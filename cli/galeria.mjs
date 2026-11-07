// Gera docs/galeria/<estilo>.png: o mesmo quadro do exemplo em cada estilo. Rode depois de adicionar um estilo.
import fs from 'node:fs';
import path from 'node:path';
import {renderStill, selectComposition} from '@remotion/renderer';
import {carregarEstilo, listarEstilos, RAIZ} from './estilos.mjs';
import {preparar} from './video.mjs';

const base = JSON.parse(fs.readFileSync(path.join(RAIZ, 'remotion/src/exemplo-props.json'), 'utf8'));
const dir = path.join(RAIZ, 'docs/galeria');
fs.mkdirSync(dir, {recursive: true});
const serveUrl = await preparar(path.join(RAIZ, 'remotion/public'));
const so = process.argv[2];
for (const nome of listarEstilos()) {
	if (so && so !== nome) continue;
	const props = {...base, estilo: carregarEstilo(nome), audio: null};
	const comp = await selectComposition({serveUrl, id: 'Reels', inputProps: props});
	// cena 2 (card), perto do fim da animação
	const t = props.timeline.cenas[1].s + 2.6;
	await renderStill({composition: comp, serveUrl, inputProps: props, frame: Math.round(t * 30), output: path.join(dir, `${nome}.png`), scale: 0.3});
	console.log(`✔ ${nome}`);
}
