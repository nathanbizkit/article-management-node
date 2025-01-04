'use strict';

import joi from 'joi';

/**
 * Merges validation error messages
 * @param err {@link joi.ValidationError} from `joi`
 * @param separator defaults to `, `
 * @returns a merged error message
 */
export const buildValidationMessage = (
    err: joi.ValidationError,
    separator = ', ',
): string => {
    if (!err) return '';
    return err.details.map((detail) => detail.message).join(separator);
};
