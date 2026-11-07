// Sua própria voz: você grava o áudio e a máquina descobre o tempo de cada palavra com o Whisper (local, grátis).
// Na primeira vez baixa e compila o whisper.cpp e baixa o modelo (~500 MB) para a pasta .whisper do projeto.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {downloadWhisperModel, installWhisperCpp} from '@remotion/install-whisper-cpp';
import {RAIZ} from '../estilos.mjs';
import {ffmpeg} from '../ffmpeg.mjs';

const WHISPER_DIR = path.join(RAIZ, '.whisper');
const VERSAO = '1.5.5';

export const falar = async ({pasta, voz = {}, pastaRoteiro}) => {
	if (!voz.arquivo) throw new Error('no roteiro, coloque "voz": {"provedor": "arquivo", "arquivo": "minha-voz.m4a"}');
	const origem = path.isAbsolute(voz.arquivo) ? voz.arquivo : path.join(pastaRoteiro, voz.arquivo);
	if (!fs.existsSync(origem)) throw new Error(`áudio não encontrado: ${origem}`);
	const modelo = voz.modelo ?? 'small';
	const audio = path.join(pasta, 'narracao.mp3');
	const wav = path.join(pasta, 'whisper-16k.wav');
	ffmpeg(['-y', '-i', origem, '-ac', '1', '-ar', '44100', '-b:a', '160k', audio]);
	ffmpeg(['-y', '-i', origem, '-ac', '1', '-ar', '16000', wav]);
	await installWhisperCpp({to: WHISPER_DIR, version: VERSAO});
	await downloadWhisperModel({model: modelo, folder: WHISPER_DIR});
	// chamamos o whisper direto: o transcribe() do pacote encerra o processo cedo em alguns Macs Intel
	const exe = path.join(WHISPER_DIR, process.platform === 'win32' ? 'main.exe' : 'main');
	const saidaJson = path.join(pasta, 'whisper');
	console.log('  transcrevendo com o Whisper (pode levar alguns minutos)...');
	execFileSync(exe, ['-f', wav, '-m', path.join(WHISPER_DIR, `ggml-${modelo}.bin`), '-l', 'pt', '-ml', '1', '-oj', '-of', saidaJson], {cwd: WHISPER_DIR, stdio: 'ignore'});
	const json = JSON.parse(fs.readFileSync(`${saidaJson}.json`, 'utf8'));
	fs.rmSync(wav, {force: true});
	fs.rmSync(`${saidaJson}.json`, {force: true});
	return {audio, ouvidas: juntarTokens(json.transcription)};
};

/** O Whisper devolve pedaços de palavra ("gra", "ça"); um pedaço que começa com espaço abre palavra nova. */
export const juntarTokens = (tokens) => {
	const palavras = [];
	for (const t of tokens) {
		const txt = t.text ?? '';
		if (!txt.trim()) continue;
		const ultimo = palavras[palavras.length - 1];
		if (!ultimo || /^\s/.test(txt)) palavras.push({w: txt.trim(), s: t.offsets.from / 1000, e: t.offsets.to / 1000});
		else { ultimo.w += txt; ultimo.e = t.offsets.to / 1000; }
	}
	return palavras.map((p) => ({...p, w: p.w.replace(/^["“]+/, '')})).filter((p) => p.w);
};
