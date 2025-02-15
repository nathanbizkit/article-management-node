'use strict';

import { NextFunction, Request, Response } from 'express';
import { parseToken } from '#app/auth/jwt.auth.js';

/**
 * Attaches a middleware that guards against unauthorized incoming request
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express
 * @param next a {@link NextFunction} function from `express`
 * @returns
 */
const requireAuthentication = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const { AUTH_JWT_SECRET_KEY: secretKey = '' } = process.env;

    let uid = 0;
    try {
        uid = await parseToken(req.cookies.session, secretKey);
    } catch {
        res.status(401).json({ error: 'unauthorized' });
        return;
    }

    res.locals.uid = uid;
    next();
};

export default requireAuthentication;
