/*
 * food-db.js — Pequeña base de datos de alimentos (valores por 100 g).
 * Orientada a ganancia muscular: rica en fuentes de proteína.
 * Puedes añadir los tuyos desde la propia app.
 */

const BUILTIN_FOODS = [
  // Proteínas
  { name: 'Pechuga de pollo', unit: 'g', per: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Pavo (pechuga)', unit: 'g', per: 100, calories: 135, protein: 30, carbs: 0, fat: 1 },
  { name: 'Ternera magra', unit: 'g', per: 100, calories: 187, protein: 26, carbs: 0, fat: 9 },
  { name: 'Salmón', unit: 'g', per: 100, calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Atún al natural', unit: 'g', per: 100, calories: 116, protein: 26, carbs: 0, fat: 1 },
  { name: 'Merluza', unit: 'g', per: 100, calories: 90, protein: 18, carbs: 0, fat: 2 },
  { name: 'Huevo entero', unit: 'ud', per: 60, calories: 90, protein: 7.5, carbs: 0.6, fat: 6.3 },
  { name: 'Clara de huevo', unit: 'ud', per: 33, calories: 17, protein: 3.6, carbs: 0.2, fat: 0 },
  { name: 'Yogur griego natural', unit: 'g', per: 100, calories: 97, protein: 9, carbs: 4, fat: 5 },
  { name: 'Queso fresco batido 0%', unit: 'g', per: 100, calories: 47, protein: 8, carbs: 3.5, fat: 0.2 },
  { name: 'Leche semidesnatada', unit: 'ml', per: 100, calories: 46, protein: 3.3, carbs: 4.8, fat: 1.6 },
  { name: 'Proteína en polvo (whey)', unit: 'g', per: 30, calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: 'Tofu', unit: 'g', per: 100, calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: 'Lentejas cocidas', unit: 'g', per: 100, calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: 'Garbanzos cocidos', unit: 'g', per: 100, calories: 164, protein: 9, carbs: 27, fat: 2.6 },
  { name: 'Alubias cocidas', unit: 'g', per: 100, calories: 127, protein: 8.7, carbs: 22, fat: 0.5 },
  { name: 'Gambas / langostinos', unit: 'g', per: 100, calories: 99, protein: 21, carbs: 0, fat: 1.7 },
  { name: 'Sardinas', unit: 'g', per: 100, calories: 208, protein: 25, carbs: 0, fat: 11 },
  { name: 'Cerdo (lomo)', unit: 'g', per: 100, calories: 143, protein: 21, carbs: 0, fat: 6 },

  // Embutidos y quesos (España)
  { name: 'Jamón ibérico', unit: 'g', per: 100, calories: 375, protein: 43, carbs: 0, fat: 22 },
  { name: 'Jamón serrano', unit: 'g', per: 100, calories: 241, protein: 31, carbs: 0.5, fat: 13 },
  { name: 'Jamón york / cocido', unit: 'g', per: 100, calories: 110, protein: 18, carbs: 1.5, fat: 3.5 },
  { name: 'Pavo (fiambre)', unit: 'g', per: 100, calories: 104, protein: 17, carbs: 1.5, fat: 3 },
  { name: 'Lomo embuchado', unit: 'g', per: 100, calories: 250, protein: 45, carbs: 0, fat: 8 },
  { name: 'Chorizo', unit: 'g', per: 100, calories: 455, protein: 24, carbs: 2, fat: 38 },
  { name: 'Salchichón', unit: 'g', per: 100, calories: 420, protein: 26, carbs: 1, fat: 34 },
  { name: 'Queso manchego curado', unit: 'g', per: 100, calories: 430, protein: 26, carbs: 1, fat: 35 },
  { name: 'Queso semicurado', unit: 'g', per: 100, calories: 375, protein: 25, carbs: 1, fat: 30 },
  { name: 'Queso fresco', unit: 'g', per: 100, calories: 174, protein: 12, carbs: 4, fat: 12 },
  { name: 'Mozzarella', unit: 'g', per: 100, calories: 280, protein: 22, carbs: 2, fat: 21 },

  // Carbohidratos
  { name: 'Arroz blanco cocido', unit: 'g', per: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Arroz integral cocido', unit: 'g', per: 100, calories: 112, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: 'Pasta cocida', unit: 'g', per: 100, calories: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  { name: 'Patata cocida', unit: 'g', per: 100, calories: 87, protein: 2, carbs: 20, fat: 0.1 },
  { name: 'Boniato', unit: 'g', per: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'Avena', unit: 'g', per: 100, calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Pan integral', unit: 'g', per: 100, calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  { name: 'Quinoa cocida', unit: 'g', per: 100, calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: 'Plátano', unit: 'ud', per: 120, calories: 107, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Manzana', unit: 'ud', per: 180, calories: 94, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: 'Naranja', unit: 'ud', per: 200, calories: 94, protein: 1.8, carbs: 24, fat: 0.2 },
  { name: 'Pan blanco', unit: 'g', per: 100, calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: 'Tortilla de patata', unit: 'g', per: 100, calories: 165, protein: 6, carbs: 14, fat: 9 },

  // Lácteos
  { name: 'Leche entera', unit: 'ml', per: 100, calories: 63, protein: 3.2, carbs: 4.7, fat: 3.6 },
  { name: 'Yogur natural', unit: 'ud', per: 125, calories: 79, protein: 5.5, carbs: 6, fat: 3.8 },
  { name: 'Requesón / cottage', unit: 'g', per: 100, calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },

  // Grasas
  { name: 'Aceite de oliva', unit: 'ml', per: 10, calories: 88, protein: 0, carbs: 0, fat: 10 },
  { name: 'Aguacate', unit: 'g', per: 100, calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'Almendras', unit: 'g', per: 30, calories: 174, protein: 6.4, carbs: 6.5, fat: 15 },
  { name: 'Nueces', unit: 'g', per: 30, calories: 196, protein: 4.6, carbs: 4.1, fat: 20 },
  { name: 'Mantequilla de cacahuete', unit: 'g', per: 20, calories: 118, protein: 5, carbs: 4, fat: 10 },

  // Verduras
  { name: 'Brócoli', unit: 'g', per: 100, calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Espinacas', unit: 'g', per: 100, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'Ensalada mixta', unit: 'g', per: 100, calories: 20, protein: 1.5, carbs: 3, fat: 0.2 },
  { name: 'Tomate', unit: 'g', per: 100, calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Lechuga', unit: 'g', per: 100, calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { name: 'Zanahoria', unit: 'g', per: 100, calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: 'Pimiento', unit: 'g', per: 100, calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  { name: 'Cebolla', unit: 'g', per: 100, calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  { name: 'Calabacín', unit: 'g', per: 100, calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { name: 'Champiñones', unit: 'g', per: 100, calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { name: 'Judías verdes', unit: 'g', per: 100, calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
  { name: 'Guisantes', unit: 'g', per: 100, calories: 81, protein: 5, carbs: 14, fat: 0.4 },
  { name: 'Maíz dulce', unit: 'g', per: 100, calories: 86, protein: 3.2, carbs: 19, fat: 1.2 },

  // Más carnes y pescados
  { name: 'Pollo (muslo)', unit: 'g', per: 100, calories: 209, protein: 26, carbs: 0, fat: 11 },
  { name: 'Filete de ternera', unit: 'g', per: 100, calories: 217, protein: 26, carbs: 0, fat: 12 },
  { name: 'Carne picada mixta', unit: 'g', per: 100, calories: 250, protein: 18, carbs: 0, fat: 20 },
  { name: 'Hamburguesa de ternera', unit: 'g', per: 100, calories: 254, protein: 17, carbs: 1, fat: 20 },
  { name: 'Bacalao', unit: 'g', per: 100, calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { name: 'Dorada / lubina', unit: 'g', per: 100, calories: 121, protein: 20, carbs: 0, fat: 4.5 },
  { name: 'Atún fresco', unit: 'g', per: 100, calories: 144, protein: 23, carbs: 0, fat: 5 },
  { name: 'Salmón ahumado', unit: 'g', per: 100, calories: 117, protein: 25, carbs: 0, fat: 4.3 },
  { name: 'Mejillones', unit: 'g', per: 100, calories: 86, protein: 12, carbs: 3.7, fat: 2.2 },
  { name: 'Pulpo', unit: 'g', per: 100, calories: 82, protein: 15, carbs: 2, fat: 1 },

  // Fruta
  { name: 'Fresas', unit: 'g', per: 100, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: 'Uvas', unit: 'g', per: 100, calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { name: 'Sandía', unit: 'g', per: 100, calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
  { name: 'Melón', unit: 'g', per: 100, calories: 34, protein: 0.8, carbs: 8, fat: 0.2 },
  { name: 'Piña', unit: 'g', per: 100, calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  { name: 'Kiwi', unit: 'ud', per: 75, calories: 45, protein: 0.8, carbs: 11, fat: 0.4 },
  { name: 'Pera', unit: 'ud', per: 170, calories: 96, protein: 0.6, carbs: 25, fat: 0.2 },
  { name: 'Mandarina', unit: 'ud', per: 90, calories: 47, protein: 0.7, carbs: 12, fat: 0.3 },
  { name: 'Arándanos', unit: 'g', per: 100, calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { name: 'Dátiles', unit: 'g', per: 100, calories: 282, protein: 2.5, carbs: 75, fat: 0.4 },

  // Cereales, pan y desayuno
  { name: 'Copos de maíz (cereales)', unit: 'g', per: 100, calories: 378, protein: 7, carbs: 84, fat: 0.9 },
  { name: 'Muesli', unit: 'g', per: 100, calories: 363, protein: 10, carbs: 66, fat: 6 },
  { name: 'Tostada de pan', unit: 'ud', per: 30, calories: 80, protein: 2.7, carbs: 15, fat: 1 },
  { name: 'Pan de molde', unit: 'ud', per: 30, calories: 80, protein: 2.5, carbs: 14, fat: 1.2 },
  { name: 'Galletas María', unit: 'ud', per: 8, calories: 35, protein: 0.6, carbs: 6, fat: 1 },
  { name: 'Tortitas de arroz', unit: 'ud', per: 8, calories: 30, protein: 0.6, carbs: 6.5, fat: 0.2 },
  { name: 'Miel', unit: 'g', per: 20, calories: 61, protein: 0.1, carbs: 16, fat: 0 },
  { name: 'Mermelada', unit: 'g', per: 20, calories: 50, protein: 0.1, carbs: 12, fat: 0 },

  // Snacks y dulces
  { name: 'Chocolate negro 85%', unit: 'g', per: 100, calories: 592, protein: 9.6, carbs: 30, fat: 46 },
  { name: 'Chocolate con leche', unit: 'g', per: 100, calories: 535, protein: 7.6, carbs: 59, fat: 30 },
  { name: 'Patatas fritas (bolsa)', unit: 'g', per: 100, calories: 536, protein: 6.6, carbs: 53, fat: 34 },
  { name: 'Barrita de proteína', unit: 'ud', per: 60, calories: 210, protein: 20, carbs: 20, fat: 6 },
  { name: 'Cacahuetes', unit: 'g', per: 30, calories: 170, protein: 7.7, carbs: 4.8, fat: 14 },
  { name: 'Pistachos', unit: 'g', per: 30, calories: 170, protein: 6, carbs: 8, fat: 13 },

  // Bebidas
  { name: 'Cerveza', unit: 'ml', per: 330, calories: 145, protein: 1.6, carbs: 11, fat: 0 },
  { name: 'Refresco de cola', unit: 'ml', per: 330, calories: 139, protein: 0, carbs: 35, fat: 0 },
  { name: 'Zumo de naranja', unit: 'ml', per: 200, calories: 90, protein: 1.4, carbs: 21, fat: 0.4 },
  { name: 'Bebida de avena', unit: 'ml', per: 100, calories: 45, protein: 0.8, carbs: 7, fat: 1.5 },
  { name: 'Café solo', unit: 'ml', per: 100, calories: 2, protein: 0.1, carbs: 0, fat: 0 },

  // Platos y varios
  { name: 'Arroz con pollo', unit: 'g', per: 100, calories: 140, protein: 9, carbs: 18, fat: 3.5 },
  { name: 'Pasta con tomate', unit: 'g', per: 100, calories: 130, protein: 4, carbs: 24, fat: 2 },
  { name: 'Pizza', unit: 'g', per: 100, calories: 266, protein: 11, carbs: 33, fat: 10 },
  { name: 'Ensaladilla rusa', unit: 'g', per: 100, calories: 150, protein: 3.5, carbs: 9, fat: 11 },
  { name: 'Hummus', unit: 'g', per: 100, calories: 177, protein: 8, carbs: 14, fat: 10 },
  { name: 'Salsa de tomate', unit: 'g', per: 100, calories: 35, protein: 1.5, carbs: 6, fat: 0.5 },
  { name: 'Mayonesa', unit: 'g', per: 15, calories: 100, protein: 0.2, carbs: 0.3, fat: 11 },
];

const CUSTOM_KEY = 'nutritrack_custom_foods_v1';

function loadCustomFoods() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCustomFood(food) {
  const custom = loadCustomFoods();
  custom.push(food);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
}

function allFoods() {
  return [...loadCustomFoods(), ...BUILTIN_FOODS];
}

// Calcula los macros para una cantidad dada (en la unidad del alimento)
function scaleFood(food, amount) {
  const factor = amount / food.per;
  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
  };
}

window.FoodDB = {
  BUILTIN_FOODS,
  loadCustomFoods,
  saveCustomFood,
  allFoods,
  scaleFood,
};
