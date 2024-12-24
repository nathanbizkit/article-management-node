'use strict';

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsOptions } from '@app/middleware/cors.middleware';
import secure from '@app/middleware/secure.middleware';
import publicRouter from '@app/handler/public.handler';
import privateRouter from '@app/handler/private.handler';

const app = express();

// middlewares
app.use(cors(corsOptions()));
app.use(secure);
app.use(compression());
app.use(cookieParser());

// routers
app.use(publicRouter);
app.use(privateRouter);

// bootup
const { APP_PORT = '8000' } = process.env;
const appPort = parseInt(APP_PORT);
const server = app.listen(appPort, () => {
    console.log(`server running on port ${appPort}`);
});

// cleanup
const gracefulShutdown = () => {
    server.close(() => console.log('http server closed'));
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
    console.log('unhandled rejection at:', promise, 'reason:', reason);
});
