'use strict';

import Joi from 'joi';
import { responseProfile, User } from './user.model';
import { CommentResponse } from './comment.message';

export type Comment = {
    id: number;
    body: string;
    userID: number;
    author: User | null;
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

// mapCommentFromDB returns a comment object mapping from database record
export const mapCommentFromDB = ({
    id,
    body,
    user_id,
    article_id,
    created_at,
    updated_at,
}: {
    id: string;
    body: string;
    user_id: string;
    article_id: string;
    created_at: Date;
    updated_at: Date;
}): Comment => ({
    id: parseInt(id),
    body,
    userID: parseInt(user_id),
    author: null,
    articleID: parseInt(article_id),
    createdAt: created_at,
    updatedAt: updated_at,
});

// mapCommentWithAuthorFromDB returns a comment object with its author mapping from database record
export const mapCommentWithAuthorFromDB = ({
    id,
    body,
    user_id,
    article_id,
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
    body: string;
    user_id: string;
    article_id: string;
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
}): Comment => ({
    id: parseInt(id),
    body,
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
    articleID: parseInt(article_id),
    createdAt: created_at,
    updatedAt: updated_at,
});
