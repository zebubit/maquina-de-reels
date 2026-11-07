// Voz grátis: vozes neurais do Microsoft Edge (msedge-tts). Não precisa de chave.
// Atenção: usa um serviço não oficial da Microsoft; pode mudar ou parar sem aviso.
import fs from 'node:fs';
import path from 'node:path';
import {MsEdgeTTS, OUTPUT_FORMAT} from 'msedge-tts';

export const VOZES_PTBR = ['pt-BR-AntonioNeural', 'pt-BR-FranciscaNeural', 'pt-BR-ThalitaMultilingualNeural'];

const TICKS = 10_000_000; // a Microsoft mede o tempo em unidades de 100 ns

export const falar = async ({texto, pasta, voz = {}}) => {
	const tts = new MsEdgeTTS();
	await tts.setMetadata(voz.nome ?? 'pt-BR-AntonioNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {wordBoundaryEnabled: true});
	const tmp = path.join(pasta, 'edge-tmp');
	fs.mkdirSync(tmp, {recursive: true});
	try {
		const opcoes = voz.velocidade ? {rate: voz.velocidade} : undefined;
		const {audioFilePath, metadataFilePath} = await tts.toFile(tmp, texto, opcoes);
		const meta = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
		const ouvidas = (meta.Metadata ?? [])
			.filter((m) => m.Type === 'WordBoundary')
			.map((m) => ({w: m.Data.text.Text, s: m.Data.Offset / TICKS, e: (m.Data.Offset + m.Data.Duration) / TICKS}));
		const audio = path.join(pasta, 'narracao.mp3');
		fs.copyFileSync(audioFilePath, audio);
		return {audio, ouvidas};
	} finally {
		tts.close();
		fs.rmSync(tmp, {recursive: true, force: true});
	}
};
