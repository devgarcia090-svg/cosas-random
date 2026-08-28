// Carta de Podium Café & Grill.
// Para cambiar precios o platos, edita solo este fichero: la web se actualiza sola.
//
// Cada plato:  { n: nombre, d: descripción (opcional), p: [precios], a: [alérgenos] }
// Los códigos de alérgeno están definidos abajo en ALERGENOS.
//
// ⚠️  IMPORTANTE: los alérgenos están deducidos de los ingredientes habituales de
// cada plato, porque el PDF de la carta solo traía la leyenda, no el detalle plato
// a plato. HAY QUE REVISARLOS EN COCINA antes de darlos por buenos: la
// responsabilidad legal de esta información es del restaurante.

// Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011).
window.ALERGENOS = {
  gl: { nombre: 'Gluten', icono: '🌾' },
  cr: { nombre: 'Crustáceos', icono: '🦐' },
  hu: { nombre: 'Huevo', icono: '🥚' },
  pe: { nombre: 'Pescado', icono: '🐟' },
  ca: { nombre: 'Cacahuetes', icono: '🥜' },
  so: { nombre: 'Soja', icono: '🌱' },
  la: { nombre: 'Lácteos', icono: '🥛' },
  fc: { nombre: 'Frutos de cáscara', icono: '🌰' },
  ap: { nombre: 'Apio', icono: '🌿' },
  mo: { nombre: 'Mostaza', icono: '🌭' },
  se: { nombre: 'Sésamo', icono: '🫓' },
  su: { nombre: 'Sulfitos', icono: '🍷' },
  al: { nombre: 'Altramuces', icono: '🫘' },
  ml: { nombre: 'Moluscos', icono: '🦑' }
};

