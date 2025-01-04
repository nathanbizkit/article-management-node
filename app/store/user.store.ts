'use strict';

import { IDatabase, ITask } from 'pg-promise';
import { mapUserFromDB } from '#app/model/user.model.js';
import { User } from '#app/model/user.types.js';

/**
 * Gets a user by an id
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param id a user's id
 * @returns a {@link User} object
 */
export const getUserByID = async <T>(
    db: IDatabase<T> | ITask<T>,
    id: number,
): Promise<User> => {
    const queryString = `SELECT 
		id, username, email, password, name, bio, image, created_at, updated_at 
		FROM "article_management".users 
		WHERE id = $1`;
    return await db.one(queryString, [id], mapUserFromDB);
};

/**
 * Gets a user by an email
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param email a user's email
 * @returns a {@link User} object
 */
export const getUserByEmail = async <T>(
    db: IDatabase<T> | ITask<T>,
    email: string,
): Promise<User> => {
    const queryString = `SELECT 
		id, username, email, password, name, bio, image, created_at, updated_at 
		FROM "article_management".users 
		WHERE email = $1`;
    return await db.one(queryString, [email], mapUserFromDB);
};

/**
 * Gets a user by a username
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param username a user's username
 * @returns a {@link User} object
 */
export const getUserByUsername = async <T>(
    db: IDatabase<T> | ITask<T>,
    username: string,
): Promise<User> => {
    const queryString = `SELECT 
		id, username, email, password, name, bio, image, created_at, updated_at 
		FROM "article_management".users 
		WHERE username = $1`;
    return await db.one(queryString, [username], mapUserFromDB);
};

/**
 * Creates a new user
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param user a {@link User} object
 * @returns a created {@link User} object with a generated id
 */
export const createUser = async <T>(
    db: IDatabase<T> | ITask<T>,
    user: User,
): Promise<User> =>
    await db.tx(async (t: ITask<T>) => {
        const queryString = `INSERT INTO "article_management".users 
            (username, email, password, name, bio, image) VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id, username, email, password, name, bio, image, created_at, updated_at`;
        return t.one(
            queryString,
            [
                user.username,
                user.email,
                user.hashedPassword,
                user.name,
                user.bio,
                user.image,
            ],
            mapUserFromDB,
        );
    });

/**
 * Updates a user only for these fields: `username`, `email`, `password`, `name`, `bio`, `image`
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param user a {@link User} object
 * @returns an updated {@link User} object with an updated timestamp
 */
export const updateUser = async <T>(
    db: IDatabase<T> | ITask<T>,
    user: User,
): Promise<User> =>
    await db.tx(async (t: ITask<T>) => {
        const queryString = `UPDATE "article_management".users 
            SET username = $1, email = $2, password = $3, name = $4, bio = $5, image = $6, updated_at = DEFAULT 
            WHERE id = $7 
            RETURNING id, username, email, password, name, bio, image, created_at, updated_at`;
        return t.one(
            queryString,
            [
                user.username,
                user.email,
                user.hashedPassword,
                user.name,
                user.bio,
                user.image,
                user.id,
            ],
            mapUserFromDB,
        );
    });

/**
 * Checks whether user A follows user B
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param a a {@link User} object
 * @param b a {@link User} object
 * @returns `true` if `a` follows `b`, otherwise `false`
 */
export const isFollowing = async <T>(
    db: IDatabase<T> | ITask<T>,
    a?: User,
    b?: User,
): Promise<boolean> => {
    if (!a || !b) return false;

    const queryString = `SELECT COUNT(to_user_id) 
		FROM "article_management".follows 
		WHERE from_user_id = $1 AND to_user_id = $2`;
    return await db
        .oneOrNone(queryString, [a.id, b.id], (c) => (c ? +c.count : 0))
        .then((count) => count !== 0);
};

/**
 * Creates a following relationship from user A to user B
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param a a {@link User} object
 * @param b a {@link User} object
 * @returns
 */
export const follow = async <T>(
    db: IDatabase<T> | ITask<T>,
    a: User,
    b: User,
) =>
    await db.tx(async (t: ITask<T>) => {
        const queryString = `INSERT INTO "article_management".follows 
            (from_user_id, to_user_id) VALUES ($1, $2)`;
        return t.none(queryString, [a.id, b.id]);
    });

/**
 * Deletes a following relationship from user A to user B
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param a a {@link User} object
 * @param b a {@link User} object
 * @returns
 */
export const unfollow = async <T>(
    db: IDatabase<T> | ITask<T>,
    a: User,
    b: User,
) =>
    await db.tx(async (t: ITask<T>) => {
        const queryString = `DELETE FROM "article_management".follows 
            WHERE from_user_id = $1 AND to_user_id = $2`;
        return t.none(queryString, [a.id, b.id]);
    });

/**
 * Gets a list of user ids that the current user follows
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param user a {@link User} object
 * @returns an arroy of user ids
 */
export const getFollowingUserIDs = async <T>(
    db: IDatabase<T> | ITask<T>,
    user: User,
): Promise<number[]> => {
    const queryString = `SELECT to_user_id AS id
        FROM "article_management".follows 
        WHERE from_user_id = $1`;
    return await db.map(queryString, [user.id], (row) => +row.id);
};
