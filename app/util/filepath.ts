'use strict';

import os from 'os';
import path from 'path';

/**
 * Resolves a file path resolved relatively to the home path
 * @param filepath a path to a file
 * @returns a file path resolved relatively to the home path
 */
export const resolveHome = (filepath: string): string => {
    if (filepath[0] === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
};
