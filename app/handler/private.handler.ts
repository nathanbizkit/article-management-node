'use strict';

import express from 'express';
import restricted from '@app/middleware/restricted.middleware';
import {
    getCurrentUser,
    updateCurrentUser,
    updateCurrentUserValidator,
} from './auth.handler';

const privateRouter = express.Router();
privateRouter.use(restricted);

privateRouter.get('/me', getCurrentUser);
privateRouter.put('/me', updateCurrentUserValidator, updateCurrentUser);

export default privateRouter;
