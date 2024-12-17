'use strict';

import 'dotenv/config';
import express from 'express';

const app = express();

app.get('/', (_req, res) => {
    res.status(200).json({ message: 'Hello, world!' });
});

app.listen(3000, () => {
    console.log(`server running on port 3000`);
});
