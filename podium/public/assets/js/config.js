// Datos del negocio y reglas de reserva.
// Este fichero lo usan tanto la web como el servidor de reservas, así que
// cambiar aquí un horario o el teléfono lo actualiza todo a la vez.

globalThis.PODIUM = {
  nombre: 'Podium Café & Grill',
  telefono: '629 89 18 06',
  telefonoE164: '+34629891806',
  whatsapp: '34629891806',
  direccion: 'Calle Atleta Antonio Peñalver',
  ciudad: 'Puente Tocinos, 30006 Murcia',
  mapaConsulta: 'Podium Cafe and Grill, Calle Atleta Antonio Peñalver, Murcia',
  instagram: 'https://www.instagram.com/podiumcafeandgrill/',
  facebook: 'https://www.facebook.com/podium.cafeteria/',

  // Horario de apertura. dia: 0 = domingo ... 6 = sábado.
  // Un cierre igual o anterior a la apertura se entiende como madrugada del día siguiente.
  horario: [
    { dia: 1, nombre: 'Lunes', cerrado: true, tramos: [] },
    { dia: 2, nombre: 'Martes', tramos: [['13:00', '17:00'], ['19:30', '00:00']] },
    { dia: 3, nombre: 'Miércoles', tramos: [['13:00', '17:00'], ['20:00', '00:00']] },
    { dia: 4, nombre: 'Jueves', tramos: [['13:00', '17:00'], ['19:30', '00:00']] },
    { dia: 5, nombre: 'Viernes', tramos: [['13:00', '01:00']] },
    { dia: 6, nombre: 'Sábado', tramos: [['13:00', '01:00']] },
    { dia: 0, nombre: 'Domingo', tramos: [['13:00', '18:00']] }
  ],

  reservas: {
    intervaloMinutos: 30,      // cada cuánto se ofrece un turno
    minutosAntesCierre: 90,    // última reserva admitida antes del cierre
    maxComensales: 20,         // por encima de esto, que llamen por teléfono
    diasVistaMaximos: 60,      // hasta cuántos días vista se puede reservar
    antelacionMinutos: 60,     // margen mínimo desde ahora
    plazasPorTurnoPorDefecto: 30
  }
};
