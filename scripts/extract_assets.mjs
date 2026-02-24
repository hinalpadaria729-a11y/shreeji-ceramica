import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';

const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;

const PDF_PATH = './public/Kohler_PriceBook_Nov\'25 Edition.pdf';
const RAW_IMG_DIR = './public/catalog/images_raw';
const OUTPUT_DIR = './public/catalog/images';
const DATA_FILE = './src/data/products.json';

async function run() {
    try {
        const docPath = path.resolve(PDF_PATH);
        const dataBuffer = new Uint8Array(fs.readFileSync(docPath));
        const loadingTask = pdfjs.getDocument({ data: dataBuffer });
        const doc = await loadingTask.promise;
        console.log(`PDF Loaded: ${doc.numPages} pages`);

        // 0. Parse Image List for Robust Mapping
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

        const allProducts = [];
        const seenCodes = new Set();

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            process.stdout.write(`\rProcessing page ${pageNum}/${doc.numPages}...`);
            const page = await doc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.0 });

            // 1. Image Tracking
            const operatorList = await page.getOperatorList();
            const pageImages = [];
            let currentTransform = [1, 0, 0, 1, 0, 0];
            const transformStack = [];

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

                    // Match to pdfimages list using dimensions (best fit scoring)
                    const matches = imageMetadata
                        .filter(m => m.page === pageNum && m.type === 'image')
                        .map(m => {
                            const diffW = Math.abs(m.width - (w * m.xppi / 72));
                            const diffH = Math.abs(m.height - (h * m.yppi / 72));
                            return { meta: m, score: diffW + diffH };
                        })
                        .filter(m => m.score < 20) // Tolerance
                        .sort((a, b) => a.score - b.score);

                    if (matches.length > 0) {
                        const bestMatch = matches[0].meta;
                        pageImages.push({ index: bestMatch.num, x, y, width: w, height: h, area: w * h });
                    }
                }
            }

            // ... (rest of the text mapping logic remains same)

            // 2. Text Mapping
            const textContent = await page.getTextContent();
            const items = textContent.items.map(it => ({
                str: it.str,
                x: it.transform[4],
                y: viewport.height - it.transform[5]
            }));

            const codeRegex = /K-[A-Z0-9-]{5,}/;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const match = item.str.match(codeRegex);
                if (match && !seenCodes.has(match[0])) {
                    const code = match[0];
                    let price = 0, mrpFound = false;
                    for (let k = i + 1; k < Math.min(items.length, i + 15); k++) {
                        const itk = items[k];
                        if (Math.abs(itk.y - item.y) > 25) break; // Strict row boundary
                        const s = itk.str.trim();
                        if (s === 'MRP') mrpFound = true;
                        else if (mrpFound && /^[0-9,]+(\.[0-9]{2})?$/.test(s)) {
                            price = parseFloat(s.replace(/,/g, ''));
                            break;
                        }
                    }
                    if (price > 0) {
                        seenCodes.add(code);
                        let nameParts = [];
                        for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
                            const itk = items[k];
                            if (Math.abs(itk.y - item.y) > 25) break; // Strict row boundary
                            const s = itk.str.trim();
                            if (s.length > 0 && !s.match(codeRegex) && !['MODEL', 'DESCRIPTION', 'MRP'].includes(s.toUpperCase())) nameParts.unshift(s);
                            else if (['DESCRIPTION', 'MODEL'].includes(s.toUpperCase())) break;
                        }
                        const name = nameParts.join(' ').replace(/\s+/g, ' ') || "Kohler Product";

                        // Refined selection: favor vertical proximity, then size
                        const candidates = pageImages.filter(img =>
                            img.x < item.x + 50 &&
                            Math.abs(item.y - img.y) < 50 &&
                            img.area < viewport.width * viewport.height * 0.25 // Exclude background
                        ).sort((a, b) => {
                            const diffY = Math.abs(a.y - item.y) - Math.abs(b.y - item.y);
                            if (Math.abs(diffY) > 15) return diffY; // Closest row first
                            return b.area - a.area; // Then largest within that row
                        });

                        if (candidates.length > 0) {
                            const best = candidates[0];
                            const idxStr = best.index.toString().padStart(3, '0');
                            const rawPath = path.join(RAW_IMG_DIR, `img-${idxStr}.png`);
                            const outPath = path.join(OUTPUT_DIR, `${code}.png`);

                            if (fs.existsSync(rawPath)) {
                                fs.copyFileSync(rawPath, outPath);
                            }
                        }

                        allProducts.push({ productCode: code, productName: name, rate: price, image: `/catalog/images/${code}.png` });
                    }
                }
            }
        }

        console.log(`\nExtracted ${allProducts.length} unique products.`);
        fs.writeFileSync(DATA_FILE, JSON.stringify(allProducts, null, 2));
    } catch (err) { console.error("\nFailed:", err); }
}

run();
