import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';

async function diagnosePage6() {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(6);
    const viewport = page.getViewport({ scale: 1.0 });

    console.log(`Page 6 Viewport: ${viewport.width} x ${viewport.height}`);

    const textContent = await page.getTextContent();
    const items = textContent.items.map(it => ({
        str: it.str,
        x: it.transform[4],
        y: viewport.height - it.transform[5],
        height: it.height
    }));

    // Find our target codes
    const codes = items.filter(it => it.str.match(/K-[A-Z0-9-]{5,}/));
    codes.forEach(c => {
        console.log(`Code: ${c.str} at (${c.x.toFixed(1)}, ${c.y.toFixed(1)})`);
    });

    // Extract images on page 6
    const operatorList = await page.getOperatorList();
    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack = [];
    const images = [];

    for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        if (fn === pdfjs.OPS.save) transformStack.push([...currentTransform]);
        else if (fn === pdfjs.OPS.restore) currentTransform = transformStack.pop();
        else if (fn === pdfjs.OPS.transform) {
            const m = operatorList.argsArray[i];
            const [a, b, c, d, e, f] = currentTransform;
            currentTransform = [
                a * m[0] + b * m[1], a * m[2] + b * m[3],
                c * m[0] + d * m[1], c * m[2] + d * m[3],
                e * m[0] + f * m[1] + m[4], e * m[2] + f * m[3] + m[5]
            ];
        } else if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
            const x = currentTransform[4];
            const y = viewport.height - (currentTransform[5] + currentTransform[3]);
            const w = Math.abs(currentTransform[0]);
            const h = Math.abs(currentTransform[3]);
            images.push({ x, y, width: w, height: h });
            console.log(`  Image at (${x.toFixed(1)}, ${y.toFixed(1)}) size (${w.toFixed(1)} x ${h.toFixed(1)})`);
        }
    }
}

diagnosePage6();
