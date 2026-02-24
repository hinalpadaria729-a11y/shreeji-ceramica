import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const workerPath = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Aquant Price List Vol. 14 Feb. 2025 - Low Res Searchable.pdf';

const dumpPage = async () => {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;

    // Page 4 contains 9272 according to the earlier test
    const page = await doc.getPage(4);
    const textContent = await page.getTextContent();
    const items = textContent.items.map(it => ({
        str: it.str.replace(/\u0000/g, ' ').trim(),
        x: it.transform[4],
        y: it.transform[5]
    })).filter(it => it.str.length > 0)
        .sort((a, b) => {
            if (Math.abs(b.y - a.y) > 5) return b.y - a.y;
            return a.x - b.x;
        });

    for (const item of items) {
        console.log(`[Y: ${item.y.toFixed(1)}, X: ${item.x.toFixed(1)}] ${item.str}`);
    }
};

dumpPage().catch(console.error);
