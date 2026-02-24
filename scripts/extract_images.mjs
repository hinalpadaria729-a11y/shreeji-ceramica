import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';

const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';

async function extractImagesFromPage(pageNumber) {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument(dataBuffer);
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageNumber);

    const operatorList = await page.getOperatorList();
    const commonObjs = page.commonObjs;
    const objs = page.objs;

    let imgCount = 0;
    for (let i = 0; i < operatorList.fnArray.length; i++) {
        if (operatorList.fnArray[i] === pdfjs.OPS.paintImageXObject ||
            operatorList.fnArray[i] === pdfjs.OPS.paintInlineImageXObject) {

            const imgName = operatorList.argsArray[i][0];
            const img = objs.get(imgName) || commonObjs.get(imgName);

            if (img) {
                imgCount++;
                const canvas = createCanvas(img.width, img.height);
                const ctx = canvas.getContext('2d');
                const imgData = ctx.createImageData(img.width, img.height);

                // Convert PDF image data to RGBA
                const data = img.data;
                const rgba = new Uint8ClampedArray(img.width * img.height * 4);

                if (img.kind === 1) { // RGB
                    for (let j = 0, k = 0; j < data.length; j += 3, k += 4) {
                        rgba[k] = data[j];
                        rgba[k + 1] = data[j + 1];
                        rgba[k + 2] = data[j + 2];
                        rgba[k + 3] = 255;
                    }
                } else if (img.kind === 2) { // RGBA
                    rgba.set(data);
                } else if (img.kind === 3) { // Grayscale
                    for (let j = 0, k = 0; j < data.length; j++, k += 4) {
                        rgba[k] = data[j];
                        rgba[k + 1] = data[j];
                        rgba[k + 2] = data[j];
                        rgba[k + 3] = 255;
                    }
                }

                imgData.data.set(rgba);
                ctx.putImageData(imgData, 0, 0);

                const outPath = `page_${pageNumber}_img_${imgCount}.png`;
                fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
                console.log(`Saved ${outPath} (${img.width}x${img.height})`);
            }
        }
    }
}

extractImagesFromPage(6).catch(console.error);
