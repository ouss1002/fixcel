// This file generates the excel file

const xlsxFile = require('read-excel-file/node');

async function getExcel(excelPath) {
    return await xlsxFile(excelPath);
}

module.exports = {
    getExcel,
}