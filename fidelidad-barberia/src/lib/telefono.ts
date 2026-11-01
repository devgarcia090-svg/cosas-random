/** Deja solo dígitos y pone el 34 a los móviles españoles de 9 cifras.
 *  Devuelve null si no parece un teléfono. */
export function normalizarTelefono(texto: string): string | null {
  let t = texto.replace(/\D/g, '').replace(/^00/, '');
  if (t.length === 9) t = `34${t}`;
  return /^[0-9]{9,15}$/.test(t) ? t : null;
}

export function formatearTelefono(t: string): string {
  return t.startsWith('34') && t.length === 11
    ? `${t.slice(2, 5)} ${t.slice(5, 8)} ${t.slice(8)}`
    : `+${t}`;
}
