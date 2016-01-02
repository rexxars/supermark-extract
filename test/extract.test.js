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
        return (
            err instanceof TypeError &&
            err.message === 'Could not find a valid supermark header'
        );
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

test('no title', function(t) {
    t.ok(extract(fixtures.noTitle).errors.some(function(err) {
        return (
            err instanceof TypeError &&
            err.message === 'Required property `Title` not found in header'
        );
    }), 'errors should contain `missing title`-error');

    t.end();
});

test('csv style tags/categories', function(t) {
    t.ok(extract(fixtures.listAsCsv).errors.some(function(err) {
        return err.message === 'Property `Tags` should be a list, string given';
    }), 'errors should contain `list expected`-error');

    t.ok(extract(fixtures.listAsCsv).errors.some(function(err) {
        return err.message === 'Property `Categories` should be a list, string given';
    }), 'errors should contain `list expected`-error');

    t.end();
});

test('invalid slug', function(t) {
    t.ok(extract('Title: foo\nSlug: Not the best way to slug\n---\nZing').errors.some(function(err) {
        return err.message.indexOf('Slug') !== -1 && err.message.indexOf('regular expression') !== -1;
    }), 'errors should contain `invalid slug`-error');

    t.end();
});

test('valid slug', function(t) {
    t.notOk(
        extract('Title: foo\nSlug: a-valid-slug-is-a-nice-slug\n---\nZing').errors.length,
        'errors should be empty on valid slug'
    );

    t.end();
});

test('invalid date', function(t) {
    t.ok(extract('Title: foo\nDate: Can\'t just put anything\n---\nZing').errors.some(function(err) {
        return err.message.indexOf('Date.parse') !== -1 && err.message.indexOf('8601') !== -1;
    }), 'errors should contain `invalid date`-error');

    t.end();
});

test('valid date', function(t) {
    t.notOk(
        extract('Title: foo\nDate: 2015-03-12\n---\nZing').errors.length,
        'errors should be empty on valid date'
    );

    t.end();
});

test('invalid status', function(t) {
    t.ok(extract('Title: foo\nStatus: foo\n---\nZing').errors.some(function(err) {
        return (
            err.message.indexOf('Status') !== -1 &&
            err.message.indexOf('Published') !== -1 &&
            err.message.indexOf('Draft') !== -1
        );
    }), 'errors should contain `invalid status`-error');

    t.end();
});

test('valid status', function(t) {
    t.notOk(
        extract('Title: foo\nStatus: Draft\n---\nZing').errors.length,
        'errors should be empty on valid status'
    );

    t.end();
});

test('invalid visibility', function(t) {
    t.ok(extract('Title: foo\nVisibility: foo\n---\nZing').errors.some(function(err) {
        return (
            err.message.indexOf('Visibility') !== -1 &&
            err.message.indexOf('Public') !== -1 &&
            err.message.indexOf('Private') !== -1
        );
    }), 'errors should contain `invalid visibility`-error');

    t.end();
});

test('valid visibility', function(t) {
    t.notOk(
        extract('Title: foo\nVisibility: Private\n---\nZing').errors.length,
        'errors should be empty on valid visibility'
    );

    t.end();
});

test('duplicate tags', function(t) {
    t.ok(extract('Title: foo\nTags:\n* Foo\n* Bar\n* Foo\n---\nZing').errors.some(function(err) {
        return err.message.indexOf('Tags') !== -1 && err.message.indexOf('unique') !== -1;
    }), 'errors should contain `duplicate tags`-error');

    t.end();
});

test('invalid tags', function(t) {
    t.ok(extract('Title: foo\nTags:\n* Foo\n*\n* Foo\n---\nZing').errors.some(function(err) {
        return err.message.indexOf('Tags') !== -1 && err.message.indexOf('valid string') !== -1;
    }), 'errors should contain `invalid tag`-error');

    t.end();
});

test('valid tags', function(t) {
    t.notOk(
        extract('Title: foo\nTags:\n* Foo\n* Bar\n---\nZing').errors.length,
        'errors should be empty on valid tags'
    );

    t.end();
});

test('duplicate categories', function(t) {
    t.ok(extract('Title: foo\nCategories:\n* Foo\n* Bar\n* Foo\n---\nZing').errors.some(function(err) {
        return err.message.indexOf('Categories') !== -1 && err.message.indexOf('unique') !== -1;
    }), 'errors should contain `duplicate categories`-error');

    t.end();
});

test('invalid categories', function(t) {
    t.ok(extract('Title: foo\nCategories:\n* Foo\n*\n* Foo\n---\nZing').errors.some(function(err) {
        return err.message.indexOf('Categories') !== -1 && err.message.indexOf('valid string') !== -1;
    }), 'errors should contain `invalid category`-error');

    t.end();
});

test('valid categories', function(t) {
    t.notOk(
        extract('Title: foo\nCategories:\n* Foo\n* Bar\n---\nZing').errors.length,
        'errors should be empty on valid categories'
    );

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
