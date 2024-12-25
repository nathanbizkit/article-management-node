'use strict';

import express from 'express';
import { getAllTags } from './tag.handler';
import { login, loginValidator } from './auth.handler';

const publicRouter = express.Router();

publicRouter.use(express.json());

publicRouter.get('/login', loginValidator, login);
publicRouter.get('/tags', getAllTags);

export default publicRouter;
