const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await context.newPage(),errors=[];
 await context.route('**/*',route=>{const u=new URL(route.request().url()),f=u.pathname.split('/').pop(),lib=f==='jspdf.umd.min.js',asset=/remok-(estimator|settings)-v2\.(js|css)$/.test(f),file=lib?process.env.JSPDF_PATH:path.join(base,asset?f:'calculator-v2.html');let body=fs.readFileSync(file,'utf8');if(!lib&&!asset)body='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>';return route.fulfill({contentType:lib||f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html; charset=utf-8',body});});
 page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
 const f=p=>page.locator(`[data-path="${p}"]`),click=a=>page.locator(`[data-action="${a}"]`).first().click();
 const names=['Пластиковое остекление','Алюминиевое остекление','Остекление балкона','Отделка окна','Отделка балкона'];
 const five=async()=>assert.deepEqual(await page.locator('.remok-choice strong').allTextContents(),names);
 await page.goto('https://remok.test/calc');await five();await page.locator('.remok-choice[data-mode="balcony"]').click();assert.equal(await page.locator('h1').innerText(),'Отделка балкона');
 await f('draft.floor.enabled').check();await f('draft.floor.length').fill('2000');await f('draft.floor.width').fill('1500');
 const baseTotal=await page.evaluate(()=>Remok.calc.balcony(Remok.storage.read('estimate').draft,Remok.storage.pricing()).total);assert(baseTotal>0);
 await page.locator('[data-action="add-work"][data-scope="draft.additionalWorks"]').click();await f('draft.additionalWorks.0.name').fill('Герметизация балкона');await f('draft.additionalWorks.0.amount').fill('1500');await click('save-balcony');
 assert.equal(await page.locator('h3').filter({hasText:/^Отделка балкона$/}).count(),1);assert.equal(await page.locator('[data-action="add-product"]').count(),1);assert.equal(await page.locator('[data-action="continue"]').count(),1);
 assert(!/Добавить отделку балкона|Нужна ли отделка балкона/.test(await page.locator('main').innerText()));await click('continue');assert((await page.locator('main').innerText()).includes('Герметизация балкона'));
 await click('document');assert.equal(await page.locator('main input, main select').count(),0);
 await page.evaluate(()=>{const original=Remok.pdf.generateEstimatePdf;Remok.pdf.generateEstimatePdf=data=>{window.testPdfData=data;return original(data)};});
 const event=page.waitForEvent('download');await click('download-pdf');const download=await event;const pdfPath=path.join(process.env.REMOK_TEST_OUTPUT||require('os').tmpdir(),'remok-balcony-entry.pdf');await download.saveAs(pdfPath);
 const data=await page.evaluate(()=>testPdfData);assert.equal(data.products[0].total,baseTotal+1500);assert.equal(data.totals.sub,baseTotal+1500);assert(data.products[0].lines.some(l=>l.label.includes('Герметизация балкона')&&l.price===1500));
 const pdfjs=await import(process.env.PDFJS_MODULE||'pdfjs-dist/legacy/build/pdf.mjs'),doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(pdfPath))}).promise;let text='';for(let i=1;i<=doc.numPages;i++)text+=(await (await doc.getPage(i)).getTextContent()).items.map(t=>t.str).join(' ');assert(text.includes('Отделка балкона'));assert(text.includes('Герметизация балкона'));await doc.destroy();
 await click('return-edit');await click('add-product');await five();assert(!/Добавить отделку балкона|Нужна ли отделка балкона/.test(await page.locator('main').innerText()));
 // The secondary top selector previously omitted balcony finish on both editor variants.
 for(const mode of ['glazing','balcony-glazing']){
  await page.locator(`[data-action="start"][data-mode="${mode}"]`).click();assert.deepEqual((await f('draft.mode').locator('option').allTextContents()).sort(),[...names].sort());
  await f('draft.mode').selectOption('balcony');assert.equal(await page.locator('h1').innerText(),'Отделка балкона');assert.equal(await f('draft.floor.length').count(),0);assert.equal(await f('draft.additionalWorks.0.amount').count(),0);
  const state=await page.evaluate(()=>Remok.storage.read('estimate'));assert.equal(state.step,'balcony');assert.equal(state.draft.mode,'balcony');assert.equal(state.draft.floor.length,'');assert.deepEqual(state.draft.additionalWorks,[]);
  await click('cancel-product');await click('add-product');await five();
 }
 await page.reload();await five();assert.deepEqual(errors,[]);console.log('PASS: five initial/add-item types, both top selectors, existing balcony editor, saved standalone card, item works/subtotal/PDF, preserved data, no repeated balcony prompts.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
