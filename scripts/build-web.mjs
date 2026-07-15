/*
 * build-web.mjs — Copia los archivos de la web (app estática) a www/,
 * que es la carpeta que Capacitor empaqueta dentro del APK.
 * Así la misma app funciona como web y como APK sin duplicar código.
 */
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const OUT = 'www';
const ASSETS = ['index.html', 'css', 'js'];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const asset of ASSETS) {
  if (existsSync(asset)) {
    await cp(asset, `${OUT}/${asset}`, { recursive: true });
    console.log(`copiado: ${asset} → ${OUT}/${asset}`);
  }
}
console.log('Web preparada en', OUT);
