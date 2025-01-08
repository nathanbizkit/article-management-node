'use strict';

import { IDatabase, ITask } from 'pg-promise';
import { mapArticleFromDB } from '#app/model/article.model.js';
import {
    getTagsByArticleID,
    getTagsByArticleIDs,
} from '#app/store/tag.store.js';
import { getUserByID } from '#app/store/user.store.js';
import { mapTagFromDB } from '#app/model/tag.model.js';
import { Article } from '#app/model/article.types.js';
import { User } from '#app/model/user.types.js';
import {
    GetArticlesOptions,
    GetFeedArticlesOptions,
} from '#app/store/article.types.js';

/**
 * Gets an article by an id
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param id an article's id
 * @returns a {@link Article} object
 */
export const getArticleByID = async <T>(
    db: IDatabase<T> | ITask<T>,
    id: number,
): Promise<Article> =>
    await db.tx(async (t: ITask<T>) => {
        const queryString = `SELECT 
            a.id, a.title, a.description, a.body, a.user_id, a.favorites_count, 
            a.created_at, a.updated_at, 
            u.id AS u_id, u.username, u.email, u.password, u.name, u.bio, u.image, 
            u.created_at AS u_created_at, u.updated_at AS u_updated_at 
            FROM "article_management".articles a 
            INNER JOIN "article_management".users u ON u.id = a.user_id 
            WHERE a.id = $1`;
        const article = await t.one(queryString, [id], mapArticleFromDB);
        article.tags = [...(await getTagsByArticleID(t, article.id))];
        return article;
    });

/**
 * Creates a new article
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param article an {@link Article} object
 * @returns a created {@link Article} object with a generated id
 */
export const createArticle = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
): Promise<Article> =>
    await db.tx(async (t: ITask<T>) => {
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

/**
 * Updates an article only for these fields: `title`, `description`, `body`
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param article an {@link Article} object
 * @returns an updated {@link Article} with an updated timestamp
 */
export const updateArticle = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
): Promise<Article> =>
    await db.tx(async (t: ITask<T>) => {
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

/**
 * Gets all global articles
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param options.tagName a specific tag name
 * @param options.username an author's username
 * @param options.favoritedBy a user's id
 * @param options.pagination.limit a query's limit
 * @param options.pagination.offset a query's offset
 * @returns an array of {@link Article}
 */
export const getArticles = async <T>(
    db: IDatabase<T> | ITask<T>,
    options: GetArticlesOptions = {},
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
    let condArgs: (string | number | number[])[] = [];

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

    if (options.favoritedBy) {
        const queryString = `SELECT article_id AS id 
			FROM "article_management".favorite_articles 
			WHERE user_id = $1`;
        const articleIDs = await db.map(
            queryString,
            [options.favoritedBy?.id],
            (row) => +row.id,
        );
        condStrings = [...condStrings, `a.id IN ($${++condCount}:csv)`];
        condArgs = [...condArgs, articleIDs];
    }

    if (condStrings.length !== 0) {
        queryString += ` WHERE ${condStrings.join(' AND ')} `;
    }

    queryString += ` ORDER BY a.created_at DESC `;

    const limit = options.pagination?.limit ?? -1;
    const offset = options.pagination?.offset ?? 0;

    if (limit >= 0) {
        queryString += ` LIMIT $${++condCount} `;
        queryString += ` OFFSET $${++condCount} `;
        condArgs = [...condArgs, limit, offset];
    } else {
        queryString += ` OFFSET $${++condCount} `;
        condArgs = [...condArgs, offset];
    }

    const articles = await db.map(queryString, condArgs, mapArticleFromDB);
    const tagsMap = await getTagsByArticleIDs(
        db,
        articles.map((article) => article.id),
    );

    return articles.map((article) => ({
        ...article,
        tags: [...(tagsMap[article.id] || [])],
    }));
};

/**
 * Gets feed articles from the following users
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param userIDs an array of user ids
 * @param options.pagination.limit a query's limit
 * @param options.pagination.offset a query's offset
 * @returns an array of {@link Article}
 */
export const getFeedArticles = async <T>(
    db: IDatabase<T> | ITask<T>,
    userIDs: number[],
    options: GetFeedArticlesOptions = {},
): Promise<Article[]> => {
    let queryString = `SELECT 
		a.id, a.title, a.description, a.body, a.user_id, a.favorites_count, 
        a.created_at, a.updated_at, 
		u.id AS u_id, u.username, u.email, u.password, u.name, u.bio, u.image, 
        u.created_at AS u_created_at, u.updated_at AS u_updated_at 
		FROM "article_management".articles a 
		INNER JOIN "article_management".users u ON u.id = a.user_id 
		WHERE a.user_id IN ($1:csv) 
		ORDER BY a.created_at DESC `;

    let condCount = 1;
    let condArgs: number[] = [];

    const limit = options.pagination?.limit ?? -1;
    const offset = options.pagination?.offset ?? 0;

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
        mapArticleFromDB,
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

/**
 * Deletes an article
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param article an {@link Article} object
 * @returns
 */
export const deleteArticle = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
) =>
    await db.tx((t: ITask<T>) =>
        t.none(`DELETE FROM "article_management".articles WHERE id = $1`, [
            article.id,
        ]),
    );

/**
 * Checks whether the article is favorited by the user
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param article an {@link Article} object
 * @param user a {@link User} object
 * @returns `true` if the article is favorited by the user, otherwise `false`
 */
export const isFavorited = async <T>(
    db: IDatabase<T> | ITask<T>,
    article?: Article,
    user?: User,
): Promise<boolean> => {
    if (!article || !user) return false;

    const queryString = `SELECT COUNT(article_id) 
		FROM "article_management".favorite_articles 
		WHERE article_id = $1 AND user_id = $2`;
    return await db
        .oneOrNone(queryString, [article.id, user.id], (c) =>
            c ? +c.count : 0,
        )
        .then((count) => count !== 0);
};

/**
 * Favorites an article
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param article an {@link Article} object
 * @param user a {@link User} object
 * @returns an array that contains updated favorites count and timestamp
 */
export const addFavorite = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
    user: User,
): Promise<[number, Date]> =>
    await db.tx(async (t: ITask<T>) => {
        let queryString = `INSERT INTO "article_management".favorite_articles 
			(article_id, user_id) VALUES ($1, $2)`;
        await t.none(queryString, [article.id, user.id]);

        queryString = `UPDATE "article_management".articles 
			SET favorites_count = favorites_count + $1, updated_at = DEFAULT 
			WHERE id = $2 
			RETURNING favorites_count, updated_at`;
        return t.one(queryString, [1, article.id], (row) => [
            row.favorites_count,
            row.updated_at,
        ]);
    });

/**
 * Unfavorites an article
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param article an {@link Article} object
 * @param user a {@link User} object
 * @returns an array that contains updated favorites cound and timestmap
 */
export const deleteFavorite = async <T>(
    db: IDatabase<T> | ITask<T>,
    article: Article,
    user: User,
): Promise<[number, Date]> =>
    await db.tx(async (t: ITask<T>) => {
        let queryString = `DELETE FROM "article_management".favorite_articles 
			WHERE article_id = $1 AND user_id = $2`;
        await t.none(queryString, [article.id, user.id]);

        queryString = `UPDATE "article_management".articles 
			SET favorites_count = GREATEST(0, favorites_count - $1), updated_at = DEFAULT 
			WHERE id = $2 
			RETURNING favorites_count, updated_at`;
        return t.one(queryString, [1, article.id], (row) => [
            row.favorites_count,
            row.updated_at,
        ]);
    });
