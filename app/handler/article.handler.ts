'use strict';

import PostgresDB from '@app/db/postgres.db';
import {
    buildArticleResponse,
    overwriteArticle,
    validateArticle,
} from '@app/model/article.model';
import { Article } from '@app/model/article.types';
import { Tag } from '@app/model/tag.types';
import { User } from '@app/model/user.types';
import {
    addFavorite,
    createArticle,
    deleteArticle,
    deleteFavorite,
    getArticleByID,
    getArticles,
    getFeedArticles,
    isFavorited,
    updateArticle,
} from '@app/store/article.store';
import {
    getFollowingUserIDs,
    getUserByID,
    getUserByUsername,
    isFollowing,
} from '@app/store/user.store';
import { buildValidationMessage } from '@app/util/validator';
import { Request, Response } from 'express';
import { checkSchema, validationResult } from 'express-validator';
import joi from 'joi';
import pgPromise from 'pg-promise';

export const createNewArticleValidator = checkSchema(
    {
        title: { notEmpty: true, isString: true, escape: true },
        description: { optional: true, isString: true, escape: true },
        body: { notEmpty: true, isString: true, escape: true },
        tags: { isArray: { options: { min: 0 } } },
        'tags.*': { isString: true },
    },
    ['body'],
);

/**
 * Creates an article
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const createNewArticle = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { title, description, body, tags = [] } = req.body;
        const article: Article = {
            id: 0,
            title,
            description,
            body,
            tags: (tags as string[]).map((name) => ({ name }) as Tag),
            userID: currentUser.id,
            author: { ...currentUser },
            favoritesCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await validateArticle(article);

        const createdArticle = await createArticle(pgdb.db, article);

        res.status(200).json(
            buildArticleResponse(createdArticle, {
                favorited: false,
                author: { following: false },
            }),
        );
    } catch (err) {
        if (err instanceof joi.ValidationError) {
            res.status(400).json({ error: buildValidationMessage(err) });
        } else if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'failed to create an article' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};

/**
 * Gets an article
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const getArticle = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { slug = '0' } = req.params;
        const article = await getArticleByID(pgdb.db, +slug);

        let currentUser: User | undefined;
        const { uid = 0 } = res.locals;
        if (uid > 0) {
            currentUser = await getUserByID(pgdb.db, uid);
        }

        const favorited = await isFavorited(pgdb.db, article, currentUser);
        const following = await isFollowing(
            pgdb.db,
            currentUser,
            article.author,
        );

        res.status(200).json(
            buildArticleResponse(article, {
                favorited,
                author: { following },
            }),
        );
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'data not found' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};

export const getAllArticlesValidator = checkSchema(
    {
        tag: { optional: true, isString: true, escape: true },
        username: { optional: true, isString: true, escape: true },
        favorited: { optional: true, isString: true, escape: true },
        limit: { optional: true, isNumeric: true },
        offset: { optional: true, isNumeric: true },
    },
    ['query'],
);

/**
 * Get recent global articles
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const getAllArticles = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { tag, username, favorited, offset, limit } = req.query;

        let favoritedBy: User | undefined;
        if (favorited as string | undefined) {
            favoritedBy = await getUserByUsername(pgdb.db, favorited as string);
        }

        const articles = await getArticles(pgdb.db, {
            tagName: tag as string | undefined,
            username: username as string | undefined,
            favoritedBy,
            pagination: {
                offset: (offset as string | undefined)
                    ? +(offset as string)
                    : undefined,
                limit: (limit as string | undefined)
                    ? +(limit as string)
                    : undefined,
            },
        });

        let currentUser: User | undefined;
        const { uid = 0 } = res.locals;
        if (uid > 0) {
            currentUser = await getUserByID(pgdb.db, uid);
        }

        const promises = articles.map(async (article) => {
            const favorited = await isFavorited(pgdb.db, article, currentUser);
            const following = await isFollowing(
                pgdb.db,
                currentUser,
                article.author,
            );
            return buildArticleResponse(article, {
                favorited,
                author: { following },
            });
        });

        const articleResponses = await Promise.all(promises);
        res.status(200).json({
            articles: articleResponses,
            articles_count: articleResponses.length,
        });
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'data not found' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};

export const getAllFeedArticlesValidator = checkSchema(
    {
        limit: { optional: true, isNumeric: true },
        offset: { optional: true, isNumeric: true },
    },
    ['query'],
);

/**
 * Get recent feed articles from the users that the current user follows
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const getAllFeedArticles = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { offset, limit } = req.query;

        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const userIDs = await getFollowingUserIDs(pgdb.db, currentUser);
        const articles = await getFeedArticles(pgdb.db, userIDs, {
            pagination: {
                offset: (offset as string | undefined)
                    ? +(offset as string)
                    : undefined,
                limit: (limit as string | undefined)
                    ? +(limit as string)
                    : undefined,
            },
        });

        const promises = articles.map(async (article) => {
            const favorited = await isFavorited(pgdb.db, article, currentUser);
            return buildArticleResponse(article, {
                favorited,
                author: { following: true },
            });
        });

        const articleResponses = await Promise.all(promises);
        res.status(200).json({
            articles: articleResponses,
            articles_count: articleResponses.length,
        });
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'data not found' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};

export const updateArticleBySlugValidator = checkSchema(
    {
        title: { optional: true, isString: true, escape: true },
        description: { optional: true, isString: true, escape: true },
        body: { optional: true, isString: true, escape: true },
    },
    ['body'],
);

/**
 * Updates an article
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const updateArticleBySlug = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { slug = '0' } = req.params;
        const currentArticle = await getArticleByID(pgdb.db, +slug);

        if (currentArticle.userID !== currentUser.id) {
            res.status(403).json({ error: 'forbidden' });
            return;
        }

        const { title, description, body } = req.body;
        const article = overwriteArticle(currentArticle, {
            ...currentArticle,
            title,
            description,
            body,
        });

        await validateArticle(article);

        const updatedArticle = await updateArticle(pgdb.db, article);
        const favorited = await isFavorited(
            pgdb.db,
            updatedArticle,
            currentUser,
        );

        res.status(200).json(
            buildArticleResponse(updatedArticle, {
                favorited,
                author: { following: false },
            }),
        );
    } catch (err) {
        if (err instanceof joi.ValidationError) {
            res.status(400).json({ error: buildValidationMessage(err) });
        } else if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'data not found' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};

/**
 * Deletes an article
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const deleteArticleBySlug = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { slug = '0' } = req.params;
        const currentArticle = await getArticleByID(pgdb.db, +slug);

        if (currentArticle.userID !== currentUser.id) {
            res.status(403).json({ error: 'forbidden' });
            return;
        }

        await deleteArticle(pgdb.db, currentArticle);

        res.status(204);
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'data not found' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};

/**
 * Favorites an article
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const favoriteArticle = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { slug = '0' } = req.params;
        const currentArticle = await getArticleByID(pgdb.db, +slug);

        const favorited = await isFavorited(
            pgdb.db,
            currentArticle,
            currentUser,
        );

        if (favorited) {
            res.status(400).json({
                error: 'you already favorited this article',
            });
            return;
        }

        const [favoritesCount, updatedAt] = await addFavorite(
            pgdb.db,
            currentArticle,
            currentUser,
        );

        currentArticle.favoritesCount = favoritesCount;
        currentArticle.updatedAt = updatedAt;

        const following = await isFollowing(
            pgdb.db,
            currentUser,
            currentArticle.author,
        );

        res.status(200).json(
            buildArticleResponse(currentArticle, {
                favorited: true,
                author: { following },
            }),
        );
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'data not found' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};

/**
 * Unfavorites an article
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const unfavoriteArticle = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { slug = '0' } = req.params;
        const currentArticle = await getArticleByID(pgdb.db, +slug);

        const favorited = await isFavorited(
            pgdb.db,
            currentArticle,
            currentUser,
        );

        if (!favorited) {
            res.status(400).json({
                error: 'you did not favorited this article',
            });
            return;
        }

        const [favoritesCount, updatedAt] = await deleteFavorite(
            pgdb.db,
            currentArticle,
            currentUser,
        );

        currentArticle.favoritesCount = favoritesCount;
        currentArticle.updatedAt = updatedAt;

        const following = await isFollowing(
            pgdb.db,
            currentUser,
            currentArticle.author,
        );

        res.status(200).json(
            buildArticleResponse(currentArticle, {
                favorited: false,
                author: { following },
            }),
        );
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'data not found' });
        } else if (err instanceof Error) {
            res.status(500).json({
                error:
                    err instanceof Error
                        ? err.message
                        : 'internal server error',
            });
        } else {
            res.status(500).json({ error: 'internal server error' });
        }
    }
};
