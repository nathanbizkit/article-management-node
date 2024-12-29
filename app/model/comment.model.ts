'use strict';

import * as Joi from 'joi';
import { buildUserProfile } from './user.model';
import {
    Comment,
    CommentFromDB,
    CommentResponse,
    CommentResponseOptions,
} from './comment.types';

const schema = Joi.object({
    body: Joi.string().required(),
    userID: Joi.number().required(),
    articleID: Joi.number().required(),
});

/**
 * Validates fields of a comment object
 * @param comment a {@link Comment} object
 * @returns either a {@link Joi.ValidationResult<User>} or a {@link Joi.ValidationError}
 */
export const validateComment = async (
    comment: Comment,
): Promise<Joi.ValidationResult<Comment>> =>
    await schema.validateAsync(comment);

/**
 * Builds a comment response object from a comment object
 * @param comment
 * @param options.author.following Whether the current user follows the user of this profile
 * @returns a {@link CommentResponse} object
 */
export const buildCommentResponse = (
    comment: Comment,
    options: CommentResponseOptions = {},
): CommentResponse => ({
    id: comment.id,
    body: comment.body,
    author: buildUserProfile(comment.author, options.author),
    created_at: comment.createdAt.toISOString(),
    updated_at: comment.updatedAt.toISOString(),
});

/**
 * Maps a database record into a comment object
 * @param comment a {@link CommentFromDB} database record
 * @returns a {@link Comment} object with an optional `author`
 */
export const mapCommentFromDB = (comment: CommentFromDB): Comment => ({
    id: +comment.id,
    body: comment.body,
    userID: +comment.user_id,
    author: {
        id: +(comment.u_id ?? '0'),
        username: comment.username ?? '',
        email: comment.email ?? '',
        plainPassword: '',
        hashedPassword: comment.password ?? '',
        name: comment.name ?? '',
        bio: comment.bio ?? '',
        image: comment.image ?? '',
        createdAt: comment.u_created_at ?? new Date(),
        updatedAt: comment.u_updated_at ?? new Date(),
    },
    articleID: +comment.article_id,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
});
