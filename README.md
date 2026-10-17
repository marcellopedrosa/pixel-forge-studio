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


## Ambientes de execução

### Desenvolvimento na nuvem — GitHub Codespaces

1. Acesse [criar Codespace](https://github.com/codespaces/new?repo=1422752405&ref=main).
2. Aguarde o `postCreateCommand` instalar as dependências com `npm install`.
3. No terminal, execute `npm run dev -- --hostname 0.0.0.0`.
4. Abra a porta **3000** pelo painel **Ports**. O encaminhamento é privado por padrão.

Configuração em `.devcontainer/devcontainer.json` (Node.js 22).

### Homologação estática — GitHub Pages

O workflow `.github/workflows/pages.yml` executa `npm install`, `npm test`, `npm run build` e envia `out/` para o GitHub Pages.

**Configuração necessária uma única vez:** em [Settings → Pages](https://github.com/marcellopedrosa/pixel-forge-studio/settings/pages), selecione **GitHub Actions** no campo **Source**, não **Deploy from a branch**. Sem isso, o deployment pode falhar com HTTP 404 mesmo depois de um build bem-sucedido.

URL esperada após deployment bem-sucedido: https://marcellopedrosa.github.io/pixel-forge-studio/

> GitHub Pages não executa `npm run dev` ou servidores Node.js. Para desenvolvimento, use Codespaces.
