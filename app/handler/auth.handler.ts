'use strict';

import {
    generateToken,
    refreshCookieMaxAge,
    refreshTTL,
    sessionCookieMaxAge,
    sessionTTL,
} from '@app/auth/jwt.auth';
import PostgresDB from '@app/db/postgres.db';
import { checkPassword } from '@app/model/user.model';
import { getUserByEmail } from '@app/store/user.store';
import { Request, Response } from 'express';
import { checkSchema } from 'express-validator';

export const loginValidator = checkSchema({
    email: { isEmail: true },
    password: { notEmpty: true },
});

export const login = async (req: Request, res: Response) => {
    const pgdb = req.app.get('postgres db') as PostgresDB;
    const { email, password } = req.body;

    let user;
    try {
        user = await getUserByEmail(pgdb.db, email);
    } catch {
        res.status(404).json({ error: 'user not found' });
        return;
    }

    if (!checkPassword(user?.hashedPassword, password)) {
        res.status(400).json({ error: 'invalid password' });
        return;
    }

    try {
        const { AUTH_JWT_SECRET_KEY: key = '' } = process.env;
        const cookiePath = req.app.get('cookie path');

        const sessionToken = await generateToken(user?.id, key, {
            expiresIn: sessionTTL,
        });
        const refreshToken = await generateToken(user?.id, key, {
            expiresIn: refreshTTL,
        });

        const cookieOptions = {
            path: cookiePath,
            secure: true,
            httpOnly: true,
        };
        res.cookie('session', sessionToken, {
            ...cookieOptions,
            maxAge: sessionCookieMaxAge,
        });
        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: refreshCookieMaxAge,
        });
    } catch {
        res.status(500).json({ error: 'failed to generate token' });
        return;
    }

    res.status(204);
};
