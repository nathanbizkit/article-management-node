'use strict';

import { NextFunction, Request, Response } from 'express';

/**
 * Attaches a middleware that redirects incoming http request to https when appropriate
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express
 * @param next a {@link NextFunction} function from `express`
 * @returns
 */
const secure = (req: Request, res: Response, next: NextFunction) => {
    if (
        !req.secure &&
        req.get('x-forwarded-proto') !== 'https' &&
        process.env.NODE_ENV !== 'development'
    ) {
        res.redirect(`https://${req.headers.host}${req.originalUrl}`);
        return;
    }

    next();
};

export default secure;
