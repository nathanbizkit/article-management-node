'use strict';

import { mapTagFromDB, mapTagsFromDB, Tag } from '@app/model/tag.model';
import { IDatabase, ITask } from 'pg-promise';

// getTags gets all tags
export const getTags = async <T>(db: IDatabase<T> | ITask<T>) => {
    const queryString = `SELECT id, name, created_at, updated_at 
		FROM "article_management".tags`;
    return db.map(queryString, [], mapTagFromDB);
};

// getTagsByArticleID returns all tags of a specifc article
export const getTagsByArticleID = async <T>(
    db: IDatabase<T> | ITask<T>,
    articleID: number,
): Promise<Tag[]> => {
    const queryString = `SELECT 
      t.id, t.name, t.created_at, t.updated_at 
      FROM article_management.tags t 
      INNER JOIN article_management.article_tags at ON at.tag_id = t.id 
      WHERE at.article_id = $1`;
    return db.map(queryString, [articleID], mapTagFromDB);
};

// getTagsByArticleIDs returns all tags for specific articles
export const getTagsByArticleIDs = async <T>(
    db: IDatabase<T> | ITask<T>,
    articleIDs: number[],
): Promise<{ [k: number]: Tag[] }> => {
    const queryString = `SELECT 
      at.article_id AS a_id, t.id, t.name, t.created_at, t.updated_at 
      FROM "article_management".article_tags at 
      INNER JOIN "article_management".tags t ON t.id = at.tag_id 
      WHERE at.article_id = ANY($1:csv)`;
    const tags = await db.map(queryString, [articleIDs], mapTagsFromDB);

    return tags.reduce(
        (acc, tag) => {
            return {
                ...acc,
                [tag.articleID]: [...(acc[tag.articleID] || []), tag],
            };
        },
        {} as { [k: number]: Tag[] },
    );
};
