'use strict';

import PostgresDB from '@app/db/postgres.db';
import { buildUserProfile } from '@app/model/user.model';
import {
    follow,
    getUserByID,
    getUserByUsername,
    isFollowing,
    unfollow,
} from '@app/store/user.store';
import { Request, Response } from 'express';
import { errors as pgpErrors } from 'pg-promise';

/**
 * Gets a user's profile
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const showProfile = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { username = '' } = req.params;
        const user = await getUserByUsername(pgdb.db, username);
        const following = await isFollowing(pgdb.db, currentUser, user);

        res.status(200).json(buildUserProfile(user, { following }));
    } catch (err) {
        if (
            err instanceof pgpErrors.QueryResultError &&
            err.code === pgpErrors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'user not found' });
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
 * Follows a user
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const followUser = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { username = '' } = req.params;
        if (currentUser.username === username) {
            res.status(400).json({ error: 'cannot follow yourself' });
            return;
        }

        const user = await getUserByUsername(pgdb.db, username);

        const following = await isFollowing(pgdb.db, currentUser, user);
        if (following) {
            res.status(500).json({
                error: 'you are already following this user',
            });
            return;
        }

        await follow(pgdb.db, currentUser, user);

        res.status(200).json(buildUserProfile(user, { following: true }));
    } catch (err) {
        if (
            err instanceof pgpErrors.QueryResultError &&
            err.code === pgpErrors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'user not found' });
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
 * Unfollows a user
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const unfollowUser = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const { username = '' } = req.params;
        if (currentUser.username === username) {
            res.status(400).json({ error: 'cannot unfollow yourself' });
            return;
        }

        const user = await getUserByUsername(pgdb.db, username);

        const following = await isFollowing(pgdb.db, currentUser, user);
        if (!following) {
            res.status(500).json({
                error: 'you are not following this user',
            });
            return;
        }

        await unfollow(pgdb.db, currentUser, user);

        res.status(200).json(buildUserProfile(user, { following: false }));
    } catch (err) {
        if (
            err instanceof pgpErrors.QueryResultError &&
            err.code === pgpErrors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'user not found' });
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
