'use strict';

import express from 'express';
import {
    createNewArticle,
    createNewArticleValidator,
    deleteArticleBySlug,
    favoriteArticle,
    getAllArticles,
    getAllArticlesValidator,
    getArticle,
    getAllFeedArticles,
    getAllFeedArticlesValidator,
    unfavoriteArticle,
    updateArticleBySlug,
    updateArticleBySlugValidator,
} from '#app/handler/article.handler.js';
import {
    createArticleComment,
    createArticleCommentValidator,
    deleteArticleComment,
    getArticleComments,
} from '#app/handler/comment.handler.js';
import requireAuthentication from '#app/middleware/requireAuthentication.middleware.js';

const articleRouter = express.Router();

/**
 * Articles
 */

articleRouter.get('/', getAllArticlesValidator, getAllArticles);
articleRouter.get(
    '/feed',
    [requireAuthentication],
    getAllFeedArticlesValidator,
    getAllFeedArticles,
);
articleRouter.post(
    '/',
    [requireAuthentication],
    createNewArticleValidator,
    createNewArticle,
);
articleRouter.get('/:slug', getArticle);
articleRouter.put(
    '/:slug',
    [requireAuthentication],
    updateArticleBySlugValidator,
    updateArticleBySlug,
);
articleRouter.delete('/:slug', [requireAuthentication], deleteArticleBySlug);

/**
 * Comments
 */
articleRouter.get('/:slug/comments', getArticleComments);
articleRouter.post(
    '/:slug/comments',
    [requireAuthentication],
    createArticleCommentValidator,
    createArticleComment,
);
articleRouter.delete(
    '/:slug/comments/:id',
    [requireAuthentication],
    deleteArticleComment,
);

/**
 * Favorites
 */

articleRouter.post('/:slug/favorite', [requireAuthentication], favoriteArticle);
articleRouter.delete(
    '/:slug/favorite',
    [requireAuthentication],
    unfavoriteArticle,
);

export default articleRouter;
