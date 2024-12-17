'use strict';

import pgPromise from 'pg-promise';

// PostgresDB represents singleton class of postgres database
class PostgresDB {
    private static _instance: PostgresDB;
    private readonly _pgp: pgPromise.IMain;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _db: pgPromise.IDatabase<any>;

    private constructor() {
        this._pgp = pgPromise();

        const {
            DB_HOST = 'localhost',
            DB_PORT = '5432',
            DB_USER,
            DB_PASS,
            DB_NAME,
        } = process.env;

        this._db = this._pgp(
            `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable`,
        );
    }

    static getInstance() {
        if (!this._instance) {
            this._instance = new PostgresDB();
        }
        return this._instance;
    }

    public get pgp() {
        return this._pgp;
    }

    public get db() {
        return this._db;
    }
}

export default PostgresDB;
