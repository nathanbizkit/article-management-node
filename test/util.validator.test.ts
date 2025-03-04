'use strict';

import joi from 'joi';
import { buildValidationMessage } from '#app/util/validator.js';
import { expect } from 'chai';

describe('util validator', function () {
    it('should build validation message', function () {
        const expected = 'validation error: foo, bar';

        const validationErrorItems = [
            { message: 'foo', path: [], type: 'foo' },
            { message: 'bar', path: [], type: 'bar' },
        ];
        const validationError = new joi.ValidationError(
            'validation error',
            validationErrorItems,
            null,
        );
        const validationMessage = buildValidationMessage(validationError);
        expect(validationMessage).to.equal(expected);
    });

    it('should build validation message without parent message', function () {
        const expected = 'foo, bar';

        const validationErrorItems = [
            { message: 'foo', path: [], type: 'foo' },
            { message: 'bar', path: [], type: 'bar' },
        ];
        const validationError = new joi.ValidationError(
            '',
            validationErrorItems,
            null,
        );
        const validationMessage = buildValidationMessage(validationError);
        expect(validationMessage).to.equal(expected);
    });
});
