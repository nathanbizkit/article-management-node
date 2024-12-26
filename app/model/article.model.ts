'use strict';

import Joi from 'joi';
import { Tag } from './tag.model';
import {
    buildUserProfile,
    User,
    UserProfile,
    UserProfileOptions,
} from './user.model';

// Article model
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

const schema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(5).max(100),
    body: Joi.string().required(),
    userID: Joi.number().required(),
    tags: Joi.array().items(Joi.string().min(3).max(50)),
});

// validateArticle validtes fields of article model
export const validateArticle = async (
    article: Article,
): Promise<Joi.ValidationResult<Article>> =>
    await schema.validateAsync(article);

// overwriteArticle overwrites each field if it's not falsy-value
export const overwriteArticle = (a: Article, b: Article): Article => ({
    ...a,
    title: b.title.trim() || a.title,
    body: b.body.trim() || a.body,
    description: b.description,
});

// ArticleResponse model
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

// ArticleResponseOptions model
export interface ArticleResponseOptions {
    favorited?: boolean;
    author?: UserProfileOptions;
}

// buildArticleResponse generates response message from article
export const buildArticleResponse = (
    article: Article,
    options: ArticleResponseOptions = {},
): ArticleResponse => ({
    id: article.id,
    title: article.title,
    description: article.description,
    body: article.body,
    tags: article.tags.map((tag) => tag.name),
    favorited: options.favorited ?? false,
    favorites_count: article.favoritesCount,
    author: buildUserProfile(article.author, options.author),
    created_at: article.createdAt.toISOString(),
    updated_at: article.updatedAt.toISOString(),
});

// ArticleFromDB model
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

// mapArticleFromDB returns an article object mapping from database record
export const mapArticleFromDB = (article: ArticleFromDB): Article => ({
    id: parseInt(article.id),
    title: article.title,
    description: article.description,
    body: article.body,
    tags: [],
    userID: parseInt(article.user_id),
    author: {
        id: parseInt(article.u_id ?? '0'),
        username: article.username ?? '',
        email: article.email ?? '',
        plainPassword: '',
        hashedPassword: article.password ?? '',
        name: article.name ?? '',
        bio: article.bio ?? '',
        image: article.image ?? '',
        createdAt: article.u_created_at ?? new Date(),
        updatedAt: article.u_updated_at ?? new Date(),
    },
    favoritesCount: parseInt(article.favorites_count),
    createdAt: article.created_at,
    updatedAt: article.updated_at,
});
