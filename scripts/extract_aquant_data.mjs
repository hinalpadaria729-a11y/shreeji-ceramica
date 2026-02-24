import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const workerPath = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Aquant Price List Vol. 14 Feb. 2025 - Low Res Searchable.pdf';

const extractData = async () => {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;

    let products = [];

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        let rawItems = textContent.items.map(it => ({
            str: it.str.replace(/\u0000/g, ' ').trim(),
            x: it.transform[4],
            y: it.transform[5]
        })).filter(it => it.str.length > 0);

        // Group into lines first to merge stuff like "MRP" ":" "`" "4,75,000" that are on the exact same line within a column
        let linesMap = new Map();
        for (let item of rawItems) {
            let key = Math.round(item.y);
            // find if there is an existing line close to it horizontally and vertically
            let matchedKey = Array.from(linesMap.keys()).find(k => Math.abs(k - key) <= 3);
            if (matchedKey !== undefined) {
                linesMap.get(matchedKey).push(item);
            } else {
                linesMap.set(key, [item]);
            }
        }

        // Merge segments on the same line that are close horizontally
        let mergedItems = [];
        for (let [y, itemsOnLine] of linesMap.entries()) {
            itemsOnLine.sort((a, b) => a.x - b.x);
            let merged = [];
            let current = null;
            for (let item of itemsOnLine) {
                if (!current) {
                    current = { ...item, text: item.str };
                } else if (item.x - (current.x + current.text.length * 3) < 40) { // close enough to merge
                    current.text += ' ' + item.str;
                } else {
                    merged.push(current);
                    current = { ...item, text: item.str };
                }
            }
            if (current) merged.push(current);
            mergedItems.push(...merged);
        }

        // Now cluster merged items into columns by X
        // typical columns: X around 20, 200, 400
        let columns = {};
        for (let item of mergedItems) {
            // define a column slot (nearest 100 might be too wide, lets cluster by nearest center)
            const colIndex = Math.floor(item.x / 100);
            // Better: group by arbitrary x clusters
            let placed = false;
            for (let colKey in columns) {
                if (Math.abs(parseFloat(colKey) - item.x) < 80) { // within 80px width
                    columns[colKey].push(item);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns[item.x.toString()] = [item];
            }
        }

        // Now process each column top-to-bottom
        for (let colKey in columns) {
            let colItems = columns[colKey];
            colItems.sort((a, b) => b.y - a.y); // top to bottom

            let currentProduct = null;

            for (let j = 0; j < colItems.length; j++) {
                let text = colItems[j].text;
                const codeNameMatch = text.match(/^([a-zA-Z0-9]+(?:\s[a-zA-Z0-9]+)?)\s*-\s*(.+)$/);

                if (codeNameMatch && codeNameMatch[1].length <= 10 && !text.includes('Volume')) {
                    if (codeNameMatch[1].trim() === '9272') console.log(`[Page ${i}] FOUND 9272 CODE MATCH`);
                    if (currentProduct && currentProduct.productCode && currentProduct.rate > 0) {
                        products.push(currentProduct);
                    }
                    currentProduct = {
                        productCode: codeNameMatch[1].trim(),
                        productName: codeNameMatch[2].trim(),
                        rate: 0, size: '', color: ''
                    };
                } else if (currentProduct) {
                    if (currentProduct.productCode === '9272') console.log(`[Page ${i}] 9272 TEXT PARSE: ${text}`);
                    if (text.toLowerCase().startsWith('size') || text.toLowerCase().includes('mm')) {
                        const parts = text.split(':');
                        currentProduct.size = parts.length > 1 ? parts[1].trim() : text.trim();
                    } else if (text.toLowerCase().includes('mrp')) {
                        const rpPart = text.replace(/[^0-9]/g, '');
                        if (rpPart) currentProduct.rate = parseInt(rpPart, 10);
                    } else if (currentProduct.rate > 0 && !currentProduct.color && text.length < 40 && !text.match(/^[0-9]+$/)) {
                        if (!text.toLowerCase().includes('mrp') && !text.toLowerCase().includes('size')) {
                            currentProduct.color = text.trim();
                            if (currentProduct.productCode === '9272') console.log(`[Page ${i}] PUSH 9272 from color block`);
                            products.push({ ...currentProduct });
                            currentProduct = null;
                        }
                    }
                }
            }
            if (currentProduct && currentProduct.productCode && currentProduct.rate > 0) {
                if (currentProduct.productCode === '9272') console.log(`[Page ${i}] PUSH 9272 from end of col block`);
                products.push({ ...currentProduct });
            }
        }
    }

    const uniqueProductsMap = new Map();
    for (const p of products) {
        if (!uniqueProductsMap.has(p.productCode) || uniqueProductsMap.get(p.productCode).rate === 0) {
            uniqueProductsMap.set(p.productCode, p);
        }
    }
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    const finalProducts = uniqueProducts.map((p, index) => ({
        id: String(index + 1),
        ...p,
        image: "" // Add image field as blank for now
    }));

    // Sort by code roughly
    finalProducts.sort((a, b) => a.productCode.localeCompare(b.productCode));

    const final9272 = finalProducts.find(p => p.productCode === '9272');
    console.log("FINAL 9272 STATUS:", final9272 ? "FOUND" : "NOT FOUND", final9272);

    fs.writeFileSync('./src/data/aquant_products.json', JSON.stringify(finalProducts, null, 2));
    console.log(`Extracted ${finalProducts.length} Aquant products.`);
};

extractData().catch(console.error);
