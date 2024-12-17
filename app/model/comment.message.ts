'use strict';

import { ProfileResponse } from './user.message';

/* Response message */

// CommentResponse definition
export type CommentResponse = {
    id: number;
    body: string;
    author: ProfileResponse;
    created_at: string;
    updated_at: string;
};
