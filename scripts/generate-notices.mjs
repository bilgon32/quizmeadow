import {readFile,writeFile,readdir,stat} from 'node:fs/promises'
import path from 'node:path'
const project=process.cwd(), seen=new Set(), notices=[]
async function visit(name,from=project) {
 let directory=from, pkg
 while(true) {
  const candidate=path.join(directory,'node_modules',name)
  try {await stat(path.join(candidate,'package.json'));pkg=candidate;break} catch {}
  const parent=path.dirname(directory)
  if(parent===directory) throw new Error('Cannot locate runtime dependency '+name)
  directory=parent
 }
 if(seen.has(pkg)) return
 seen.add(pkg)
 const metadata=JSON.parse(await readFile(path.join(pkg,'package.json'),'utf8'))
 const licenses=(await readdir(pkg)).filter(file=>/^licen[cs]e(?:[.-]|$)/i.test(file))
 if(!licenses.length) throw new Error('Missing license text for '+metadata.name)
 const text=(await Promise.all(licenses.map(file=>readFile(path.join(pkg,file),'utf8')))).join('\n\n').replace(/\r\n/g,'\n').trimEnd()
 notices.push({name:metadata.name,version:metadata.version,license:metadata.license,text})
 for(const dependency of Object.keys(metadata.dependencies||{})) await visit(dependency,pkg)
}
for(const name of ['react','react-dom','react-markdown','lucide-react','motion','yaml','zod']) await visit(name)
notices.sort((a,b)=>a.name.localeCompare(b.name))
await writeFile('THIRD_PARTY_NOTICES.md','# Third-party notices\n\nNotices for the app runtime and bundled renderer dependencies. Electron also ships its own runtime and Chromium notices in the app bundle.\n\n'+notices.map(p=>`## ${p.name} ${p.version}\n\nLicense: ${p.license}\n\n${p.text}\n`).join('\n---\n\n').trimEnd()+'\n')
console.log('Generated notices for '+notices.length+' runtime dependencies.')
