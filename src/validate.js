// @todo Consider if this should be a separate module, eg `supermark-validate`
'use strict';

var validators = {
    title: validateTitle,
    slug: validateSlug,
    date: validateDate,
    status: validateStatus,
    visibility: validateVisibility,
    tags: validateTags,
    categories: validateCategories
};

var requiredProps = ['title'];
var slugRegex = /^[a-zA-Z0-9_!().-]+$/;

function validateTitle(title) {
    // Title is required
    if (!hasValue(title)) {
        return new TypeError('Required property `Title` not found in header');
    }
}

function validateSlug(slug) {
    // If slug is present, it needs to have a valid value
    if (!(slug + '').match(slugRegex)) {
        return new TypeError(
            '`Slug` is explicitly defined, but does not have a valid value. ' +
            'Must adhere to the following regular expression: ' + slugRegex.toString()
        );
    }
}

function validateDate(date) {
    // Date validation is hard. Let's just assume the user knows what the deal is.
    var parsed = Date.parse(date);
    if (isNaN(parsed) || !parsed) {
        return new TypeError(
            '`Date` must be a date that is parsable by `Date.parse()`. ' +
            'We recommend sticking with dates in ISO-8601 format.'
        );
    }
}

function validateStatus(status) {
    var value = (status + '').toLowerCase();
    if (value !== 'published' && value !== 'draft') {
        return new TypeError('`Status` must be either `Published` or `Draft`');
    }
}

function validateVisibility(visibility) {
    var value = (visibility + '').toLowerCase();
    if (value !== 'public' && value !== 'private') {
        return new TypeError('`Visibility` must be either `Public` or `Private`');
    }
}

function validateTags(tags) {
    return validateList('Tags', tags);
}

function validateCategories(categories) {
    return validateList('Categories', categories);
}

function validateList(type, items) {
    for (var i = 0; i < items.length; i++) {
        if (!hasValue(items[i])) {
            return new Error('All entries in `' + type + '` must be valid strings');
        }
    }

    var filtered = items.filter(unique);
    if (filtered.length !== items.length) {
        return new Error('All entries in `' + type + '` must be unique');
    }
}

function hasValue(value) {
    return value && (value + '').trim().length > 0;
}

function unique(val, i, arr) {
    return arr.indexOf(val) === i;
}

/**
 * Validate a parsed supermark document, returning an array of errors
 *
 * @param  {Object} doc Document, from `extract()`
 * @return {Array} Errors encountered
 */
function validate(doc) {
    var keys = Object.keys(doc.props);

    if (!keys.length) {
        return [new TypeError('No valid supermark properties found in header')];
    }

    var validateKeys = Object.keys(doc.props).concat(requiredProps).filter(unique);

    return validateKeys.reduce(function(errors, prop) {
        if (!validators[prop]) {
            return errors;
        }

        return errors.concat(validators[prop](doc.props[prop]));
    }, []).filter(Boolean);
}

module.exports = validate;
