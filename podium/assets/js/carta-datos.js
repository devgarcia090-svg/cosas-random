// Carta de Podium Café & Grill.
// Para cambiar precios o platos, edita solo este fichero: la web se actualiza sola.
// Formato de cada plato: { n: nombre, d: descripcion (opcional), p: [ {l: etiqueta, v: precio} ] }

window.CARTA = [
  {
    id: 'sugerencias',
    nombre: 'Sugerencias',
    icono: '★',
    destacada: true,
    platos: [
      { n: 'Pulpo con cremoso de humo', p: [{ l: 'Unidad', v: 14.5 }] },
      { n: 'Queso de cabra frito con mermelada de tomate', p: [{ l: 'Unidad', v: 7.0 }] },
      { n: 'Tartar de atún con helado de mango', p: [{ l: 'Unidad', v: 17.0 }] },
      { n: 'Almejas al ajillo con piñones', p: [{ l: 'Unidad', v: 17.5 }] },
      { n: 'Lomo Rubia Gallega', d: 'Chuletón de rubia gallega a la brasa. Promoción con vino Pinna Fidelis', p: [{ l: 'Unidad', v: 59.0 }] },
      { n: 'Ensalada de burrata', p: [{ l: 'Unidad', v: 13.5 }] },
      { n: 'Chuletón finlandés chocolate madurado', d: '65 € / kg', p: [{ l: 'Unidad', v: 65.0 }] }
    ]
  },
  {
    id: 'aperitivos',
    nombre: 'Aperitivos',
    icono: '🍢',
    platos: [
      { n: 'Bicicleta', p: [{ l: 'Unidad', v: 1.6 }] },
      { n: 'Marinera', p: [{ l: 'Unidad', v: 2.4 }] },
      { n: 'Marinero', p: [{ l: 'Unidad', v: 2.4 }] },
      { n: 'Caballito', p: [{ l: 'Unidad', v: 2.4 }] },
      { n: 'Tigre', p: [{ l: 'Unidad', v: 2.4 }] },
      { n: 'Zamburiña', p: [{ l: 'Unidad', v: 3.0 }] },
      { n: 'Rollito de salmón', p: [{ l: 'Unidad', v: 4.2 }] },
      { n: 'Tapa de ensaladilla', p: [{ l: 'Unidad', v: 6.5 }] },
      { n: 'Salchicha seca y queso', p: [{ l: 'Unidad', v: 7.0 }] },
      { n: 'Mejillones', p: [{ l: 'Entera', v: 9.5 }, { l: 'Media', v: 6.0 }] },
      { n: 'Mojama y hueva', p: [{ l: 'Entera', v: 12.0 }, { l: 'Media', v: 6.0 }] },
      { n: 'Tabla de quesos', p: [{ l: 'Entera', v: 11.0 }, { l: 'Media', v: 7.0 }] },
      { n: 'Nachos con chili y guacamole', p: [{ l: 'Unidad', v: 11.0 }] },
      { n: 'Plato de jamón duroc', p: [{ l: 'Entera', v: 13.0 }, { l: 'Media', v: 7.5 }] },
      { n: 'Plato de jamón ibérico', p: [{ l: 'Entera', v: 17.0 }, { l: 'Media', v: 9.0 }] },
      { n: 'Plato de ibéricos', d: 'Surtido de ibéricos', p: [{ l: 'Unidad', v: 15.0 }] },
      { n: 'Gambas al ajillo', p: [{ l: 'Unidad', v: 13.5 }] },
      { n: 'Gamba roja a la plancha', d: 'Docena', p: [{ l: 'Entera', v: 20.0 }, { l: 'Media', v: 10.0 }] },
      { n: 'Almejas al ajillo con piñones', p: [{ l: 'Unidad', v: 17.5 }] },
      { n: 'Sepia a la plancha', p: [{ l: 'Unidad', v: 14.0 }] },
      { n: 'Calamar nacional a la andaluza', p: [{ l: 'Entera', v: 18.0 }, { l: 'Media', v: 10.5 }] },
      { n: 'Calamar nacional a la plancha', p: [{ l: 'Unidad', v: 18.0 }] },
      { n: 'Pulpo rockero a la brasa', p: [{ l: 'Entera', v: 19.0 }, { l: 'Media', v: 10.5 }] },
      { n: 'Pulpo con cremoso de humo', p: [{ l: 'Unidad', v: 14.5 }] }
    ]
  },
  {
    id: 'entrantes',
    nombre: 'Entrantes',
    icono: '🥘',
    platos: [
      { n: 'Croqueta casera de jamón', p: [{ l: 'Unidad', v: 2.3 }] },
      { n: 'Croqueta casera de queso de cabra y cebolla caramelizada', p: [{ l: 'Unidad', v: 2.3 }] },
      { n: 'Croqueta casera de carrillera', p: [{ l: 'Unidad', v: 2.3 }] },
      { n: 'Croqueta casera de boletus', p: [{ l: 'Unidad', v: 2.3 }] },
      { n: 'Croqueta casera de pulpo', p: [{ l: 'Unidad', v: 2.5 }] },
      { n: 'Croqueta de gamba roja', p: [{ l: 'Unidad', v: 2.5 }] },
      { n: 'Patatas asadas con ajo', p: [{ l: 'Unidad', v: 0.8 }] },
      { n: 'Patatas a lo pobre', p: [{ l: 'Unidad', v: 5.8 }] },
      { n: 'Patatas al ajo cabañil', p: [{ l: 'Unidad', v: 6.8 }] },
      { n: 'Patatas bravas', p: [{ l: 'Entera', v: 9.0 }, { l: 'Media', v: 6.0 }] },
      { n: 'Patatas rancheras', d: 'Con pollo o bacon', p: [{ l: 'Unidad', v: 9.7 }] },
      { n: 'Alcachofa confitada', d: 'Con sopa de parmesano y lascas de jamón', p: [{ l: 'Unidad', v: 5.5 }] },
      { n: 'Alcachofa con cremoso de foie', p: [{ l: 'Unidad', v: 7.0 }] },
      { n: 'Verduras a la brasa', p: [{ l: 'Entera', v: 11.5 }, { l: 'Media', v: 6.5 }] },
      { n: 'Berenjenas con miel', p: [{ l: 'Entera', v: 12.5 }, { l: 'Media', v: 8.0 }] },
      { n: 'Huevos rotos con jamón', p: [{ l: 'Unidad', v: 13.5 }] },
      { n: 'Tartar de atún con helado de mango', p: [{ l: 'Unidad', v: 17.0 }] }
    ]
  },
  {
    id: 'ensaladas',
    nombre: 'Ensaladas',
    icono: '🥗',
    platos: [
      { n: 'Mediterránea', d: 'Lechuga, tomate, pepino, atún, huevo duro y olivas', p: [{ l: 'Entera', v: 12.5 }, { l: 'Media', v: 7.5 }] },
      { n: 'Fit', d: 'Lechuga, tomate, atún, huevo duro, queso y pollo', p: [{ l: 'Entera', v: 13.5 }, { l: 'Media', v: 8.5 }] },
      { n: 'Ensalada Leonor mango', d: 'Lechuga, gambas, mango, queso y helado de mango', p: [{ l: 'Entera', v: 15.0 }, { l: 'Media', v: 10.0 }] },
      { n: 'Ensalada de burrata', p: [{ l: 'Unidad', v: 13.5 }] },
      { n: 'Tomate partido con olivas', p: [{ l: 'Unidad', v: 6.0 }] },
      { n: 'Tomate partido con bonito', p: [{ l: 'Entera', v: 13.0 }, { l: 'Media', v: 8.0 }] },
      { n: 'Tomate con ventresca', p: [{ l: 'Unidad', v: 10.5 }] }
    ]
  },
  {
    id: 'carnes',
    nombre: 'Carnes a la brasa',
    icono: '🔥',
    destacada: true,
    platos: [
      { n: 'Pollo a la brasa (ración)', p: [{ l: 'Unidad', v: 9.0 }] },
      { n: 'Pollo a la brasa', p: [{ l: 'Entera', v: 17.5 }, { l: 'Media', v: 10.0 }] },
      { n: 'Combinado de pechuga o lomo con huevo', p: [{ l: 'Unidad', v: 11.0 }] },
      { n: 'Ración de cordero', p: [{ l: 'Unidad', v: 16.0 }] },
      { n: 'Medio kilo de cordero', p: [{ l: 'Unidad', v: 24.0 }] },
      { n: 'Kilo de cordero', p: [{ l: 'Unidad', v: 44.0 }] },
      { n: 'Pierna de lechal al Hosper', d: 'Horneada a baja temperatura', p: [{ l: 'Unidad', v: 17.5 }] },
      { n: 'Rabo de toro', p: [{ l: 'Unidad', v: 14.0 }] },
      { n: 'Carrillera en salsa', p: [{ l: 'Unidad', v: 13.5 }] },
      { n: 'Solomillo de cerdo a la pimienta', p: [{ l: 'Unidad', v: 14.0 }] },
      { n: 'Lagarto ibérico a la brasa', p: [{ l: 'Unidad', v: 19.5 }] },
      { n: 'Solomillo de ternera', p: [{ l: 'Unidad', v: 21.5 }] },
      { n: 'Entrecot de vaca madurada', p: [{ l: 'Unidad', v: 21.0 }] },
      { n: 'Entrecot de angus', p: [{ l: 'Unidad', v: 25.0 }] },
      { n: 'Chuletón de ternera', p: [{ l: 'Unidad', v: 34.0 }] },
      { n: 'Chuletón de vaca madurada', d: '41,50 € / kg', p: [{ l: 'Unidad', v: 41.5 }] },
      { n: 'Chuletón de angus', d: '42,00 € / kg', p: [{ l: 'Unidad', v: 42.0 }] },
      { n: 'Lomo Rubia Gallega', d: 'Chuletón de rubia gallega a la brasa. Promoción con vino Pinna Fidelis', p: [{ l: 'Unidad', v: 59.0 }] },
      { n: 'Lomo Finlandia Sashi', d: 'Chuletón de vaca de Finlandia, calidad nórdica a nivel mundial', p: [{ l: 'Unidad', v: 65.0 }] },
      { n: 'Chuletón finlandés chocolate madurado', d: '65 € / kg', p: [{ l: 'Unidad', v: 65.0 }] },
      { n: 'Parrillada de 4 carnes (2 personas)', d: 'Pollo, cerdo, cordero y ternera', p: [{ l: 'Unidad', v: 22.0 }] },
      { n: 'Parrillada de 4 carnes (4 personas)', d: 'Pollo, cerdo, cordero y ternera', p: [{ l: 'Unidad', v: 40.0 }] }
    ]
  },
  {
    id: 'pescados',
    nombre: 'Pescados',
    icono: '🐟',
    platos: [
      { n: 'Boquerones fritos', p: [{ l: 'Unidad', v: 10.0 }] },
      { n: 'Emperador a la brasa con salsa verde', p: [{ l: 'Unidad', v: 12.0 }] },
      { n: 'Lubina a la brasa con salsa verde', p: [{ l: 'Unidad', v: 16.0 }] },
      { n: 'Dorada a la brasa con salsa verde', p: [{ l: 'Unidad', v: 16.0 }] },
      { n: 'Fritura de pescado (2 personas)', d: 'Calamar a la andaluza, boquerones, croquetas, gambas y emperador', p: [{ l: 'Unidad', v: 27.0 }] },
      { n: 'Parrillada de marisco (2 personas)', d: 'Calamar a la plancha, emperador, gamba roja, zamburiñas y mejillones', p: [{ l: 'Unidad', v: 37.0 }] }
    ]
  },
  {
    id: 'arroces',
    nombre: 'Arroces',
    icono: '🍚',
    nota: 'Precio por persona. Mínimo 2 personas.',
    platos: [
      { n: 'Arroz de pollo y costillejas', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 10.0 }] },
      { n: 'Arroz a banda', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 12.0 }] },
      { n: 'Arroz de marisco', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 14.5 }] },
      { n: 'Arroz de chuletón', d: 'Precio por persona, mínimo 2', p: [{ l: 'Unidad', v: 19.5 }] }
    ]
  },
  {
    id: 'hamburguesas',
    nombre: 'Hamburguesas',
    icono: '🍔',
    destacada: true,
    platos: [
      { n: 'Crispy chicken', d: 'Pollo con rebozado crujiente, lechuga y tomate', p: [{ l: 'Unidad', v: 7.0 }] },
      { n: 'Clásica de angus 150 g', d: 'Lechuga, tomate y cebolla', p: [{ l: 'Unidad', v: 7.5 }] },
      { n: 'Completa de angus 150 g', d: 'Lechuga, tomate, cebolla, huevo, bacon y queso', p: [{ l: 'Unidad', v: 11.0 }] },
      { n: 'Podium madurada 200 g', d: 'Ternera madurada, queso cheddar, bacon y salsa burger', p: [{ l: 'Unidad', v: 13.0 }] },
      { n: 'Smash Podium 200 g', d: 'Ternera, cebolla frita, tomate deshidratado, queso, salsa cheddar y bacon', p: [{ l: 'Unidad', v: 14.5 }] }
    ]
  },
  {
    id: 'picar',
    nombre: 'Para picar',
    icono: '🍟',
    platos: [
      { n: 'Nuggets (6 uds.)', p: [{ l: 'Unidad', v: 5.0 }] },
      { n: 'Bolitas de pollo (12 uds.)', p: [{ l: 'Unidad', v: 5.5 }] },
      { n: 'Queso de cabra frito con mermelada de tomate', p: [{ l: 'Unidad', v: 7.0 }] },
      { n: 'Salchicha seca, queso y almendras', p: [{ l: 'Unidad', v: 7.0 }] }
    ]
  },
  {
    id: 'montaditos',
    nombre: 'Montaditos',
    icono: '🥖',
    platos: [
      { n: 'Lomo', p: [{ l: 'Unidad', v: 2.9 }] },
      { n: 'Pechuga de pollo', p: [{ l: 'Unidad', v: 2.9 }] },
      { n: 'Longaniza', p: [{ l: 'Unidad', v: 2.9 }] },
      { n: 'Sobrasada y queso', p: [{ l: 'Unidad', v: 2.9 }] },
      { n: 'Salchicha', p: [{ l: 'Unidad', v: 2.9 }] },
      { n: 'Podium', d: 'Lomo, tomate, queso cheddar, bacon y salsa barbacoa', p: [{ l: 'Unidad', v: 4.0 }] },
      { n: 'Ternera', p: [{ l: 'Unidad', v: 4.0 }] },
      { n: 'Ternera con foie', p: [{ l: 'Unidad', v: 5.8 }] }
    ]
  },
  {
    id: 'postres',
    nombre: 'Postres',
    icono: '🍰',
    platos: [
      { n: 'Arroz con leche', d: 'Casero', p: [{ l: 'Unidad', v: 4.0 }] },
      { n: 'Tortitas', d: 'Nutella y nata. Casero', p: [{ l: 'Unidad', v: 4.5 }] },
      { n: 'Coulant de chocolate', d: 'Chocolate caliente. Casero', p: [{ l: 'Unidad', v: 4.5 }] },
      { n: 'Tarta de queso', p: [{ l: 'Unidad', v: 4.5 }] },
      { n: 'Tarta del abuelo', p: [{ l: 'Unidad', v: 4.5 }] },
      { n: 'Tarta de la abuela', p: [{ l: 'Unidad', v: 4.5 }] },
      { n: 'Pan de Calatrava', p: [{ l: 'Unidad', v: 4.5 }] },
      { n: 'Crepes', d: 'Nutella y nata. Casero', p: [{ l: 'Unidad', v: 5.0 }] },
      { n: 'Gofre', d: 'Chocolate o Nutella y nata. Casero', p: [{ l: 'Unidad', v: 5.0 }] },
      { n: 'Coulant de chocolate con helado', d: 'Chocolate caliente y helado de vainilla. Casero', p: [{ l: 'Unidad', v: 5.5 }] },
      { n: 'Gofre a la taza', d: 'Chocolate, nata y polvo de galleta Oreo. Casero', p: [{ l: 'Unidad', v: 6.0 }] },
      { n: 'Tortitas con helado', d: 'Nutella y helado a elegir. Casero', p: [{ l: 'Unidad', v: 6.0 }] },
      { n: 'Tarta de whisky', p: [{ l: 'Unidad', v: 6.0 }] },
      { n: 'Crepes con helado', d: 'Nutella, nata y helado a elegir. Casero', p: [{ l: 'Unidad', v: 6.5 }] },
      { n: 'Gofre con helado', d: 'Chocolate o Nutella y bola de helado a elegir. Casero', p: [{ l: 'Unidad', v: 6.5 }] },
      { n: 'Leche frita con helado de turrón', d: 'Casero', p: [{ l: 'Unidad', v: 6.5 }] },
      { n: 'Tarta de pistacho helada', p: [{ l: 'Unidad', v: 6.5 }] },
      { n: 'Tarta de queso al horno', d: 'Casero', p: [{ l: 'Unidad', v: 7.0 }] }
    ]
  },
  {
    id: 'cervezas',
    nombre: 'Cervezas',
    icono: '🍺',
    platos: [
      { n: 'Estrella de Levante', d: 'Lager de maduración lenta, refrescante y con sabor. 4,80 % vol.', p: [{ l: '33 cl', v: 2.6 }, { l: 'Copa', v: 3.5 }, { l: 'Jarra', v: 10.5 }] },
      { n: 'Estrella de Levante 0,0', d: 'Fresca y con amargor equilibrado, sin alcohol. 0,00 % vol.', p: [{ l: '33 cl', v: 2.5 }] },
      { n: 'Estrella de Levante 0,0 Tostada', d: 'Malta pilsen con maltas caramelo y torrefactas. 0,00 % vol.', p: [{ l: '33 cl', v: 2.9 }] },
      { n: 'Punta Este', d: 'Lager elegante, con cuerpo, de cebada malteada en Murcia. 5,40 % vol.', p: [{ l: 'Copa', v: 3.5 }, { l: 'Jarra', v: 10.0 }] },
      { n: 'Verna', d: 'Clara con limones Verna y Primofiori de la Vega del Segura. 3,20 % vol.', p: [{ l: '33 cl', v: 3.1 }] },
      { n: 'Voll-Damm', d: 'Doble malta: más aroma, más sabor y más cuerpo. 7,20 % vol.', p: [{ l: '33 cl', v: 3.2 }] },
      { n: 'Estrella de Levante Reserva 60', d: 'Lager especial con lúpulo nugget de Caravaca de la Cruz. 6,30 % vol.', p: [{ l: '33 cl', v: 3.2 }] }
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
