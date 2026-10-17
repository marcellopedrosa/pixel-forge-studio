"use client";
import {useEffect,useRef,useState} from "react";
import {flatten,importPSD,type Layer} from "../lib/psd-import";
type Kind="rect"|"ellipse"|"line"|"text"|"image"|"path";
type Item={id:string;kind:Kind;name:string;x:number;y:number;w:number;h:number;fill:string;stroke:string;strokeWidth:number;opacity:number;visible:boolean;locked:boolean;angle:number;text?:string;fontSize?:number;image?:string;filter:string;group?:string;points?:{x:number;y:number}[]};
type Drag={id?:string;x:number;y:number;ox:number;oy:number;drawing:boolean};
const id=()=>crypto.randomUUID();
const newItem=(kind:Kind,x:number,y:number):Item=>({id:id(),kind,name:kind,x,y,w:1,h:1,fill:"#ff7c00",stroke:"#ffffff",strokeWidth:0,opacity:1,visible:true,locked:false,angle:0,filter:"none"});
const filters=["none","grayscale(1)","sepia(1)","blur(3px)","invert(1)","contrast(1.5)","brightness(1.3)","saturate(1.7)"];
const menu:Record<string,string[]>={
"Arquivo":["Novo projeto","Abrir imagem","Abrir PSD em camadas","Exportar PNG","Exportar SVG","Salvar JSON","Abrir JSON"],
"Editar":["Desfazer","Refazer","Duplicar","Excluir","Agrupar","Desagrupar","Selecionar tudo"],
"Imagem":["Escala de cinza","Sépia","Inverter","Brilho","Contraste","Remover filtro"],
"Camada":["Nova camada","Mover para frente","Mover para trás","Bloquear","Ocultar","Duplicar","Excluir"],
"Selecionar":["Todos","Limpar seleção"],"Filtro":["Escala de cinza","Sépia","Desfoque","Inverter","Contraste","Brilho","Saturação","Remover filtro"],
"Exibir":["Zoom +","Zoom -","Grade"],"Janela":["Camadas","Propriedades"],"Ajuda":["Sobre"]
};
export default function DesignStudio(){
 const [items,setItems]=useState<Item[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [tool,setTool]=useState("select"),[openMenu,setOpenMenu]=useState<string|null>(null);
 const [width,setWidth]=useState(1280),[height,setHeight]=useState(720),[zoom,setZoom]=useState(65),[grid,setGrid]=useState(false),[status,setStatus]=useState("Pronto");
 const [history,setHistory]=useState<Item[][]>([]),[future,setFuture]=useState<Item[][]>([]);
 const surface=useRef<SVGSVGElement>(null),drag=useRef<Drag|null>(null),fileImage=useRef<HTMLInputElement>(null),filePsd=useRef<HTMLInputElement>(null),fileJSON=useRef<HTMLInputElement>(null);
 const selectedItem=items.find(o=>o.id===selected[0]);
 const snapshot=()=>{setHistory(h=>[...h.slice(-39),structuredClone(items)]);setFuture([])};
 const apply=(fn:(old:Item[])=>Item[])=>setItems(fn);
 const update=(changes:Partial<Item>)=>apply(old=>old.map(o=>selected.includes(o.id)?{...o,...changes}:o));
 const undo=()=>{if(!history.length)return;setFuture(f=>[items,...f]);setItems(history.at(-1)!);setHistory(h=>h.slice(0,-1))};
 const redo=()=>{if(!future.length)return;setHistory(h=>[...h,items]);setItems(future[0]);setFuture(f=>f.slice(1))};
 const point=(e:React.PointerEvent)=>{const rect=surface.current!.getBoundingClientRect();return {x:(e.clientX-rect.left)*width/rect.width,y:(e.clientY-rect.top)*height/rect.height}};
 function pointerDown(e:React.PointerEvent){if(e.button!==0)return;const p=point(e);const target=(e.target as Element).closest("[data-object]");const targetId=target?.getAttribute("data-object");
  if(tool==="select"&&targetId){const obj=items.find(x=>x.id===targetId);if(!obj||obj.locked)return;snapshot();setSelected(old=>e.shiftKey?(old.includes(targetId)?old.filter(x=>x!==targetId):[...old,targetId]):[targetId]);drag.current={id:targetId,x:p.x,y:p.y,ox:obj.x,oy:obj.y,drawing:false};surface.current?.setPointerCapture(e.pointerId);return}
  if(tool==="select"){setSelected([]);return}
  if(tool==="text"){const t=newItem("text",p.x,p.y);t.text="Novo texto";t.fontSize=42;t.w=280;t.h=55;snapshot();apply(old=>[...old,t]);setSelected([t.id]);setTool("select");return}
  if(tool==="eyedropper"){if(targetId){const obj=items.find(o=>o.id===targetId);if(obj)update({fill:obj.fill})}return}
  if(tool==="eraser"){if(targetId){snapshot();apply(old=>old.filter(o=>o.id!==targetId))}return}
  if(["rect","ellipse","line","path"].includes(tool)){snapshot();const obj=newItem(tool as Kind,p.x,p.y);if(tool==="path")obj.points=[{x:0,y:0}];apply(old=>[...old,obj]);setSelected([obj.id]);drag.current={id:obj.id,x:p.x,y:p.y,ox:p.x,oy:p.y,drawing:true};surface.current?.setPointerCapture(e.pointerId)}
 }
 function pointerMove(e:React.PointerEvent){const d=drag.current;if(!d)return;const p=point(e);
  if(d.drawing){apply(old=>old.map(o=>o.id===d.id?{...o,x:Math.min(d.x,p.x),y:Math.min(d.y,p.y),w:Math.max(2,Math.abs(p.x-d.x)),h:Math.max(2,Math.abs(p.y-d.y)),points:o.kind==="path"?[...(o.points||[]),{x:p.x-o.x,y:p.y-o.y}]:o.points}:o));return}
  if(d.id)apply(old=>old.map(o=>o.id===d.id?{...o,x:d.ox+p.x-d.x,y:d.oy+p.y-d.y}:o));
 }
 const stop=()=>{drag.current=null};
 const triggerDownload=(name:string,contents:Blob)=>{const url=URL.createObjectURL(contents),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)};
 const svgMarkup=()=>{const source=surface.current?.cloneNode(true) as SVGSVGElement|undefined;if(!source)return "";source.querySelectorAll("[data-selection]").forEach(n=>n.remove());source.setAttribute("xmlns","http://www.w3.org/2000/svg");return new XMLSerializer().serializeToString(source)};
 const exportSvg=()=>triggerDownload("pixelforge.svg",new Blob([svgMarkup()],{type:"image/svg+xml"}));
 const exportPng=()=>{const svg=svgMarkup(),url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"})),img=new Image();img.onload=()=>{const c=document.createElement("canvas");c.width=width;c.height=height;c.getContext("2d")?.drawImage(img,0,0);c.toBlob(b=>b&&triggerDownload("pixelforge.png",b));URL.revokeObjectURL(url)};img.onerror=()=>{setStatus("Não foi possível rasterizar o SVG.");URL.revokeObjectURL(url)};img.src=url};
 async function openPSD(f?:File){if(!f)return;setStatus("Importando PSD...");try{const d=await importPSD(f);const out:Item[]=flatten(d.layers).filter(l=>l.kind==="bitmap"&&l.image).reverse().map(l=>({...newItem("image",l.left,l.top),id:l.id,name:l.name,x:l.left,y:l.top,w:l.width,h:l.height,opacity:l.opacity,visible:l.visible,locked:l.locked,image:l.image,group:l.id.split("/").slice(0,-1).join("/")}));snapshot();setItems(out);setSelected([]);setWidth(d.width);setHeight(d.height);setStatus("PSD: "+out.length+" bitmaps / "+flatten(d.layers).length+" registros / "+d.warnings.length+" avisos")}catch(err){setStatus("Falha ao abrir PSD: "+String(err))}}
 async function openImage(f?:File){if(!f)return;const u=URL.createObjectURL(f);const image=new Image();image.onload=()=>{const o=newItem("image",40,40);o.name=f.name;o.w=image.width;o.h=image.height;o.image=u;snapshot();setItems(a=>[...a,o]);setSelected([o.id]);setStatus("Imagem importada: "+f.name)};image.onerror=()=>setStatus("Erro ao importar imagem");image.src=u}
 async function openJSON(f?:File){if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.items))throw Error("Documento inválido");snapshot();setItems(d.items);setWidth(d.width||1280);setHeight(d.height||720);setStatus("Documento aberto")}catch(e){setStatus(String(e))}}
 const run=(action:string)=>{setOpenMenu(null);if(action==="Abrir PSD em camadas")filePsd.current?.click();
 else if(action==="Abrir imagem")fileImage.current?.click();else if(action==="Abrir JSON")fileJSON.current?.click();
 else if(action==="Novo projeto"){snapshot();setItems([]);setSelected([])}
 else if(action==="Exportar SVG")exportSvg();else if(action==="Exportar PNG")exportPng();
 else if(action==="Salvar JSON")triggerDownload("pixelforge.json",new Blob([JSON.stringify({width,height,items},null,2)],{type:"application/json"}));
 else if(action==="Desfazer")undo();else if(action==="Refazer")redo();
 else if(action==="Excluir"){snapshot();setItems(old=>old.filter(o=>!selected.includes(o.id)));setSelected([])}
 else if(action==="Duplicar"){snapshot();setItems(old=>[...old,...old.filter(o=>selected.includes(o.id)).map(o=>({...o,id:id(),name:o.name+" cópia",x:o.x+20,y:o.y+20}))])}
 else if(action==="Agrupar"){if(selected.length>1){snapshot();const group=id();apply(old=>old.map(o=>selected.includes(o.id)?{...o,group}:o))}}
 else if(action==="Desagrupar"){snapshot();update({group:undefined})}
 else if(action==="Selecionar tudo"||action==="Todos")setSelected(items.filter(o=>!o.locked).map(o=>o.id));
 else if(action==="Limpar seleção")setSelected([]);
 else if(action==="Bloquear"){snapshot();update({locked:true})}
 else if(action==="Ocultar"){snapshot();update({visible:false})}
 else if(action==="Mover para frente"){snapshot();apply(old=>[...old.filter(o=>!selected.includes(o.id)),...old.filter(o=>selected.includes(o.id))])}
 else if(action==="Mover para trás"){snapshot();apply(old=>[...old.filter(o=>selected.includes(o.id)),...old.filter(o=>!selected.includes(o.id))])}
 else if(action==="Nova camada"){snapshot();apply(old=>[...old,newItem("rect",80,80)])}
 else if(action==="Zoom +")setZoom(z=>Math.min(300,z+15));else if(action==="Zoom -")setZoom(z=>Math.max(15,z-15));else if(action==="Grade")setGrid(g=>!g);
 else {const vals:Record<string,string>={"Escala de cinza":filters[1],"Sépia":filters[2],"Desfoque":filters[3],"Inverter":filters[4],"Contraste":filters[5],"Brilho":filters[6],"Saturação":filters[7],"Remover filtro":"none"};if(vals[action]){snapshot();update({filter:vals[action]})}}
 };
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(["INPUT","TEXTAREA","SELECT"].includes((e.target as HTMLElement).tagName))return;const ctrl=e.ctrlKey||e.metaKey;if(ctrl&&e.key.toLowerCase()==="z"){e.preventDefault();undo()}else if(e.key==="Delete"){run("Excluir")}else if(!ctrl){const map:Record<string,string>={v:"select",r:"rect",o:"ellipse",l:"line",t:"text",p:"path"};if(map[e.key.toLowerCase()])setTool(map[e.key.toLowerCase()])}};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn)});
 const shape=(o:Item)=>{const props={fill:o.fill,stroke:o.stroke,strokeWidth:o.strokeWidth};switch(o.kind){case "rect":return <rect width={o.w} height={o.h} {...props}/>;case "ellipse":return <ellipse cx={o.w/2} cy={o.h/2} rx={o.w/2} ry={o.h/2} {...props}/>;case "line":return <line x1={0} y1={0} x2={o.w} y2={o.h} {...props}/>;case "text":return <text x={0} y={o.fontSize||40} fill={o.fill} fontSize={o.fontSize||40} fontFamily="Arial">{o.text||"Texto"}</text>;case "image":return <image width={o.w} height={o.h} href={o.image} preserveAspectRatio="none"/>;case "path":return <polyline points={(o.points||[]).map(p=>p.x+","+p.y).join(" ")} fill="none" stroke={o.strokeWidth?o.stroke:o.fill} strokeWidth={Math.max(2,o.strokeWidth)}/>}}
 return <div className="studio">
 <nav className="studio-menu"><b>PixelForge Studio</b>{Object.keys(menu).map(m=><div key={m} className="menu-wrap"><button className="menu-label" onClick={()=>setOpenMenu(x=>x===m?null:m)}>{m}</button>{openMenu===m&&<div className="menu-popup">{menu[m].map(cmd=><button key={cmd} onClick={()=>run(cmd)}>{cmd}</button>)}</div>}</div>)}<span style={{marginLeft:"auto"}}>{status}</span></nav>
 <div className="studio-options"><button onClick={()=>run("Desfazer")}>↶ Desfazer</button><button onClick={()=>run("Refazer")}>↷ Refazer</button><button onClick={()=>run("Agrupar")}>Agrupar</button><button onClick={()=>run("Desagrupar")}>Desagrupar</button><button onClick={()=>run("Bloquear")}>🔒</button><button onClick={()=>run("Duplicar")}>Duplicar</button><label>Zoom <input type="range" min="20" max="160" value={zoom} onChange={e=>setZoom(+e.target.value)}/>{zoom}%</label></div>
 <div className="studio-grid"><aside className="studio-left"><div className="tool-group">{[["select","↖","Selecionar"],["rect","▭","Retângulo"],["ellipse","◯","Elipse"],["line","╱","Linha"],["path","✎","Caneta livre"],["text","T","Texto"],["eyedropper","◉","Conta-gotas"],["eraser","⌫","Excluir objeto"]].map(([key,icon,title])=><button title={title} key={key} className={tool===key?"active":""} onClick={()=>setTool(key)}>{icon}</button>)}</div><hr/><label>Preenchimento <input type="color" value={selectedItem?.fill||"#ff7c00"} onChange={e=>{snapshot();update({fill:e.target.value})}}/></label><label>Contorno <input type="color" value={selectedItem?.stroke||"#ffffff"} onChange={e=>{snapshot();update({stroke:e.target.value})}}/></label></aside>
 <main className="studio-stage"><div className="studio-board" style={{width:width*zoom/100,height:height*zoom/100}}><svg ref={surface} xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"100%",background:"#ffffff",touchAction:"none"}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={stop} onPointerCancel={stop}>{grid&&<defs><pattern id="studio-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" stroke="#ddd" fill="none"/></pattern></defs>}{grid&&<rect width="100%" height="100%" fill="url(#studio-grid-pattern)"/>}{items.filter(o=>o.visible).map(o=><g data-object={o.id} key={o.id} transform={`translate(${o.x} ${o.y}) rotate(${o.angle} ${o.w/2} ${o.h/2})`} opacity={o.opacity} style={{filter:o.filter,cursor:tool==="select"?"move":"crosshair"}}>{shape(o)}{selected.includes(o.id)&&<rect data-selection="true" x={-2} y={-2} width={o.w+4} height={o.h+4} fill="none" stroke="#138af5" strokeDasharray="6 4" pointerEvents="none"/>}</g>)}</svg></div></main>
 <aside className="studio-right"><h3>Camadas ({items.length})</h3><div className="studio-layers">{[...items].reverse().map(o=><div key={o.id} className={"studio-layer "+(selected.includes(o.id)?"selected":"")}><button title="Visibilidade" onClick={()=>{setItems(a=>a.map(i=>i.id===o.id?{...i,visible:!i.visible}:i))}}>{o.visible?"◉":"○"}</button><button title="Selecionar camada" onClick={()=>setSelected(e=>e.includes(o.id)?[]:[o.id])}>{o.group?"▣ ":""}{o.name}</button><button title="Travar" onClick={()=>setItems(a=>a.map(i=>i.id===o.id?{...i,locked:!i.locked}:i))}>{o.locked?"🔒":"🔓"}</button></div>)}</div><h3>Propriedades</h3>{selectedItem?<><label>Nome <input value={selectedItem.name} onChange={e=>update({name:e.target.value})}/></label><div className="studio-nums">{(["x","y","w","h","angle"] as const).map(k=><label key={k}>{k.toUpperCase()} <input type="number" value={Math.round(selectedItem[k])} onChange={e=>update({[k]:+e.target.value})}/></label>)}</div>{selectedItem.kind==="text"&&<><label>Texto <input value={selectedItem.text||""} onChange={e=>update({text:e.target.value})}/></label><label>Tamanho <input type="number" value={selectedItem.fontSize||40} onChange={e=>update({fontSize:+e.target.value})}/></label></>}<label>Opacidade <input type="range" min="0" max="100" value={Math.round(selectedItem.opacity*100)} onChange={e=>update({opacity:+e.target.value/100})}/></label><label>Filtro <select value={selectedItem.filter} onChange={e=>{snapshot();update({filter:e.target.value})}}>{filters.map(f=><option key={f} value={f}>{f}</option>)}</select></label><button onClick={()=>run("Excluir")}>Excluir</button></>:<p>Selecione um objeto no canvas ou na lista.</p>}</aside></div>
 <input hidden ref={fileImage} type="file" accept="image/*" onChange={e=>{void openImage(e.target.files?.[0]);e.target.value=""}}/><input hidden ref={filePsd} type="file" accept=".psd" onChange={e=>{void openPSD(e.target.files?.[0]);e.target.value=""}}/><input hidden ref={fileJSON} type="file" accept=".json" onChange={e=>{void openJSON(e.target.files?.[0]);e.target.value=""}}/>
 </div>
}
