'use strict';

import express from 'express';

const publicRouter = express.Router();

publicRouter.get('/', (_req, res) => {
    res.status(200).json({ message: 'Hello, world!' });
});

export default publicRouter;
