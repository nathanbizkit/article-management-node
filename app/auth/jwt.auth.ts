'use strict';

import Jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { AuthenticationError } from './jwt.types';

export const sessionTTL = 259200; // 3 days (seconds)
export const refreshTTL = 604800; // 7 days (seconds)

/**
 * Generates a jwt in HS512 algorithm with user id payload
 * @param uid user id
 * @param key secret key
 * @param options sign options from `jsonwebtoken`
 * @returns a signed token with user id payload
 */
export const generateToken = async (
    uid: number,
    key: Secret,
    options: SignOptions = {},
): Promise<string> =>
    new Promise((resolve, reject) =>
        Jwt.sign(
            { uid },
            key,
            { ...options, algorithm: 'HS512' },
            (err, encoded) =>
                err
                    ? reject(new AuthenticationError(err.message))
                    : encoded
                      ? resolve(encoded)
                      : reject(new AuthenticationError('token is empty')),
        ),
    );

/**
 * Gets a user id from token
 * @param token a signed token
 * @param key secret key
 * @returns a user id
 */
export const parseToken = async (token: string, key: Secret): Promise<number> =>
    new Promise((resolve, reject) =>
        Jwt.verify(token, key, (err, decoded) =>
            err
                ? reject(new AuthenticationError(err.message))
                : decoded
                  ? typeof decoded === 'string' &&
                    Object.prototype.toString.call(decoded) ===
                        '[object String]'
                      ? reject(
                            new AuthenticationError('invalid type of payload'),
                        )
                      : (decoded as JwtPayload).uid
                        ? resolve((decoded as JwtPayload).uid)
                        : reject(new AuthenticationError('uid is missing'))
                  : reject(new AuthenticationError('corrupted payload')),
        ),
    );
