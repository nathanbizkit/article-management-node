'use strict';

import {
    Article,
    mapArticleFromDB,
    mapArticleWithAuthorFromDB,
} from '@app/model/article.model';
import { getTagsByArticleID, getTagsByArticleIDs } from './tag.store';
import { IDatabase, ITask } from 'pg-promise';
import { getUserByID } from './user.store';
import { mapTagFromDB } from '@app/model/tag.model';
import { User } from '@app/model/user.model';

export interface GetArticlesOptions {
    tagName?: string;
    username?: string;
    favoritedBy?: User;
}

export interface PaginationOptions {
    limit?: number;
    offset?: number;
}

// getArticleByID find an article by id
export const getArticleByID = async <T>(
    db: IDatabase<T> | ITask<T>,
    id: number,
): Promise<Article> =>
    db.tx(async (t: ITask<T>) => {
        const queryString = `SELECT 
            a.id, a.title, a.description, a.body, a.user_id, a.favorites_count, 
            a.created_at, a.updated_at, 
            u.id AS u_id, u.username, u.email, u.password, u.name, u.bio, u.image, 
            u.created_at AS u_created_at, u.updated_at AS u_updated_at 
            FROM "article_management".articles a 
            INNER JOIN "article_management".users u ON u.id = a.user_id 
            WHERE a.id = $1`;
        const article = await t.one(
            queryString,
            [id],
            mapArticleWithAuthorFromDB,
        );

        article.tags = [...(await getTagsByArticleID(t, article.id))];
        return article;
    });

// createArticle creates an article and returns the newly created article
export const createArticle = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
): Promise<Article> =>
    db.tx(async (t: ITask<T>) => {
        const queryString = `INSERT INTO "article_management".articles 
            (title, description, body, user_id) VALUES ($1, $2, $3, $4) 
            RETURNING id, title, description, body, user_id, favorites_count, created_at, updated_at`;
        const createdArticle = await t.one(
            queryString,
            [article.title, article.description, article.body, article.userID],
            mapArticleFromDB,
        );

        createdArticle.author = await getUserByID(t, createdArticle.userID);

        if (article.tags.length > 0) {
            // create temporary tags table
            let queryString = `CREATE TEMPORARY TABLE tags_staging 
                (LIKE "article_management".tags INCLUDING ALL) ON COMMIT DROP`;
            await t.none(queryString);

            // copy into temporary table
            queryString = `INSERT INTO tags_staging(name) VALUES ($1)`;
            await t.batch(
                article.tags.map((tag) => t.none(queryString, [tag.name])),
            );

            // insert into tags (on conflict do update)
            queryString = `INSERT INTO "article_management".tags (name)
                SELECT name FROM tags_staging 
                ON CONFLICT (name) DO UPDATE SET updated_at = NOW() 
                RETURNING id, name, created_at, updated_at`;
            const tags = await t.map(queryString, [], mapTagFromDB);

            // insert into article_tags
            queryString = `INSERT INTO "article_management".article_tags(article_id, tag_id) VALUES ($1, $2)`;
            await t.batch(
                tags.map((tag) =>
                    t.none(queryString, [createdArticle.id, tag.id]),
                ),
            );

            createdArticle.tags = [...tags];
        }

        return createdArticle;
    });

// updateArticle updates an article (for title, description, body)
export const updateArticle = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
): Promise<Article> =>
    db.tx(async (t: ITask<T>) => {
        const queryString = `UPDATE "article_management".articles 
            SET title = $1, description = $2, body = $3, updated_at = DEFAULT 
            WHERE id = $4 
            RETURNING id, title, description, body, user_id, favorites_count, created_at, updated_at`;
        const updatedArticle = await t.one(
            queryString,
            [article.title, article.description, article.body, article.id],
            mapArticleFromDB,
        );

        updatedArticle.author = await getUserByID(t, updatedArticle.userID);
        updatedArticle.tags = [
            ...(await getTagsByArticleID(t, updatedArticle.id)),
        ];

        return updatedArticle;
    });

