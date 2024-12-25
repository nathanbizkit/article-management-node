'use strict';

import PostgresDB from '@app/db/postgres.db';
import { getTags } from '@app/store/tag.store';
import { Request, Response } from 'express';

// getAllTags returns all tags
export const getAllTags = async (req: Request, res: Response) => {
    const pgdb = req.app.get('postgres db') as PostgresDB;

    let tags;
    try {
        tags = await getTags(pgdb.db);
    } catch {
        res.status(500).json({ error: 'failed to get tags' });
        return;
    }

    res.status(200).json({ tags: tags.map((tag) => tag.name) });
};
