const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = './public/Aquant Price List Vol. 14 Feb. 2025 - Low Res Searchable.pdf';
let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    // Write the raw text to a file so we can inspect it easily
    fs.writeFileSync('./aquant_raw_text.txt', data.text);
    console.log(`Number of pages: ${data.numpages}`);
    console.log('Sample text (first 2000 chars):');
    console.log(data.text.substring(0, 2000));
}).catch(function (error) {
    console.error("Error parsing pdf:", error);
});
