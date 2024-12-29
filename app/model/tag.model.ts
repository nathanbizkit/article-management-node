'use strict';

import { Tag, TagFromDB } from './tag.types';

/**
 * Maps a database record into a tag object
 * @param tag a {@link TagFromDB} database record
 * @returns a {@link Tag} object with an optional `articleID`
 */
export const mapTagFromDB = (tag: TagFromDB): Tag & { articleID?: number } => ({
    articleID: +(tag.a_id ?? '0'),
    id: +tag.id,
    name: tag.name,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at,
});
