'use strict';

import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
    buildCommentResponse,
    validateComment,
} from '#app/model/comment.model.js';
import { User, UserProfile } from '#app/model/user.types.js';
import { Comment, CommentResponse } from '#app/model/comment.types.js';

chaiUse(chaiAsPromised);

describe('model comment', function () {
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
    const normalComment: Comment = {
        id: 1,
        body: 'This is a body.',
        userID: 1,
        author: normalUser,
        articleID: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe('validation', function () {
        it('should allow normal comment to pass validation', async function () {
            await expect(
                validateComment(normalComment),
            ).to.eventually.deep.equal(normalComment);
        });

        it('should reject comment with empty body', async function () {
            const expected = '"body" is not allowed to be empty';
            const comment: Comment = {
                ...normalComment,
                body: '',
            };
            await expect(validateComment(comment)).to.be.rejectedWith(expected);
        });
    });

    it('should build comment response', function () {
        const { username, name, bio, image } = normalUser;
        const author: UserProfile = {
            username,
            name,
            bio,
            image,
            following: false,
        };
        const { id, body, createdAt, updatedAt } = normalComment;
        const expected: CommentResponse = {
            id,
            body,
            author,
            created_at: createdAt.toISOString(),
            updated_at: updatedAt.toISOString(),
        };
        expect(buildCommentResponse(normalComment)).to.deep.equal(expected);
    });
});
