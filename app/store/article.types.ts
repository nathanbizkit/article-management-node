'use strict';

import { User } from '@app/model/user.types';

export interface PaginationOptions {
    limit?: number;
    offset?: number;
}

export interface GetArticlesOptions {
    tagName?: string;
    username?: string;
    favoritedBy?: User;
    pagination?: PaginationOptions;
}

export interface GetFeedArticlesOptions {
    pagination?: PaginationOptions;
}
