'use strict';

import { generateToken, refreshTTL, sessionTTL } from '@app/auth/jwt.auth';
import { AuthenticationError } from '@app/auth/jwt.types';
import PostgresDB from '@app/db/postgres.db';
import {
    checkPassword,
    hashUserPassword,
    validateUser,
} from '@app/model/user.model';
import { User } from '@app/model/user.types';
import { createUser, getUserByEmail } from '@app/store/user.store';
import { buildValidationMessage } from '@app/util/validator';
import { Request, Response } from 'express';
import { checkSchema, validationResult } from 'express-validator';
import { ValidationError } from 'joi';
import { errors as pgpErrors } from 'pg-promise';

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

export const loginValidator = checkSchema({
    email: { isEmail: true, escape: true },
    password: { notEmpty: true, escape: true },
});

/**
 * Logins a user and sets session and refresh token in cookies
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
            user.hashedPassword,
            password,
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
        res.cookie('session', refresh, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: refreshTTL * 1000,
        });
        res.status(204);
    } catch (err) {
        if (
            err instanceof pgpErrors.QueryResultError &&
            err.code === pgpErrors.queryResultErrorCode.noData
        ) {
            res.status(404).json({ error: 'user not found' });
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

export const registerValidator = checkSchema({
    username: { notEmpty: true, escape: true },
    email: { isEmail: true, escape: true },
    password: { notEmpty: true, escape: true },
    name: { notEmpty: true, escape: true },
});

/**
 * Register a new user and sets session and refresh token in cookies
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
        res.cookie('session', refresh, {
            path,
            secure: true,
            httpOnly: true,
            maxAge: refreshTTL * 1000,
        });
        res.status(200).json(createdUser);
    } catch (err) {
        if (err instanceof ValidationError) {
            res.status(400).json({ error: buildValidationMessage(err) });
        } else if (
            err instanceof pgpErrors.QueryResultError &&
            err.code === pgpErrors.queryResultErrorCode.noData
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
