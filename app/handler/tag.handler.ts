'use strict';

import PostgresDB from '@app/db/postgres.db';
import { getTags } from '@app/store/tag.store';
import { Request, Response } from 'express';

/**
 * Gets all tags
 * @param req a {@link Request} object from `express`
 * @param res a {@link Response} object from `express`
 */
export const getAllTags = async (req: Request, res: Response) => {
    const pgdb = req.app.get('postgres db') as PostgresDB;

    try {
        const tags = await getTags(pgdb.db);
        res.status(200).json({ tags: tags.map((tag) => tag.name) });
    } catch {
        res.status(500).json({ error: 'failed to get tags' });
    }
};
