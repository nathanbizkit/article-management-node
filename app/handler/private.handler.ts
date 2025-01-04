'use strict';

import express from 'express';
import restricted from '#app/middleware/restricted.middleware.js';
import {
    getCurrentUser,
    updateCurrentUser,
    updateCurrentUserValidator,
} from '#app/handler/user.handler.js';
import {
    followUser,
    showProfile,
    unfollowUser,
} from '#app/handler/profile.handler.js';
import {
    createArticleComment,
    createArticleCommentValidator,
    deleteArticleComment,
} from '#app/handler/comment.handler.js';
import {
    createNewArticle,
    createNewArticleValidator,
    deleteArticleBySlug,
    favoriteArticle,
    getAllFeedArticles,
    getAllFeedArticlesValidator,
    unfavoriteArticle,
    updateArticleBySlug,
    updateArticleBySlugValidator,
} from '#app/handler/article.handler.js';

const privateRouter = express.Router();
privateRouter.use(restricted);

privateRouter.get('/me', getCurrentUser);
privateRouter.put('/me', updateCurrentUserValidator, updateCurrentUser);

privateRouter.get('/profiles/:username', showProfile);
privateRouter.post('/profiles/:username/follow', followUser);
privateRouter.delete('/profiles/:username/follow', unfollowUser);

privateRouter.get(
    '/articles/feed',
    getAllFeedArticlesValidator,
    getAllFeedArticles,
);
privateRouter.post('/articles', createNewArticleValidator, createNewArticle);
privateRouter.put(
    '/articles/:slug',
    updateArticleBySlugValidator,
    updateArticleBySlug,
);
privateRouter.delete('/articles/:slug', deleteArticleBySlug);

privateRouter.post(
    '/articles/:slug/comments',
    createArticleCommentValidator,
    createArticleComment,
);
privateRouter.delete('/articles/:slug/comments/:id', deleteArticleComment);

privateRouter.post('/articles/:slug/favorite', favoriteArticle);
privateRouter.delete('/articles/:slug/favorite', unfavoriteArticle);

export default privateRouter;
