"use client";
import {useState} from "react";
import Editor from "../components/Editor";
import DesignStudio from "../components/DesignStudio";
import "./studio.css";
export default function Page(){
 const [mode,setMode]=useState<"design"|"psd">("design");
 return <><div className="appmode"><b>PixelForge Studio</b><button className={mode==="design"?"current":""} onClick={()=>setMode("design")}>Editor gráfico</button><button className={mode==="psd"?"current":""} onClick={()=>setMode("psd")}>Importação PSD — original</button><span style={{marginLeft:"auto",fontSize:12}}>PSD preservado na aba original</span></div>{mode==="design"?<DesignStudio/>:<Editor/>}</>
}
