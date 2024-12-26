'use strict';

// Tag model
export type Tag = {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};

// TagFromDB model
export type TagFromDB = {
    a_id: string;
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
};

// mapTagFromDB returns a tag object mapping from database record
export const mapTagFromDB = (tag: TagFromDB): Tag & { articleID?: number } => ({
    articleID: tag.a_id ? parseInt(tag.a_id) : undefined,
    id: parseInt(tag.id),
    name: tag.name,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at,
});
