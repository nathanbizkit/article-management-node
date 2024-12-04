'use strict';

import pgPromise from 'pg-promise';

const pgp = pgPromise();

export const connectDB = ({
  host = 'localhost',
  port = '5432',
  name,
  user,
  pass,
}: {
  host: string | undefined;
  port: string | undefined;
  name: string | undefined;
  user: string | undefined;
  pass: string | undefined;
}): pgPromise.IDatabase<object> => {
  return pgp(
    `postgres://${user}:${pass}@${host}:${port}/${name}?sslmode=disable`,
  );
};
