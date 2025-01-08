'use strict';

import 'dotenv/config';
import fs from 'fs';
import http from 'http';
import https, { Server as HTTPSServer } from 'https';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { corsOptions } from '#app/middleware/cors.middleware.js';
import secure from '#app/middleware/secure.middleware.js';
import PostgresDB from '#app/db/postgres.db.js';
import apiRouter from '#app/router/api.router.js';

const app = express();

// locals
app.set('postgres db', PostgresDB.getInstance());
app.set('cookie path', '/api/v1');

// middlewares
app.use(cors(corsOptions()));
app.use(secure);
app.use(compression());
app.use(cookieParser());
app.use(morgan('combined'));

// routers
app.use('/api/v1', apiRouter);

// bootup
const {
    APP_PORT = '8000',
    APP_TLS_PORT = '8443',
    TLS_CERT_FILE = '',
    TLS_KEY_FILE = '',
} = process.env;

const httpServer = new http.Server(app);

const appPort = +APP_PORT;
httpServer.listen(appPort, () => {
    console.log(`api server running on port ${appPort}`);
});

let httpsServer: HTTPSServer | undefined;
if (TLS_KEY_FILE !== '' && TLS_CERT_FILE !== '') {
    const options = {
        key: fs.readFileSync(TLS_KEY_FILE),
        cert: fs.readFileSync(TLS_CERT_FILE),
    };
    httpsServer = new https.Server(options, app);

    const appTLSPort = +APP_TLS_PORT;
    httpsServer.listen(appTLSPort, () => {
        console.log(
            `api server running on port ${appTLSPort} (ssl connection)`,
        );
    });
}

// cleanup
const gracefulShutdown = () => {
    httpServer.close(() => console.log('http server closed'));

    if (httpsServer) {
        httpsServer.close(() => console.log('https server closed'));
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
    console.log('unhandled rejection at:', promise, 'reason:', reason);
});
