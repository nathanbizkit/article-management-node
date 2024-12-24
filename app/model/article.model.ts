'use strict';

import Joi from 'joi';
import { Tag } from './tag.model';
import { responseProfile, User } from './user.model';
import { ArticleResponse } from './article.message';

// Article model
export type Article = {
    id: number;
    title: string;
    description: string;
    body: string;
    tags: Tag[];
    userID: number;
    author: User | null;
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

// responseArticle generates response message from article
export const responseArticle = (
    article: Article,
    favorited: boolean,
    followingAuthor: boolean,
): ArticleResponse => ({
    id: article.id,
    title: article.title,
    description: article.description,
    body: article.body,
    tags: article.tags.map((tag) => tag.name),
    favorited,
    favorites_count: article.favoritesCount,
    author: responseProfile(article.author, followingAuthor),
    created_at: article.createdAt.toISOString(),
    updated_at: article.updatedAt.toISOString(),
});

// mapArticleFromDB returns an article object mapping from database record
export const mapArticleFromDB = ({
    id,
    title,
    description,
    body,
    user_id,
    favorites_count,
    created_at,
    updated_at,
}: {
    id: string;
    title: string;
    description: string;
    body: string;
    user_id: string;
    favorites_count: string;
    created_at: Date;
    updated_at: Date;
}): Article => ({
    id: parseInt(id),
    title,
    description,
    body,
    tags: [],
    userID: parseInt(user_id),
    author: null,
    favoritesCount: parseInt(favorites_count),
    createdAt: created_at,
    updatedAt: updated_at,
});

// mapArticleWithAuthorFromDB returns an article object with its author mapping from database record
export const mapArticleWithAuthorFromDB = ({
    id,
    title,
    description,
    body,
    user_id,
    favorites_count,
    created_at,
    updated_at,
    u_id,
    username,
    email,
    password,
    name,
    bio,
    image,
    u_created_at,
    u_updated_at,
}: {
    id: string;
    title: string;
    description: string;
    body: string;
    user_id: string;
    favorites_count: string;
    created_at: Date;
    updated_at: Date;
    u_id: string;
    username: string;
    email: string;
    password: string;
    name: string;
    bio: string;
    image: string;
    u_created_at: Date;
    u_updated_at: Date;
}): Article => ({
    id: parseInt(id),
    title,
    description,
    body,
    tags: [],
    userID: parseInt(user_id),
    author: {
        id: parseInt(u_id),
        username,
        email,
        plainPassword: '',
        hashedPassword: password,
        name,
        bio,
        image,
        createdAt: u_created_at,
        updatedAt: u_updated_at,
    },
    favoritesCount: parseInt(favorites_count),
    createdAt: created_at,
    updatedAt: updated_at,
});
