/* =====================================================================
   AquaLadra — configuración
   Todo lo que puede cambiar con el tiempo está aquí, en un solo sitio.
   Si cambia el teléfono o la página de citas, se toca esto y nada más.
   ===================================================================== */
window.AQUALADRA = {
  /* Teléfono en formato internacional, sin espacios ni signos */
  telefono: "34684797236",

  /* Página de citas de Google Calendar ("Peluqueria Aqualadra").
     Para sacarla: Google Calendar > la programación de citas > Abrir
     página de reservas > copiar la URL. Debe acabar en ?gv=true      */
  reservasUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0TB3CkzzD2VCLoi9bWnkO8gGvxrkGcz_4IaJWLuuFp6F5DAzm7XakYus5sqdi9TlxDF5nrlKgm?gv=true",

  /* Altura del calendario incrustado, en píxeles */
  reservasAlto: 640,

  /* Mapa de la ubicación (Google Maps, incrustado) */
  mapaUrl: "https://www.google.com/maps?q=Calle%20Mayor%20Bajo%20Iz%20138%2C%2030006%20Puente%20Tocinos%2C%20Murcia&output=embed",

  /* Enlace a Google Maps para abrirlo fuera, sin incrustar nada */
  mapaEnlace: "https://www.google.com/maps/search/?api=1&query=Calle+Mayor+Bajo+Iz+138%2C+30006+Puente+Tocinos%2C+Murcia"
};
