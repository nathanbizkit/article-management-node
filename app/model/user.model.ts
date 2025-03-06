'use strict';

import joi from 'joi';
import bcrypt from 'bcrypt';
import {
    User,
    UserFromDB,
    UserProfile,
    UserProfileOptions,
} from '#app/model/user.types.js';

const schema = joi.object({
    id: joi.number().optional(),
    username: joi
        .string()
        .pattern(/^[a-zA-Z0-9][a-zA-Z0-9_.]+[a-zA-Z0-9]$/)
        .min(5)
        .max(100)
        .required(),
    email: joi.string().email().required(),
    plainPassword: joi
        .string()
        .pattern(/^(?=.*\d)(?=.*[!@#$%^&*_.])(?=.*[a-z])(?=.*[A-Z]).+$/)
        .min(7)
        .max(50)
        .required(),
    hashedPassword: joi.string().allow('').optional(),
    name: joi.string().min(5).max(100).required(),
    bio: joi.string().max(255).allow(''),
    image: joi.string().uri().max(255).allow(''),
    createdAt: joi.date().optional(),
    updatedAt: joi.date().optional(),
});

/**
 * Validates fields of a user object
 * @param user a {@link User} object
 * @returns either a ValidationResult<User> or a {@link joi.ValidationError}
 */
export const validateUser = async (
    user: User,
): Promise<joi.ValidationResult<User>> => await schema.validateAsync(user);

/**
 * Overwrites each fields of `a` with `b` if it's not falsy value
 * @param a a {@link User} object to be overwritten
 * @param b a {@link User} object to overwrite
 * @returns an overwritten {@link User} object
 */
export const overwriteUser = (a: User, b: User): User => ({
    ...a,
    username: b.username?.trim() || a.username,
    email: b.email?.trim() || a.email,
    plainPassword: b.plainPassword?.trim() || '', // no hashing required if empty
    name: b.name?.trim() || a.name,
    bio: b.bio,
    image: b.image,
});

/**
 * Encrypts a plain password
 * @param plain a plain password
 * @returns a hashed password
 */
export const hashUserPassword = async (plain: string): Promise<string> =>
    !plain || plain === ''
        ? await Promise.reject(new Error('password is empty'))
        : await bcrypt.hash(plain, 10);

/**
 * Checks whether a user's password is matched with a hashed one
 * @param plain a plain password
 * @param hashed a password that is already hashed
 * @returns `true` if the plain password is matched, otherwise `false`
 */
export const checkPassword = async (
    plain: string,
    hashed: string,
): Promise<boolean> => await bcrypt.compare(plain, hashed);

/**
 * Builds a user's profile object from a user object
 * @param user a {@link User} object
 * @param options.following Whether the current user follows the user of this profile
 * @returns a {@link UserProfile} object
 */
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

/**
 * Maps a database record into a user object
 * @param user a {@link UserFromDB} database record
 * @returns a {@link User} object
 */
export const mapUserFromDB = (user: UserFromDB): User => ({
    id: +user.id,
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
