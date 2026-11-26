# How to contribute

[Português](CONTRIBUTING.md)

A new style, scene type, voice, or text correction is welcome. Your name stays in the project.

## 1. Submit a style (no programming required)

1. Fork the repository and clone your fork.
2. Copy a style similar to the one you want to make.

   ```bash
   cp estilos/escuro-minimal.json estilos/verde-neon.json
   ```

3. Edit the new file.

| Field | What it controls |
|---|---|
| `nome` | Match the filename without its extension, using lowercase letters and hyphens (`verde-neon`). |
| `autor` | Your handle or name. |
| `descricao` | A sentence describing the kind of video this style suits. |
| `fundo`, `fundo2` | Background gradient colors, from the center to the edge. |
| `texto` | Text color. |
| `destaque` | Color for highlighted words. |
| `card`, `linha` | Card background and grid line colors. |
| `fonteTitulo`, `fonteTexto`, `fonteMono` | Choose from Inter, Playfair Display, Space Grotesk, JetBrains Mono, Anton, Montserrat, Sora, Bebas Neue, DM Sans, and Space Mono. |
| `tituloCaixaAlta` | Set to `true` for uppercase titles. |
| `legenda.posicao` | Caption height. Use 0 for the top or 0.9 for the bottom. |
| `legenda.tamanho` | Font size, from 30 to 120. |
| `legenda.palavrasPorVez` | Words shown at a time, from 1 to 8. |
| `animacao.entrada` | Entrance animation. Choose `sobe`, `zoom`, or `pop`. |
| `animacao.grade`, `particulas`, `flashCor` | Toggle the background effects. |

Use `#rrggbb` or `rgba(r, g, b, a)` for colors.

4. Preview and check your style.

   ```bash
   node cli/index.mjs criar exemplos/primeiro-reels --estilo verde-neon --previa
   npm run galeria -- verde-neon     # generates docs/galeria/verde-neon.png
   npm test                         # validates the style
   ```

5. Open a pull request with the JSON file and gallery image.

Make the style your own. You can draw inspiration from videos you like, but respect other people's brands, logos, and content.

## 2. Add a scene type

Scenes live in the `CenaView` component in `remotion/src/Reels.tsx`, with one `case` per type.

1. Add the type to `remotion/src/tipos.ts` and to the `TIPOS` list in `cli/roteiro.mjs`.
2. Write the `case` in `CenaView`. Use the theme colors and fonts (`C`, `F_TIT`, `F_TXT`) so the scene works with every style.
3. Add the scene to an example script and show the preview in your pull request.

Run `npm run estudio` to see your change live in Remotion Studio.

## 3. Add a voice

Each voice is a file in `cli/vozes/` that exports `falar({texto, pasta, voz})` and returns `{audio, ouvidas}`. The `ouvidas` array has the form `[{w, s, e}]`, with one entry per word and times in seconds. See `cli/vozes/edge.mjs` for an example.

## Before submitting

- Check that `npm test` passes.
- Write project text in Brazilian Portuguese.
- Keep each pull request to one topic.

Questions are welcome. Open an issue to ask.
