const fs = require('fs').promises;
const TempWriter = require('../app/utils/temp-file-writer');
const ValidationUtils = require('../app/utils/validation-utils');

test('Write temp file', async(done) => {
    let fileName = 'test-temp-file.txt';
    let content = 'abracadabra';
    let encoding = 'utf8';

    let filePath = TempWriter.writeTempFile(fileName, content, encoding);
    let fileContent = await fs.readFile(filePath, encoding);

    expect(ValidationUtils.validNonEmptyString(filePath)).toBeTruthy();     //it is returning file path
    expect(fs.access(filePath)).toBeTruthy();     //file exists
    expect(fileContent === content).toBeTruthy();     //content is correctly
    done();
});