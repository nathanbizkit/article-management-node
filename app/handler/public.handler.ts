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

const publicRouter = express.Router();

publicRouter.use(express.json());

publicRouter.get('/login', loginValidator, login);
publicRouter.post('register', registerValidator, register);
publicRouter.post('/refresh_token', refreshToken);
publicRouter.get('/tags', getAllTags);

export default publicRouter;
