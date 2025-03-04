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
    const details = err.details.map((detail) => detail.message).join(separator);
    return err.message ? `${err.message}: ${details}` : details;
};
