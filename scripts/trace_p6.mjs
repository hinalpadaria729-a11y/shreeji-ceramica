import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';

async function tracePage6() {
    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(6);
    const viewport = page.getViewport({ scale: 1.0 });

    const operatorList = await page.getOperatorList();
    const pageImages = [];
    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack = [];

    // Parse image metadata
    const imageListText = fs.readFileSync('./public/catalog/image_list.txt', 'utf8');
    const imageMetadata = [];
    const lines = imageListText.split('\n').slice(2);
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 12) {
            imageMetadata.push({
                page: parseInt(parts[0]),
                num: parseInt(parts[1]),
                type: parts[2],
                width: parseInt(parts[3]),
                height: parseInt(parts[4]),
                xppi: parseInt(parts[12]),
                yppi: parseInt(parts[13])
            });
        }
    }

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

            const candidates = imageMetadata.filter(m =>
                m.page === 6 &&
                m.type === 'image' &&
                Math.abs(m.width - (w * m.xppi / 72)) < 10 &&
                Math.abs(m.height - (h * m.yppi / 72)) < 10
            );

            if (candidates.length > 0) {
                pageImages.push({ index: candidates[0].num, x, y, width: w, height: h, area: w * h });
                console.log(`OPER: Image index ${candidates[0].num} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
            }
        }
    }

    const textContent = await page.getTextContent();
    const items = textContent.items.map(it => ({
        str: it.str,
        x: it.transform[4],
        y: viewport.height - it.transform[5]
    }));

    ['K-5402IN-ZZ-0', 'K-5401IN-0'].forEach(code => {
        const item = items.find(it => it.str === code);
        if (!item) return;
        console.log(`CODE: ${code} at (${item.x.toFixed(1)}, ${item.y.toFixed(1)})`);

        const cands = pageImages.filter(img =>
            img.x < item.x + 50 &&
            Math.abs(item.y - img.y) < 50
        ).sort((a, b) => {
            const diffY = Math.abs(a.y - item.y) - Math.abs(b.y - item.y);
            if (Math.abs(diffY) > 15) return diffY;
            return b.area - a.area;
        });

        if (cands.length > 0) {
            console.log(`  MATCH: Picks index ${cands[0].index} (diffY: ${Math.abs(cands[0].y - item.y).toFixed(1)})`);
        } else {
            console.log(`  MATCH: NONE within 50px`);
        }
    });
}

tracePage6();
