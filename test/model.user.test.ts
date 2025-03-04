'use strict';

import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
    buildUserProfile,
    checkPassword,
    hashUserPassword,
    overwriteUser,
    validateUser,
} from '#app/model/user.model.js';
import { User, UserProfile } from '#app/model/user.types.js';

chaiUse(chaiAsPromised);

describe('model user', function () {
    const normalUser: User = {
        id: 1,
        username: 'foobar',
        email: 'foobar@gmail.com',
        plainPassword: 'P@ssW0rd',
        hashedPassword: '',
        name: 'FOOBAR',
        bio: '',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe('validation', function () {
        it('should allow normal user to pass validation', async function () {
            await expect(validateUser(normalUser)).to.eventually.deep.equal(
                normalUser,
            );
        });

        describe('username', function () {
            it('should reject user with empty username', async function () {
                const expected = `"username" is not allowed to be empty`;
                const user: User = {
                    ...normalUser,
                    username: '',
                };
                await expect(validateUser(user)).to.be.rejectedWith(expected);
            });

            it('should reject user with short username', async function () {
                const expected = `"username" length must be at least 5 characters long`;
                const user: User = {
                    ...normalUser,
                    username: 'abc',
                };
                await expect(validateUser(user)).to.be.rejectedWith(expected);
            });

            it('should reject user with long username', async function () {
                const expected =
                    `"username" length must be less than ` +
                    `or equal to 100 characters long`;
                const user: User = {
                    ...normalUser,
                    username: 'a'.repeat(101),
                };
                await expect(validateUser(user)).to.be.rejectedWith(expected);
            });

            it('should reject user with wrong pattern in the username', async function () {
                const expected =
                    `"username" with value "_abc_" fails to ` +
                    `match the required pattern: /^[a-zA-Z0-9][a-zA-Z0-9_.]+[a-zA-Z0-9]$/`;
                const user: User = {
                    ...normalUser,
                    username: '_abc_',
                };
                await expect(validateUser(user)).to.be.rejectedWith(expected);
            });
        });

        describe('email', function () {
            it('should reject user with invalid email', async function () {
                const expected = `"email" must be a valid email`;
                const user: User = {
                    ...normalUser,
                    email: `___abc@__.com`,
                };
                await expect(validateUser(user)).to.be.rejectedWith(expected);
            });
        });

        describe('plain password', function () {
            it('should reject user with short password', async function () {
                const expected = `"plainPassword" length must be at least 7 characters long`;
                const user: User = {
                    ...normalUser,
                    plainPassword: 'Ab1$',
                };
                await expect(validateUser(user)).to.rejectedWith(expected);
            });

            it('should reject user with long password', async function () {
                const expected =
                    `"plainPassword" length must be less than ` +
                    `or equal to 50 characters long`;
                const user: User = {
                    ...normalUser,
                    plainPassword: `${'A'.repeat(51)}b1$`,
                };
                await expect(validateUser(user)).to.rejectedWith(expected);
            });

            it('should reject user with wrong pattern in the password', async function () {
                const expected =
                    `"plainPassword" with value "abcdefg" fails to ` +
                    `match the required pattern: /^(?=.*\\d)(?=.*[!@#$%^&*_.])(?=.*[a-z])(?=.*[A-Z]).+$/`;
                const user: User = {
                    ...normalUser,
                    plainPassword: 'abcdefg',
                };
                await expect(validateUser(user)).to.rejectedWith(expected);
            });
        });

        describe('name', function () {
            it('should reject user with short name', async function () {
                const expected = `"name" length must be at least 5 characters long`;
                const user: User = {
                    ...normalUser,
                    name: 'FOO',
                };
                await expect(validateUser(user)).to.rejectedWith(expected);
            });

            it('should reject user with long name', async function () {
                const expected =
                    `"name" length must be less than ` +
                    `or equal to 100 characters long`;
                const user: User = {
                    ...normalUser,
                    name: 'FOO'.repeat(51),
                };
                await expect(validateUser(user)).to.rejectedWith(expected);
            });
        });

        describe('bio', function () {
            it('should reject user with long bio', async function () {
                const expected =
                    `"bio" length must be less than ` +
                    `or equal to 255 characters long`;
                const user: User = {
                    ...normalUser,
                    bio: 'a'.repeat(256),
                };
                await expect(validateUser(user)).to.rejectedWith(expected);
            });
        });
    });

    describe('overwrite', function () {
        it('should overwrite user A with user B', function () {
            const expected: User = {
                id: 1,
                username: 'foobar_2',
                email: 'foobar_2@gmail.com',
                plainPassword: 'password_foobar_2',
                hashedPassword: '',
                name: 'FOOBAR 2',
                bio: 'This is foobar 2.',
                image: 'https://imgur.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const userA: User = {
                id: 1,
                username: 'foobar_1',
                email: 'foobar_1@gmail.com',
                plainPassword: 'password_foobar_1',
                hashedPassword: '',
                name: 'FOOBAR 1',
                bio: '',
                image: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const userB: User = {
                id: 2,
                username: 'foobar_2',
                email: 'foobar_2@gmail.com',
                plainPassword: 'password_foobar_2',
                hashedPassword: '',
                name: 'FOOBAR 2',
                bio: 'This is foobar 2.',
                image: 'https://imgur.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const overwrittenUser = overwriteUser(userA, userB);
            expect(overwrittenUser).to.deep.equal(expected);
        });

        it('should not overwrite user A with user B that has empty fields', function () {
            const expected: User = {
                id: 1,
                username: 'foobar_1',
                email: 'foobar_1@gmail.com',
                plainPassword: '',
                hashedPassword: '',
                name: 'FOOBAR 1',
                bio: 'This is foobar 2.',
                image: 'https://imgur.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const userA: User = {
                id: 1,
                username: 'foobar_1',
                email: 'foobar_1@gmail.com',
                plainPassword: 'password_foobar_1',
                hashedPassword: '',
                name: 'FOOBAR 1',
                bio: '',
                image: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const userB: User = {
                id: 2,
                username: '',
                email: '',
                plainPassword: '',
                hashedPassword: '',
                name: '',
                bio: 'This is foobar 2.',
                image: 'https://imgur.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const overwrittenUser = overwriteUser(userA, userB);
            expect(overwrittenUser).to.deep.equal(expected);
        });
    });

    describe('password hashing', function () {
        it('should hash password', async function () {
            const plain = 'password';
            const hashed = await hashUserPassword(plain);
            await expect(checkPassword(plain, hashed)).to.eventually.be.true;
        });

        it('should reject when plain password is empty', async function () {
            const expected = 'password is empty';
            await expect(hashUserPassword('')).to.be.rejectedWith(expected);
        });
    });

    it('should build user profile', function () {
        const { username, name, bio, image } = normalUser;
        const expected: UserProfile = {
            username,
            name,
            bio,
            image,
            following: false,
        };
        expect(buildUserProfile(normalUser)).to.deep.equal(expected);
    });
});
