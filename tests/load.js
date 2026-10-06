const vm=require('vm'),fs=require('fs');
const root=__dirname+'/../data/';
const g={};g.window=g;vm.createContext(g);
for(const f of ['monsters.js','chapters.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),g,{filename:f});
module.exports=g.DV_DATA;
