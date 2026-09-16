// Run: node internal-estimator/tilda/tests/v2-math.cjs (Node built-ins only).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../remok-estimator-v2.js'),'utf8');
const context={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},Intl};vm.createContext(context);
for(const name of ['config','calculators','storage','window-sketch','v2-model'])vm.runInContext(source.split('// ===== '+name+' =====')[1].split('// ===== ')[0],context);
const R=context.window.Remok,C=R.calc,V=R.v2,p=R.storage.pricing();
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const part=()=>({enabled:false,depth:180,type:'aquilon',depthChecked:true,hasDepthDifference:false,comment:''});
const item=()=>({mode:'glazing',width:2000,height:1500,profile:'veka',lamination:'none',exterior:part(),interior:part()});
let r=C.product(item(),p);near(r.total,54000);near(r.lines[0].price,45000);near(r.lines[1].price,9000);
for(const [lam,total] of [['none',54000],['one',70200],['two',81000]]){r=C.product({...item(),lamination:lam},p);near(r.total,total);near(r.lines[0].price,total-9000);near(r.installationDisplayPrice,9000);}
const block={...item(),productType:'balcony_small',geometryVersion:2,windowWidthMm:1400,windowHeightMm:1500,doorWidthMm:700,doorHeightMm:2200,sections:[{openingType:'fixed'},{openingType:'turn'}]};V.sync(block,p);
r=C.product(block,p);near(r.area,3.64);near(r.total,3.64*18000);near(r.installationDisplayPrice,10920);assert.deepEqual(JSON.parse(JSON.stringify(V.finishDimensions(block))),{width:2100,height:2200});
const partial=C.product({...block,windowHeightMm:''},p);assert(partial.errors.length);near(partial.total,0);
block.exterior.enabled=true;near(C.product(block,p).total,3.64*18000+C.calculateExterior(2100,2200,180,'aquilon',p));
const legacy={...item(),productType:'balcony_small',width:2100,height:2200};near(C.product(legacy,p).total,4.62*18000);assert(!V.modernBlock(legacy));
assert.equal(V.planeIds({balconyGlazingShape:'l',sidePosition:'left'}).join(','),'left,facade');assert.equal(V.planeIds({balconyGlazingShape:'l',sidePosition:'right'}).join(','),'facade,right');
const right=V.geometry({...block,doorSide:'right'}).primitives.filter(p=>p.kind==='rect'),left=V.geometry({...block,doorSide:'left'}).primitives.filter(p=>p.kind==='rect');assert(right[0].height<right[2].height);assert(left[0].height>left[2].height);
for(const material of ['pvc','aluminum'])for(const shape of ['straight','l','u']){
 const b={...item(),mode:'balcony-glazing',balconyGlazingMaterial:material,balconyGlazingShape:shape,sidePosition:'left',aluminumColor:'white',planes:['left','facade','right'].map(id=>({...V.newPlane(id),widthMm:2000,heightMm:2000}))};
 b.planes.forEach(v=>V.equalPlane(v));const n=shape==='straight'?1:shape==='l'?2:3;
 r=C.product(b,p);near(r.area,n*4);near(r.total,n*4*(material==='pvc'?18000:13000));assert.equal(r.errors.length,0);
 b.planes.forEach(v=>Object.assign(v,{heightMode:'floor',upperHeightMm:1000,lowerHeightMm:1000,lowerFilling:'sandwich'}));
 b.lamination='one';r=C.product(b,p);near(r.sandwichArea,n*2);near(r.glassArea,n*2);near(r.sandwichAdjustment,n*2000);near(r.total,n*4*(material==='pvc'?18000*1.3:13000)-n*2000);near(r.installationDisplayPrice,n*12000);
 V.sync(b,p);near(b.sandwichAdjustment,n*2000);
 if(shape==='l')near(r.sandwichAdjustment,4000);
 b.planes.forEach(v=>v.lowerFilling='glass');near(C.product(b,p).sandwichAdjustment,0);
 b.planes.find(v=>v.id==='facade').lowerHeightMm=1200;assert(C.product(b,p).errors.some(e=>e.includes('сумма высот')));
}
context.localStorage.getItem=()=>JSON.stringify({glazing:{veka:19500},hardwareDefault:'Своя'});const merged=R.storage.pricing();assert.equal(merged.glazing.veka,19500);assert.equal(merged.hardwareDefault,'Своя');assert.equal(merged.installationDisplayRatePerM2,3000);assert.equal(merged.sandwichDiscountPerM2,1000);
const old=fs.readFileSync(path.join(__dirname,'../remok-estimator.js'),'utf8');assert.equal(source.split('// ===== calculators =====')[1].split('// ===== storage =====')[0],old.split('// ===== calculators =====')[1].split('// ===== storage =====')[0]);
console.log('PASS A–J: unchanged legacy totals and lamination, installation split, block area 3.64 / finish 2100×2200, straight/L/U PVC+aluminum, floor glass/sandwich, absolute adjustment, validation and PricingConfig defaults. Original calculators unchanged.');
