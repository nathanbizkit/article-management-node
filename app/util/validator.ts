'use strict';

import { ValidationError } from 'joi';

/**
 * Merges validation error messages
 * @param err {@link ValidationError} from `joi`
 * @param separator defaults to `, `
 * @returns a merged error message
 */
export const buildValidationMessage = (
    err: ValidationError,
    separator = ', ',
): string => {
    if (!err) return '';
    return err.details.map((detail) => detail.message).join(separator);
};
