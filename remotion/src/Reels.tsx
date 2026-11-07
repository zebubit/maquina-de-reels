import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {carregarFonte} from './fontes';
import type {Cena, Estilo, Palavra, Props} from './tipos';

export type {Props} from './tipos';
export const FPS = 30;

// ---------- utilidades ----------
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const pr = (t: number, a: number, d = 0.5) => interpolate(t, [a, a + d], [0, 1], {...CL, easing: EASE});
const norm = (s: string) => s.toLowerCase().replace(/[.,?!:;"“”()]/g, '');
const passo = (s: number, e: number, n: number, k: number) => s + 0.45 + k * Math.min(0.7, Math.max(0.25, (e - s - 1.2) / Math.max(1, n)));

const luminancia = (cor: string) => {
	const m = cor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
	if (!m) return 0;
	const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// tudo que depende do estilo fica num só lugar
const tema = (E: Estilo) => {
	const C = {
		fundo: E.fundo, fundo2: E.fundo2 ?? E.fundo, texto: E.texto, dest: E.destaque,
		card: E.card ?? '#14161c', linha: E.linha ?? 'rgba(255,255,255,0.1)',
	};
	const LEG = {posicao: 0.74, tamanho: 58, palavrasPorVez: 4, caixaAlta: false, destaqueItalico: true, ...(E.legenda ?? {})};
	const ANI = {entrada: 'sobe', grade: true, particulas: true, flashCor: false, ...(E.animacao ?? {})};
	// fundo claro pede sombra suave, senão o texto fica borrado
	const claro = luminancia(C.fundo) > 0.5;
	const SOMBRA = {
		titulo: claro ? 'none' : '0 6px 30px rgba(0,0,0,0.6)',
		legenda: claro ? '0 2px 10px rgba(255,255,255,0.7)' : '0 3px 14px rgba(0,0,0,0.9)',
		caixa: claro ? '0 24px 60px rgba(0,0,0,0.12)' : '0 40px 90px rgba(0,0,0,0.5)',
	};
	return {
		C, LEG, ANI, SOMBRA,
		F_TIT: carregarFonte(E.fonteTitulo), F_TXT: carregarFonte(E.fonteTexto), F_MONO: carregarFonte(E.fonteMono ?? 'JetBrains Mono'),
		CAPS: (s: string) => (E.tituloCaixaAlta ? s.toUpperCase() : s),
		// legenda no topo empurra o conteúdo pra baixo
		OFF: LEG.posicao < 0.4 ? 170 : 0,
	};
};
type Tema = ReturnType<typeof tema>;

const entra = (ani: Tema['ANI'], p: number): React.CSSProperties => {
	if (ani.entrada === 'zoom') return {opacity: p, transform: `scale(${0.82 + 0.18 * p})`};
	if (ani.entrada === 'pop') {
		const o = p < 1 ? Math.sin(p * Math.PI) * 0.08 : 0;
		return {opacity: Math.min(1, p * 2), transform: `scale(${0.7 + 0.3 * p + o})`};
	}
	return {opacity: p, transform: `translateY(${(1 - p) * 70}px)`};
};

// texto com *palavra* vira destaque
const Rico: React.FC<{s: string; cor: string}> = ({s, cor}) => (
	<>{s.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <span key={i} style={{color: cor}}>{p.slice(1, -1)}</span> : <span key={i}>{p}</span>))}</>
);

// ---------- fundo ----------
const Fundo: React.FC<{t: number; th: Tema}> = ({t, th: {C, ANI}}) => (
	<AbsoluteFill style={{background: `radial-gradient(ellipse 120% 70% at 50% 30%, ${C.fundo2} 0%, ${C.fundo} 70%)`}}>
		{ANI.grade && (
			<AbsoluteFill style={{backgroundImage: `linear-gradient(${C.linha} 1px, transparent 1px), linear-gradient(90deg, ${C.linha} 1px, transparent 1px)`,
				backgroundSize: '72px 72px', opacity: 0.35, transform: `translateY(${(t * 6) % 72}px)`}} />
		)}
		{ANI.particulas && Array.from({length: 40}).map((_, i) => {
			const x = random('x' + i) * 1080, y0 = random('y' + i) * 1920, v = 10 + random('v' + i) * 25, r = 1 + random('r' + i) * 2.5;
			return <div key={i} style={{position: 'absolute', left: x, top: (y0 - t * v + 1920) % 1920, width: r * 2, height: r * 2, borderRadius: '50%', background: C.dest, opacity: 0.12 + random('o' + i) * 0.25}} />;
		})}
	</AbsoluteFill>
);

// ---------- cenas ----------
const CenaView: React.FC<{c: Cena; s: number; e: number; t: number; th: Tema; roteiro: Props['roteiro']}> = ({c, s, e, t, th, roteiro}) => {
	const {C, F_TIT, F_TXT, F_MONO, CAPS, OFF, ANI, SOMBRA} = th;
	const p = pr(t, s, 0.55);
	const caixa: React.CSSProperties = {background: C.card, border: `1.5px solid ${C.linha}`, borderRadius: 34, boxShadow: SOMBRA.caixa};
	const Kicker = ({x}: {x?: string}) => (x ? <div style={{fontFamily: F_MONO, fontSize: 30, letterSpacing: 8, color: C.dest, textTransform: 'uppercase', marginBottom: 18}}>{x}</div> : null);
	const Titulo = ({x, size = 110}: {x?: string; size?: number}) =>
		x ? <div style={{fontFamily: F_TIT, fontWeight: 900, fontSize: size, lineHeight: 1.02, color: C.texto, textShadow: SOMBRA.titulo}}><Rico s={CAPS(x)} cor={C.dest} /></div> : null;
	const Sub = ({x}: {x?: string}) => (x ? <div style={{fontFamily: F_TXT, fontWeight: 600, fontSize: 44, color: C.texto, opacity: 0.8, marginTop: 22, lineHeight: 1.25}}><Rico s={x} cor={C.dest} /></div> : null);

	switch (c.tipo) {
		case 'foto': {
			const img = c.imagem;
			return (
				<AbsoluteFill>
					{img && <Img src={staticFile(img)} style={{width: 1080, height: 1920, objectFit: 'cover', objectPosition: c.posicaoImagem ?? '50% 30%', transform: `scale(${interpolate(t, [s, e], [1.04, 1.13], CL)})`}} />}
					<AbsoluteFill style={{background: `linear-gradient(180deg, ${C.fundo} 0%, transparent 20%, transparent 45%, ${C.fundo}cc 62%, ${C.fundo} 100%)`}} />
					<div style={{position: 'absolute', left: 80, right: 80, top: 1000, textAlign: 'center', ...entra(ANI, p)}}>
						<Kicker x={c.kicker} /><Titulo x={c.titulo} size={120} /><Sub x={c.sub} />
					</div>
				</AbsoluteFill>
			);
		}
		case 'titulo':
			return (
				<div style={{position: 'absolute', left: 80, right: 80, top: 600 + OFF, textAlign: 'center', ...entra(ANI, p)}}>
					{c.icone && <div style={{fontSize: 150, marginBottom: 30}}>{c.icone}</div>}
					<Kicker x={c.kicker} /><Titulo x={c.titulo} size={124} /><Sub x={c.sub} />
				</div>
			);
		case 'card': {
			const itens = c.itens ?? [];
			return (
				<div style={{position: 'absolute', left: 80, right: 80, top: 400 + OFF, ...entra(ANI, p)}}>
					<div style={{textAlign: 'center', marginBottom: 40}}><Kicker x={c.kicker} /><Titulo x={c.titulo} size={96} /></div>
					{itens.length > 0 && (
						<div style={{...caixa, padding: '26px 34px'}}>
							{itens.map((it, k) => {
								const q = pr(t, passo(s, e, itens.length, k), 0.4);
								return (
									<div key={k} style={{display: 'flex', alignItems: 'center', gap: 26, padding: '22px 6px', borderBottom: k < itens.length - 1 ? `1px solid ${C.linha}` : 'none', opacity: q, transform: `translateX(${(1 - q) * -40}px)`}}>
										<div style={{width: 64, height: 64, borderRadius: 20, background: `${C.dest}22`, border: `2px solid ${C.dest}`, display: 'grid', placeItems: 'center', fontFamily: F_MONO, fontSize: 30, color: C.dest, flexShrink: 0}}>{c.icone ?? k + 1}</div>
										<div style={{fontFamily: F_TXT, fontWeight: 700, fontSize: 50, color: C.texto, lineHeight: 1.2}}><Rico s={it} cor={C.dest} /></div>
									</div>
								);
							})}
						</div>
					)}
					<Sub x={c.sub} />
				</div>
			);
		}
		case 'numero': {
			const v = Math.round((c.valor ?? 0) * pr(t, s + 0.2, Math.min(1.6, Math.max(0.3, e - s - 0.4))));
			const barra = c.barra ?? null;
			return (
				<div style={{position: 'absolute', left: 90, right: 90, top: 580 + OFF, textAlign: 'center', ...entra(ANI, p)}}>
					<Kicker x={c.kicker} />
					<div style={{fontFamily: F_TIT, fontWeight: 900, fontSize: 210, lineHeight: 1, color: C.dest, textShadow: `0 0 60px ${C.dest}55`}}>{c.prefixo ?? ''}{v.toLocaleString('pt-BR')}{c.sufixo ?? ''}</div>
					{c.rotulo && <div style={{fontFamily: F_TXT, fontWeight: 700, fontSize: 48, color: C.texto, marginTop: 24}}><Rico s={c.rotulo} cor={C.dest} /></div>}
					{barra !== null && (
						<div style={{height: 34, borderRadius: 20, background: C.card, border: `1.5px solid ${C.linha}`, marginTop: 50, overflow: 'hidden'}}>
							<div style={{height: '100%', width: `${barra * pr(t, s + 0.4, 1.4)}%`, background: C.dest, borderRadius: 20}} />
						</div>
					)}
					<Sub x={c.sub} />
				</div>
			);
		}
		case 'chat': {
			const msgs = c.msgs ?? [];
			return (
				<div style={{position: 'absolute', left: 90, right: 90, top: 400 + OFF, ...entra(ANI, p)}}>
					<div style={{textAlign: 'center', marginBottom: 36}}><Kicker x={c.kicker} /><Titulo x={c.titulo} size={84} /></div>
					<div style={{...caixa, padding: 34, display: 'flex', flexDirection: 'column', gap: 22}}>
						{msgs.map((m, k) => {
							const q = pr(t, passo(s, e, msgs.length, k), 0.35);
							const eu = m.de !== 'cliente';
							return (
								<div key={k} style={{alignSelf: eu ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: '20px 26px', borderRadius: 28, background: eu ? '#1f6f47' : '#262b36', color: '#fff',
									fontFamily: F_TXT, fontSize: 44, lineHeight: 1.3, opacity: q, transform: `scale(${0.85 + 0.15 * q})`, transformOrigin: eu ? 'right bottom' : 'left bottom'}}>{m.txt}</div>
							);
						})}
					</div>
				</div>
			);
		}
		case 'cta':
			return (
				<div style={{position: 'absolute', left: 60, right: 60, top: 420, textAlign: 'center', ...entra(ANI, p)}}>
					{roteiro.logo && <Img src={staticFile(roteiro.logo)} style={{width: 640, marginBottom: 30}} />}
					<div style={{fontFamily: F_TXT, fontWeight: 700, fontSize: 48, letterSpacing: 6, color: C.texto, opacity: 0.85}}>{c.titulo ?? 'COMENTA'}</div>
					<div style={{fontFamily: F_TIT, fontWeight: 900, fontSize: Math.min(200, 1200 / Math.max(1, (c.palavra ?? 'EU QUERO').length)), lineHeight: 1.05, color: C.dest,
						textShadow: `0 0 60px ${C.dest}55`, transform: `scale(${1 + 0.03 * Math.sin(t * 5)})`}}>{c.palavra ?? 'EU QUERO'}</div>
					<Sub x={c.sub} />
					{roteiro.assinatura?.handles && <div style={{fontFamily: F_TXT, fontWeight: 800, fontSize: 40, color: C.texto, marginTop: 60}}>{roteiro.assinatura.handles}</div>}
				</div>
			);
		default:
			return null;
	}
};

// ---------- legenda palavra por palavra ----------
const agrupar = (palavras: Palavra[], max: number) => {
	const frases: Palavra[][] = [];
	for (const w of palavras) {
		const cur = frases[frases.length - 1];
		const last = cur?.[cur.length - 1];
		if (!cur || /[.,?!:]$/.test(last.w) || cur.length >= max || w.s - last.e > 0.45) frases.push([w]);
		else cur.push(w);
	}
	return frases;
};

const Legenda: React.FC<{t: number; th: Tema; frases: Palavra[][]; destaques: Set<string>}> = ({t, th: {C, LEG, F_TIT, F_TXT, SOMBRA}, frases, destaques}) => {
	const i = frases.findIndex((f, k) => t >= f[0].s - 0.08 && t < (frases[k + 1]?.[0].s ?? f[f.length - 1].e + 0.6) - 0.04);
	if (i < 0) return null;
	return (
		<div style={{position: 'absolute', left: 70, right: 70, top: LEG.posicao * 1920, textAlign: 'center', lineHeight: 1.18}}>
			{frases[i].map((w, k) => {
				const q = pr(t, w.s - 0.06, 0.25);
				const hi = destaques.has(norm(w.w));
				return (
					<span key={k} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', margin: '0 9px', paddingBottom: 6, opacity: t < w.s - 0.06 ? 0 : 1}}>
						<span style={{display: 'inline-block', transform: `translateY(${(1 - q) * 105}%)`, fontFamily: hi && LEG.destaqueItalico ? F_TIT : F_TXT,
							fontStyle: hi && LEG.destaqueItalico ? 'italic' : 'normal', fontWeight: 800, fontSize: hi ? LEG.tamanho * 1.1 : LEG.tamanho,
							color: hi ? C.dest : C.texto, textShadow: SOMBRA.legenda}}>{LEG.caixaAlta ? w.w.toUpperCase() : w.w}</span>
					</span>
				);
			})}
		</div>
	);
};

// ---------- assinatura (foto redonda + @) ----------
const Assinatura: React.FC<{t: number; tipo?: string; th: Tema; roteiro: Props['roteiro']; desde: number}> = ({t, tipo, th: {C, F_TXT}, roteiro, desde}) => {
	const a = roteiro.assinatura;
	if (!a || tipo === 'foto' || tipo === 'cta') return null;
	return (
		<div style={{position: 'absolute', left: 60, top: 1690, display: 'flex', alignItems: 'center', gap: 22, opacity: pr(t, desde, 0.6)}}>
			{a.foto && (
				<div style={{width: 150, height: 150, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${C.dest}`, flexShrink: 0}}>
					<Img src={staticFile(a.foto)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: a.posicaoRosto ?? '50% 25%', transform: `scale(${a.zoomRosto ?? 1.6})`, transformOrigin: a.posicaoRosto ?? '50% 25%'}} />
				</div>
			)}
			<div style={{fontFamily: F_TXT, color: C.texto}}>
				{a.nome && <div style={{fontWeight: 800, fontSize: 34}}>{a.nome}</div>}
				{a.handles && <div style={{fontSize: 28, color: C.dest, fontWeight: 700}}>{a.handles}</div>}
				{a.marca && <div style={{fontSize: 23, opacity: 0.6}}>{a.marca}</div>}
			</div>
		</div>
	);
};

// ---------- montagem ----------
export const Reels: React.FC<Props> = ({roteiro, estilo, palavras, timeline, audio}) => {
	const t = useCurrentFrame() / FPS;
	const th = useMemo(() => tema(estilo), [estilo]);
	const frases = useMemo(() => agrupar(palavras, th.LEG.palavrasPorVez), [palavras, th]);
	const destaques = useMemo(() => new Set((roteiro.destaques ?? []).map((s) => norm(s))), [roteiro]);
	const cenas = roteiro.cenas;
	let atual = 0;
	timeline.cenas.forEach((c, i) => { if (t >= c.s - 0.05) atual = i; });
	const fim = timeline.fim;
	return (
		<AbsoluteFill style={{background: th.C.fundo, overflow: 'hidden'}}>
			<Fundo t={t} th={th} />
			{audio && <Audio src={staticFile(audio)} />}
			{cenas.map((c, i) => {
				const s = timeline.cenas[i]?.s ?? 0, e = timeline.cenas[i + 1]?.s ?? fim + 1.2;
				if (t < s - 0.05 || t > e + 0.05) return null;
				const sai = i < cenas.length - 1 ? pr(t, e - 0.28, 0.28) : 0;
				return (
					<AbsoluteFill key={i} style={{opacity: 1 - sai, filter: sai > 0 ? `blur(${sai * 10}px)` : undefined}}>
						<CenaView c={c} s={s} e={e} t={t} th={th} roteiro={roteiro} />
					</AbsoluteFill>
				);
			})}
			{th.ANI.flashCor && timeline.cenas.slice(1).map((c, i) => {
				const f = interpolate(t, [c.s - 0.05, c.s + 0.02, c.s + 0.16], [0, 0.85, 0], CL);
				return f > 0 ? <AbsoluteFill key={i} style={{background: th.C.dest, opacity: f}} /> : null;
			})}
			{cenas[atual]?.tipo !== 'cta' && <Legenda t={t} th={th} frases={frases} destaques={destaques} />}
			<Assinatura t={t} tipo={cenas[atual]?.tipo} th={th} roteiro={roteiro} desde={timeline.cenas[0]?.e ?? 0} />
			<AbsoluteFill style={{background: '#000', opacity: interpolate(t, [0, 0.35, fim + 0.7, fim + 1.2], [1, 0, 0, 1], CL)}} />
		</AbsoluteFill>
	);
};
