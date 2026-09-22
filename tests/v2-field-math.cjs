const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../remok-estimator-v2.js'),'utf8'),ctx={window:{},Intl,localStorage:{getItem:()=>null}};vm.createContext(ctx);
for(const name of ['config','calculators','storage','window-sketch','v2-model'])vm.runInContext(source.split('// ===== '+name+' =====')[1].split('// ===== ')[0],ctx);
const {calc:C,v2:V,windowSketch:S}=ctx.window.Remok,p=ctx.window.Remok.storage.pricing(),near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const part=()=>({enabled:false,type:'',depth:'',depthChecked:false});
const item=(width=780,height=2050)=>({mode:'glazing',productType:'single',width,height,profile:'veka',lamination:'none',sections:[{widthMm:width,openingType:'tilt_turn',hingeSide:'right'}],exterior:part(),interior:part()});
// Frozen pre-PATCH primitive output for the exact same arguments (turn and tilt-turn).
const old={left:[[80,20,10,85],[10,85,80,150],[6,25,14,25],[6,145,14,145]],right:[[10,20,80,85],[80,85,10,150],[76,25,84,25],[76,145,84,145]]};
for(const type of ['turn','tilt_turn'])for(const side of ['left','right']){
 const lines=[];S.drawOpening((...v)=>lines.push(v),()=>assert.fail('unexpected text'),{openingType:type,hingeSide:side},10,20,80,150);
 assert.deepEqual(lines,[...old[side==='left'?'right':'left'],...(type==='tilt_turn'?[[10,150,45,20],[45,20,80,150]]:[])]);
}
for(const [w,h] of [[780,2050],[1600,1400],[2400,1200]]){
 const a=item(w,h),r=C.product(a,p),g=S.geometry(a),frame=g.primitives.find(p=>p.kind==='rect');near(r.area,w*h/1e6);near(frame.width/frame.height,w/h);
 near(g.scale,Math.min(300/w,190/h));assert(frame.x>=0&&frame.y>=0&&frame.x+frame.width<=g.width&&frame.y+frame.height<=g.height);
 const pdfRects=[],doc={setDrawColor(){},setTextColor(){},setLineWidth(){},setFont(){},setFontSize(){},line(){},text(){},rect(...v){pdfRects.push(v)}};S.drawPdf(doc,g,16,20,178,59);near(pdfRects[0][2]/pdfRects[0][3],w/h);
 near(C.product(a,p).total,w*h/1e6*18000+w*h/1e6*3000);
}
const transom={...item(1600,2000),hasTopTransom:true,transomHeightMm:500};near(C.product(transom,p).area,3.2);near(C.product(transom,p).total,C.product(item(1600,2000),p).total);
const tr=S.geometry(transom).primitives.filter(p=>p.kind==='rect');near(tr[0].height/(tr[0].height+tr[2].height),.25);
for(const widths of [[1400],[700,700],[500,1000]])for(const position of widths.length===1?['left','right']:['left','middle','right']){
 const a={...item(),productType:'balcony_small',geometryVersion:2,windows:widths.map((widthMm,i)=>({widthMm,openingType:i?'tilt_turn':'fixed',hingeSide:'right'})),windowHeightMm:1500,doorWidthMm:700,doorHeightMm:2200,doorPosition:position,sections:[{}, {openingType:'turn',hingeSide:'left'}]};V.sync(a,p);
 const expected=(widths.reduce((s,w)=>s+w,0)*1500+700*2200)/1e6;near(C.product(a,p).area,expected);near(C.product(a,p).total,expected*18000+expected*3000);near(V.finishDimensions(a).width,widths.reduce((s,w)=>s+w,0)+700);near(V.finishDimensions(a).height,2200);
 const g=S.geometry(a),frames=g.primitives.filter(p=>p.kind==='rect').filter((_,i)=>i%2===0),parts=V.blockParts(a);assert.equal(frames.length,widths.length+1);
 parts.forEach((part,i)=>{near(frames[i].width/frames[i].height,part.widthMm/part.heightMm);near(frames[i].width,part.widthMm*g.scale);near(frames[i].height,part.heightMm*g.scale);if(i)near(frames[i].x,frames[i-1].x+frames[i-1].width);});
 assert.equal(parts.findIndex(p=>p.door),position==='left'?0:position==='middle'?1:widths.length);
 a.exterior={enabled:true,type:'aquilon',depth:180,depthChecked:true};near(C.product(a,p).total,expected*18000+expected*3000+C.calculateExterior(V.finishDimensions(a).width,2200,180,'aquilon',p));
}
const legacy={...item(2100,2200),productType:'balcony_small',sections:[{widthMm:1400,openingType:'fixed'},{widthMm:700,openingType:'turn'}]},snapshot=JSON.stringify(legacy);near(C.product(legacy,p).total,4.62*18000+4.62*3000);S.geometry(legacy);assert.equal(JSON.stringify(legacy),snapshot);assert(!V.modernBlock(legacy));
const a=item(),base=C.product(a,p).total;a.additionalWorks=[{id:'a',name:'Демонтаж',flat:true,amount:2000},{id:'b',name:'СТИЗ',flat:true,amount:1500}];let r=C.product(a,p);near(r.baseTotal,base);near(r.additionalWorksTotal,3500);near(r.total,base+3500);assert.equal(r.lines.filter(l=>l.kind==='item-work').length,2);
a.additionalWorks.push({name:'',flat:true,amount:100});r=C.product(a,p);near(r.total,base+3500);assert(r.errors.length);
assert.equal(p.installationDisplayRatePerM2,3000);assert.equal(p.sandwichDiscountPerM2,1000);
console.log('PASS: exact old hinge inversion, single/transom, SVG and PDF ratios, 1/2-window blocks all positions/areas/finishes, legacy preservation, item works and validation.');
// Shared work wrapper covers every item family, including the separate balcony finish model.
const extras=[{id:'extra',name:'Работа',flat:false,quantity:2,rate:1750}];
for(const mode of ['aluminum','finish','balcony-glazing']) {
 const a={...item(1600,1500),mode,aluminumColor:'white'};
 if(mode==='finish')a.exterior={enabled:true,type:'aquilon',depth:180,depthChecked:true};
 if(mode==='balcony-glazing'){Object.assign(a,{balconyGlazingMaterial:'pvc',balconyGlazingShape:'straight',planes:[{...V.newPlane('facade'),widthMm:1600,heightMm:1500}]});V.equalPlane(a.planes[0]);}
 const base=C.product(a,p);a.additionalWorks=extras;near(C.product(a,p).total,base.total+3500);near(C.product(a,p).installationDisplayPrice,base.installationDisplayPrice);
}
const balcony={enabled:true,walls:{enabled:false},floor:{enabled:true,length:2000,width:1500,material:'laminate',insulated:false},ceiling:{enabled:false},electricity:{enabled:false},warmFloor:{enabled:false}};
const balconyBase=C.balcony(balcony,p);balcony.additionalWorks=extras;near(C.balcony(balcony,p).total,balconyBase.total+3500);
near(C.calculateExterior(1300,2500,180,'aquilon',p),(1.3+2.5)*(.18+.16)*6000+2800);
console.log('PASS: works for aluminum, window finish, balcony glazing/finish, unchanged installation and Aquilon formula.');