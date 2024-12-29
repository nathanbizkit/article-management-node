'use strict';

import { Tag } from './tag.types';
import { User, UserProfile, UserProfileOptions } from './user.types';

export type Article = {
    id: number;
    title: string;
    description: string;
    body: string;
    tags: Tag[];
    userID: number;
    author: User;
    favoritesCount: number;
    createdAt: Date;
    updatedAt: Date;
};

export type ArticleResponse = {
    id: number;
    title: string;
    description: string;
    body: string;
    tags: string[];
    favorited: boolean;
    favorites_count: number;
    author: UserProfile;
    created_at: string;
    updated_at: string;
};

export interface ArticleResponseOptions {
    /**
     * Whether the current user favorites this article
     * @default false
     */
    favorited?: boolean;
    author?: UserProfileOptions;
}

export type ArticleFromDB = {
    id: string;
    title: string;
    description: string;
    body: string;
    user_id: string;
    favorites_count: string;
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
