'use strict';

import express from 'express';
import { getAllTags } from '#app/handler/tag.handler.js';

const tagRouter = express.Router();

/**
 * Tags
 */

tagRouter.get('/', getAllTags);

export default tagRouter;
