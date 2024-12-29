'use strict';

export type Tag = {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};

export type TagFromDB = {
    a_id: string;
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
};
