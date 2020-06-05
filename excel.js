const xlsxFile = require('read-excel-file/node');

async function getExcel(excelPath) {
    return await xlsxFile(excelPath);
}

module.exports = {
    getExcel,
}