'use strict';

import express from 'express';
import requireAuthentication from '#app/middleware/requireAuthentication.middleware.js';
import {
    followUser,
    showProfile,
    unfollowUser,
} from '#app/handler/profile.handler.js';

const profileRouter = express.Router();

/**
 * Profiles
 */

profileRouter.get('/:username', [requireAuthentication], showProfile);

/**
 * Follows
 */

profileRouter.post('/:username/follow', [requireAuthentication], followUser);
profileRouter.delete(
    '/:username/follow',
    [requireAuthentication],
    unfollowUser,
);

export default profileRouter;
