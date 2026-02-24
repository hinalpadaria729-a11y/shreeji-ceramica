const fs = require('fs');
const pdfLib = require('pdf-parse');

const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';
const OUTPUT_PATH = './src/data/products.json';

async function extractFullCatalog() {
    try {
        console.log('Reading PDF...');
        const dataBuffer = fs.readFileSync(PDF_PATH);

        // Handle pdf-parse's default export
        const pdf = typeof pdfLib === 'function' ? pdfLib : pdfLib.default;

        if (!pdf) {
            throw new Error('pdf-parse function not found in exports');
        }

        const data = await pdf(dataBuffer);

        console.log('PDF loaded. Total Pages:', data.numpages);
        const lines = data.text.split('\n');
        const products = [];

        const codeRegex = /K-[A-Z0-9-]{5,}/;
        const priceRegex = /MRP ₹\s?([\d,]+\.?\d*)/;

        let currentCategory = 'General';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.toUpperCase() === line && line.length > 5 && line.length < 50 && !line.includes('MRP') && !line.includes('PRICE')) {
                currentCategory = line;
            }

            const codeMatch = line.match(codeRegex);
            if (codeMatch) {
                const code = codeMatch[0];

                let price = null;
                for (let offset = -2; offset <= 3; offset++) {
                    const checkLine = lines[i + offset];
                    if (checkLine) {
                        const pMatch = checkLine.match(priceRegex);
                        if (pMatch) {
                            price = parseFloat(pMatch[1].replace(/,/g, ''));
                            break;
                        }
                    }
                }

                if (price) {
                    let name = 'Kohler Product';
                    for (let offset = -1; offset >= -3; offset--) {
                        const checkLine = lines[i + offset] ? lines[i + offset].trim() : '';
                        if (checkLine && !checkLine.match(codeRegex) && !checkLine.match(priceRegex) && checkLine.length > 5) {
                            name = checkLine;
                            break;
                        }
                    }

                    products.push({
                        productCode: code,
                        productName: name,
                        category: currentCategory,
                        rate: price,
                        image: `/catalog/images/${code.split('-')[0]}.png`
                    });
                }
            }
        }

        const uniqueProducts = [];
        const seen = new Set();
        for (const p of products) {
            if (!seen.has(p.productCode)) {
                seen.add(p.productCode);
                uniqueProducts.push(p);
            }
        }

        console.log(`Extracted ${uniqueProducts.length} unique products.`);
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueProducts, null, 2));
        console.log(`Saved to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('Extraction failed:', error);
    }
}

extractFullCatalog();
