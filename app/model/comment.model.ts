'use strict';

import Joi from 'joi';
import { responseProfile, User } from './user.model';
import { CommentResponse } from './comment.message';

export type Comment = {
    id: number;
    body: string;
    userID: number;
    author: User;
    articleID: number;
    createdAt: Date;
    updatedAt: Date;
};

const schema = Joi.object({
    body: Joi.string().required(),
    userID: Joi.number().required(),
    articleID: Joi.number().required(),
});

// validateComment validates fields of comment model
export const validateComment = (
    comment: Comment,
): Joi.ValidationResult<Comment> => schema.validate(comment);

// responseComment generates response message for comment
export const responseComment = (
    comment: Comment,
    followingAuthor: boolean,
): CommentResponse => ({
    id: comment.id,
    body: comment.body,
    author: responseProfile(comment.author, followingAuthor),
    created_at: comment.createdAt.toISOString(),
    updated_at: comment.updatedAt.toISOString(),
});
