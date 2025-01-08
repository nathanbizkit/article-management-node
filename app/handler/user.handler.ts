'use strict';

import { Request, Response } from 'express';
import { checkSchema, validationResult } from 'express-validator';
import joi from 'joi';
import pgPromise from 'pg-promise';
import {
    generateToken,
    parseToken,
    refreshTTL,
    sessionTTL,
} from '#app/auth/jwt.auth.js';
import { AuthenticationError } from '#app/auth/jwt.types.js';
import PostgresDB from '#app/db/postgres.db.js';
import {
    buildUserProfile,
    checkPassword,
    hashUserPassword,
    overwriteUser,
    validateUser,
} from '#app/model/user.model.js';
import { User } from '#app/model/user.types.js';
import {
    createUser,
    getUserByEmail,
    getUserByID,
    updateUser,
} from '#app/store/user.store.js';
import { buildValidationMessage } from '#app/util/validator.js';

/**
 * Creates a session token and refresh token with a user's id in the payload
 * @param uid a user's id
 * @returns an array of session and refresh token respectively
 */
const createTokens = async (uid: number): Promise<string[]> => {
    const { AUTH_JWT_SECRET_KEY: key = '' } = process.env;
    const sessionToken = await generateToken(uid, key, {
        expiresIn: sessionTTL,
    });
    const refreshToken = await generateToken(uid, key, {
        expiresIn: refreshTTL,
    });
    return [sessionToken, refreshToken];
};

export const loginValidator = checkSchema(
    {
        email: { isEmail: true },
        password: { notEmpty: true },
    },
    ['body'],
);

/**
 * Logs a user in and sets session and refresh token in cookies
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const login = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { email, password } = req.body;
        const user = await getUserByEmail(pgdb.db, email);
        const isValidPassword = await checkPassword(
            password,
            user.hashedPassword,
        );

        if (!isValidPassword) {
            res.status(400).json({ error: 'invalid password ' });
            return;
        }

        const path = req.app.get('cookie path') ?? '/';
        const [session, refresh] = await createTokens(user.id);

        res.cookie('session', session, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: sessionTTL * 1000,
        });
        res.cookie('refreshToken', refresh, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: refreshTTL * 1000,
        });
        res.sendStatus(204);
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'data not found' });
        } else if (err instanceof AuthenticationError) {
            res.status(500).json({ error: 'failed to generate token' });
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

export const registerValidator = checkSchema(
    {
        username: { notEmpty: true },
        email: { isEmail: true },
        password: { notEmpty: true },
        name: { notEmpty: true },
    },
    ['body'],
);

/**
 * Registers a new user and sets session and refresh token in cookies
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const register = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { username, email, password, name } = req.body;
        const user: User = {
            id: 0,
            username,
            email,
            plainPassword: password,
            hashedPassword: '',
            name,
            bio: '',
            image: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await validateUser(user);
        user.hashedPassword = await hashUserPassword(user.plainPassword);
        const createdUser = await createUser(pgdb.db, user);

        const path = req.app.get('cookie path') ?? '/';
        const [session, refresh] = await createTokens(createdUser.id);

        res.cookie('session', session, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: sessionTTL * 1000,
        });
        res.cookie('refreshToken', refresh, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: refreshTTL * 1000,
        });
        res.status(200).json(createdUser);
    } catch (err) {
        if (err instanceof joi.ValidationError) {
            res.status(400).json({ error: buildValidationMessage(err) });
        } else if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(500).json({ error: 'failed to create a user' });
        } else if (err instanceof AuthenticationError) {
            res.status(500).json({ error: 'failed to generate token' });
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
 * Refreshes tokens using a refresh token in cookies
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken = '' } = req.cookies;
    if (!refreshToken) {
        res.status(400).json({ error: 'refresh token is empty' });
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { AUTH_JWT_SECRET_KEY: key = '' } = process.env;

        const uid = await parseToken(refreshToken, key);
        const user = await getUserByID(pgdb.db, uid);

        const path = req.app.get('cookie path') ?? '/';
        const [session, refresh] = await createTokens(user.id);

        res.cookie('session', session, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: sessionTTL * 1000,
        });
        res.cookie('refreshToken', refresh, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: refreshTTL * 1000,
        });
        res.sendStatus(204);
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'data not found' });
        } else if (err instanceof AuthenticationError) {
            res.status(500).json({ error: 'failed to generate token' });
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
 * Gets a current user's profile and sets session and refresh token in cookies
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const path = req.app.get('cookie path') ?? '/';
        const [session, refresh] = await createTokens(currentUser.id);

        res.cookie('session', session, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: sessionTTL * 1000,
        });
        res.cookie('refreshToken', refresh, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: refreshTTL * 1000,
        });
        res.status(200).json(buildUserProfile(currentUser));
    } catch (err) {
        if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'data not found' });
        } else if (err instanceof AuthenticationError) {
            res.status(500).json({ error: 'failed to generate token' });
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

export const updateCurrentUserValidator = checkSchema(
    {
        username: { isString: true, optional: true },
        email: { isEmail: true, optional: true },
        password: { isString: true, optional: true },
        name: { isString: true, optional: true },
        bio: { isString: true, optional: true },
        image: { isURL: true, optional: true },
    },
    ['body'],
);

/**
 * Updates a current user's profile and sets session and refresh token in cookies
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({ error: result.array() });
        return;
    }

    try {
        const pgdb = req.app.get('postgres db') as PostgresDB;
        const { uid = 0 } = res.locals;
        const currentUser = await getUserByID(pgdb.db, uid);

        const {
            username = '',
            email = '',
            password = '',
            name = '',
            bio = '',
            image = '',
        } = req.body;
        const user = overwriteUser(currentUser, {
            ...currentUser,
            username,
            email,
            plainPassword: password,
            name,
            bio,
            image,
        });

        await validateUser(user);

        if (user.plainPassword) {
            user.hashedPassword = await hashUserPassword(user.plainPassword);
        }

        const updatedUser = await updateUser(pgdb.db, user);

        const path = req.app.get('cookie path') ?? '/';
        const [session, refresh] = await createTokens(updatedUser.id);

        res.cookie('session', session, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: sessionTTL * 1000,
        });
        res.cookie('refreshToken', refresh, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: refreshTTL * 1000,
        });
        res.status(200).json(buildUserProfile(updatedUser));
    } catch (err) {
        if (err instanceof joi.ValidationError) {
            res.status(400).json({ error: buildValidationMessage(err) });
        } else if (
            err instanceof pgPromise.errors.QueryResultError &&
            err.code === pgPromise.errors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'data not found' });
        } else if (err instanceof AuthenticationError) {
            res.status(500).json({ error: 'failed to generate token' });
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
