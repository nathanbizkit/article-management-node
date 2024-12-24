'use strict';

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsOptions } from '@app/middleware/cors.middleware';
import secure from '@app/middleware/secure.middleware';
import restricted from '@app/middleware/restricted.middleware';

const app = express();

// middlewares
app.use(cors(corsOptions()));
app.use(secure);
app.use(compression());
app.use(cookieParser());

app.get('/', (_req, res) => {
    res.status(200).json({ message: 'Hello, world!' });
});

app.get('/private', restricted, (_req, res) => {
    res.status(200).json({ message: 'Welcome to restricted area!' });
});

const { APP_PORT = '8000' } = process.env;
const appPort = parseInt(APP_PORT);

const server = app.listen(appPort, () => {
    console.log(`server running on port ${appPort}`);
});

const gracefulShutdown = () => {
    server.close(() => console.log('http server closed'));
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
    console.log('unhandled rejection at:', promise, 'reason:', reason);
});
