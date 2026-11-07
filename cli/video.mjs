// Monta o vídeo com o Remotion: empacota uma vez, depois gera prévias (quadros) ou o MP4.
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {RAIZ} from './estilos.mjs';

const FPS = 30;
const ID = 'Reels';

export const preparar = async (publicDir) => {
	const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'remotion/src/index.ts'), publicDir});
	return serveUrl;
};

/** Um quadro por cena, perto do fim da animação de entrada. Salva em <saida>/previa/cena-NN.png */
export const previa = async ({serveUrl, props, saida}) => {
	const comp = await selectComposition({serveUrl, id: ID, inputProps: props});
	const dir = path.join(saida, 'previa');
	fs.rmSync(dir, {recursive: true, force: true});
	fs.mkdirSync(dir, {recursive: true});
	const arquivos = [];
	for (const [i, c] of props.timeline.cenas.entries()) {
		const t = c.s + Math.min(c.e - c.s, 2.2) * 0.85;
		const out = path.join(dir, `cena-${String(i + 1).padStart(2, '0')}.png`);
		await renderStill({composition: comp, serveUrl, inputProps: props, frame: Math.min(comp.durationInFrames - 1, Math.round(t * FPS)), output: out, scale: 0.4});
		arquivos.push(out);
	}
	return arquivos;
};

export const renderizar = async ({serveUrl, props, saida, nome}) => {
	const comp = await selectComposition({serveUrl, id: ID, inputProps: props});
	const out = path.join(saida, `${nome}.mp4`);
	let ultimo = -1;
	await renderMedia({
		composition: comp, serveUrl, inputProps: props, codec: 'h264', crf: 18, pixelFormat: 'yuv420p', outputLocation: out,
		onProgress: ({progress}) => {
			const p = Math.floor(progress * 10);
			if (p !== ultimo) { ultimo = p; process.stdout.write(`  renderizando ${p * 10}%\n`); }
		},
	});
	return out;
};
