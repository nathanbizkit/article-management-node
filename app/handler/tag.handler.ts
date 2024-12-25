'use strict';

import PostgresDB from '@app/db/postgres.db';
import { getTags } from '@app/store/tag.store';
import { Request, Response } from 'express';

// getAllTags returns all tags
export const getAllTags = async (_req: Request, res: Response) => {
    const db = PostgresDB.getInstance().db;

    let tags;
    try {
        tags = await getTags(db);
    } catch {
        res.status(500).json({ error: 'failed to get tags' });
        return;
    }

    res.status(200).json({ tags: tags.map((tag) => tag.name) });
};
