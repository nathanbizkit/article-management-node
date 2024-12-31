'use strict';

import * as Joi from 'joi';
import { buildUserProfile } from './user.model';
import {
    Article,
    ArticleFromDB,
    ArticleResponse,
    ArticleResponseOptions,
} from './article.types';

const schema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(5).max(100).allow(''),
    body: Joi.string().required(),
    userID: Joi.number().required(),
    tags: Joi.array().items(Joi.string().min(3).max(50)),
});

/**
 * Validates fields of an article object
 * @param article a {@link Article} object
 * @returns either a ValidationResult<Article> or a {@link Joi.ValidationError}
 */
export const validateArticle = async (
    article: Article,
): Promise<Joi.ValidationResult<Article>> =>
    await schema.validateAsync(article);

/**
 * Overwrites each fields of `a` with `b` if it's not falsy-value
 * @param a an {@link Article} object to be overwritten
 * @param b an {@link Article} object to overwrite
 * @returns an overwritten {@link Article} object
 */
export const overwriteArticle = (a: Article, b: Article): Article => ({
    ...a,
    title: b.title?.trim() || a.title,
    body: b.body?.trim() || a.body,
    description: b.description,
});

/**
 * Builds an article response object from an article object
 * @param article an {@link Article} object
 * @param options.favorited Whether the current user favorites this article
 * @param options.author.following Whether the current user follows the user of this profile
 * @returns a {@link ArticleResponse} object
 */
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

/**
 * Maps a database record into an article object
 * @param article an {@link ArticleFromDB} database record
 * @returns an {@link Article} object with an optional `author`
 */
export const mapArticleFromDB = (article: ArticleFromDB): Article => ({
    id: +article.id,
    title: article.title,
    description: article.description,
    body: article.body,
    tags: [],
    userID: +article.user_id,
    author: {
        id: +(article.u_id ?? '0'),
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
    favoritesCount: +article.favorites_count,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
});
