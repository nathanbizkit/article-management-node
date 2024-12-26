'use strict';

import Joi from 'joi';
import {
    buildUserProfile,
    User,
    UserProfile,
    UserProfileOptions,
} from './user.model';

// Comment model
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
export const validateComment = async (
    comment: Comment,
): Promise<Joi.ValidationResult<Comment>> =>
    await schema.validateAsync(comment);

// Comment model
export type CommentResponse = {
    id: number;
    body: string;
    author: UserProfile;
    created_at: string;
    updated_at: string;
};

// CommentResponseOptions model
export interface CommentResponseOptions {
    author?: UserProfileOptions;
}

// buildCommentResponse generates response message for comment
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

// CommentFromDB model
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

// mapCommentFromDB returns a comment object mapping from database record
export const mapCommentFromDB = (comment: CommentFromDB): Comment => ({
    id: parseInt(comment.id),
    body: comment.body,
    userID: parseInt(comment.user_id),
    author: {
        id: parseInt(comment.u_id ?? '0'),
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
    articleID: parseInt(comment.article_id),
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
});
