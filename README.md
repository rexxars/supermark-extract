# supermark-extract

[![Version npm](http://img.shields.io/npm/v/supermark-extract.svg?style=flat-square)](http://browsenpm.org/package/supermark-extract)[![Build Status](http://img.shields.io/travis/rexxars/supermark-extract/master.svg?style=flat-square)](https://travis-ci.org/rexxars/supermark-extract)[![Dependencies](https://img.shields.io/david/rexxars/supermark-extract.svg?style=flat-square)](https://david-dm.org/rexxars/supermark-extract)[![Coverage Status](http://img.shields.io/coveralls/rexxars/supermark-extract/master.svg?style=flat-square)](https://coveralls.io/r/rexxars/supermark-extract?branch=master)

Extract supermark properties from a markdown file

## Installing

```
npm install --save supermark-extract
```

## Usage

```js
var fs = require('fs');
var extract = require('supermark-extract');

var markdown = fs.readFileSync('some-markdown-file.md', { encoding: 'utf8' });
var supermark = extract(markdown);

console.log(supermark);
```

Results in something along the lines of:

```json
{
    "title": "Some document title",
    "excerpt": "An excerpt of the document can be used in lists, RSS-feeds etc",
    "slug": "some-document-title",
    "date": "2015-12-30T00:11:19.411Z",
    "status": "Draft",
    "visibility": "Private",
    "tags": ["List Of", "Random", "Tags"],
    "categories": ["Testing", "Blogging"],
    "author": "Espen Hovlandsdal <espen@hovlandsdal.com>",
    "errors": [],
    "intro": "Raw markdown source up to the first <!-- read more -->",
    "document": "Raw markdown source of the document, without the supermark header."
}
```

## Ecosystem

This is a submodule of [supermark](https://github.com/rexxars/supermark).

## License

MIT-licensed, see LICENSE.
