'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tape');
var camelcase = require('lodash.camelcase');
var extract = require('..');

var fixtures = fs.readdirSync(path.join(__dirname, 'fixtures')).reduce(
    function reduceFixture(curr, file) {
        var fixture = path.basename(file, path.extname(file));
        curr[camelcase(fixture)] = fs.readFileSync(
            path.join(__dirname, 'fixtures', file),
            { encoding: 'utf8' }
        );
        return curr;
    }, {}
);

test('basic document', function(t) {
    isSame(t, extract(fixtures.basic), {
        title: 'Why Espen shouldn\'t be allowed to stay up late',
        date: '2015-12-30T00:11:19.411Z',
        tags: ['List', 'Ramblings'],
        errors: [],
        document: fixtures.basic.replace(/[\s\S]+-{3,}\s+/, '')
    });
    t.end();
});

test('full document', function(t) {
    isSame(t, extract(fixtures.full), {
        title: 'Full document: The real test.',
        excerpt: 'It ain\'t easy coming up with sample text.',
        slug: 'full-document-the-real-test',
        date: '2015-12-30T00:11:19.411Z',
        status: 'Draft',
        visibility: 'Private',
        tags: ['List', 'Random', 'Tags'],
        categories: ['Testing', 'Blogging'],
        errors: [],
        document: fixtures.full.replace(/[\s\S]*?- - -\s+/, '')
    });
    t.end();
});

test('no valid props', function(t) {
    t.ok(extract(fixtures.invalidProps).errors.some(function(err) {
        return err.message.indexOf('No valid supermark properties') > -1;
    }), 'errors should contain `no valid supermark props`-error');

    t.end();
});

test('unknown props', function(t) {
    t.ok(extract(fixtures.unknownProps).errors.some(function(err) {
        return err.message.indexOf('Property `Single unknown prop` is not a valid') > -1;
    }), 'errors should contain `invalid property`-error');

    t.end();
});

test('no header', function(t) {
    t.ok(extract(fixtures.noHeader).errors.some(function(err) {
        return err.message.indexOf('Could not find a valid supermark header') > -1;
    }), 'errors should contain `no valid supermark header`-error');

    t.end();
});

test('invalid header prop', function(t) {
    t.ok(extract(fixtures.invalidHeaderProp).errors.some(function(err) {
        return err.message.indexOf('Couldn\'t make sense of line: `Invalid header prop`') > -1;
    }), 'errors should contain `couldnt make sense of line`');

    t.end();
});

test('non-list prop as list', function(t) {
    t.ok(extract(fixtures.excerptAsList).errors.some(function(err) {
        return err.message.indexOf('`Excerpt` did not have a value and is not a list') > -1;
    }), 'errors should contain `not a list`');

    t.end();
});

test('starred horizontal rules', function(t) {
    isSame(t, extract(fixtures.starHr), {
        title: 'Starred horizontal rules are the worst',
        excerpt: 'But they are valid markup, so what the heck.',
        errors: [],
        document: '# Bip-bop.\n\nBoop.\n'
    });
    t.end();
});

function isSame(t, actual, expected) {
    t.equal(
        Object.keys(actual).length,
        Object.keys(expected).length,
        'should have expected number of properties'
    );

    for (var key in expected) {
        t.deepEqual(actual[key], expected[key], '`' + key + '` should be equal');
    }
}
