'use strict';

import express from 'express';
import restricted from '@app/middleware/restricted.middleware';
import {
    getCurrentUser,
    updateCurrentUser,
    updateCurrentUserValidator,
} from './auth.handler';
import { followUser, showProfile, unfollowUser } from './profile.handler';
import {
    createArticleComment,
    createArticleCommentValidator,
    deleteArticleComment,
} from './comment.handler';

const privateRouter = express.Router();
privateRouter.use(restricted);

privateRouter.get('/me', getCurrentUser);
privateRouter.put('/me', updateCurrentUserValidator, updateCurrentUser);

privateRouter.get('/profiles/:username', showProfile);
privateRouter.post('/profiles/:username/follow', followUser);
privateRouter.delete('/profiles/:username/follow', unfollowUser);

privateRouter.post(
    '/articles/:slug/comments',
    createArticleCommentValidator,
    createArticleComment,
);
privateRouter.delete('/articles/:slug/comments/:id', deleteArticleComment);

export default privateRouter;
