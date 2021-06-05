const os = require('os');
const fs = require('fs');
const random = require('random');
const iconv = require('iconv-lite');
const uniqueFilename = require('unique-filename');

class TempWriter {
    static writeTempFileWithRandomName(filePrefix, content, encoding = 'utf8') {
        const contentFile = `${uniqueFilename(os.tmpdir(), filePrefix)}.htm`;
        fs.writeFile(contentFile, content, encoding, function (err) {
            if (err) throw err;
        });
        return contentFile;        
    }
    static writeTempFileWithDateSufix(prefix, date, fileExtension, content, encoding = 'utf8') {
        return TempWriter.writeTempFile(`${prefix}_${date.getDay()}${date.getMonth()}${date.getYear()}_.${fileExtension}`, content, encoding);
    }
    static writeTempFileWithPrefixAndTitle(prefix, title, fileExtension, content, encoding = 'utf8') {
        return TempWriter.writeTempFile(`${prefix} ${title}.${fileExtension}`, content, encoding);
    }
    static writeTempFileWithSubjectAndTitle(subject, title, fileExtension, content, encoding = 'utf8') {
        return TempWriter.writeTempFile(`(${subject}) ${title}.${fileExtension}`, content, encoding);
    }
    static writeTempFile(fileName, content, encoding = 'utf8') {
        const filePath = `${os.tmpdir()}/${fileName}`;

        let buffer = content;
        if (encoding !== 'utf8') {
            buffer = iconv.encode(content, encoding);
        }
        
        fs.writeFile(filePath, buffer, function (err) {
            if (err) throw err;
        });
        
        return filePath;        
    }    
}

module.exports = TempWriter;