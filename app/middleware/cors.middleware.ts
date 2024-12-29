'use strict';

import { CorsOptions } from 'cors';

/**
 * Gets cors options that with dynamic origin inherited from env
 * @returns a {@link CorsOptions} object that `cors` middleware can use
 */
export const corsOptions = (): CorsOptions => {
    const { CORS_ALLOWED_ORIGINS: origin = '*' } = process.env;
    const corsOptions: CorsOptions = {
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['Origin', 'Content-Length', 'Content-Type'],
        maxAge: 43200, // 12 hours
    };

    if (origin !== '*' && origin !== '') {
        corsOptions.origin = origin.split(',');
    }

    return corsOptions;
};
