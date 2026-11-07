// Alinha o texto ORIGINAL do roteiro (com acento, número, sigla) aos tempos que a voz ou o Whisper deram.

export const normalizar = (s) =>
	s.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');

// maior subsequência comum entre duas listas de palavras normalizadas
const lcs = (a, b) => {
	const n = a.length, m = b.length;
	const dp = Array.from({length: n + 1}, () => new Uint16Array(m + 1));
	for (let i = n - 1; i >= 0; i--)
		for (let j = m - 1; j >= 0; j--)
			dp[i][j] = a[i] && a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
	const pares = [];
	let i = 0, j = 0;
	while (i < n && j < m) {
		if (a[i] && a[i] === b[j]) { pares.push([i, j]); i++; j++; }
		else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
		else j++;
	}
	return pares;
};

/**
 * cenas: [{fala}] do roteiro. ouvidas: [{w, s, e}] com tempo em segundos.
 * Retorna {palavras: [{w,s,e}], timeline: {cenas: [{s,e}], fim}, alinhadas, total}.
 */
export const alinhar = (cenas, ouvidas) => {
	const toks = [], cenaDe = [];
	cenas.forEach((c, i) => c.fala.split(/\s+/).filter(Boolean).forEach((w) => { toks.push(w); cenaDe.push(i); }));
	const tempo = new Array(toks.length).fill(null);
	const pares = lcs(toks.map(normalizar), ouvidas.map((w) => normalizar(w.w)));
	for (const [a, b] of pares) tempo[a] = [ouvidas[b].s, ouvidas[b].e];
	const fim = ouvidas.length ? ouvidas[ouvidas.length - 1].e : Math.max(1, toks.length * 0.4);
	// palavras que não bateram (número escrito diferente, sigla) dividem o intervalo vizinho
	for (let k = 0; k < toks.length; ) {
		if (tempo[k]) { k++; continue; }
		let j = k;
		while (j < toks.length && !tempo[j]) j++;
		const ini = k > 0 ? tempo[k - 1][1] : 0;
		const fi = j < toks.length ? tempo[j][0] : fim;
		const passo = Math.max(0.05, (fi - ini) / (j - k));
		for (let m = k; m < j; m++) tempo[m] = [round(ini + (m - k) * passo), round(ini + (m - k + 1) * passo)];
		k = j;
	}
	const palavras = toks.map((w, i) => ({w, s: tempo[i][0], e: tempo[i][1]}));
	const inicios = cenas.map((_, i) => {
		if (i === 0) return 0;
		const idx = cenaDe.indexOf(i);
		return idx < 0 ? fim : round(Math.max(0, palavras[idx].s - 0.12));
	});
	const timeline = {cenas: inicios.map((s, i) => ({s, e: inicios[i + 1] ?? round(fim)})), fim: round(fim)};
	return {palavras, timeline, alinhadas: pares.length, total: toks.length};
};

const round = (x) => Math.round(x * 100) / 100;
