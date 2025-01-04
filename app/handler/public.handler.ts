'use strict';

import express from 'express';
import { getAllTags } from '#app/handler/tag.handler.js';
import {
    login,
    loginValidator,
    refreshToken,
    register,
    registerValidator,
} from '#app/handler/user.handler.js';
import { getArticleComments } from '#app/handler/comment.handler.js';
import {
    getAllArticles,
    getAllArticlesValidator,
    getArticle,
} from '#app/handler/article.handler.js';

const publicRouter = express.Router();

publicRouter.use(express.json());

publicRouter.get('/login', loginValidator, login);
publicRouter.post('register', registerValidator, register);
publicRouter.post('/refresh_token', refreshToken);
publicRouter.get('/tags', getAllTags);

publicRouter.get('/articles', getAllArticlesValidator, getAllArticles);
publicRouter.get('/articles/:slug', getArticle);
publicRouter.get('/articles/:slug/comments', getArticleComments);

export default publicRouter;
