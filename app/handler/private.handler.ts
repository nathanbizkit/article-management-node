'use strict';

import express from 'express';
import requireAuthentication from '#app/middleware/requireAuthentication.middleware.js';
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

/**
 * Current user profile
 */
privateRouter.get('/me', [requireAuthentication], getCurrentUser);
privateRouter.put(
    '/me',
    [requireAuthentication],
    updateCurrentUserValidator,
    updateCurrentUser,
);

/**
 * Profiles
 */
privateRouter.get('/profiles/:username', [requireAuthentication], showProfile);
privateRouter.post(
    '/profiles/:username/follow',
    [requireAuthentication],
    followUser,
);
privateRouter.delete(
    '/profiles/:username/follow',
    [requireAuthentication],
    unfollowUser,
);

/**
 * Personal Articles
 */
privateRouter.get(
    '/articles/feed',
    [requireAuthentication],
    getAllFeedArticlesValidator,
    getAllFeedArticles,
);
privateRouter.post(
    '/articles',
    [requireAuthentication],
    createNewArticleValidator,
    createNewArticle,
);
privateRouter.put(
    '/articles/:slug',
    [requireAuthentication],
    updateArticleBySlugValidator,
    updateArticleBySlug,
);
privateRouter.delete(
    '/articles/:slug',
    [requireAuthentication],
    deleteArticleBySlug,
);

/**
 * Comments
 */
privateRouter.post(
    '/articles/:slug/comments',
    [requireAuthentication],
    createArticleCommentValidator,
    createArticleComment,
);
privateRouter.delete(
    '/articles/:slug/comments/:id',
    [requireAuthentication],
    deleteArticleComment,
);

/**
 * Favorites
 */
privateRouter.post(
    '/articles/:slug/favorite',
    [requireAuthentication],
    favoriteArticle,
);
privateRouter.delete(
    '/articles/:slug/favorite',
    [requireAuthentication],
    unfavoriteArticle,
);

export default privateRouter;
