// Roda o ffmpeg que vem junto com o Remotion (ninguém precisa instalar outro).
// Chama o node direto em vez do npx, que se comporta diferente no Windows.
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {RAIZ} from './estilos.mjs';

const CLI = path.join(RAIZ, 'node_modules/@remotion/cli/remotion-cli.js');
export const ffmpeg = (args) => execFileSync(process.execPath, [CLI, 'ffmpeg', '-v', 'error', ...args], {cwd: RAIZ, stdio: 'inherit'});
