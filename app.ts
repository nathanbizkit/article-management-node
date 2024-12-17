'use strict';

import 'dotenv/config';
import express from 'express';

const app = express();

app.get('/', (_req, res) => {
    res.status(200).json({ message: 'Hello, world!' });
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
