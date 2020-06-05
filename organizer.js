const fs = require('fs');

async function writeDirectory(id) {
    fs.mkdir('./result/' + id, { recursive: true }, (err) => {
        if(err) {
            console.log(err);
        }
    });
}

module.exports = {
    writeDirectory,
}