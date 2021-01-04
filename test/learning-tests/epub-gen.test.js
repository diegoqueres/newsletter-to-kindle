const test = require('tape');
const ValidationUtils = require('../../utils/validation-utils');
const {extract} = require('article-parser');
const Epub = require('epub-gen');
const axios = require('axios');
const os = require('os');
const fs = require('fs').promises;
require('dotenv').config();

test('Generate epub with text params', async (t) => {
    const option = {
        title: "Alice's Adventures in Wonderland", // *Required, title of the book.
        author: "Lewis Carroll", // *Required, name of the author.
        publisher: "Macmillan & Co.", // optional
        cover: "https://unsplash.com/photos/E4fNq7wYE2w/download?force=true&w=400", // Url or File path, both ok.
        content: [
            {
                title: "About the author", // Optional
                author: "John Doe", // Optional
                data: "<h2>Charles Lutwidge Dodgson</h2>"
                +"<div lang=\"en\">Better known by the pen name Lewis Carroll...</div>" // pass html string
            },
            {
                title: "Down the Rabbit Hole",
                data: "<p>Alice was beginning to get very tired...</p>"
            },
        ]
    };
    const filePath = `${os.tmpdir()}/${option.title}.epub`;
    const epub = new Epub(option, filePath);
    await epub.promise.then(() => console.log('Done'));

    //t.assert( ValidationUtils.validNonEmptyString(epub.title), 'has title');
    //t.assert( ValidationUtils.validNonEmptyString(epub.author), 'has author');
    //t.assert( ValidationUtils.validNonEmptyString(epub.content), 'has content');
    //t.assert( ValidationUtils.validNonEmptyString(epub.filePath), 'it is returning file path');
    t.assert( fs.access(filePath), 'file exists');
    t.end();
});

test('Generate epub from guttenberg ebook', async (t) => {
    await axios.get('http://www.gutenberg.org/files/2701/2701-0.txt').
    then(res => res.data).
    then(text => {
      text = text.slice(text.indexOf('EXTRACTS.'));
      text = text.slice(text.indexOf('CHAPTER 1.'));
  
      const lines = text.split('\r\n');
      const content = [];
      for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        if (line.startsWith('CHAPTER ')) {
          if (content.length) {
            content[content.length - 1].data = content[content.length - 1].data.join('\n');
          }
          content.push({
            title: line,
            data: ['<h2>' + line + '</h2>']
          });
        } else if (line.trim() === '') {
          if (content[content.length - 1].data.length > 1) {
            content[content.length - 1].data.push('</p>');
          }
          content[content.length - 1].data.push('<p>');
        } else {
          content[content.length - 1].data.push(line);
        }
      }
  
      const options = {
        title: 'Moby-Dick',
        author: 'Herman Melville',
        output: `${os.tmpdir()}/moby-dick.epub`,
        content
      };
  
      return new Epub(options).promise;
    }).
    then(() => console.log('Done'));

    const filePath = `${os.tmpdir()}/moby-dick.epub`;
    t.assert( fs.access(filePath), 'file exists');
    t.end();
});

test('Generate epub with css style', async (t) => {
    const filePath = `${os.tmpdir()}/moby-dick-css.epub`;
    const options = {
        title: 'Moby-Dick',
        author: 'Herman Melville',
        output: filePath,
        cover: 'https://m.media-amazon.com/images/I/51r+suV1YaL.jpg',
        css: `
          * { font-family: 'PT Serif'; }
          p { line-height: 1.5em; }
        `,
        content: [
            {
              title: 'Chapter 1: Loomings',
              data: `<p>
                Call me Ishmael. Some years ago—never mind how long precisely
              </p>`
            },
            {
                title: 'Chapter 2: Trees',
                data: `<p>
                  Call me Ishmael. Some years ago—never mind how long precisely
                </p>`
            },
            {
                title: 'Chapter 3: Rabbits',
                data: `<p>
                  Call me Ishmael. Some years ago—never mind how long precisely
                </p>`
            }
        ]
    };
    const epub = new Epub(options);
    await epub.promise.then(() => console.log('Done'));

    t.assert( fs.access(filePath), 'file exists');
    t.end();

});