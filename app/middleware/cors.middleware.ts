'use strict';

import { CorsOptions } from 'cors';

// corsOptions returns custom options for cors middleware
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
