'use strict';

import express from 'express';
import {
    getCurrentUser,
    login,
    loginValidator,
    refreshToken,
    register,
    registerValidator,
    updateCurrentUser,
    updateCurrentUserValidator,
} from '#app/handler/user.handler.js';
import requireAuthentication from '#app/middleware/requireAuthentication.middleware.js';

const userRouter = express.Router();

/**
 * Auth
 */

userRouter.post('/login', loginValidator, login);
userRouter.post('/register', registerValidator, register);
userRouter.post('/refresh_token', refreshToken);

/**
 * Current user
 */

userRouter.get('/me', [requireAuthentication], getCurrentUser);
userRouter.put(
    '/me',
    [requireAuthentication],
    updateCurrentUserValidator,
    updateCurrentUser,
);

export default userRouter;
