import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const workerPath = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
const PDF_PATH = './public/Aquant Price List Vol. 14 Feb. 2025 - Low Res Searchable.pdf';

const traceImages = async () => {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;

    const page = await doc.getPage(4);
    const opList = await page.getOperatorList();

    let imageOps = [];
    let transformStack = [[1, 0, 0, 1, 0, 0]];
    let currentTransform = [1, 0, 0, 1, 0, 0];

    const multiply = (m1, m2) => {
        return [
            m1[0] * m2[0] + m1[1] * m2[2],
            m1[0] * m2[1] + m1[1] * m2[3],
            m1[2] * m2[0] + m1[3] * m2[2],
            m1[2] * m2[1] + m1[3] * m2[3],
            m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
            m1[4] * m2[1] + m1[5] * m2[3] + m2[5]
        ];
    };

    for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];

        if (fn === pdfjs.OPS.save) {
            transformStack.push([...currentTransform]);
        } else if (fn === pdfjs.OPS.restore) {
            currentTransform = transformStack.pop();
        } else if (fn === pdfjs.OPS.transform) {
            currentTransform = multiply(currentTransform, args);
        } else if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
            imageOps.push({
                fn,
                args,
                transform: [...currentTransform]
            });
        }
    }

    console.log(`Found ${imageOps.length} images on page 4.`);
    for (let i = 0; i < imageOps.length; i++) {
        const t = imageOps[i].transform;
        console.log(`Image ${i}: id=${imageOps[i].args[0]}, w=${t[0].toFixed(1)}, h=${t[3].toFixed(1)}, x=${t[4].toFixed(1)}, y=${t[5].toFixed(1)}`);
    }

    // Also get texts to compare their y values
    const textContent = await page.getTextContent();
    let texts = textContent.items.map(it => ({
        str: it.str.replace(/\u0000/g, ' ').trim(),
        x: it.transform[4],
        y: it.transform[5]
    })).filter(it => it.str.length > 0 && it.str.match(/^([a-zA-Z0-9]+(?:\s[a-zA-Z0-9]+)?)\s*-\s*(.+)$/));

    console.log("Found product codes:");
    texts.forEach(t => console.log(`Text "${t.str}" at x=${t.x.toFixed(1)}, y=${t.y.toFixed(1)}`));
};

traceImages().catch(console.error);
