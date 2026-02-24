import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import Jimp from 'jimp';

const workerPath = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
const PDF_PATH = './public/Aquant Price List Vol. 14 Feb. 2025 - Low Res Searchable.pdf';
const OUT_DIR = './public/catalog/aquant_images';

const extractImages = async () => {
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    const dataBuffer = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const doc = await loadingTask.promise;

    let totalSaved = 0;

    // Track pairs to update the JSON later
    const jsonPath = './src/data/aquant_products.json';
    let products = [];
    if (fs.existsSync(jsonPath)) {
        products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

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

    for (let pNum = 1; pNum <= doc.numPages; pNum++) {
        const page = await doc.getPage(pNum);
        const opList = await page.getOperatorList();

        // Extract texts with codes
        const textContent = await page.getTextContent();
        let texts = textContent.items.map(it => ({
            str: it.str.replace(/\u0000/g, ' ').trim(),
            x: it.transform[4],
            y: it.transform[5]
        })).filter(it => it.str.length > 0);

        let productsOnPage = [];
        for (let t of texts) {
            const m = t.str.match(/^([a-zA-Z0-9]+(?:\s[a-zA-Z0-9]+)?)\s*-\s*(.+)$/);
            if (m && m[1].length <= 10 && !t.str.includes('Volume')) {
                productsOnPage.push({ code: m[1].trim(), x: t.x, y: t.y });
            }
        }

        if (productsOnPage.length === 0) continue;

        // Extract image locations
        let transformStack = [[1, 0, 0, 1, 0, 0]];
        let currentTransform = [1, 0, 0, 1, 0, 0];
        let imagesOnPage = [];

        for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            const args = opList.argsArray[i];

            if (fn === pdfjs.OPS.save) {
                transformStack.push([...currentTransform]);
            } else if (fn === pdfjs.OPS.restore) {
                currentTransform = transformStack.pop() || [1, 0, 0, 1, 0, 0];
            } else if (fn === pdfjs.OPS.transform) {
                currentTransform = multiply(currentTransform, args);
            } else if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
                // Ignore very tiny images or full-page backgrounds (heuristics)
                const w = Math.abs(currentTransform[0]);
                const h = Math.abs(currentTransform[3]);
                if (w > 50 && w < 1000 && h > 50 && h < 1000) {
                    imagesOnPage.push({
                        id: args[0],
                        x: currentTransform[4],
                        y: currentTransform[5],
                        w, h
                    });
                }
            }
        }

        // Match images to products
        for (let prod of productsOnPage) {
            let closestImg = null;
            let minScore = Infinity;

            for (let img of imagesOnPage) {
                let dX = Math.abs(img.x - prod.x);
                let dY = Math.abs(img.y - prod.y);
                // The images usually align closely in X, and are near in Y
                if (dX < 150 && dY < 300) {
                    let score = dX * 2 + dY; // Prioritize X alignment
                    if (score < minScore) {
                        minScore = score;
                        closestImg = img;
                    }
                }
            }

            if (closestImg) {
                try {
                    const imgData = await page.objs.get(closestImg.id);
                    if (!imgData || !imgData.data) continue;

                    const bytesPerPixel = Math.floor(imgData.data.length / (imgData.width * imgData.height));
                    const image = await new Jimp(imgData.width, imgData.height);

                    let srcIdx = 0;
                    for (let y = 0; y < imgData.height; y++) {
                        for (let x = 0; x < imgData.width; x++) {
                            let r = 255, g = 255, b = 255;
                            if (bytesPerPixel === 3) {
                                r = imgData.data[srcIdx++];
                                g = imgData.data[srcIdx++];
                                b = imgData.data[srcIdx++];
                            } else if (bytesPerPixel === 4) {
                                r = imgData.data[srcIdx++];
                                g = imgData.data[srcIdx++];
                                b = imgData.data[srcIdx++];
                                srcIdx++; // alpha
                            } else {
                                const v = imgData.data[srcIdx++];
                                r = v; g = v; b = v;
                            }
                            // Convert CMYK roughly if needed? Usually it's RGB
                            // The Jimp 0.22 uses simple rgbaToInt
                            image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                        }
                    }

                    const safeName = prod.code.replace(/[^a-zA-Z0-9]/g, '_');
                    const imgPath = `${OUT_DIR}/${safeName}.jpg`;
                    await image.writeAsync(imgPath);

                    // Update JSON product
                    const p = products.find(pt => pt.productCode === prod.code);
                    if (p) {
                        p.image = `/catalog/aquant_images/${safeName}.jpg`;
                    }

                    totalSaved++;
                    console.log(`Saved image for ${prod.code}`);
                } catch (e) {
                    console.error(`Error saving image for ${prod.code}: ${e.message}`);
                }
            } else {
                console.log(`No image found physically near ${prod.code}`);
            }
        }
    }

    // Save updated JSON
    fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
    console.log(`Saved ${totalSaved} images and updated json!`);
};

extractImages().catch(console.error);
