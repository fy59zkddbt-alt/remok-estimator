// Local-only preview of the working tree. Production loaders are not modified.
const fs=require('fs'),http=require('http'),path=require('path');
const root=path.resolve(__dirname,'..'),pdf=process.env.JSPDF_PATH;
if(!pdf||!fs.existsSync(pdf))throw Error('Set JSPDF_PATH to your local jspdf.umd.min.js (4.2.1).');
const assets=new Set(['remok-estimator-v2.js','remok-settings-v2.js','remok-estimator-v2.css']);
const server=http.createServer((req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname;let body,type;
 if(route==='/calc'||route==='/calc-settings'||route==='/'){
  body=fs.readFileSync(path.join(root,route==='/calc-settings'?'settings-v2.html':'calculator-v2.html'),'utf8');
  body=body.replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/[^"\s]+\/(remok-(?:estimator|settings)-v2\.(?:js|css))(?:\?[^"\s]*)?/g,'/$1').replace('https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js','/jspdf.umd.min.js');
  body='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>';type='text/html';
 }else if(assets.has(route.slice(1))){body=fs.readFileSync(path.join(root,route.slice(1)));type=route.endsWith('.css')?'text/css':'application/javascript';}
 else if(route==='/jspdf.umd.min.js'){body=fs.readFileSync(pdf);type='application/javascript';}
 else {res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});res.end(body);
});
server.listen(Number(process.env.PORT)||8765,'127.0.0.1',()=>console.log('Local V2: http://127.0.0.1:'+server.address().port+'/calc (settings: /calc-settings)'));
