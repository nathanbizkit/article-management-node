'use strict';

import express from 'express';
import restricted from '@app/middleware/restricted.middleware';

const privateRouter = express.Router();

privateRouter.use(restricted);

privateRouter.get('/private', (_req, res) => {
    res.status(200).json({ message: 'Welcome to restricted area!' });
});

export default privateRouter;
