// Carta de Podium Café & Grill.
// Generada a partir del PDF oficial del local (carta-original.pdf), incluidos los
// alérgenos, que en el PDF venían como iconos de la tipografía "eicon".
//
// Cada plato:
//   n    nombre
//   d    descripción (opcional)
//   p    precios: [{ l: etiqueta, v: importe }]
//   a    alérgenos que CONTIENE
//   sin  alérgenos que el local declara que NO lleva
//   esp  vegetariano / vegano
//
// Un plato sin "a" ni "sin" es que en la carta original no venía declarado:
// la web lo muestra como "consulta al personal", nunca como libre de alérgenos.

// Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011).
window.ALERGENOS = {
  gluten:     { nombre: 'Gluten',             icono: '🌾' },
  trigo:      { nombre: 'Trigo',              icono: '🌾' },
  crustaceos: { nombre: 'Crustáceos',         icono: '🦐' },
  huevo:      { nombre: 'Huevo',              icono: '🥚' },
  pescado:    { nombre: 'Pescado',            icono: '🐟' },
  cacahuetes: { nombre: 'Cacahuetes',         icono: '🥜' },
  soja:       { nombre: 'Soja',               icono: '🌱' },
  leche:      { nombre: 'Lácteos',            icono: '🥛' },
  frutos:     { nombre: 'Frutos de cáscara',  icono: '🌰' },
  apio:       { nombre: 'Apio',               icono: '🌿' },
  mostaza:    { nombre: 'Mostaza',            icono: '🌭' },
  sesamo:     { nombre: 'Sésamo',             icono: '🫓' },
  sulfitos:   { nombre: 'Sulfitos',           icono: '🍷' },
  altramuces: { nombre: 'Altramuces',         icono: '🫘' },
  moluscos:   { nombre: 'Moluscos',           icono: '🦑' }
};

