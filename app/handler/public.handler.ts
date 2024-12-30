'use strict';

import express from 'express';
import { getAllTags } from './tag.handler';
import {
    login,
    loginValidator,
    refreshToken,
    register,
    registerValidator,
} from './auth.handler';
import { getArticleComments } from './comment.handler';

const publicRouter = express.Router();

publicRouter.use(express.json());

publicRouter.get('/login', loginValidator, login);
publicRouter.post('register', registerValidator, register);
publicRouter.post('/refresh_token', refreshToken);
publicRouter.get('/tags', getAllTags);

publicRouter.get('/articles/:slug/comments', getArticleComments);

export default publicRouter;
