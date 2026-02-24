import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

import { pathToFileURL } from 'url';
const workerPath = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Aquant Price List Vol. 14 Feb. 2025 - Low Res Searchable.pdf';

async function testParse() {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;
    console.log(`Number of pages: ${doc.numPages}`);

    // Test on a few pages
    for (let i = 1; i <= Math.min(5, doc.numPages); i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        console.log(`--- Page ${i} ---`);

        let lastY = -1;
        let line = '';

        // Simple sort by Y then X to try and reconstruct lines
        const items = textContent.items.map(it => ({
            str: it.str,
            x: it.transform[4],
            y: it.transform[5],
            color: it.color ? it.color : null // Some pdfjs versions have color in textContent, but it's complex
        })).sort((a, b) => {
            if (Math.abs(b.y - a.y) > 5) return b.y - a.y;
            return a.x - b.x;
        });

        for (const item of items) {
            if (lastY !== -1 && Math.abs(item.y - lastY) > 5) {
                console.log(line);
                line = '';
            }
            line += item.str + ' ';
            lastY = item.y;
        }
        if (line) console.log(line);
    }
}

testParse().catch(err => console.error(err));
