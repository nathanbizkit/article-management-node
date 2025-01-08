'use strict';

import express from 'express';
import userRouter from './user.router.js';
import articleRouter from './article.router.js';
import tagRouter from './tag.router.js';
import profileRouter from './profile.router.js';

const apiRouter = express.Router();

apiRouter.use(express.json());
apiRouter.use('/', userRouter);
apiRouter.use('/profiles', profileRouter);
apiRouter.use('/articles', articleRouter);
apiRouter.use('/tags', tagRouter);

export default apiRouter;
