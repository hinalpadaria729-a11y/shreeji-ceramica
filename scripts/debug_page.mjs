import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';

async function debugPage(pageNumber) {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument(dataBuffer);
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageNumber);

    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    console.log(`--- Text Items on Page ${pageNumber} ---`);
    textContent.items.forEach(item => {
        const x = item.transform[4];
        const y = viewport.height - item.transform[5];
        if (item.str.trim()) {
            console.log(`Text: "${item.str}" at [${x.toFixed(2)}, ${y.toFixed(2)}]`);
        }
    });

    const operatorList = await page.getOperatorList();
    console.log(`\n--- Image Operations on Page ${pageNumber} ---`);

    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack = [];

    for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        const args = operatorList.argsArray[i];

        if (fn === pdfjs.OPS.save) {
            transformStack.push([...currentTransform]);
        } else if (fn === pdfjs.OPS.restore) {
            currentTransform = transformStack.pop();
        } else if (fn === pdfjs.OPS.transform) {
            const m = args;
            const [a, b, c, d, e, f] = currentTransform;
            currentTransform = [
                a * m[0] + b * m[1],
                a * m[2] + b * m[3],
                c * m[0] + d * m[1],
                c * m[2] + d * m[3],
                e * m[0] + f * m[1] + m[4],
                e * m[2] + f * m[3] + m[5]
            ];
        } else if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
            const x = currentTransform[4];
            const y = viewport.height - currentTransform[5];
            const width = currentTransform[0];
            const height = -currentTransform[3]; // Height is often negative in PDF transforms
            console.log(`Image at [${x.toFixed(2)}, ${y.toFixed(2)}] Size: [${width.toFixed(2)}x${height.toFixed(2)}]`);
        }
    }
}

debugPage(6).catch(console.error);
