const test = require('tape');
const fs = require('fs').promises;
const TempWriter = require('../utils/temp-file-writer');
const ValidationUtils = require('../utils/validation-utils');

test('Write temp file', async (t) => {
    let fileName = 'test-temp-file.txt';
    let content = 'abracadabra';
    let encoding = 'utf8';

    let filePath = TempWriter.writeTempFile(fileName, content, encoding);
    let fileContent = await fs.readFile(filePath, encoding);

    t.assert( ValidationUtils.validNonEmptyString(filePath), 'it is returning file path');
    t.assert( fs.access(filePath), 'file exists');
    t.assert( fileContent === content, 'content is correctly');
    t.end();
});