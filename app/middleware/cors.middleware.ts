'use strict';

import { CorsOptions } from 'cors';

// corsOptions returns custom options for cors middleware
export const corsOptions = (): CorsOptions => {
    const { CORS_ALLOWED_ORIGINS = '*' } = process.env;
    const corsOptions: CorsOptions = {
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['Origin', 'Content-Length', 'Content-Type'],
        maxAge: 43200, // 12 hours
    };

    if (CORS_ALLOWED_ORIGINS !== '*' && CORS_ALLOWED_ORIGINS !== '') {
        corsOptions.origin = CORS_ALLOWED_ORIGINS.split(',');
    }

    return corsOptions;
};
