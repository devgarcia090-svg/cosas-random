const eur = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export function formatCents(cents: number): string {
  return eur.format(cents / 100);
}
