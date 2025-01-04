'use strict';

import {
    User,
    UserProfile,
    UserProfileOptions,
} from '#app/model/user.types.js';

export type Comment = {
    id: number;
    body: string;
    userID: number;
    author: User;
    articleID: number;
    createdAt: Date;
    updatedAt: Date;
};

export type CommentResponse = {
    id: number;
    body: string;
    author: UserProfile;
    created_at: string;
    updated_at: string;
};

export interface CommentResponseOptions {
    author?: UserProfileOptions;
}

export type CommentFromDB = {
    id: string;
    body: string;
    user_id: string;
    article_id: string;
    created_at: Date;
    updated_at: Date;

    // author
    u_id?: string;
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    bio?: string;
    image?: string;
    u_created_at?: Date;
    u_updated_at?: Date;
};
