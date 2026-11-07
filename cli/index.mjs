#!/usr/bin/env node
// Máquina de Reels: roteiro.json -> voz -> legenda alinhada -> vídeo vertical 1080x1920.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {alinhar} from './alinhar.mjs';
import {carregarEstilo, listarEstilos, RAIZ} from './estilos.mjs';
import {validarRoteiro} from './roteiro.mjs';

const AJUDA = `
Máquina de Reels: crie reels narrados em português a partir de um roteiro.

Uso:
  maquina-de-reels novo <pasta>              cria uma pasta com um roteiro de exemplo
  maquina-de-reels criar <pasta> [opções]    gera voz, legenda e vídeo
  maquina-de-reels estilos                   lista os estilos disponíveis

Opções do "criar":
  --previa          salva um quadro de cada cena em <pasta>/saida/previa/ (rápido, pra conferir)
  --render          gera o vídeo final em <pasta>/saida/<slug>.mp4
  --sem-voz         reaproveita a narração já gerada (não gasta crédito de voz)
  --estilo <nome>   troca o estilo sem mexer no roteiro

Vozes (campo "voz" do roteiro):
  {"provedor": "edge", "nome": "pt-BR-AntonioNeural"}      grátis (também: pt-BR-FranciscaNeural)
  {"provedor": "elevenlabs", "id": "<voice_id>"}            paga, precisa de ELEVENLABS_API_KEY
  {"provedor": "arquivo", "arquivo": "minha-voz.m4a"}       sua própria gravação (Whisper local)
`;

const sair = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(1); };

const [cmd, alvo, ...resto] = process.argv.slice(2);
const flags = new Set(resto.filter((a) => a.startsWith('--')));
const valor = (f) => { const i = resto.indexOf(f); return i >= 0 ? resto[i + 1] : undefined; };

if (!cmd || cmd === 'ajuda' || cmd === '--help' || cmd === '-h') { console.log(AJUDA); process.exit(0); }

if (cmd === 'estilos') {
	for (const n of listarEstilos()) {
		const e = carregarEstilo(n);
		console.log(`${n.padEnd(20)} ${e.descricao}  (por ${e.autor})`);
	}
	process.exit(0);
}

if (cmd === 'novo') {
	if (!alvo) sair('diga o nome da pasta: maquina-de-reels novo meu-video');
	const destino = path.resolve(alvo);
	if (fs.existsSync(path.join(destino, 'roteiro.json'))) sair(`já existe um roteiro em ${destino}`);
	fs.mkdirSync(destino, {recursive: true});
	const ex = JSON.parse(fs.readFileSync(path.join(RAIZ, 'exemplos/primeiro-reels/roteiro.json'), 'utf8'));
	ex.slug = path.basename(destino);
	fs.writeFileSync(path.join(destino, 'roteiro.json'), JSON.stringify(ex, null, 2) + '\n');
	console.log(`✔ roteiro criado em ${path.join(destino, 'roteiro.json')}\n  Edite as falas e rode: maquina-de-reels criar ${alvo} --previa`);
	process.exit(0);
}

if (cmd !== 'criar') sair(`comando "${cmd}" não existe. Rode sem nada pra ver a ajuda.`);
if (!alvo) sair('diga a pasta do vídeo: maquina-de-reels criar meu-video --previa');

const pasta = path.resolve(alvo);
const arqRoteiro = path.join(pasta, 'roteiro.json');
if (!fs.existsSync(arqRoteiro)) sair(`não achei ${arqRoteiro}. Crie com: maquina-de-reels novo ${alvo}`);
const roteiro = JSON.parse(fs.readFileSync(arqRoteiro, 'utf8'));
const errosRot = validarRoteiro(roteiro);
if (errosRot.length) sair(`roteiro com problema:\n- ${errosRot.join('\n- ')}`);

let estilo;
try { estilo = carregarEstilo(valor('--estilo') ?? roteiro.estilo ?? 'dourado-noturno'); } catch (e) { sair(e.message); }

