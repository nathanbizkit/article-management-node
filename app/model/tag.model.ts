'use strict';

// Tag model
export type Tag = {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};

// mapTagFromDB returns a tag object mapping from database record
export const mapTagFromDB = ({
    id,
    name,
    created_at,
    updated_at,
}: {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}): Tag => ({
    id: parseInt(id),
    name,
    createdAt: created_at,
    updatedAt: updated_at,
});

// mapTagsFromDB returns tag objects mapping from database record
export const mapTagsFromDB = ({
    a_id,
    id,
    name,
    created_at,
    updated_at,
}: {
    a_id: string;
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}): Tag & { articleID: number } => ({
    articleID: parseInt(a_id),
    id: parseInt(id),
    name,
    createdAt: created_at,
    updatedAt: updated_at,
});
