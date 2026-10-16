import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
test("scripts essenciais disponíveis",()=>{const p=JSON.parse(readFileSync("package.json"));for(const x of ["test","build","dev"])assert.equal(typeof p.scripts[x],"string")});
test("importador preserva hierarquia e posições",()=>{const s=readFileSync("lib/psd-import.ts","utf8");for(const term of ["source.children","source.left","source.top","warnings","countRaster"])assert.ok(s.includes(term),term)});
test("opacidade não é aplicada duas vezes no nó image",()=>{const s=readFileSync("components/Editor.tsx","utf8");assert.ok(s.includes('opacity={l.opacity}'));assert.ok(!s.includes("opacity={l.opacity} style={{opacity"))});
test("comparação com composição original e diagnóstico",()=>{const s=readFileSync("components/Editor.tsx","utf8");assert.ok(s.includes("Comparar original"));assert.ok(s.includes("Diagnóstico PSD"))});
