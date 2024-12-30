'use strict';

import { mapCommentFromDB } from '@app/model/comment.model';
import { IDatabase, ITask } from 'pg-promise';
import { getUserByID } from './user.store';
import { Comment } from '@app/model/comment.types';

/**
 * Gets a comment by an id
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param id a comment's id
 * @returns a {@link Comment} object
 */
export const getCommentByID = async <T>(
    db: IDatabase<T> | ITask<T>,
    id: number,
): Promise<Comment> => {
    const queryString = `SELECT 
		c.id, c.body, c.user_id, c.article_id, c.created_at, c.updated_at, 
		u.id AS u_id, u.username, u.email, u.password, u.name, u.bio, u.image, 
        u.created_at AS u_created_at, u.updated_at AS u_updated_at 
		FROM "article_management".comments c 
		INNER JOIN "article_management".users u ON u.id = c.user_id 
		WHERE c.id = $1`;
    return await db.one(queryString, [id], mapCommentFromDB);
};

/**
 * Gets comments by an article id
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param articleID
 * @returns an array of {@link Comment}
 */
export const getCommentsByArticleID = async <T>(
    db: IDatabase<T> | ITask<T>,
    articleID: number,
): Promise<Comment[]> => {
    const queryString = `SELECT 
		c.id, c.body, c.user_id, c.article_id, c.created_at, c.updated_at, 
		u.id AS u_id, u.username, u.email, u.password, u.name, u.bio, u.image, 
        u.created_at AS u_created_at, u.updated_at AS u_updated_at 
		FROM "article_management".comments c 
		INNER JOIN "article_management".users u ON u.id = c.user_id 
		WHERE c.article_id = $1 
		ORDER BY c.created_at DESC`;
    return await db.map(queryString, [articleID], mapCommentFromDB);
};

/**
 * Creates a new comment of an article
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param comment a {@link Comment} object
 * @returns a created {@link Comment} with a generated id
 */
export const createComment = async <T>(
    db: IDatabase<T> | ITask<T>,
    comment: Comment,
): Promise<Comment> =>
    await db.tx(async (t: ITask<T>) => {
        const queryString = `INSERT INTO "article_management".comments 
            (body, user_id, article_id) VALUES ($1, $2, $3) 
            RETURNING id, body, user_id, article_id, created_at, updated_at`;
        const createdComment = await t.one(
            queryString,
            [comment.body, comment.userID, comment.articleID],
            mapCommentFromDB,
        );
        createdComment.author = await getUserByID(t, createdComment.userID);
        return createdComment;
    });

/**
 * Deletes a comment
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param comment a {@link Comment} object
 * @returns
 */
export const deleteComment = async <T>(
    db: IDatabase<T> | ITask<T>,
    comment: Comment,
) =>
    await db.tx((t: ITask<T>) =>
        t.none(`DELETE FROM "article_management".comments WHERE id = $1`, [
            comment.id,
        ]),
    );
