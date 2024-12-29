'use strict';

import { parseToken } from '@app/auth/jwt.auth';
import { NextFunction, Request, Response } from 'express';

/**
 * Attaches a middleware that guards against unauthorized incoming request
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express
 * @param next a {@link NextFunction} function from `express`
 * @returns
 */
const restricted = async (req: Request, res: Response, next: NextFunction) => {
    const { AUTH_JWT_SECRET_KEY: secretKey = '' } = process.env;

    let uid: number;
    try {
        uid = (await parseToken(req.cookies.session, secretKey)) ?? 0;
    } catch {
        res.status(401).json({ error: 'unauthorized' });
        return;
    }

    res.locals.uid = uid;
    next();
};

export default restricted;
