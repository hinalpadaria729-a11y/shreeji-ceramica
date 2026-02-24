import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const workerPath = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Aquant Price List Vol. 14 Feb. 2025 - Low Res Searchable.pdf';

const trace = async () => {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;

    // Page 4 only
    const page = await doc.getPage(4);
    const textContent = await page.getTextContent();
    let rawItems = textContent.items.map(it => ({
        str: it.str.replace(/\u0000/g, ' ').trim(),
        x: it.transform[4],
        y: it.transform[5]
    })).filter(it => it.str.length > 0);

    let linesMap = new Map();
    for (let item of rawItems) {
        let key = Math.round(item.y);
        let matchedKey = Array.from(linesMap.keys()).find(k => Math.abs(k - key) <= 3);
        if (matchedKey !== undefined) {
            linesMap.get(matchedKey).push(item);
        } else {
            linesMap.set(key, [item]);
        }
    }

    let mergedItems = [];
    for (let [y, itemsOnLine] of linesMap.entries()) {
        itemsOnLine.sort((a, b) => a.x - b.x);
        let merged = [];
        let current = null;
        for (let item of itemsOnLine) {
            if (!current) {
                current = { ...item, text: item.str };
            } else if (item.x - (current.x + current.text.length * 3) < 40) {
                current.text += ' ' + item.str;
            } else {
                merged.push(current);
                current = { ...item, text: item.str };
            }
        }
        if (current) merged.push(current);
        mergedItems.push(...merged);
    }

    let columns = {};
    for (let item of mergedItems) {
        let placed = false;
        for (let colKey in columns) {
            if (Math.abs(parseFloat(colKey) - item.x) < 80) {
                columns[colKey].push(item);
                placed = true;
                break;
            }
        }
        if (!placed) columns[item.x.toString()] = [item];
    }

    let products = [];
    for (let colKey in columns) {
        let colItems = columns[colKey];
        colItems.sort((a, b) => b.y - a.y);
        let currentProduct = null;

        for (let j = 0; j < colItems.length; j++) {
            let text = colItems[j].text;
            const codeNameMatch = text.match(/^([a-zA-Z0-9]+(?:\s[a-zA-Z0-9]+)?)\s*-\s*(.+)$/);

            if (codeNameMatch && codeNameMatch[1].length <= 10 && !text.includes('Volume')) {
                if (currentProduct && currentProduct.productCode === '9272') {
                    console.log("PUSHING 9272:", currentProduct);
                }
                if (codeNameMatch[1].trim() === '9272') {
                    console.log("FOUND 9272 ROOT!");
                }

                if (currentProduct && currentProduct.productCode && currentProduct.rate > 0) {
                    products.push(currentProduct);
                }
                currentProduct = {
                    productCode: codeNameMatch[1].trim(),
                    productName: codeNameMatch[2].trim(),
                    rate: 0, size: '', color: ''
                };
            } else if (currentProduct) {
                if (currentProduct.productCode === '9272') console.log(`9272 line: ${text}`);
                if (text.toLowerCase().startsWith('size') || text.toLowerCase().includes('mm')) {
                    const parts = text.split(':');
                    currentProduct.size = parts.length > 1 ? parts[1].trim() : text.trim();
                } else if (text.toLowerCase().includes('mrp')) {
                    const rpPart = text.replace(/[^0-9]/g, '');
                    if (rpPart) currentProduct.rate = parseInt(rpPart, 10);
                } else if (currentProduct.rate > 0 && !currentProduct.color && text.length < 40 && !text.match(/^[0-9]+$/)) {
                    if (!text.toLowerCase().includes('mrp') && !text.toLowerCase().includes('size')) {
                        currentProduct.color = text.trim();
                        if (currentProduct.productCode === '9272') console.log("COLOR SET 9272:", currentProduct.color);
                        products.push({ ...currentProduct });
                        currentProduct = null;
                    }
                }
            }
        }
        if (currentProduct && currentProduct.productCode === '9272') {
            console.log("END OF COL 9272:", currentProduct);
            products.push({ ...currentProduct });
        }
    }
    console.log("Total Products:", products.length);
    console.log("Products Array:", JSON.stringify(products, null, 2));
};

trace().catch(console.error);
