'use strict';

import { NextFunction, Request, Response } from 'express';

// secure attaches secure tls middleware to http engine
const secure = (req: Request, res: Response, next: NextFunction) => {
    if (
        !req.secure &&
        req.get('x-forwarded-proto') !== 'https' &&
        process.env.NODE_ENV !== 'development'
    ) {
        return res.redirect(`https://${req.get('host')}${req.url}`);
    }

    next();
};

export default secure;
