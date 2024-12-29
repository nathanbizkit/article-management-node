'use strict';

import { mapTagFromDB } from '@app/model/tag.model';
import { Tag } from '@app/model/tag.types';
import { IDatabase, ITask } from 'pg-promise';

/**
 * Gets all tags
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @returns an array of {@link Tag}
 */
export const getTags = async <T>(
    db: IDatabase<T> | ITask<T>,
): Promise<Tag[]> => {
    const queryString = `SELECT id, name, created_at, updated_at 
		FROM "article_management".tags`;
    return await db.map(queryString, [], mapTagFromDB);
};

/**
 * Gets all tags of a specific article
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param articleID an article id
 * @returns an array of {@link Tag}
 */
export const getTagsByArticleID = async <T>(
    db: IDatabase<T> | ITask<T>,
    articleID: number,
): Promise<Tag[]> => {
    const queryString = `SELECT 
      t.id, t.name, t.created_at, t.updated_at 
      FROM article_management.tags t 
      INNER JOIN article_management.article_tags at ON at.tag_id = t.id 
      WHERE at.article_id = $1`;
    return await db.map(queryString, [articleID], mapTagFromDB);
};

/**
 * Gets all tags of multiple number of specific articles
 * @param db either {@link IDatabase<T>} or {@link ITask<T>} object
 * @param articleIDs an array of article ids
 * @returns a map of tags of specific articles
 */
export const getTagsByArticleIDs = async <T>(
    db: IDatabase<T> | ITask<T>,
    articleIDs: number[],
): Promise<Record<number, Tag[]>> => {
    const queryString = `SELECT 
      at.article_id AS a_id, t.id, t.name, t.created_at, t.updated_at 
      FROM "article_management".article_tags at 
      INNER JOIN "article_management".tags t ON t.id = at.tag_id 
      WHERE at.article_id = ANY($1:csv)`;
    return await db.map(queryString, [articleIDs], mapTagFromDB).then((tags) =>
        tags.reduce(
            (acc, tag) => {
                return {
                    ...acc,
                    [tag.articleID ?? 0]: [
                        ...(acc[tag.articleID ?? 0] || []),
                        tag,
                    ],
                };
            },
            {} as Record<number, Tag[]>,
        ),
    );
};
