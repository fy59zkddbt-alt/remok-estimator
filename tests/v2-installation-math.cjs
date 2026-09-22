const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../remok-estimator-v2.js'),'utf8'),ctx={window:{},Intl,localStorage:{getItem:()=>null}};vm.createContext(ctx);
for(const name of ['config','calculators','storage','window-sketch','v2-model'])vm.runInContext(source.split('// ===== '+name+' =====')[1].split('// ===== ')[0],ctx);
const R=ctx.window.Remok,C=R.calc,V=R.v2,p=R.storage.pricing(),near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`),clone=o=>JSON.parse(JSON.stringify(o));

const part=()=>({enabled:false}), item={mode:'glazing',productType:'double',width:2000,height:1500,profile:'veka',lamination:'none',sections:[{widthMm:1000,openingType:'fixed'},{widthMm:1000,openingType:'fixed'}],exterior:part(),interior:part()};
Object.assign(p.pvcProfiles.find(v=>v.id==='veka'),{basePricePerM2:20000});
let r=C.product(item,p);near(r.lines[0].price,60000);near(r.installationDisplayPrice,9000);near(r.total,69000);assert.equal(r.errors.length,0);
r=C.product({...item,additionalWorks:[{name:'Демонтаж',flat:true,amount:2000}]},p);near(r.total,71000);near(r.baseTotal,69000);
const special=clone(p);Object.assign(special.pvcProfiles.find(v=>v.id==='veka'),{basePricePerM2:100,activityPercent:82,laminateTwoSidesPercent:117,productMarkupPercent:20});
r=C.product({...item,productType:'single',width:1000,height:1000,lamination:'two',sections:[{widthMm:1000,openingType:'turn'}]},special);near(r.lines[0].price,358.8);near(r.installationDisplayPrice,3000);near(r.total,3358.8);assert.equal(r.errors.length,0);
const balcony={...item,mode:'balcony-glazing',balconyGlazingMaterial:'pvc',balconyGlazingShape:'straight',planes:[{...V.newPlane('facade'),widthMm:2000,heightMm:1500,heightMode:'floor',upperHeightMm:1000,lowerHeightMm:500,lowerFilling:'sandwich',sections:[{widthMm:2000,openingType:'fixed'}]}]};
r=C.product(balcony,p);near(r.area,3);near(r.sandwichArea,1);near(r.lines[0].price,59000);near(r.installationDisplayPrice,9000);near(r.total,68000);
const block={...item,productType:'balcony_small',windows:[{widthMm:500,openingType:'fixed'},{widthMm:1000,openingType:'fixed'}],windowHeightMm:1500,doorWidthMm:700,doorHeightMm:2200,sections:[{}, {openingType:'turn'}]};r=C.product(block,p);near(r.area,3.79);near(r.installationDisplayPrice,11370);near(r.total,75800+11370);
console.log('PASS: installation above 60000 = 69000; item works = 71000; 358.8 + 3000; sandwich full installation area; block 11370.');
