'use strict';

import Joi from 'joi';
import Bcrypt from 'bcrypt';

// User model
export type User = {
    id: number;
    username: string;
    email: string;
    plainPassword: string;
    hashedPassword: string;
    name: string;
    bio: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
};

const schema = Joi.object({
    username: Joi.string()
        .pattern(/^[a-zA-Z0-9][a-zA-Z0-9_.]+[a-zA-Z0-9]$/)
        .min(5)
        .max(100)
        .required(),

    plainPassword: Joi.string()
        .pattern(/^(?=.*\d)(?=.*[!@#$%^&*_.])(?=.*[a-z])(?=.*[A-Z]).+$/)
        .min(7)
        .max(50)
        .required(),

    email: Joi.string().email().min(5).max(100).required(),
    name: Joi.string().min(5).max(100).required(),
    bio: Joi.string().max(255),
    image: Joi.string().max(255),
});

// validateUser validates fields of user model
export const validateUser = async (
    user: User,
): Promise<Joi.ValidationResult<User>> => await schema.validateAsync(user);

// overwriteUser overwrites each field if it's not falsy-value
export const overwriteUser = (a: User, b: User): User => ({
    ...a,
    username: b.username.trim() || a.username,
    email: b.email.trim() || a.email,
    plainPassword: b.plainPassword.trim() || a.plainPassword,
    name: b.name.trim() || a.name,
    bio: b.bio,
    image: b.image,
});

// hashUserPassword encrypts user's password and stores it as hashed password
export const hashUserPassword = async (plain: string): Promise<string> =>
    !plain || plain === ''
        ? await Promise.reject(new Error('plain password is empty'))
        : await Bcrypt.hash(plain, 10);

// checkPassword checks if user's password is matched with hashed password
export const checkPassword = async (
    hashed: string,
    plain: string,
): Promise<boolean> => await Bcrypt.compare(plain, hashed);

// UserProfile model
export type UserProfile = {
    username: string;
    name: string;
    bio: string;
    image: string;
    following: boolean;
};

// UserProfileOptions model
export interface UserProfileOptions {
    following?: boolean;
}

// buildUserProfile generates user's profile information
export const buildUserProfile = (
    user: User,
    options: UserProfileOptions = {},
): UserProfile => ({
    username: user.username,
    name: user.name,
    bio: user.bio,
    image: user.image,
    following: options.following ?? false,
});

// UserFromDB model
export type UserFromDB = {
    id: string;
    username: string;
    email: string;
    password: string;
    name: string;
    bio: string;
    image: string;
    created_at: Date;
    updated_at: Date;
};

// mapUserFromDB returns a user object mapping from database record
export const mapUserFromDB = (user: UserFromDB): User => ({
    id: parseInt(user.id),
    username: user.username,
    email: user.email,
    plainPassword: '',
    hashedPassword: user.password,
    name: user.name,
    bio: user.bio,
    image: user.image,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
});
