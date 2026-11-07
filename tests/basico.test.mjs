import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {alinhar, normalizar} from '../cli/alinhar.mjs';
import {PASTA_ESTILOS, fontesDisponiveis, listarEstilos, validarEstilo} from '../cli/estilos.mjs';
import {validarRoteiro} from '../cli/roteiro.mjs';

test('normalizar tira acento, pontuação e caixa', () => {
	assert.equal(normalizar('Ação!'), 'acao');
	assert.equal(normalizar('R$ 5,50'), 'r550');
});

test('alinhar usa os tempos ouvidos e mantém o texto original', () => {
	const cenas = [{fala: 'Olá, mundo.'}, {fala: 'Segunda cena aqui.'}];
	const ouvidas = [
		{w: 'ola', s: 0.0, e: 0.4}, {w: 'mundo', s: 0.5, e: 0.9},
		{w: 'segunda', s: 1.2, e: 1.6}, {w: 'cena', s: 1.7, e: 2.0}, {w: 'aqui', s: 2.1, e: 2.5},
	];
	const r = alinhar(cenas, ouvidas);
	assert.equal(r.alinhadas, 5);
	assert.deepEqual(r.palavras.map((p) => p.w), ['Olá,', 'mundo.', 'Segunda', 'cena', 'aqui.']);
	assert.equal(r.timeline.cenas[0].s, 0);
	assert.equal(r.timeline.cenas[1].s, 1.08); // começa um pouco antes da 1ª palavra
	assert.equal(r.timeline.fim, 2.5);
});

test('alinhar preenche palavras que a transcrição escreveu diferente', () => {
	const cenas = [{fala: 'Custa 50 reais hoje'}];
	const ouvidas = [{w: 'custa', s: 0, e: 0.4}, {w: 'cinquenta', s: 0.5, e: 1.0}, {w: 'reais', s: 1.1, e: 1.4}, {w: 'hoje', s: 1.5, e: 1.8}];
	const r = alinhar(cenas, ouvidas);
	const cinquenta = r.palavras[1];
	assert.equal(cinquenta.w, '50');
	assert.ok(cinquenta.s >= 0.4 && cinquenta.e <= 1.1, `tempo do "50" fora do buraco: ${JSON.stringify(cinquenta)}`);
});

test('todos os estilos da pasta são válidos', () => {
	const fontes = fontesDisponiveis();
	assert.ok(fontes.length >= 5);
	for (const nome of listarEstilos()) {
		const arq = path.join(PASTA_ESTILOS, `${nome}.json`);
		const erros = validarEstilo(JSON.parse(fs.readFileSync(arq, 'utf8')), arq, fontes);
		assert.deepEqual(erros, [], `estilo ${nome}: ${erros.join('; ')}`);
	}
});

test('validarEstilo aponta os erros comuns', () => {
	const erros = validarEstilo({nome: 'Meu Estilo', fundo: 'azul', texto: '#fff', destaque: '#f00', fonteTitulo: 'Comic Sans', fonteTexto: 'Inter'}, 'meu-estilo.json');
	assert.ok(erros.some((e) => e.includes('minúsculas')));
	assert.ok(erros.some((e) => e.includes('cor "fundo"')));
	assert.ok(erros.some((e) => e.includes('Comic Sans')));
	assert.ok(erros.some((e) => e.includes('autor')));
});

test('o roteiro de exemplo é válido', () => {
	const r = JSON.parse(fs.readFileSync(new URL('../exemplos/primeiro-reels/roteiro.json', import.meta.url), 'utf8'));
	assert.deepEqual(validarRoteiro(r), []);
});

test('validarRoteiro pega cena sem fala e tipo desconhecido', () => {
	const erros = validarRoteiro({cenas: [{tipo: 'titulo'}, {tipo: 'video', fala: 'oi'}]});
	assert.ok(erros.some((e) => e.includes('cena 1') && e.includes('fala')));
	assert.ok(erros.some((e) => e.includes('cena 2') && e.includes('video')));
});
