'use strict';

import PostgresDB from '@app/db/postgres.db';
import {
    buildCommentResponse,
    validateComment,
} from '@app/model/comment.model';
import { Comment } from '@app/model/comment.types';
import { User } from '@app/model/user.types';
import { getArticleByID } from '@app/store/article.store';
import {
    createComment,
    deleteComment,
    getCommentByID,
    getCommentsByArticleID,
} from '@app/store/comment.store';
import { getUserByID, isFollowing } from '@app/store/user.store';
import { buildValidationMessage } from '@app/util/validator';
import { Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import joi from 'joi';
import pgPromise from 'pg-promise';

export const createArticleCommentValidator = checkSchema(
    {
        body: { notEmpty: true, isString: true, escape: true },
    },
    ['body'],
);

/**
 * Creates a comment
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const createArticleComment = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { slug = '0' } = req.params;
        const article = await getArticleByID(pgdb.db, +slug);

        const { body = '' } = req.body;
        const comment: Comment = {
            id: 0,
            body,
            userID: currentUser.id,
            author: { ...currentUser },
            articleID: article.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await validateComment(comment);

        const createdComment = await createComment(pgdb.db, comment);
        res.status(200).json(buildCommentResponse(createdComment));
    } catch (err) {
        if (err instanceof joi.ValidationError) {
            res.status(400).json({ error: buildValidationMessage(err) });
        } else if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'data not found' });
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
 * Gets all article's comments
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const getArticleComments = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { slug = '0' } = req.params;
        const article = await getArticleByID(pgdb.db, +slug);

        let currentUser: User | undefined;
        const { uid = 0 } = res.locals;
        if (uid > 0) {
            currentUser = await getUserByID(pgdb.db, uid);
        }

        const comments = await getCommentsByArticleID(pgdb.db, article.id);
        const promises = comments.map(async (comment) => {
            const following = await isFollowing(
                pgdb.db,
                currentUser,
                comment.author,
            );
            return buildCommentResponse(comment, { author: { following } });
        });

        const commentResponses = await Promise.all(promises);
        res.status(200).json({ comments: commentResponses });
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'data not found' });
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
 * Deletes an article's comment
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const deleteArticleComment = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { slug = '0', id = '0' } = req.params;
        const article = await getArticleByID(pgdb.db, +slug);
        const comment = await getCommentByID(pgdb.db, +id);

        if (article.id !== comment.articleID) {
            res.status(400).json({
                error: 'the comment is not from this article',
            });
            return;
        }

        if (comment.userID !== currentUser.id) {
            res.status(403).json({ error: 'forbidden' });
            return;
        }

        await deleteComment(pgdb.db, comment);

        res.status(204);
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'data not found' });
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
