// Sua própria voz: você grava o áudio e a máquina descobre o tempo de cada palavra com o Whisper (local, grátis).
// Na primeira vez baixa o whisper.cpp e o modelo (~500 MB) para a pasta .whisper do projeto.
import fs from 'node:fs';
import path from 'node:path';
import {downloadWhisperModel, installWhisperCpp, toCaptions, transcribe} from '@remotion/install-whisper-cpp';
import {RAIZ} from '../estilos.mjs';
import {ffmpeg} from '../ffmpeg.mjs';

const WHISPER_DIR = path.join(RAIZ, '.whisper');
const VERSAO = '1.5.5';

export const falar = async ({pasta, voz = {}, pastaRoteiro}) => {
	if (!voz.arquivo) throw new Error('no roteiro, coloque "voz": {"provedor": "arquivo", "arquivo": "minha-voz.m4a"}');
	const origem = path.isAbsolute(voz.arquivo) ? voz.arquivo : path.join(pastaRoteiro, voz.arquivo);
	if (!fs.existsSync(origem)) throw new Error(`áudio não encontrado: ${origem}`);
	const modelo = voz.modelo ?? 'medium';
	const audio = path.join(pasta, 'narracao.mp3');
	const wav = path.join(pasta, 'whisper-16k.wav');
	ffmpeg(['-y', '-i', origem, '-ac', '1', '-ar', '44100', '-b:a', '160k', audio]);
	ffmpeg(['-y', '-i', origem, '-ac', '1', '-ar', '16000', wav]);
	await installWhisperCpp({to: WHISPER_DIR, version: VERSAO});
	await downloadWhisperModel({model: modelo, folder: WHISPER_DIR});
	const res = await transcribe({inputPath: wav, whisperPath: WHISPER_DIR, model: modelo, tokenLevelTimestamps: true, splitOnWord: true, language: 'pt'});
	fs.rmSync(wav, {force: true});
	const {captions} = toCaptions({whisperCppOutput: res});
	const ouvidas = captions.map((c) => ({w: c.text.trim(), s: c.startMs / 1000, e: c.endMs / 1000})).filter((c) => c.w);
	return {audio, ouvidas};
};

