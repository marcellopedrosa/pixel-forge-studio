import { readPsd } from "ag-psd";
export type Layer = {id:string;name:string;visible:boolean;locked:boolean;opacity:number;left:number;top:number;width:number;height:number;image?:string;children:Layer[];kind:"group"|"bitmap";blendMode?:string};
export type PsdDocument = {width:number;height:number;layers:Layer[];warnings:string[];composite?:string};
function imageUrl(canvas:HTMLCanvasElement|undefined):string|undefined {try{return canvas?.toDataURL("image/png")}catch{return undefined}}
export async function importPSD(file:File):Promise<PsdDocument>{
 const buffer=await file.arrayBuffer(); const warnings:string[]=[];
 const psd=readPsd(buffer,{skipLayerImageData:false,skipCompositeImageData:false,useImageData:false});
 let index=0;
 function walk(children:readonly any[] =[],path=""):Layer[]{
  return children.map((source:any)=>{
   const id=path+"/"+index++;const childLayers=walk(source.children||[],id);
   let canvas=source.canvas as HTMLCanvasElement|undefined;
   if(!canvas && source.imageData){canvas=document.createElement("canvas");canvas.width=source.imageData.width;canvas.height=source.imageData.height;canvas.getContext("2d")?.putImageData(source.imageData,0,0)}
   const image=imageUrl(canvas);
   const kind=source.children?"group":"bitmap";
   if(kind==="bitmap"&&!image && (source.right-source.left)>0 && (source.bottom-source.top)>0)warnings.push("Sem pixels: "+source.name);
   return {id,name:source.name||"Sem nome",visible:source.hidden!==true,locked:!!source.protected?.transparency,opacity:typeof source.opacity==="number"?source.opacity:1,left:source.left||0,top:source.top||0,width:Math.max(0,(source.right||0)-(source.left||0)),height:Math.max(0,(source.bottom||0)-(source.top||0)),image,children:childLayers,kind,blendMode:source.blendMode};
  });
 }
 const composite=imageUrl(psd.canvas as HTMLCanvasElement|undefined);
 return {width:psd.width,height:psd.height,layers:walk(psd.children||[]),warnings,composite};
}
export function flatten(layers:Layer[]):Layer[]{return layers.flatMap(l=>[l,...flatten(l.children)])}
export function countRaster(layers:Layer[]):number{return flatten(layers).filter(l=>l.kind==="bitmap"&&!!l.image).length}
export function findLayer(layers:Layer[],id:string):Layer|undefined{return flatten(layers).find(l=>l.id===id)}
export function updateLayer(layers:Layer[],id:string,fn:(layer:Layer)=>Layer):Layer[]{return layers.map(l=>l.id===id?fn(l):{...l,children:updateLayer(l.children,id,fn)})}
