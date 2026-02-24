import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';

async function debugObj() {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(6);

    const operatorList = await page.getOperatorList();
    for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
            const imgName = operatorList.argsArray[i][0];
            // Try to get the object
            let img = null;
            try {
                img = page.objs.get(imgName) || page.commonObjs.get(imgName);
                if (img) {
                    console.log(`Image ${imgName}:`, Object.keys(img).join(', '));
                    if (img.imageMask) console.log(`  Has mask: ${img.imageMask}`);
                }
            } catch (e) {
                console.log(`Image ${imgName} not resolved yet`);
            }
        }
    }
}

debugObj();
