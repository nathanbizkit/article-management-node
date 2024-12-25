'use strict';

import jwt, {
    JwtPayload,
    PrivateKey,
    PublicKey,
    Secret,
    SignOptions,
} from 'jsonwebtoken';

export const sessionTTL = 259200; // 3 days
export const refreshTTL = 604800; // 7 days
export const sessionCookieMaxAge = sessionTTL * 1000; // 3 days in milliseconds
export const refreshCookieMaxAge = refreshTTL * 1000; // 7 days in milliseconds

// generateToken generates a jwt token in HS512 algorith with id object
export const generateToken = async (
    uid: number,
    key: Secret | PrivateKey,
    options: SignOptions,
): Promise<string | undefined> =>
    new Promise((resolve, reject) =>
        jwt.sign(
            { uid },
            key,
            { ...options, algorithm: 'HS512' },
            (err, encoded) => (err ? reject(err) : resolve(encoded)),
        ),
    );

// parseToken gets an id from jwt token
export const parseToken = async (
    token: string,
    key: Secret | PublicKey,
): Promise<number | undefined> =>
    new Promise((resolve, reject) =>
        jwt.verify(token, key, (err, decoded) =>
            err ? reject(err) : resolve((decoded as JwtPayload)?.uid),
        ),
    );
