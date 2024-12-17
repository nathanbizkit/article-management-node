'use strict';

import { ProfileResponse } from './user.message';

/* Response message */

// ArticleResponse definition
export type ArticleResponse = {
    id: number;
    title: string;
    description: string;
    body: string;
    tags: string[];
    favorited: boolean;
    favorites_count: number;
    author: ProfileResponse;
    created_at: string;
    updated_at: string;
};
