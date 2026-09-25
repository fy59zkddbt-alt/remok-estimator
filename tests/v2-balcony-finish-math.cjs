const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../remok-estimator-v2.js'),'utf8'),ctx={window:{},Intl,localStorage:{getItem:()=>null}};vm.createContext(ctx);
for(const name of ['config','calculators','storage','window-sketch','v2-model'])vm.runInContext(source.split('// ===== '+name+' =====')[1].split('// ===== ')[0],ctx);
const R=ctx.window.Remok,C=R.calc,V=R.v2,p=R.storage.pricing(),near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`),clone=o=>JSON.parse(JSON.stringify(o));


const b={enabled:true,saved:true,walls:{enabled:true,material:'optima',insulated:true,items:[{id:'a',width:3000,height:2000,hasOpenings:true,openings:[{width:1000,height:1000}],material:'pvc',insulated:true},{id:'b',width:2000,height:2000,hasOpenings:false,openings:[],material:'mdf',insulated:false},{id:'c',width:1500,height:2000,hasOpenings:false,openings:[],material:'norma',insulated:true}]},floor:{enabled:false,length:2000,width:1500,material:'laminate',insulated:false},ceiling:{enabled:false},electricity:{enabled:false},warmFloor:{enabled:false}};
let r=C.balcony(b,p);assert.deepEqual(Array.from(r.lines,l=>l.price),[21800,14200,18800]);near(r.total,54800);near(V.getItemArea(b,p),12);assert.equal(r.errors.length,0);
const changed=clone(b);changed.walls.items[1].material='optima';changed.walls.items[1].insulated=true;r=C.balcony(changed,p);assert.deepEqual(Array.from(r.lines,l=>l.price),[21800,27400,18800]);assert.deepEqual(changed.walls.items[0],b.walls.items[0]);assert.deepEqual(changed.walls.items[2],b.walls.items[2]);
const legacy=clone(b);legacy.walls.items.forEach(w=>{delete w.material;delete w.insulated});const before=JSON.stringify(legacy);near(C.balcony(legacy,p).total,[5,4,3].reduce((sum,a)=>sum+Math.round(((a*3255+7500)/.75)/100)*100,0));assert.equal(JSON.stringify(legacy),before);assert.equal(V.wallSettings({...legacy.walls.items[0],insulated:false},legacy).insulated,false);
const item={...b,mode:'balcony',additionalWorks:[{id:'w',name:'Работа',flat:true,amount:2000}]};near(C.product(item,p).total,56800);near(V.totalOrderArea([item,item],{saved:false},p),24);assert.equal(V.sketches(item).length,0);
console.log('PASS: three wall rates/insulation, opening net areas, independent edits, immutable legacy fallback/explicit false, item works/areas.');
