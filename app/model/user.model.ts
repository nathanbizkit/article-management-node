'use strict';

import Joi from 'joi';
import Bcrypt from 'bcrypt';
import { ProfileResponse } from './user.message';

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
export const validateUser = (user: User): Joi.ValidationResult<User> =>
    schema.validate(user);

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
export const hashUserPassword = async (user: User) => {
    if (user.plainPassword === '') {
        throw new Error('plain password is empty');
    }

    user.hashedPassword = await Bcrypt.hash(user.plainPassword, 10);
};

// checkUserPassword checks if user's password is matched with hashed password
export const checkUserPassword = async (
    user: User,
    plain: string,
): Promise<boolean> => await Bcrypt.compare(plain, user.hashedPassword);

// responseProfile generates response message for user's profile
export const responseProfile = (
    user: User,
    following: boolean,
): ProfileResponse => ({
    username: user.username,
    name: user.name,
    bio: user.bio,
    image: user.image,
    following,
});
