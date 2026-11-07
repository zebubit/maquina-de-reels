# Como contribuir

Toda ajuda conta: um estilo novo, um tipo de cena, uma voz nova, uma correção de texto. Seu nome fica no projeto.

## 1. Mandar um estilo (o jeito mais fácil, não precisa programar)

1. Faça um fork do repositório e clone o seu fork.
2. Copie um estilo parecido com o que você quer:
   ```bash
   cp estilos/escuro-minimal.json estilos/verde-neon.json
   ```
3. Edite o arquivo novo:

| Campo | O que é |
|---|---|
| `nome` | igual ao nome do arquivo, minúsculas com hífen (`verde-neon`) |
| `autor` | seu @ ou nome |
| `descricao` | uma frase: pra que tipo de vídeo ele combina |
| `fundo`, `fundo2` | cores do fundo (degradê do centro pra borda) |
| `texto` | cor do texto |
| `destaque` | cor das palavras em destaque |
| `card`, `linha` | fundo das caixas e cor das linhas da grade |
| `fonteTitulo`, `fonteTexto`, `fonteMono` | uma das fontes: Inter, Playfair Display, Space Grotesk, JetBrains Mono, Anton, Montserrat, Sora, Bebas Neue, DM Sans, Poppins, Space Mono |
| `tituloCaixaAlta` | `true` deixa os títulos em MAIÚSCULAS |
| `legenda.posicao` | altura da legenda: 0 é o topo, 0.9 é embaixo |
| `legenda.tamanho` | tamanho da letra (30 a 120) |
| `legenda.palavrasPorVez` | quantas palavras aparecem juntas (1 a 8) |
| `animacao.entrada` | `sobe`, `zoom` ou `pop` |
| `animacao.grade`, `particulas`, `flashCor` | liga ou desliga os efeitos do fundo |

Cores: `#rrggbb` ou `rgba(r, g, b, a)`.

4. Veja como ficou:
   ```bash
   node cli/index.mjs criar exemplos/primeiro-reels --estilo verde-neon --previa
   npm run galeria -- verde-neon     # gera docs/galeria/verde-neon.png
   npm test                       # confere se o estilo está válido
   ```
5. Abra um Pull Request com o JSON e a imagem da galeria. Pronto!

Regra de ouro: o estilo é seu. Pode se inspirar em vídeos que você gosta, mas não copie a marca, o logo ou o conteúdo de ninguém.

## 2. Tipo de cena novo

As cenas ficam em `remotion/src/Reels.tsx`, no componente `CenaView` (um `case` por tipo). Pra criar uma:

1. Adicione o tipo em `remotion/src/tipos.ts` e em `cli/roteiro.mjs` (lista `TIPOS`).
2. Escreva o `case` no `CenaView`. Use as cores e fontes do tema (`C`, `F_TIT`, `F_TXT`), assim a cena funciona em todos os estilos.
3. Coloque um exemplo da cena num roteiro e mostre a prévia no Pull Request.

`npm run estudio` abre o Remotion Studio pra ver a mudança ao vivo.

## 3. Voz nova

Cada voz é um arquivo em `cli/vozes/` que exporta `falar({texto, pasta, voz})` e devolve `{audio, ouvidas}`, onde `ouvidas` é a lista `[{w, s, e}]` com cada palavra e o tempo em segundos. Veja `cli/vozes/edge.mjs` como modelo.

## Antes de mandar

- `npm test` passando.
- Textos em português do Brasil.
- Um Pull Request por assunto.

Dúvidas: abra uma issue. Sem pergunta boba.
