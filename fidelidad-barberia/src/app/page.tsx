import { NEGOCIO } from '@/lib/config';
import { Cabecera } from './cabecera';
import { FormAlta } from './form-alta';

export default function Alta() {
  return (
    <>
      <Cabecera subtitulo="Tarjeta de fidelidad" />
      <section className="mb-8 rounded-2xl border border-dorado/40 bg-panel p-5 text-center">
        <p className="font-serif text-3xl text-dorado">{NEGOCIO.sellosPremio} cortes</p>
        <p className="mt-1 text-lg">= {NEGOCIO.premio}</p>
        <p className="mt-3 text-sm text-suave">
          Tu tarjeta va en la Wallet del móvil y se sella sola cada vez que vienes.
        </p>
      </section>
      <FormAlta />
    </>
  );
}
