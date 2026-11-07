// Validação do roteiro.json
export const TIPOS = ['titulo', 'card', 'numero', 'chat', 'foto', 'cta'];

export const validarRoteiro = (r) => {
	const erros = [];
	if (!r || !Array.isArray(r.cenas) || r.cenas.length === 0) return ['o roteiro precisa de uma lista "cenas" com pelo menos uma cena'];
	r.cenas.forEach((c, i) => {
		const n = `cena ${i + 1}`;
		if (!TIPOS.includes(c.tipo)) erros.push(`${n}: tipo "${c.tipo}" não existe. Use: ${TIPOS.join(', ')}`);
		if (!c.fala || !String(c.fala).trim()) erros.push(`${n}: falta a "fala" (o que a voz diz nessa cena)`);
		if (c.tipo === 'numero' && typeof c.valor !== 'number') erros.push(`${n}: cena "numero" precisa de "valor" numérico`);
		if (c.tipo === 'chat' && !Array.isArray(c.msgs)) erros.push(`${n}: cena "chat" precisa de "msgs"`);
		if (c.tipo === 'card' && c.itens && !Array.isArray(c.itens)) erros.push(`${n}: "itens" tem que ser uma lista`);
	});
	return erros;
};
