'use strict';

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

export type UserProfile = {
    username: string;
    name: string;
    bio: string;
    image: string;
    following: boolean;
};

export interface UserProfileOptions {
    /**
     * Whether the current user follows the user of this profile
     * @default false
     */
    following?: boolean;
}
