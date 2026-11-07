export type Mensagem = {de: 'cliente' | 'ia' | string; txt: string};

export type Cena = {
	tipo: 'titulo' | 'card' | 'numero' | 'chat' | 'foto' | 'cta';
	fala: string;
	titulo?: string;
	sub?: string;
	kicker?: string;
	icone?: string;
	itens?: string[];
	valor?: number;
	prefixo?: string;
	sufixo?: string;
	rotulo?: string;
	barra?: number;
	msgs?: Mensagem[];
	palavra?: string;
	imagem?: string;
	posicaoImagem?: string;
};

export type Roteiro = {
	slug?: string;
	estilo?: string;
	destaques?: string[];
	logo?: string;
	assinatura?: {foto?: string; nome?: string; handles?: string; marca?: string; posicaoRosto?: string; zoomRosto?: number};
	cenas: Cena[];
};

export type Estilo = {
	nome: string;
	fundo: string;
	fundo2?: string;
	texto: string;
	destaque: string;
	card?: string;
	linha?: string;
	fonteTitulo: string;
	fonteTexto: string;
	fonteMono?: string;
	tituloCaixaAlta?: boolean;
	legenda?: {posicao?: number; tamanho?: number; palavrasPorVez?: number; caixaAlta?: boolean; destaqueItalico?: boolean};
	animacao?: {entrada?: 'sobe' | 'zoom' | 'pop'; grade?: boolean; particulas?: boolean; flashCor?: boolean};
};

export type Palavra = {w: string; s: number; e: number};

export type Props = {
	roteiro: Roteiro;
	estilo: Estilo;
	palavras: Palavra[];
	timeline: {cenas: {s: number; e: number}[]; fim: number};
	audio?: string | null;
};
