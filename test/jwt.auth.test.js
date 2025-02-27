'use strict';

import assert from 'assert';
import { generateToken, parseToken } from '#app/auth/jwt.auth.js';

describe('JWT Auth', function () {
    const secretKey = 'SECRET_KEY';

    it('should generate a jwt with user id payload', async function () {
        const uid = 1;
        const token = await generateToken(uid, secretKey);
        assert.ok(token);

        const parsedUid = await parseToken(token, secretKey);
        assert.strictEqual(uid, parsedUid);
    });
});
