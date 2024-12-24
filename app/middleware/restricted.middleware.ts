'use strict';

import { parseToken } from '@app/auth/jwt.auth';
import { NextFunction, Request, Response } from 'express';

// restricted guards against unauthorized incoming request
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
