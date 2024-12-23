'use strict';

import { mapUserFromDB, User } from '@app/model/user.model';
import { IDatabase, ITask } from 'pg-promise';

// getUserByID finds a user by id
export const getUserByID = async <T>(
    db: IDatabase<T> | ITask<T>,
    id: number,
): Promise<User | null> => {
    const queryString = `SELECT 
		id, username, email, password, name, bio, image, created_at, updated_at 
		FROM "article_management".users 
		WHERE id = $1`;
    return db.one(queryString, [id], mapUserFromDB);
};

// getUserByID finds a user by email
export const getUserByEmail = async <T>(
    db: IDatabase<T> | ITask<T>,
    email: string,
): Promise<User | null> => {
    const queryString = `SELECT 
		id, username, email, password, name, bio, image, created_at, updated_at 
		FROM "article_management".users 
		WHERE email = $1`;
    return db.one(queryString, [email], mapUserFromDB);
};

// getUserByID finds a user by username
export const getUserByUsername = async <T>(
    db: IDatabase<T> | ITask<T>,
    username: string,
): Promise<User | null> => {
    const queryString = `SELECT 
		id, username, email, password, name, bio, image, created_at, updated_at 
		FROM "article_management".users 
		WHERE username = $1`;
    return db.one(queryString, [username], mapUserFromDB);
};

// createUser creates a user and returns the newly created user
export const createUser = async <T>(
    db: IDatabase<T> | ITask<T>,
    user: User,
): Promise<User> =>
    db.tx(async (t: ITask<T>) => {
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

// updateUser updates a user (for username, email, password, name, bio, image)
export const updateUser = async <T>(
    db: IDatabase<T> | ITask<T>,
    user: User,
): Promise<User> =>
    db.tx(async (t: ITask<T>) => {
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

// isFollowing returns wheter user A follows user B
export const isFollowing = async <T>(
    db: IDatabase<T> | ITask<T>,
    a: User | null | undefined,
    b: User | null | undefined,
): Promise<boolean> => {
    if (a === null || a === undefined || b === null || b === undefined) {
        return false;
    }

    const queryString = `SELECT COUNT(to_user_id) 
		FROM "article_management".follows 
		WHERE from_user_id = $1 AND to_user_id = $2`;
    const count = await db.one(queryString, [a.id, b.id], (c) =>
        parseInt(c.count),
    );

    return count !== 0;
};

// follow creates a follow relationship from user A to user B
export const follow = <T>(db: IDatabase<T> | ITask<T>, a: User, b: User) =>
    db.tx(async (t: ITask<T>) => {
        const queryString = `INSERT INTO "article_management".follows 
			(from_user_id, to_user_id) VALUES ($1, $2)`;
        return t.none(queryString, [a.id, b.id]);
    });

// unfollow deletes a follow relationship from user A to user B
export const unfollow = <T>(db: IDatabase<T> | ITask<T>, a: User, b: User) =>
    db.tx(async (t: ITask<T>) => {
        const queryString = `DELETE FROM "article_management".follows 
			WHERE from_user_id = $1 AND to_user_id = $2`;
        return t.none(queryString, [a.id, b.id]);
    });

// getFollowingUserIDs returns user ids that current user follows
export const getFollowingUserIDs = async <T>(
    db: IDatabase<T> | ITask<T>,
    user: User,
): Promise<number[]> => {
    const queryString = `SELECT to_user_id AS id
        FROM "article_management".follows 
        WHERE from_user_id = $1`;
    return db.map(queryString, [user.id], (row) => parseInt(row.id));
};