window.CARTA = [
  {
    id: 'sugerencias',
    nombre: 'Sugerencias',
    icono: '★',
    destacada: true,
    platos: [
      { n: 'Pulpo con cremoso de humo', p: [{ l: 'Unidad', v: 14.5 }], a: ['leche', 'moluscos'] },
      { n: 'Queso de cabra frito con mermelada de tomate', p: [{ l: 'Unidad', v: 7 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Tartar de atún con helado de mango', p: [{ l: 'Unidad', v: 17 }] },
      { n: 'Almejas al ajillo con piñones', p: [{ l: 'Unidad', v: 17.5 }], a: ['moluscos'] },
      { n: 'Lomo Rubia Gallega', d: 'Chuletón de rubia gallega a la brasa. Promoción con vino Pinna Fidelis', p: [{ l: 'Unidad', v: 59 }] },
      { n: 'Ensalada de burrata', p: [{ l: 'Unidad', v: 13.5 }], sin: ['trigo', 'gluten', 'huevo'] },
      { n: 'Chuletón finlandés chocolate madurado', d: '65 € / kg', p: [{ l: 'Unidad', v: 65 }] }
    ]
  },
  {
    id: 'aperitivos',
    nombre: 'Aperitivos',
    icono: '🍢',
    platos: [
      { n: 'Bicicleta', p: [{ l: 'Unidad', v: 1.6 }], a: ['trigo', 'gluten', 'leche', 'huevo', 'soja', 'sulfitos'] },
      { n: 'Marinera', p: [{ l: 'Unidad', v: 2.4 }], a: ['gluten', 'huevo', 'pescado', 'soja', 'sulfitos'] },
      { n: 'Marinero', p: [{ l: 'Unidad', v: 2.4 }], a: ['trigo', 'gluten', 'leche', 'huevo', 'pescado', 'soja', 'sulfitos'] },
      { n: 'Tapa de ensaladilla', p: [{ l: 'Unidad', v: 6.5 }], a: ['leche', 'huevo', 'pescado', 'soja', 'sulfitos'] },
      { n: 'Caballito', p: [{ l: 'Unidad', v: 2.4 }], a: ['trigo', 'gluten', 'crustaceos'] },
      { n: 'Zamburiña', p: [{ l: 'Unidad', v: 3 }], a: ['moluscos'] },
      { n: 'Tigre', p: [{ l: 'Unidad', v: 2.4 }], a: ['gluten', 'leche', 'huevo', 'moluscos'] },
      { n: 'Mejillones', p: [{ l: 'Entera', v: 9.5 }, { l: 'Media', v: 6 }], a: ['moluscos'] },
      { n: 'Calamar nacional a la andaluza', p: [{ l: 'Entera', v: 18 }, { l: 'Media', v: 10.5 }], a: ['gluten', 'moluscos'] },
      { n: 'Calamar nacional a la plancha', p: [{ l: 'Unidad', v: 18 }], a: ['moluscos', 'sulfitos'] },
      { n: 'Sepia a la plancha', p: [{ l: 'Unidad', v: 14 }], a: ['moluscos', 'sulfitos'] },
      { n: 'Pulpo rockero a la brasa', p: [{ l: 'Entera', v: 19 }, { l: 'Media', v: 10.5 }], a: ['moluscos'] },
      { n: 'Pulpo con cremoso de humo', p: [{ l: 'Unidad', v: 14.5 }], a: ['leche', 'moluscos'] },
      { n: 'Rollito de salmón', p: [{ l: 'Unidad', v: 4.2 }], a: ['huevo', 'crustaceos', 'pescado', 'soja', 'sulfitos'] },
      { n: 'Gambas al ajillo', p: [{ l: 'Unidad', v: 13.5 }], a: ['crustaceos'] },
      { n: 'Plato de jamón ibérico', p: [{ l: 'Entera', v: 17 }, { l: 'Media', v: 9 }] },
      { n: 'Plato de jamón duroc', p: [{ l: 'Entera', v: 13 }, { l: 'Media', v: 7.5 }], a: ['leche'] },
      { n: 'Tabla de quesos', p: [{ l: 'Entera', v: 11 }, { l: 'Media', v: 7 }], a: ['leche'] },
      { n: 'Nachos con chili y guacamole', p: [{ l: 'Unidad', v: 11 }], a: ['leche', 'huevo', 'apio', 'soja'] },
      { n: 'Salchicha seca y queso', p: [{ l: 'Unidad', v: 7 }] },
      { n: 'Plato de ibéricos', d: 'Surtido de ibéricos', p: [{ l: 'Unidad', v: 15 }] },
      { n: 'Gamba roja a la plancha', d: 'Docena', p: [{ l: 'Unidad', v: 20 }, { l: 'Media', v: 10 }], a: ['crustaceos'] },
      { n: 'Almejas al ajillo con piñones', p: [{ l: 'Unidad', v: 17.5 }], a: ['moluscos'] },
      { n: 'Mojama y hueva', p: [{ l: 'Entera', v: 12 }, { l: 'Media', v: 6 }], a: ['pescado'] }
    ]
  },
  {
    id: 'entrantes',
    nombre: 'Entrantes',
    icono: '🥘',
    platos: [
      { n: 'Huevos rotos con jamón', p: [{ l: 'Unidad', v: 13.5 }] },
      { n: 'Berenjenas con miel', p: [{ l: 'Entera', v: 12.5 }, { l: 'Media', v: 8 }], a: ['gluten', 'leche'] },
      { n: 'Alcachofa confitada', d: 'Con sopa de parmesano y lascas de jamón', p: [{ l: 'Unidad', v: 5.5 }], a: ['leche'] },
      { n: 'Verduras a la brasa', p: [{ l: 'Entera', v: 11.5 }, { l: 'Media', v: 6.5 }] },
      { n: 'Croqueta casera de jamón', p: [{ l: 'Unidad', v: 2.3 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Croqueta casera de queso de cabra y cebolla caramelizada', p: [{ l: 'Unidad', v: 2.3 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Croqueta casera de carrillera', p: [{ l: 'Unidad', v: 2.3 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Croqueta casera de boletus', p: [{ l: 'Unidad', v: 2.3 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Croqueta casera de pulpo', p: [{ l: 'Unidad', v: 2.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Patatas rancheras', d: 'Con pollo o bacon', p: [{ l: 'Unidad', v: 9.7 }], a: ['leche', 'sulfitos'] },
      { n: 'Patatas bravas', p: [{ l: 'Entera', v: 9 }, { l: 'Media', v: 6 }], a: ['leche'] },
      { n: 'Patatas asadas con ajo', p: [{ l: 'Unidad', v: 0.8 }], a: ['huevo'] },
      { n: 'Patatas a lo pobre', p: [{ l: 'Unidad', v: 5.8 }] },
      { n: 'Patatas al ajo cabañil', p: [{ l: 'Unidad', v: 6.8 }], a: ['sulfitos'] },
      { n: 'Croqueta de gamba roja', p: [{ l: 'Unidad', v: 2.5 }] },
      { n: 'Tartar de atún con helado de mango', p: [{ l: 'Unidad', v: 17 }] },
      { n: 'Alcachofa con cremoso de foie', p: [{ l: 'Unidad', v: 7 }] }
    ]
  },
  {
    id: 'ensaladas',
    nombre: 'Ensaladas',
    icono: '🥗',
    platos: [
      { n: 'Mediterránea', d: 'Lechuga, tomate, pepino, atún, huevo duro y olivas', p: [{ l: 'Entera', v: 12.5 }, { l: 'Media', v: 7.5 }], a: ['huevo', 'pescado', 'sulfitos'] },
      { n: 'Fit', d: 'Lechuga, tomate, atún, huevo duro, queso y pollo', p: [{ l: 'Entera', v: 13.5 }, { l: 'Media', v: 8.5 }], a: ['leche', 'huevo', 'pescado'] },
      { n: 'Ensalada Leonor mango', d: 'Lechuga, gambas, mango, queso y helado de mango', p: [{ l: 'Entera', v: 15 }, { l: 'Media', v: 10 }], a: ['leche', 'crustaceos'] },
      { n: 'Tomate partido con olivas', p: [{ l: 'Unidad', v: 6 }], a: ['sulfitos'] },
      { n: 'Tomate partido con bonito', p: [{ l: 'Entera', v: 13 }, { l: 'Media', v: 8 }], a: ['pescado', 'sulfitos'] },
      { n: 'Tomate con ventresca', p: [{ l: 'Unidad', v: 10.5 }], a: ['pescado'] },
      { n: 'Ensalada de burrata', p: [{ l: 'Unidad', v: 13.5 }], sin: ['trigo', 'gluten', 'huevo'] }
    ]
  },
  {
    id: 'carnes',
    nombre: 'Carnes a la brasa',
    icono: '🔥',
    destacada: true,
    platos: [
      { n: 'Pollo a la brasa (ración)', p: [{ l: 'Unidad', v: 9 }] },
      { n: 'Pollo a la brasa', p: [{ l: 'Entera', v: 17.5 }, { l: 'Media', v: 10 }] },
      { n: 'Chuletón de ternera', p: [{ l: 'Unidad', v: 34 }] },
      { n: 'Chuletón de angus', d: '42,00 € / kg', p: [{ l: 'Unidad', v: 42 }] },
      { n: 'Chuletón de vaca madurada', d: '41,50 € / kg', p: [{ l: 'Unidad', v: 41.5 }] },
      { n: 'Solomillo de ternera', p: [{ l: 'Unidad', v: 21.5 }] },
      { n: 'Entrecot de vaca madurada', p: [{ l: 'Unidad', v: 21 }] },
      { n: 'Kilo de cordero', p: [{ l: 'Unidad', v: 44 }] },
      { n: 'Medio kilo de cordero', p: [{ l: 'Unidad', v: 24 }] },
      { n: 'Lagarto ibérico a la brasa', p: [{ l: 'Unidad', v: 19.5 }] },
      { n: 'Ración de cordero', p: [{ l: 'Unidad', v: 16 }] },
      { n: 'Combinado de pechuga o lomo con huevo', p: [{ l: 'Unidad', v: 11 }], a: ['huevo'] },
      { n: 'Rabo de toro', p: [{ l: 'Unidad', v: 14 }] },
      { n: 'Carrillera en salsa', p: [{ l: 'Unidad', v: 13.5 }], a: ['gluten'] },
      { n: 'Parrillada de 4 carnes (4 personas)', d: 'Pollo, cerdo, cordero y ternera', p: [{ l: 'Unidad', v: 40 }] },
      { n: 'Parrillada de 4 carnes (2 personas)', d: 'Pollo, cerdo, cordero y ternera', p: [{ l: 'Unidad', v: 22 }] },
      { n: 'Solomillo de cerdo a la pimienta', p: [{ l: 'Unidad', v: 14 }] },
      { n: 'Pierna de lechal al Hosper', d: 'Horneada a baja temperatura', p: [{ l: 'Unidad', v: 17.5 }] },
      { n: 'Lomo Rubia Gallega', d: 'Chuletón de rubia gallega a la brasa. Promoción con vino Pinna Fidelis', p: [{ l: 'Unidad', v: 59 }] },
      { n: 'Lomo Finlandia Sashi', d: 'Chuletón de vaca de Finlandia, calidad nórdica a nivel mundial', p: [{ l: 'Unidad', v: 65 }] },
      { n: 'Entrecot de angus', p: [{ l: 'Unidad', v: 25 }] },
      { n: 'Chuletón finlandés chocolate madurado', d: '65 € / kg', p: [{ l: 'Unidad', v: 65 }] }
    ]
  },
  {
    id: 'pescados',
    nombre: 'Pescados',
    icono: '🐟',
    platos: [
      { n: 'Lubina a la brasa con salsa verde', p: [{ l: 'Unidad', v: 16 }], a: ['pescado'] },
      { n: 'Dorada a la brasa con salsa verde', p: [{ l: 'Unidad', v: 16 }], a: ['pescado'] },
      { n: 'Emperador a la brasa con salsa verde', p: [{ l: 'Unidad', v: 12 }], a: ['pescado'] },
      { n: 'Boquerones fritos', p: [{ l: 'Unidad', v: 10 }], a: ['gluten', 'pescado'] },
      { n: 'Fritura de pescado (2 personas)', d: 'Calamar a la andaluza, boquerones, croquetas, gambas y emperador', p: [{ l: 'Unidad', v: 27 }], a: ['leche', 'huevo', 'crustaceos', 'moluscos'] },
      { n: 'Parrillada de marisco (2 personas)', d: 'Calamar a la plancha, emperador, gamba roja, zamburiñas y mejillones', p: [{ l: 'Unidad', v: 37 }] }
    ]
  },
  {
    id: 'arroces',
    nombre: 'Arroces',
    icono: '🍚',
    nota: 'Precio por persona. Mínimo 2 personas. Se preparan por encargo.',
    platos: [
      { n: 'Arroz de marisco', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 14.5 }], a: ['crustaceos', 'pescado', 'moluscos'] },
      { n: 'Arroz a banda', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 12 }], a: ['crustaceos', 'pescado', 'moluscos'] },
      { n: 'Arroz de pollo y costillejas', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 10 }] },
      { n: 'Arroz de chuletón', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 19.5 }] }
    ]
  },
  {
    id: 'hamburguesas',
    nombre: 'Hamburguesas',
    icono: '🍔',
    destacada: true,
    platos: [
      { n: 'Clásica de angus 150 g', d: 'Lechuga, tomate y cebolla', p: [{ l: 'Unidad', v: 7.5 }], a: ['gluten', 'sulfitos'] },
      { n: 'Completa de angus 150 g', d: 'Lechuga, tomate, cebolla, huevo, bacon y queso', p: [{ l: 'Unidad', v: 11 }], a: ['gluten', 'leche', 'huevo', 'sulfitos'] },
      { n: 'Podium madurada 200 g', d: 'Ternera madurada, queso cheddar, bacon y salsa burger', p: [{ l: 'Unidad', v: 13 }], a: ['gluten', 'leche', 'huevo', 'sulfitos'] },
      { n: 'Smash Podium 200 g', d: 'Ternera, cebolla frita, tomate deshidratado, queso, salsa cheddar y bacon', p: [{ l: 'Unidad', v: 14.5 }], a: ['gluten', 'leche', 'huevo', 'sulfitos'] },
      { n: 'Crispy chicken', d: 'Pollo con rebozado crujiente, lechuga y tomate', p: [{ l: 'Unidad', v: 7 }], a: ['gluten', 'sesamo', 'apio'] }
    ]
  },
  {
    id: 'picar',
    nombre: 'Para picar',
    icono: '🍟',
    platos: [
      { n: 'Nuggets (6 uds.)', p: [{ l: 'Unidad', v: 5 }], a: ['gluten', 'huevo'] },
      { n: 'Bolitas de pollo (12 uds.)', p: [{ l: 'Unidad', v: 5.5 }], a: ['gluten', 'huevo'] },
      { n: 'Queso de cabra frito con mermelada de tomate', p: [{ l: 'Unidad', v: 7 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Salchicha seca, queso y almendras', p: [{ l: 'Unidad', v: 7 }], a: ['leche'] }
    ]
  },
  {
    id: 'montaditos',
    nombre: 'Montaditos',
    icono: '🥖',
    platos: [
      { n: 'Lomo', p: [{ l: 'Unidad', v: 2.9 }], a: ['gluten'] },
      { n: 'Pechuga de pollo', p: [{ l: 'Unidad', v: 2.9 }], a: ['gluten'] },
      { n: 'Longaniza', p: [{ l: 'Unidad', v: 2.9 }], a: ['gluten'] },
      { n: 'Sobrasada y queso', p: [{ l: 'Unidad', v: 2.9 }], a: ['gluten', 'leche'] },
      { n: 'Salchicha', p: [{ l: 'Unidad', v: 2.9 }], a: ['gluten'] },
      { n: 'Podium', d: 'Lomo, tomate, queso cheddar, bacon y salsa barbacoa', p: [{ l: 'Unidad', v: 4 }], a: ['gluten', 'leche'] },
      { n: 'Ternera', p: [{ l: 'Unidad', v: 4 }], a: ['gluten'] },
      { n: 'Ternera con foie', p: [{ l: 'Unidad', v: 5.8 }], a: ['gluten'] }
    ]
  },
  {
    id: 'postres-caseros',
    nombre: 'Postres caseros',
    icono: '🍰',
    platos: [
      { n: 'Crepes', d: 'Nutella y nata', p: [{ l: 'Unidad', v: 5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Tarta de queso al horno', p: [{ l: 'Unidad', v: 7 }] },
      { n: 'Tortitas con helado', d: 'Nutella y helado a elegir', p: [{ l: 'Unidad', v: 6 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Tortitas', d: 'Nutella y nata', p: [{ l: 'Unidad', v: 4.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Coulant chocolate con helado', d: 'Chocolate caliente y helado de vainilla', p: [{ l: 'Unidad', v: 5.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Coulant chocolate', d: 'Chocolate caliente', p: [{ l: 'Unidad', v: 4.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Crepes con helado', d: 'Nutella, nata y helado a elegir', p: [{ l: 'Unidad', v: 6.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Arroz con leche', p: [{ l: 'Unidad', v: 4 }], a: ['leche'] },
      { n: 'Gofre con helado', d: 'Chocolate o Nutella y bola de helado a elegir', p: [{ l: 'Unidad', v: 6.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Gofre a la taza', d: 'Chocolate, nata y polvo de galleta Oreo', p: [{ l: 'Unidad', v: 6 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Gofre', d: 'Chocolate o Nutella y nata', p: [{ l: 'Unidad', v: 5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Leche frita con helado de turrón', p: [{ l: 'Unidad', v: 6.5 }], a: ['leche', 'huevo', 'cacahuetes', 'frutos', 'sesamo'] },
      { n: 'Tarta de queso', p: [{ l: 'Unidad', v: 4.5 }], a: ['gluten', 'leche'] },
      { n: 'Tarta del abuelo', p: [{ l: 'Unidad', v: 4.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Tarta de la abuela', p: [{ l: 'Unidad', v: 4.5 }], a: ['gluten', 'leche', 'huevo'] },
      { n: 'Pan de Calatrava', p: [{ l: 'Unidad', v: 4.5 }], a: ['gluten', 'leche', 'huevo'] }
    ]
  },
  {
    id: 'postres',
    nombre: 'Postres',
    icono: '🍮',
    platos: [
      { n: 'Tarta de pistacho helada', p: [{ l: 'Unidad', v: 6.5 }], a: ['gluten', 'leche', 'cacahuetes', 'frutos', 'soja'] },
      { n: 'Tarta de whisky', p: [{ l: 'Unidad', v: 6 }], a: ['leche', 'huevo', 'cacahuetes', 'frutos'] }
    ]
  }
,
  {
    id: 'cervezas',
    nombre: 'Cervezas',
    icono: '🍺',
    platos: [
      { n: 'Estrella de Levante', d: 'Lager de maduración lenta, refrescante y con sabor. 4,80 % vol.', p: [{ l: '33 cl', v: 2.6 }, { l: 'Copa', v: 3.5 }, { l: 'Jarra', v: 10.5 }], a: ['gluten'] },
      { n: 'Estrella de Levante 0,0', d: 'Fresca y con amargor equilibrado, sin alcohol. 0,00 % vol.', p: [{ l: '33 cl', v: 2.5 }], a: ['gluten'] },
      { n: 'Estrella de Levante 0,0 Tostada', d: 'Malta pilsen con maltas caramelo y torrefactas. 0,00 % vol.', p: [{ l: '33 cl', v: 2.9 }], a: ['gluten'] },
      { n: 'Punta Este', d: 'Lager elegante, con cuerpo, de cebada malteada en Murcia. 5,40 % vol.', p: [{ l: 'Copa', v: 3.5 }, { l: 'Jarra', v: 10 }], a: ['gluten'] },
      { n: 'Verna', d: 'Clara con limones Verna y Primofiori de la Vega del Segura. 3,20 % vol.', p: [{ l: '33 cl', v: 3.1 }], a: ['gluten'] },
      { n: 'Voll-Damm', d: 'Doble malta: más aroma, más sabor y más cuerpo. 7,20 % vol.', p: [{ l: '33 cl', v: 3.2 }], a: ['gluten'] },
      { n: 'Estrella de Levante Reserva 60', d: 'Lager especial con lúpulo nugget de Caravaca de la Cruz. 6,30 % vol.', p: [{ l: '33 cl', v: 3.2 }], a: ['gluten'] }
    ]
  }
];

// Menú del día
window.MENU_DIARIO = {
  precio: 11,
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
