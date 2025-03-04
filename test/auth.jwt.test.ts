'use strict';

import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import jwt from 'jsonwebtoken';
import { generateToken, parseToken } from '#app/auth/jwt.auth.js';

chaiUse(chaiAsPromised);

describe('jwt auth', function () {
    describe('token signing', function () {
        const secretKey = 'SECRET_KEY';
        const uid = 1;

        it('should generate a jwt with user id payload', async function () {
            const token = await generateToken(uid, secretKey);
            const parsedUid = await parseToken(token, secretKey);
            expect(parsedUid).to.equal(uid);
        });

        it('should fail when generating a jwt using empty key', async function () {
            const expected = 'secretOrPrivateKey must have a value';
            await expect(generateToken(0, '')).to.be.rejectedWith(expected);
        });

        it('should fail when parsing a jwt with wrong key', async function () {
            const expected = 'invalid signature';
            const token = await generateToken(uid, secretKey);
            await expect(parseToken(token, 'WRONG_KEY')).to.be.rejectedWith(
                expected,
            );
        });

        it('should fail when parsing a jwt with invalid payload', async function () {
            const expected = 'invalid type of payload';
            const token = await jwt.sign('string', secretKey);
            await expect(parseToken(token, secretKey)).to.be.rejectedWith(
                expected,
            );
        });

        it('should fail when parsing a jwt when uid is missing', async function () {
            const expected = 'uid is missing';
            const token = await jwt.sign({ foo: 'bar' }, secretKey);
            await expect(parseToken(token, secretKey)).to.be.rejectedWith(
                expected,
            );
        });

        it('should fail when parsing a malformed jwt', async function () {
            const expected = 'jwt malformed';
            await expect(parseToken('foobar', secretKey)).to.be.rejectedWith(
                expected,
            );
        });
    });
});
