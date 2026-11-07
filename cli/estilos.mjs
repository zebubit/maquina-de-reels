// Carrega e valida estilos (estilos/*.json).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PASTA_ESTILOS = path.join(RAIZ, 'estilos');

// a lista de fontes vem do próprio fontes.ts, assim só existe um lugar pra mexer
export const fontesDisponiveis = () => {
	const src = fs.readFileSync(path.join(RAIZ, 'remotion/src/fontes.ts'), 'utf8');
	return [...src.matchAll(/^\s*'([^']+)': \(\) =>/gm)].map((m) => m[1]);
};

const COR = /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;
const ENTRADAS = ['sobe', 'zoom', 'pop'];

/** Retorna a lista de problemas do estilo (vazia = tudo certo). */
export const validarEstilo = (e, nomeArquivo, fontes = fontesDisponiveis()) => {
	const erros = [];
	const nome = nomeArquivo ? path.basename(nomeArquivo, '.json') : null;
	if (!e || typeof e !== 'object') return ['o arquivo não é um objeto JSON'];
	if (!e.nome) erros.push('falta "nome"');
	else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.nome)) erros.push(`"nome" deve ser em minúsculas com hífen (ex.: verde-neon), veio "${e.nome}"`);
	if (nome && e.nome && e.nome !== nome) erros.push(`"nome" (${e.nome}) tem que ser igual ao nome do arquivo (${nome})`);
	if (!e.autor) erros.push('falta "autor" (seu @ ou nome, pra você ganhar o crédito)');
	if (!e.descricao) erros.push('falta "descricao" (uma frase dizendo pra que o estilo serve)');
	for (const k of ['fundo', 'texto', 'destaque']) {
		if (!e[k]) erros.push(`falta a cor "${k}"`);
	}
	for (const k of ['fundo', 'fundo2', 'texto', 'destaque', 'card', 'linha']) {
		if (e[k] !== undefined && !COR.test(String(e[k]))) erros.push(`cor "${k}" inválida: "${e[k]}" (use #rrggbb ou rgba(r,g,b,a))`);
	}
	for (const k of ['fonteTitulo', 'fonteTexto', 'fonteMono']) {
		if (k !== 'fonteMono' && !e[k]) erros.push(`falta "${k}"`);
		if (e[k] && !fontes.includes(e[k])) erros.push(`fonte "${e[k]}" em "${k}" não existe. Opções: ${fontes.join(', ')}`);
	}
	const l = e.legenda ?? {};
	if (l.posicao !== undefined && !(l.posicao >= 0 && l.posicao <= 0.9)) erros.push('"legenda.posicao" vai de 0 (topo) a 0.9 (embaixo)');
	if (l.tamanho !== undefined && !(l.tamanho >= 30 && l.tamanho <= 120)) erros.push('"legenda.tamanho" vai de 30 a 120');
	if (l.palavrasPorVez !== undefined && !(Number.isInteger(l.palavrasPorVez) && l.palavrasPorVez >= 1 && l.palavrasPorVez <= 8)) erros.push('"legenda.palavrasPorVez" vai de 1 a 8');
	const a = e.animacao ?? {};
	if (a.entrada !== undefined && !ENTRADAS.includes(a.entrada)) erros.push(`"animacao.entrada" deve ser ${ENTRADAS.join(', ')}`);
	return erros;
};

export const listarEstilos = () => fs.readdirSync(PASTA_ESTILOS).filter((f) => f.endsWith('.json')).map((f) => path.basename(f, '.json')).sort();

export const carregarEstilo = (nome) => {
	const arq = path.join(PASTA_ESTILOS, `${nome}.json`);
	if (!fs.existsSync(arq)) throw new Error(`estilo "${nome}" não encontrado. Estilos disponíveis: ${listarEstilos().join(', ')}`);
	const e = JSON.parse(fs.readFileSync(arq, 'utf8'));
	const erros = validarEstilo(e, arq);
	if (erros.length) throw new Error(`estilo "${nome}" com problema:\n- ${erros.join('\n- ')}`);
	return e;
};