const nome = roteiro.slug || path.basename(pasta);
const saida = path.join(pasta, 'saida');
fs.mkdirSync(saida, {recursive: true});

// imagens citadas no roteiro vão pra saida/ (é a pasta pública do vídeo)
const publicar = (p) => {
	if (!p) return p;
	const src = path.isAbsolute(p) ? p : path.join(pasta, p);
	if (!fs.existsSync(src)) sair(`imagem não encontrada: ${src}`);
	fs.copyFileSync(src, path.join(saida, path.basename(src)));
	return path.basename(src);
};
const rot = structuredClone(roteiro);
rot.logo = publicar(rot.logo);
if (rot.assinatura?.foto) rot.assinatura.foto = publicar(rot.assinatura.foto);
for (const c of rot.cenas) if (c.imagem) c.imagem = publicar(c.imagem);

// ---------- voz ----------
const arqTempos = path.join(saida, 'voz-tempos.json');
const narracao = path.join(saida, 'narracao.mp3');
let ouvidas;
if (flags.has('--sem-voz') && fs.existsSync(arqTempos) && fs.existsSync(narracao)) {
	ouvidas = JSON.parse(fs.readFileSync(arqTempos, 'utf8'));
	console.log('• voz: reaproveitando a narração que já existe');
} else {
	const voz = roteiro.voz ?? {provedor: 'edge'};
	let texto = roteiro.cenas.map((c) => c.fala).join('\n');
	// "pronuncia" muda só o que a voz fala; a legenda continua com o texto original
	for (const [de, para] of Object.entries(roteiro.pronuncia ?? {})) {
		texto = texto.replace(new RegExp(`(?<![\\p{L}\\p{N}])${de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu'), para);
	}
	console.log(`• voz: gerando com "${voz.provedor}"...`);
	let mod;
	try { mod = await import(`./vozes/${voz.provedor}.mjs`); } catch { sair(`provedor de voz "${voz.provedor}" não existe. Use edge, elevenlabs ou arquivo.`); }
	try {
		({ouvidas} = await mod.falar({texto, pasta: saida, voz, pastaRoteiro: pasta}));
	} catch (e) { sair(`falha na voz: ${e.message}`); }
	fs.writeFileSync(arqTempos, JSON.stringify(ouvidas));
	// volume no padrão das redes (-16 LUFS); usa o ffmpeg que vem com o Remotion
	const tmp = path.join(saida, 'narracao-tmp.mp3');
	execFileSync('npx', ['remotion', 'ffmpeg', '-v', 'error', '-y', '-i', narracao, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-b:a', '160k', tmp], {cwd: RAIZ, stdio: 'inherit'});
	fs.renameSync(tmp, narracao);
}

// ---------- legenda alinhada ----------
const {palavras, timeline, alinhadas, total} = alinhar(roteiro.cenas, ouvidas);
console.log(`• legenda: ${alinhadas}/${total} palavras alinhadas, ${timeline.fim.toFixed(1)} s de narração, ${roteiro.cenas.length} cenas`);
const props = {roteiro: rot, estilo, palavras, timeline, audio: 'narracao.mp3'};
fs.writeFileSync(path.join(saida, 'props.json'), JSON.stringify(props));

if (!flags.has('--previa') && !flags.has('--render')) {
	console.log(`\n✔ pronto pra montar. Rode de novo com --previa (conferir) ou --render (vídeo final).`);
	process.exit(0);
}

const {preparar, previa, renderizar} = await import('./video.mjs');
console.log('• preparando o projeto de vídeo...');
const serveUrl = await preparar(saida);
if (flags.has('--previa')) {
	const qs = await previa({serveUrl, props, saida});
	console.log(`✔ prévia: ${qs.length} quadros em ${path.join(saida, 'previa')}`);
}
if (flags.has('--render')) {
	const out = await renderizar({serveUrl, props, saida, nome});
	console.log(`✔ vídeo: ${out}`);
}