window.CARTA = [
  {
    id: 'sugerencias',
    nombre: 'Sugerencias',
    icono: '★',
    destacada: true,
    platos: [
      { n: 'Pulpo con cremoso de humo', p: [{ l: 'Unidad', v: 14.5 }], a: ['ml', 'la'] },
      { n: 'Queso de cabra frito con mermelada de tomate', p: [{ l: 'Unidad', v: 7.0 }], a: ['la', 'gl', 'hu'] },
      { n: 'Tartar de atún con helado de mango', p: [{ l: 'Unidad', v: 17.0 }], a: ['pe', 'la', 'so'] },
      { n: 'Almejas al ajillo con piñones', p: [{ l: 'Unidad', v: 17.5 }], a: ['ml', 'fc'] },
      { n: 'Lomo Rubia Gallega', d: 'Chuletón de rubia gallega a la brasa. Promoción con vino Pinna Fidelis', p: [{ l: 'Unidad', v: 59.0 }], a: [] },
      { n: 'Ensalada de burrata', p: [{ l: 'Unidad', v: 13.5 }], a: ['la'] },
      { n: 'Chuletón finlandés chocolate madurado', d: '65 € / kg', p: [{ l: 'Unidad', v: 65.0 }], a: [] }
    ]
  },
  {
    id: 'aperitivos',
    nombre: 'Aperitivos',
    icono: '🍢',
    platos: [
      { n: 'Bicicleta', p: [{ l: 'Unidad', v: 1.6 }], a: ['gl', 'hu', 'pe'] },
      { n: 'Marinera', p: [{ l: 'Unidad', v: 2.4 }], a: ['gl', 'hu', 'pe'] },
      { n: 'Marinero', p: [{ l: 'Unidad', v: 2.4 }], a: ['gl', 'hu', 'pe', 'su'] },
      { n: 'Caballito', p: [{ l: 'Unidad', v: 2.4 }], a: ['gl', 'hu', 'cr'] },
      { n: 'Tigre', p: [{ l: 'Unidad', v: 2.4 }], a: ['ml', 'gl', 'la', 'hu'] },
      { n: 'Zamburiña', p: [{ l: 'Unidad', v: 3.0 }], a: ['ml'] },
      { n: 'Rollito de salmón', p: [{ l: 'Unidad', v: 4.2 }], a: ['pe', 'la', 'gl'] },
      { n: 'Tapa de ensaladilla', p: [{ l: 'Unidad', v: 6.5 }], a: ['hu', 'pe'] },
      { n: 'Salchicha seca y queso', p: [{ l: 'Unidad', v: 7.0 }], a: ['la', 'su'] },
      { n: 'Mejillones', p: [{ l: 'Entera', v: 9.5 }, { l: 'Media', v: 6.0 }], a: ['ml'] },
      { n: 'Mojama y hueva', p: [{ l: 'Entera', v: 12.0 }, { l: 'Media', v: 6.0 }], a: ['pe'] },
      { n: 'Tabla de quesos', p: [{ l: 'Entera', v: 11.0 }, { l: 'Media', v: 7.0 }], a: ['la', 'fc'] },
      { n: 'Nachos con chili y guacamole', p: [{ l: 'Unidad', v: 11.0 }], a: ['la', 'ap'] },
      { n: 'Plato de jamón duroc', p: [{ l: 'Entera', v: 13.0 }, { l: 'Media', v: 7.5 }], a: [] },
      { n: 'Plato de jamón ibérico', p: [{ l: 'Entera', v: 17.0 }, { l: 'Media', v: 9.0 }], a: [] },
      { n: 'Plato de ibéricos', d: 'Surtido de ibéricos', p: [{ l: 'Unidad', v: 15.0 }], a: ['la', 'su'] },
      { n: 'Gambas al ajillo', p: [{ l: 'Unidad', v: 13.5 }], a: ['cr'] },
      { n: 'Gamba roja a la plancha', d: 'Docena', p: [{ l: 'Entera', v: 20.0 }, { l: 'Media', v: 10.0 }], a: ['cr'] },
      { n: 'Almejas al ajillo con piñones', p: [{ l: 'Unidad', v: 17.5 }], a: ['ml', 'fc'] },
      { n: 'Sepia a la plancha', p: [{ l: 'Unidad', v: 14.0 }], a: ['ml'] },
      { n: 'Calamar nacional a la andaluza', p: [{ l: 'Entera', v: 18.0 }, { l: 'Media', v: 10.5 }], a: ['ml', 'gl'] },
      { n: 'Calamar nacional a la plancha', p: [{ l: 'Unidad', v: 18.0 }], a: ['ml'] },
      { n: 'Pulpo rockero a la brasa', p: [{ l: 'Entera', v: 19.0 }, { l: 'Media', v: 10.5 }], a: ['ml'] },
      { n: 'Pulpo con cremoso de humo', p: [{ l: 'Unidad', v: 14.5 }], a: ['ml', 'la'] }
    ]
  },
  {
    id: 'entrantes',
    nombre: 'Entrantes',
    icono: '🥘',
    platos: [
      { n: 'Croqueta casera de jamón', p: [{ l: 'Unidad', v: 2.3 }], a: ['gl', 'la', 'hu'] },
      { n: 'Croqueta casera de queso de cabra y cebolla caramelizada', p: [{ l: 'Unidad', v: 2.3 }], a: ['gl', 'la', 'hu', 'su'] },
      { n: 'Croqueta casera de carrillera', p: [{ l: 'Unidad', v: 2.3 }], a: ['gl', 'la', 'hu', 'su'] },
      { n: 'Croqueta casera de boletus', p: [{ l: 'Unidad', v: 2.3 }], a: ['gl', 'la', 'hu'] },
      { n: 'Croqueta casera de pulpo', p: [{ l: 'Unidad', v: 2.5 }], a: ['gl', 'la', 'hu', 'ml'] },
      { n: 'Croqueta de gamba roja', p: [{ l: 'Unidad', v: 2.5 }], a: ['gl', 'la', 'hu', 'cr'] },
      { n: 'Patatas asadas con ajo', p: [{ l: 'Unidad', v: 0.8 }], a: [] },
      { n: 'Patatas a lo pobre', p: [{ l: 'Unidad', v: 5.8 }], a: [] },
      { n: 'Patatas al ajo cabañil', p: [{ l: 'Unidad', v: 6.8 }], a: [] },
      { n: 'Patatas bravas', p: [{ l: 'Entera', v: 9.0 }, { l: 'Media', v: 6.0 }], a: ['gl'] },
      { n: 'Patatas rancheras', d: 'Con pollo o bacon', p: [{ l: 'Unidad', v: 9.7 }], a: ['la', 'gl'] },
      { n: 'Alcachofa confitada', d: 'Con sopa de parmesano y lascas de jamón', p: [{ l: 'Unidad', v: 5.5 }], a: ['la'] },
      { n: 'Alcachofa con cremoso de foie', p: [{ l: 'Unidad', v: 7.0 }], a: ['la', 'su'] },
      { n: 'Verduras a la brasa', p: [{ l: 'Entera', v: 11.5 }, { l: 'Media', v: 6.5 }], a: [] },
      { n: 'Berenjenas con miel', p: [{ l: 'Entera', v: 12.5 }, { l: 'Media', v: 8.0 }], a: ['gl', 'hu'] },
      { n: 'Huevos rotos con jamón', p: [{ l: 'Unidad', v: 13.5 }], a: ['hu'] },
      { n: 'Tartar de atún con helado de mango', p: [{ l: 'Unidad', v: 17.0 }], a: ['pe', 'la', 'so'] }
    ]
  },
  {
    id: 'ensaladas',
    nombre: 'Ensaladas',
    icono: '🥗',
    platos: [
      { n: 'Mediterránea', d: 'Lechuga, tomate, pepino, atún, huevo duro y olivas', p: [{ l: 'Entera', v: 12.5 }, { l: 'Media', v: 7.5 }], a: ['pe', 'hu', 'su'] },
      { n: 'Fit', d: 'Lechuga, tomate, atún, huevo duro, queso y pollo', p: [{ l: 'Entera', v: 13.5 }, { l: 'Media', v: 8.5 }], a: ['pe', 'hu', 'la'] },
      { n: 'Ensalada Leonor mango', d: 'Lechuga, gambas, mango, queso y helado de mango', p: [{ l: 'Entera', v: 15.0 }, { l: 'Media', v: 10.0 }], a: ['cr', 'la'] },
      { n: 'Ensalada de burrata', p: [{ l: 'Unidad', v: 13.5 }], a: ['la'] },
      { n: 'Tomate partido con olivas', p: [{ l: 'Unidad', v: 6.0 }], a: ['su'] },
      { n: 'Tomate partido con bonito', p: [{ l: 'Entera', v: 13.0 }, { l: 'Media', v: 8.0 }], a: ['pe'] },
      { n: 'Tomate con ventresca', p: [{ l: 'Unidad', v: 10.5 }], a: ['pe'] }
    ]
  },
  {
    id: 'carnes',
    nombre: 'Carnes a la brasa',
    icono: '🔥',
    destacada: true,
    platos: [
      { n: 'Pollo a la brasa (ración)', p: [{ l: 'Unidad', v: 9.0 }], a: [] },
      { n: 'Pollo a la brasa', p: [{ l: 'Entera', v: 17.5 }, { l: 'Media', v: 10.0 }], a: [] },
      { n: 'Combinado de pechuga o lomo con huevo', p: [{ l: 'Unidad', v: 11.0 }], a: ['hu'] },
      { n: 'Ración de cordero', p: [{ l: 'Unidad', v: 16.0 }], a: [] },
      { n: 'Medio kilo de cordero', p: [{ l: 'Unidad', v: 24.0 }], a: [] },
      { n: 'Kilo de cordero', p: [{ l: 'Unidad', v: 44.0 }], a: [] },
      { n: 'Pierna de lechal al Hosper', d: 'Horneada a baja temperatura', p: [{ l: 'Unidad', v: 17.5 }], a: [] },
      { n: 'Rabo de toro', p: [{ l: 'Unidad', v: 14.0 }], a: ['su', 'ap'] },
      { n: 'Carrillera en salsa', p: [{ l: 'Unidad', v: 13.5 }], a: ['su', 'ap'] },
      { n: 'Solomillo de cerdo a la pimienta', p: [{ l: 'Unidad', v: 14.0 }], a: ['la', 'su'] },
      { n: 'Lagarto ibérico a la brasa', p: [{ l: 'Unidad', v: 19.5 }], a: [] },
      { n: 'Solomillo de ternera', p: [{ l: 'Unidad', v: 21.5 }], a: [] },
      { n: 'Entrecot de vaca madurada', p: [{ l: 'Unidad', v: 21.0 }], a: [] },
      { n: 'Entrecot de angus', p: [{ l: 'Unidad', v: 25.0 }], a: [] },
      { n: 'Chuletón de ternera', p: [{ l: 'Unidad', v: 34.0 }], a: [] },
      { n: 'Chuletón de vaca madurada', d: '41,50 € / kg', p: [{ l: 'Unidad', v: 41.5 }], a: [] },
      { n: 'Chuletón de angus', d: '42,00 € / kg', p: [{ l: 'Unidad', v: 42.0 }], a: [] },
      { n: 'Lomo Rubia Gallega', d: 'Chuletón de rubia gallega a la brasa. Promoción con vino Pinna Fidelis', p: [{ l: 'Unidad', v: 59.0 }], a: [] },
      { n: 'Lomo Finlandia Sashi', d: 'Chuletón de vaca de Finlandia, calidad nórdica a nivel mundial', p: [{ l: 'Unidad', v: 65.0 }], a: [] },
      { n: 'Chuletón finlandés chocolate madurado', d: '65 € / kg', p: [{ l: 'Unidad', v: 65.0 }], a: [] },
      { n: 'Parrillada de 4 carnes (2 personas)', d: 'Pollo, cerdo, cordero y ternera', p: [{ l: 'Unidad', v: 22.0 }], a: ['su'] },
      { n: 'Parrillada de 4 carnes (4 personas)', d: 'Pollo, cerdo, cordero y ternera', p: [{ l: 'Unidad', v: 40.0 }], a: ['su'] }
    ]
  },
  {
    id: 'pescados',
    nombre: 'Pescados',
    icono: '🐟',
    platos: [
      { n: 'Boquerones fritos', p: [{ l: 'Unidad', v: 10.0 }], a: ['pe', 'gl'] },
      { n: 'Emperador a la brasa con salsa verde', p: [{ l: 'Unidad', v: 12.0 }], a: ['pe'] },
      { n: 'Lubina a la brasa con salsa verde', p: [{ l: 'Unidad', v: 16.0 }], a: ['pe'] },
      { n: 'Dorada a la brasa con salsa verde', p: [{ l: 'Unidad', v: 16.0 }], a: ['pe'] },
      { n: 'Fritura de pescado (2 personas)', d: 'Calamar a la andaluza, boquerones, croquetas, gambas y emperador', p: [{ l: 'Unidad', v: 27.0 }], a: ['pe', 'gl', 'cr', 'ml', 'la', 'hu'] },
      { n: 'Parrillada de marisco (2 personas)', d: 'Calamar a la plancha, emperador, gamba roja, zamburiñas y mejillones', p: [{ l: 'Unidad', v: 37.0 }], a: ['ml', 'cr', 'pe'] }
    ]
  },
  {
    id: 'arroces',
    nombre: 'Arroces',
    icono: '🍚',
    nota: 'Precio por persona. Mínimo 2 personas. Se preparan por encargo.',
    platos: [
      { n: 'Arroz de pollo y costillejas', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 10.0 }], a: [] },
      { n: 'Arroz a banda', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 12.0 }], a: ['pe', 'ml', 'cr'] },
      { n: 'Arroz de marisco', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 14.5 }], a: ['cr', 'ml', 'pe'] },
      { n: 'Arroz de chuletón', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 19.5 }], a: [] }
    ]
  },
  {
    id: 'hamburguesas',
    nombre: 'Hamburguesas',
    icono: '🍔',
    destacada: true,
    platos: [
      { n: 'Crispy chicken', d: 'Pollo con rebozado crujiente, lechuga y tomate', p: [{ l: 'Unidad', v: 7.0 }], a: ['gl', 'hu', 'la', 'mo', 'se'] },
      { n: 'Clásica de angus 150 g', d: 'Lechuga, tomate y cebolla', p: [{ l: 'Unidad', v: 7.5 }], a: ['gl', 'se', 'mo'] },
      { n: 'Completa de angus 150 g', d: 'Lechuga, tomate, cebolla, huevo, bacon y queso', p: [{ l: 'Unidad', v: 11.0 }], a: ['gl', 'hu', 'la', 'se', 'mo'] },
      { n: 'Podium madurada 200 g', d: 'Ternera madurada, queso cheddar, bacon y salsa burger', p: [{ l: 'Unidad', v: 13.0 }], a: ['gl', 'la', 'hu', 'se', 'mo', 'su'] },
      { n: 'Smash Podium 200 g', d: 'Ternera, cebolla frita, tomate deshidratado, queso, salsa cheddar y bacon', p: [{ l: 'Unidad', v: 14.5 }], a: ['gl', 'la', 'hu', 'se', 'mo', 'su'] }
    ]
  },
  {
    id: 'picar',
    nombre: 'Para picar',
    icono: '🍟',
    platos: [
      { n: 'Nuggets (6 uds.)', p: [{ l: 'Unidad', v: 5.0 }], a: ['gl', 'hu', 'la'] },
      { n: 'Bolitas de pollo (12 uds.)', p: [{ l: 'Unidad', v: 5.5 }], a: ['gl', 'hu', 'la'] },
      { n: 'Queso de cabra frito con mermelada de tomate', p: [{ l: 'Unidad', v: 7.0 }], a: ['la', 'gl', 'hu'] },
      { n: 'Salchicha seca, queso y almendras', p: [{ l: 'Unidad', v: 7.0 }], a: ['la', 'fc', 'su'] }
    ]
  },
  {
    id: 'montaditos',
    nombre: 'Montaditos',
    icono: '🥖',
    platos: [
      { n: 'Lomo', p: [{ l: 'Unidad', v: 2.9 }], a: ['gl'] },
      { n: 'Pechuga de pollo', p: [{ l: 'Unidad', v: 2.9 }], a: ['gl'] },
      { n: 'Longaniza', p: [{ l: 'Unidad', v: 2.9 }], a: ['gl', 'su'] },
      { n: 'Sobrasada y queso', p: [{ l: 'Unidad', v: 2.9 }], a: ['gl', 'la', 'su'] },
      { n: 'Salchicha', p: [{ l: 'Unidad', v: 2.9 }], a: ['gl', 'su'] },
      { n: 'Podium', d: 'Lomo, tomate, queso cheddar, bacon y salsa barbacoa', p: [{ l: 'Unidad', v: 4.0 }], a: ['gl', 'la', 'mo', 'su'] },
      { n: 'Ternera', p: [{ l: 'Unidad', v: 4.0 }], a: ['gl'] },
      { n: 'Ternera con foie', p: [{ l: 'Unidad', v: 5.8 }], a: ['gl', 'la', 'su'] }
    ]
  },
  {
    id: 'postres',
    nombre: 'Postres',
    icono: '🍰',
    platos: [
      { n: 'Arroz con leche', d: 'Casero', p: [{ l: 'Unidad', v: 4.0 }], a: ['la'] },
      { n: 'Tortitas', d: 'Nutella y nata. Casero', p: [{ l: 'Unidad', v: 4.5 }], a: ['gl', 'hu', 'la', 'fc', 'so'] },
      { n: 'Coulant de chocolate', d: 'Chocolate caliente. Casero', p: [{ l: 'Unidad', v: 4.5 }], a: ['gl', 'hu', 'la', 'so'] },
      { n: 'Tarta de queso', p: [{ l: 'Unidad', v: 4.5 }], a: ['gl', 'hu', 'la'] },
      { n: 'Tarta del abuelo', p: [{ l: 'Unidad', v: 4.5 }], a: ['gl', 'hu', 'la', 'fc'] },
      { n: 'Tarta de la abuela', p: [{ l: 'Unidad', v: 4.5 }], a: ['gl', 'hu', 'la', 'fc'] },
      { n: 'Pan de Calatrava', p: [{ l: 'Unidad', v: 4.5 }], a: ['gl', 'hu', 'la'] },
      { n: 'Crepes', d: 'Nutella y nata. Casero', p: [{ l: 'Unidad', v: 5.0 }], a: ['gl', 'hu', 'la', 'fc', 'so'] },
      { n: 'Gofre', d: 'Chocolate o Nutella y nata. Casero', p: [{ l: 'Unidad', v: 5.0 }], a: ['gl', 'hu', 'la', 'fc', 'so'] },
      { n: 'Coulant de chocolate con helado', d: 'Chocolate caliente y helado de vainilla. Casero', p: [{ l: 'Unidad', v: 5.5 }], a: ['gl', 'hu', 'la', 'so'] },
      { n: 'Gofre a la taza', d: 'Chocolate, nata y polvo de galleta Oreo. Casero', p: [{ l: 'Unidad', v: 6.0 }], a: ['gl', 'hu', 'la', 'so'] },
      { n: 'Tortitas con helado', d: 'Nutella y helado a elegir. Casero', p: [{ l: 'Unidad', v: 6.0 }], a: ['gl', 'hu', 'la', 'fc', 'so'] },
      { n: 'Tarta de whisky', p: [{ l: 'Unidad', v: 6.0 }], a: ['gl', 'hu', 'la', 'su'] },
      { n: 'Crepes con helado', d: 'Nutella, nata y helado a elegir. Casero', p: [{ l: 'Unidad', v: 6.5 }], a: ['gl', 'hu', 'la', 'fc', 'so'] },
      { n: 'Gofre con helado', d: 'Chocolate o Nutella y bola de helado a elegir. Casero', p: [{ l: 'Unidad', v: 6.5 }], a: ['gl', 'hu', 'la', 'fc', 'so'] },
      { n: 'Leche frita con helado de turrón', d: 'Casero', p: [{ l: 'Unidad', v: 6.5 }], a: ['gl', 'hu', 'la', 'fc'] },
      { n: 'Tarta de pistacho helada', p: [{ l: 'Unidad', v: 6.5 }], a: ['gl', 'hu', 'la', 'fc'] },
      { n: 'Tarta de queso al horno', d: 'Casero', p: [{ l: 'Unidad', v: 7.0 }], a: ['gl', 'hu', 'la'] }
    ]
  },
  {
    id: 'cervezas',
    nombre: 'Cervezas',
    icono: '🍺',
    platos: [
      { n: 'Estrella de Levante', d: 'Lager de maduración lenta, refrescante y con sabor. 4,80 % vol.', p: [{ l: '33 cl', v: 2.6 }, { l: 'Copa', v: 3.5 }, { l: 'Jarra', v: 10.5 }], a: ['gl'] },
      { n: 'Estrella de Levante 0,0', d: 'Fresca y con amargor equilibrado, sin alcohol. 0,00 % vol.', p: [{ l: '33 cl', v: 2.5 }], a: ['gl'] },
      { n: 'Estrella de Levante 0,0 Tostada', d: 'Malta pilsen con maltas caramelo y torrefactas. 0,00 % vol.', p: [{ l: '33 cl', v: 2.9 }], a: ['gl'] },
      { n: 'Punta Este', d: 'Lager elegante, con cuerpo, de cebada malteada en Murcia. 5,40 % vol.', p: [{ l: 'Copa', v: 3.5 }, { l: 'Jarra', v: 10.0 }], a: ['gl'] },
      { n: 'Verna', d: 'Clara con limones Verna y Primofiori de la Vega del Segura. 3,20 % vol.', p: [{ l: '33 cl', v: 3.1 }], a: ['gl'] },
      { n: 'Voll-Damm', d: 'Doble malta: más aroma, más sabor y más cuerpo. 7,20 % vol.', p: [{ l: '33 cl', v: 3.2 }], a: ['gl'] },
      { n: 'Estrella de Levante Reserva 60', d: 'Lager especial con lúpulo nugget de Caravaca de la Cruz. 6,30 % vol.', p: [{ l: '33 cl', v: 3.2 }], a: ['gl'] }
    ]
  }
];

// Menú del día (se muestra aparte, en portada y en la carta)
window.MENU_DIARIO = {
  precio: 11.0,
  incluye: 'Incluye 1 bebida y postre o café',
  primeros: [
    'Gazpacho',
    'Gazpacho de hortalizas de la huerta',
    'Ensalada mediterránea',
    'Ensalada de verduras de la huerta'
  ],
  segundos: ['Arroz con costillejas', 'Combinado de pechugas'],
  postres: ['Arroz con leche']
};
