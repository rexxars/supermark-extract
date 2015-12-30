'use strict';

var assign = require('object-assign');

// Allowed property names
var validProps = [
    'Title',
    'Excerpt',
    'Slug',
    'Date',
    'Status',
    'Visibility',
    'Tags',
    'Categories'
];

// Define which properties are allowed to be lists
var listProps = [
    'Tags',
    'Categories'
];

// Yes, this is crazy. But markdown has some pretty funky, weird rules when it
// comes to what horizontal rules can look like (so lets try to support them all)
var matchers = {
    header: /^(\w+:[\s\S]*?)\n {0,3}(?:(?:-+ {0,2}){3,}|(?:_+ {0,2}){3,}|(?:\*+ {0,2}){3,})\s*\n/,
    headerProp: /^(.*?):\s*(.*)$/,
    listItem: /^\s*[-*+\d]\s*(.*)$/
};

function extractHeader(source) {
    // Try to find a valid header
    var result = source.match(matchers.header);
    return result ? result[1] : false;
}

function reduceLine(target, line) {
    var listItemMatch = line.match(matchers.listItem);

    // Check if this is is a list item
    if (listItemMatch) {
        return reduceListItem(target, listItemMatch);
    }

    // Split line into parts
    var propMatch = line.match(matchers.headerProp);
    var prop = propMatch && propMatch[1].trim();
    var value = propMatch && propMatch[2].trim();

    if (!propMatch || !prop) {
        return addError(new Error('Couldn\'t make sense of line: `' + line + '`'), target);
    }

    // Check that the property is one known to us
    if (validProps.indexOf(prop) === -1) {
        return addError(new Error('Property `' + prop + '` is not a valid property'), target);
    }

    // All properties need values, unless they are lists
    if (!value && listProps.indexOf(prop) === -1) {
        return addError(new Error(
            'Property `' + prop + '` did not have a value and is not a list'
        ), target);
    }

    // Set erthe value to our result
    if (value) {
        target.props[prop.toLowerCase()] = value;
    }

    target.lastItem = prop.toLowerCase();
    return target;
}

function reduceListItem(target, match) {
    var item = match[1].trim();

    // Create an array if the target prop doesn't exist
    if (!target.props[target.lastItem]) {
        target.props[target.lastItem] = [];
    } else if (!Array.isArray(target.props[target.lastItem])) {
        return addError(new Error(
            'List item `' + item + '` had a non-list parent: `' + target.lastItem + '`'
        ), target);
    }

    // Add the list item to the parent property
    target.props[target.lastItem].push(item);
    return target;
}

function addError(error, target) {
    target.errors.push(error);
    return target;
}

function extract(source) {
    var header = extractHeader(source);
    if (!header) {
        return {
            props: {},
            errors: [new Error('Could not find a valid supermark header')]
        };
    }

    // Appears to be a correct header, try to parse individual properties
    var result = header.split('\n').filter(Boolean).reduce(reduceLine, {
        props: {},
        errors: [],
        lastItem: null
    });

    if (!Object.keys(result.props).length) {
        result.errors.push(new Error('No valid supermark properties found in header'));
    }

    return assign({}, result.props, {
        document: source.replace(matchers.header, ''),
        errors: result.errors
    });
}

module.exports = extract;
