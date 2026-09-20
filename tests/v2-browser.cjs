// Test-only dependency: Playwright (PLAYWRIGHT_MODULE can point to an installed copy).
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=path.resolve(__dirname,'..'),out=process.env.REMOK_TEST_OUTPUT||require('os').tmpdir();
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await context.newPage(),errors=[];
 await context.route('**/*',route=>{const u=new URL(route.request().url()),f=u.pathname.split('/').pop();let file,type;
  if(f==='jspdf.umd.min.js'){file=(process.env.JSPDF_PATH||path.join(base,'../js/vendor',f));type='application/javascript';}
  else if(/remok-(estimator|settings)-v2\.(js|css)$/.test(f)){file=path.join(base,f);type=f.endsWith('.css')?'text/css':'application/javascript';}
  else {file=path.join(base,u.pathname==='/calc-settings'?'settings-v2.html':'calculator-v2.html');type='text/html';}
  let body=fs.readFileSync(file,'utf8');if(type==='text/html')body='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>';
  return route.fulfill({contentType:type+'; charset=utf-8',body});
 });
 page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
 await page.goto('https://remok.test/calc');
 const f=p=>page.locator(`[data-path="${p}"]`),click=a=>page.locator(`[data-action="${a}"]`).first().click(),state=()=>page.evaluate(()=>Remok.storage.read('estimate'));
 const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
 async function type(p,v){const el=f(p);await el.fill('');await el.evaluate(e=>window.inputTest=e);await el.pressSequentially(String(v));assert.equal(await el.inputValue(),String(v));assert(await el.evaluate(e=>e===inputTest&&document.activeElement===e));}
 async function next(){if((await state()).items.length)await click('add-product');}
 async function begin(mode){await page.locator(`[data-action="start"][data-mode="${mode}"]`).click();}
 async function noFinish(){for(const k of ['exterior','interior'])await page.locator(`[data-path="draft.${k}.enabled"][data-value="false"]`).click();}
 async function doc(){if((await state()).step==='saved')await click('continue');await click('document');assert.equal(await page.locator('main input, main select, main textarea').count(),0);}
 assert.equal(await page.locator('.remok-choice').count(),5);
 await f('client.contactPreference').selectOption('telegram');await type('client.telegramUsername','@PRIVATE_REMOK_TEST');
 for(const number of ['89991234567','79991234567','+79991234567']){await f('client.phone').selectText();await f('client.phone').evaluate((el,n)=>{const d=new DataTransfer();d.setData('text/plain',n);el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:d}));},number);assert.equal(await f('client.phone').inputValue(),'+7 999 123-45-67');}
 for(const material of ['pvc','aluminum'])for(const shape of ['straight','l','u']){
  await next();await begin('balcony-glazing');assert.equal(await f('draft.profile').count(),0);
  await page.locator(`[data-action="balcony-material"][data-material="${material}"]`).click();await page.locator(`[data-action="balcony-shape"][data-shape="${shape}"]`).click();
  if(shape==='l')await f('draft.sidePosition').selectOption('left');
  if(material==='pvc'){await f('draft.profile').selectOption('veka');await f('draft.lamination').selectOption('one');}else {await f('draft.aluminumColor').selectOption('color');assert.equal(await f('draft.lamination').count(),0);}
  const ids=shape==='straight'?['facade']:shape==='l'?['left','facade']:['left','facade','right'];
  for(const id of ids){await page.locator(`[data-action="plane-tab"][data-id="${id}"]`).click();const index=(await state()).draft.planes.findIndex(p=>p.id===id),p='draft.planes.'+index;
   await type(p+'.widthMm',3200);await type(p+'.heightMm',2500);await f(p+'.sectionCount').selectOption('4');assert.deepEqual((await state()).draft.planes[index].sections.map(s=>s.widthMm),[800,800,800,800]);
   await type(p+'.sections.0.widthMm',700);assert((await page.locator('main').innerText()).includes('не совпадает'));
   await page.locator('[data-action="equal-plane"]').click();await f(p+'.sections.0.openingType').selectOption(material==='pvc'?'tilt_turn':'sliding');
   if(material==='aluminum')assert.equal(await f(p+'.sections.0.openingType').locator('option').count(),2);
   await f(p+'.heightMode').selectOption('floor');await type(p+'.upperHeightMm',1500);await type(p+'.lowerHeightMm',1000);await f(p+'.lowerFilling').selectOption('sandwich');
   await type(p+'.lowerHeightMm',900);assert(await page.locator('[data-action="save-product"]').isDisabled());await type(p+'.lowerHeightMm',1000);
  }
  const draft=(await state()).draft;near(draft.sandwichAdjustment,ids.length*3200);await page.reload();assert.deepEqual((await state()).draft,draft);
  await page.screenshot({path:path.join(out,`remok-v2-${material}-${shape}.png`),fullPage:true});await click('save-product');
  const result=await page.evaluate(()=>{const s=Remok.storage.read('estimate');return Remok.calc.product(s.items.at(-1),Remok.storage.pricing());});
  near(result.area,ids.length*8);near(result.total,ids.length*8*(material==='pvc'?18000*1.3:13000*1.4)-ids.length*3200);near(result.installationDisplayPrice,ids.length*24000);
 }
 await next();await begin('glazing');await page.locator('[data-action="product-type"][data-type="balcony_small"]').click();
 for(const [key,value]of Object.entries({'windows.0.widthMm':1400,windowHeightMm:1500,doorWidthMm:700,doorHeightMm:2200}))await type('draft.'+key,value);
 await f('draft.profile').selectOption('veka');await f('draft.doorPosition').selectOption('left');await noFinish();await click('save-product');
 near(await page.evaluate(()=>{const s=Remok.storage.read('estimate');return Remok.calc.product(s.items.at(-1),Remok.storage.pricing()).total;}),65520);
 for(const kind of ['double','triple']){await next();await begin('glazing');await page.locator(`[data-action="product-type"][data-type="${kind}"]`).click();await type('draft.width',2000);await type('draft.height',1500);await f('draft.profile').selectOption('veka');await noFinish();await click('save-product');}
 await next();await begin('aluminum');await type('draft.width',2000);await type('draft.height',1500);await f('draft.sections.0.openingType').selectOption('sliding');await noFinish();await click('save-product');
 await next();await begin('finish');await type('draft.width',1300);await type('draft.height',2500);await page.locator('[data-action="finish-kind"][data-kind="both"]').click();
 for(const k of ['exterior','interior']){await type('draft.'+k+'.depth',180);await f('draft.'+k+'.type').selectOption(k==='exterior'?'aquilon':'bfk');await f('draft.'+k+'.depthChecked').check();}await click('save-product');
 await click('add-product');await click('edit-balcony');await f('balcony.floor.enabled').check();await type('balcony.floor.length',2500);await type('balcony.floor.width',1300);await click('save-balcony');
 await click('continue');await click('add-work');await f('works.0.name').fill('СТИЗ');await f('works.0.flat').check();assert.equal(await f('works.0.amount').inputValue(),'');await type('works.0.amount',12500);
 await page.locator('[data-action="discount-mode"][data-mode="percent"]').click();await type('discount',10);await doc();
 assert(!(await page.locator('main').innerText()).includes('@PRIVATE'));assert(!(await page.locator('main').innerText()).includes('sandwichAdjustment'));assert((await page.locator('main').innerText()).includes('Монтаж с расходными материалами'));
 await page.evaluate(()=>{window.capturedPdfData=null;const original=Remok.pdf.generateEstimatePdf;Remok.pdf.generateEstimatePdf=data=>{window.capturedPdfData=data;return original(data)}});
 let event=page.waitForEvent('download');await click('download-pdf');await (await event).saveAs(path.join(out,'remok-v2-mixed.pdf'));const data=await page.evaluate(()=>capturedPdfData);assert(!JSON.stringify(data).includes('@PRIVATE'));assert(!Object.hasOwn(data.client,'contactPreference'));
 await click('return-edit');const saved=(await state()).items;await click('duplicate');await click('save-product');assert.deepEqual((await state()).items.at(-1).planes,saved[0].planes);
 await page.locator('[data-action="discount-mode"][data-mode="target"]').click();await type('targetPrice',500000);await click('delete-product');assert(await page.locator('[data-action="document"]').isDisabled());await click('confirm-target');await doc();
 await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:data=>{window.shared=data;window.gesture=navigator.userActivation.isActive;return Promise.resolve()}})});await click('share-pdf');assert(await page.evaluate(()=>gesture));assert.equal(await page.evaluate(()=>shared.files[0].type),'application/pdf');
 await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));event=page.waitForEvent('download');await click('share-pdf');await event;
 await page.evaluate(()=>window.print=()=>window.printed=true);await click('print');assert(await page.evaluate(()=>printed));await page.emulateMedia({media:'print'});assert.equal(await page.locator('.remok-header').evaluate(e=>getComputedStyle(e).display),'none');await page.pdf({path:path.join(out,'remok-v2-print.pdf'),preferCSSPageSize:true});await page.emulateMedia({media:'screen'});
 for(const width of [360,390,430,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.goto('https://remok.test/calc-settings');for(const [key,value]of [['installationDisplayRatePerM2','3100'],['sandwichDiscountPerM2','1200'],['hardwareDefault','Фурнитура "своя"']])await page.locator(`[data-price="${key}"]`).fill(value);await page.getByRole('button',{name:'Сохранить настройки',exact:true}).click();await page.reload();assert.equal(await page.locator('[data-price="installationDisplayRatePerM2"]').inputValue(),'3100');
 await page.goto('https://remok.test/calc');assert(await page.locator('[data-action="document"]').isDisabled());
 await page.evaluate(()=>{const s=Remok.storage.read('estimate');const old={...s.items.find(p=>p.productType==='balcony_small')};for(const k of ['geometryVersion','windows','windowCount','doorPosition','windowWidthMm','windowHeightMm','doorWidthMm','doorHeightMm'])delete old[k];old.id='legacy';s.items=[old];s.discountMode='none';s.step='estimate';Remok.storage.write('estimate',s)});await page.reload();near(await page.evaluate(()=>{const s=Remok.storage.read('estimate');return Remok.calc.product(s.items[0],Remok.storage.pricing()).area;}),4.62);await click('edit-product');assert.equal(await f('draft.windowHeightMm').count(),0);assert.equal(await f('draft.width').inputValue(),'2100');assert(!(await page.locator('[data-action="save-product"]').isDisabled()));await click('cancel-product');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: six balcony flows, floor validation/sandwich, tabs/autosave/caret, real block, PVC/aluminum/finishes, mixed order, works/discount/fixed price, document/PDF/share/print, mobile, settings, private contacts excluded and legacy block preserved.');
})().catch(e=>{console.error(e);process.exit(1)});
