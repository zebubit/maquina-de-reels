import {loadFont as inter} from '@remotion/google-fonts/Inter';
import {loadFont as playfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as spaceGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as jetbrains} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as anton} from '@remotion/google-fonts/Anton';
import {loadFont as montserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as sora} from '@remotion/google-fonts/Sora';
import {loadFont as bebas} from '@remotion/google-fonts/BebasNeue';
import {loadFont as dmSans} from '@remotion/google-fonts/DMSans';
import {loadFont as poppins} from '@remotion/google-fonts/Poppins';
import {loadFont as spaceMono} from '@remotion/google-fonts/SpaceMono';

// Para adicionar uma fonte: importe do @remotion/google-fonts e coloque aqui.
// O nome da chave é o que vai no estilo (fonteTitulo, fonteTexto, fonteMono).
export const FONTES: Record<string, () => string> = {
	'Inter': () => inter().fontFamily,
	'Playfair Display': () => playfair().fontFamily,
	'Space Grotesk': () => spaceGrotesk().fontFamily,
	'JetBrains Mono': () => jetbrains().fontFamily,
	'Anton': () => anton().fontFamily,
	'Montserrat': () => montserrat().fontFamily,
	'Sora': () => sora().fontFamily,
	'Bebas Neue': () => bebas().fontFamily,
	'DM Sans': () => dmSans().fontFamily,
	'Poppins': () => poppins().fontFamily,
	'Space Mono': () => spaceMono().fontFamily,
};

const cache: Record<string, string> = {};
export const carregarFonte = (nome: string): string => {
	const chave = FONTES[nome] ? nome : 'Inter';
	return (cache[chave] ??= FONTES[chave]());
};
