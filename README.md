# PixelForge Studio v1.0

Editor experimental em Next.js com importação PSD por camada usando ag-psd.

## Executar

```bash
npm install
npm test
npm run build
npm run dev
```

Abra http://localhost:3000. Use **Abrir PSD** para selecionar seu arquivo. A interface tem camadas/grupos, seleção e movimentação, posição, visibilidade, bloqueio, opacidade, exportação SVG e diagnóstico de camadas sem pixels.

## Limitações
Esta publicação é uma implementação inicial simplificada: não reproduz todas as ferramentas do ZIP v1.0 entregue anteriormente na conversa. Textos do PSD e efeitos podem ficar rasterizados; máscaras, modos de mesclagem e composição isolada não têm fidelidade integral ao Photopea.

## Resultado das verificações locais (2026-10-16)
- `npm install` falhou por erro de DNS `EAI_AGAIN` ao acessar registry.npmjs.org.
- `npm test` no artefato v1.0 anterior: **4/4 passaram**. Os testes deste commit são novos e precisam ser executados pela CI.
- `npm run build` falhou com `next: not found` porque `npm install` não completou.
- Portanto **build e importação de PSD no navegador ainda não foram validados**.

## Próxima prioridade
Validar o PSD de referência com screenshots em CI, tratar camadas sem pixel, máscaras e modos de composição.
