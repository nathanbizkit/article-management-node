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
export const validateArticle = (
    article: Article,
): Joi.ValidationResult<Article> => schema.validate(article);

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
