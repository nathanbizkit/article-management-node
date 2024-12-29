'use strict';

import express from 'express';
import { getAllTags } from './tag.handler';
import {
    login,
    loginValidator,
    register,
    registerValidator,
} from './auth.handler';

const publicRouter = express.Router();

publicRouter.use(express.json());

publicRouter.get('/login', loginValidator, login);
publicRouter.post('register', registerValidator, register);
publicRouter.get('/tags', getAllTags);

export default publicRouter;
