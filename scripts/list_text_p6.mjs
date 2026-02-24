import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';

async function listText() {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(6);
    const viewport = page.getViewport({ scale: 1.0 });

    const textContent = await page.getTextContent();
    const items = textContent.items.map(it => ({
        str: it.str,
        x: it.transform[4],
        y: viewport.height - it.transform[5]
    }));

    // Focus on the area between K-28529 and K-29777 (y ~ 260 to 350)
    items.filter(it => it.y > 200 && it.y < 400).forEach(it => {
        console.log(`[${it.y.toFixed(1)}, ${it.x.toFixed(1)}] ${it.str}`);
    });
}

listText();
