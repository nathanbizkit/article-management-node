'use strict';

import * as Joi from 'joi';

/**
 * Merges validation error messages
 * @param err {@link Joi.ValidationError} from `joi`
 * @param separator defaults to `, `
 * @returns a merged error message
 */
export const buildValidationMessage = (
    err: Joi.ValidationError,
    separator = ', ',
): string => {
    if (!err) return '';
    return err.details.map((detail) => detail.message).join(separator);
};