// getArticles gets global articles
export const getArticles = async <T>(
    db: IDatabase<T> | ITask<T>,
    options: GetArticlesOptions,
    paginationOptions: PaginationOptions,
): Promise<Article[]> => {
    let queryString = `SELECT 
		a.id, a.title, a.description, a.body, a.user_id, a.favorites_count, 
        a.created_at, a.updated_at, 
		u.id AS u_id, u.username, u.email, u.password, u.name, u.bio, u.image, 
        u.created_at AS u_created_at, u.updated_at AS u_updated_at 
		FROM "article_management".articles a 
		INNER JOIN "article_management".users u ON u.id = a.user_id `;

    let condCount = 0;
    let condStrings: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let condArgs: any[] = [];

    if (options.username) {
        condStrings = [...condStrings, `u.username = $${++condCount}`];
        condArgs = [...condArgs, options.username];
    }

    if (options.tagName) {
        queryString += ` INNER JOIN "article_management".article_tags at ON at.article_id = a.id 
			INNER JOIN "article_management".tags t ON t.id = at.tag_id `;
        condStrings = [...condStrings, `t.name = $${++condCount}`];
        condArgs = [...condArgs, options.tagName];
    }

    if (options.favoritedBy !== null || options.favoritedBy !== undefined) {
        const queryString = `SELECT article_id AS id 
			FROM "article_management".favorite_articles 
			WHERE user_id = $1`;
        const articleIDs = await db.map(
            queryString,
            [options.favoritedBy?.id],
            (row) => row.id,
        );
        condStrings = [...condStrings, `a.id = ANY($${++condCount}:csv)`];
        condArgs = [...condArgs, articleIDs];
    }

    if (condStrings.length !== 0) {
        queryString += ` WHERE ${condStrings.join(' AND ')} `;
    }

    queryString += ` ORDER BY a.created_at DESC `;

    const { limit = -1, offset = 0 } = paginationOptions;
    if (limit >= 0) {
        queryString += ` LIMIT $${++condCount} `;
        queryString += ` OFFSET $${++condCount} `;
        condArgs = [...condArgs, limit, offset];
    } else {
        queryString += ` OFFSET $${++condCount} `;
        condArgs = [...condArgs, offset];
    }

    const articles = await db.map(
        queryString,
        condArgs,
        mapArticleWithAuthorFromDB,
    );
    const tagsMap = await getTagsByArticleIDs(
        db,
        articles.map((article) => article.id),
    );

    return articles.map((article) => ({
        ...article,
        tags: [...(tagsMap[article.id] || [])],
    }));
};

// getFeedArticles gets following users' articles
export const getFeedArticles = async <T>(
    db: IDatabase<T> | ITask<T>,
    userIDs: number[],
    paginationOptions: PaginationOptions,
): Promise<Article[]> => {
    let queryString = `SELECT 
		a.id, a.title, a.description, a.body, a.user_id, a.favorites_count, 
        a.created_at, a.updated_at, 
		u.id AS u_id, u.username, u.email, u.password, u.name, u.bio, u.image, 
        u.created_at AS u_created_at, u.updated_at AS u_updated_at 
		FROM "article_management".articles a 
		INNER JOIN "article_management".users u ON u.id = a.user_id 
		WHERE a.user_id = ANY($1:csv) 
		ORDER BY a.created_at DESC`;

    let condCount = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let condArgs: any = [];

    const { limit = -1, offset = 0 } = paginationOptions;
    if (limit >= 0) {
        queryString += ` LIMIT $${++condCount} `;
        queryString += ` OFFSET $${++condCount} `;
        condArgs = [...condArgs, limit, offset];
    } else {
        queryString += ` OFFSET $${++condCount} `;
        condArgs = [...condArgs, offset];
    }

    const articles = await db.map(
        queryString,
        [userIDs, ...condArgs],
        mapArticleWithAuthorFromDB,
    );

    const tagsMap = await getTagsByArticleIDs(
        db,
        articles.map((article) => article.id),
    );

    return articles.map((article) => ({
        ...article,
        tags: [...(tagsMap[article.id] || [])],
    }));
};

// deleteArticle deletes an article
export const deleteArticle = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
) =>
    db.tx((t: ITask<T>) =>
        t.none(`DELETE FROM "article_management".articles WHERE id = $1`, [
            article.id,
        ]),
    );

// isFavorited checks whether the article is favorited by the user
export const isFavorited = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article | null | undefined,
    user: User | null | undefined,
): Promise<boolean> => {
    if (
        article === null ||
        article === undefined ||
        user === null ||
        user === undefined
    ) {
        return false;
    }

    const queryString = `SELECT COUNT(article_id) 
		FROM "article_management".favorite_articles 
		WHERE article_id = $1 AND user_id = $2`;
    const count = await db.one(queryString, [article.id, user.id], (c) =>
        parseInt(c.count),
    );

    return count !== 0;
};

// addFavorite favorites an article
export const addFavorite = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
    user: User,
): Promise<{ favoritesCount: number; updatedAt: Date }> =>
    db.tx(async (t: ITask<T>) => {
        let queryString = `INSERT INTO "article_management".favorite_articles 
			(article_id, user_id) VALUES ($1, $2)`;
        await t.none(queryString, [article.id, user.id]);

        queryString = `UPDATE "article_management".articles 
			SET favorites_count = favorites_count + $1, updated_at = DEFAULT 
			WHERE id = $2 
			RETURNING favorites_count, updated_at`;
        return t.one(queryString, [1, article.id], (row) => ({
            favoritesCount: row.favorites_count,
            updatedAt: row.updated_at,
        }));
    });

// deleteFavorite unfavorites an article
export const deleteFavorite = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
    user: User,
): Promise<{ favoritesCount: number; updatedAt: Date }> =>
    db.tx(async (t: ITask<T>) => {
        let queryString = `DELETE FROM "article_management".favorite_articles 
			WHERE article_id = $1 AND user_id = $2`;
        await t.none(queryString, [article.id, user.id]);

        queryString = `UPDATE "article_management".articles 
			SET favorites_count = GREATEST(0, favorites_count - $1), updated_at = DEFAULT 
			WHERE id = $2 
			RETURNING favorites_count, updated_at`;
        return t.one(queryString, [1, article.id], (row) => ({
            favoritesCount: row.favorites_count,
            updatedAt: row.updated_at,
        }));
    });
