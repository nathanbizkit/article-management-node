'use strict';

import 'dotenv/config';
import express from 'express';

// import { connectDB } from '@app/db/postgres.db';

// const db = connectDB({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   name: process.env.DB_NAME,
//   user: process.env.DB_USER,
//   pass: process.env.DB_PASS,
// });

const app = express();

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, world!' });
});

app.listen(3000, () => {
  console.log(`server running on port 3000`);
});
