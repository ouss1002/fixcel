const fetch = require('node-fetch');
const {writeFile} = require('fs');
const {promisify} = require('util');
const writeFilePromise = promisify(writeFile);

async function downloadFile(url, outputPath) {
    return fetch(url)
        .then(x => x.arrayBuffer())
        .then(x => writeFilePromise(outputPath, Buffer.from(x)));
}

async function downloadRetry(url, outputPath, n) {
    try {
        return await downloadFile(url, outputPath);
    } catch(err) {
        if(n === 1) {
            throw err;
        }
        await new Promise(r => setTimeout(r, 5000));
        console.log("   fail... retrying before exiting: ", n);
        return await downloadRetry(url, outputPath, n - 1);
    }
}

module.exports = {
    downloadFile,
    downloadRetry,
}