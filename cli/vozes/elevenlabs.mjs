// Voz ElevenLabs (paga, inclusive a sua voz clonada). Precisa da variável ELEVENLABS_API_KEY.
import fs from 'node:fs';
import path from 'node:path';

export const falar = async ({texto, pasta, voz = {}}) => {
	const chave = process.env.ELEVENLABS_API_KEY;
	if (!chave) throw new Error('defina a variável ELEVENLABS_API_KEY com a sua chave da ElevenLabs');
	if (!voz.id) throw new Error('no roteiro, coloque "voz": {"provedor": "elevenlabs", "id": "<voice_id>"}');
	const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz.id}/with-timestamps`, {
		method: 'POST',
		headers: {'xi-api-key': chave, 'Content-Type': 'application/json'},
		body: JSON.stringify({
			text: texto,
			model_id: voz.modelo ?? 'eleven_multilingual_v2',
			voice_settings: {stability: voz.estabilidade ?? 0.7, similarity_boost: voz.similaridade ?? 0.75, style: 0},
		}),
	});
	if (!r.ok) throw new Error(`ElevenLabs respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
	const j = await r.json();
	const audio = path.join(pasta, 'narracao.mp3');
	fs.writeFileSync(audio, Buffer.from(j.audio_base64, 'base64'));
	return {audio, ouvidas: palavrasDosCaracteres(j.alignment)};
};

// a ElevenLabs devolve o tempo de cada letra; aqui juntamos as letras em palavras
export const palavrasDosCaracteres = (al) => {
	const out = [];
	let atual = null;
	al.characters.forEach((ch, i) => {
		if (/\s/.test(ch)) { atual = null; return; }
		if (!atual) { atual = {w: '', s: al.character_start_times_seconds[i], e: 0}; out.push(atual); }
		atual.w += ch;
		atual.e = al.character_end_times_seconds[i];
	});
	return out;
};
