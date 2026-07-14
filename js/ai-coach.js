/*
 * ai-coach.js — Coach de nutrición con IA (Claude).
 *
 * Llama directamente a la API de Anthropic desde el navegador (sin servidor).
 * La API key se guarda solo en localStorage de este navegador.
 *
 * Flujo: el usuario escribe en lenguaje natural lo que ha comido; Claude lo
 * interpreta, estima los macros de cada alimento y da una valoración teniendo
 * en cuenta los datos de la báscula, el objetivo y lo ya ingerido hoy.
 */

const KEY_STORAGE = 'nutritrack_anthropic_key_v1';
const MODEL = 'claude-opus-4-8';

function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}
function setApiKey(key) {
  if (key) localStorage.setItem(KEY_STORAGE, key.trim());
  else localStorage.removeItem(KEY_STORAGE);
}
function hasApiKey() {
  return !!getApiKey();
}

// Esquema de salida estructurada: garantiza que la respuesta sea JSON válido.
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    foods: {
      type: 'array',
      description: 'Cada alimento identificado en el texto, con macros estimados para la cantidad indicada',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del alimento con cantidad, ej. "Pechuga de pollo 150g"' },
          calories: { type: 'integer' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
        },
        required: ['name', 'calories', 'protein', 'carbs', 'fat'],
        additionalProperties: false,
      },
    },
    assessment: {
      type: 'string',
      description: 'Valoración breve (2-4 frases) en español sobre si esta comida encaja con el objetivo, tono cercano y motivador',
    },
    verdict: {
      type: 'string',
      enum: ['excelente', 'buena', 'mejorable', 'floja'],
      description: 'Veredicto global de la comida respecto al objetivo',
    },
    protein_status: {
      type: 'string',
      enum: ['baja', 'correcta', 'alta'],
      description: 'Nivel de proteína de esta comida para alguien que quiere ganar músculo',
    },
    suggestions: {
      type: 'array',
      description: '1-3 sugerencias concretas y accionables en español para mejorar o completar',
      items: { type: 'string' },
    },
  },
  required: ['foods', 'assessment', 'verdict', 'protein_status', 'suggestions'],
  additionalProperties: false,
};

function buildSystemPrompt(context) {
  const { profile, latest, targets, eatenToday, age } = context;
  const goalLabels = {
    gain_muscle: 'ganar masa muscular (lean bulk)',
    lose_fat: 'perder grasa preservando músculo',
    recomp: 'recomposición corporal (mantener peso, cambiar composición)',
  };

  const lines = [
    'Eres un coach de nutrición deportiva experto, cercano y motivador. Hablas en español de España.',
    'Tu trabajo: interpretar lo que el usuario dice que ha comido, estimar los macronutrientes de cada alimento de la forma más realista posible, y valorar la comida respecto a su objetivo y sus datos.',
    '',
    'PERFIL DEL USUARIO:',
    `- Objetivo: ${goalLabels[profile.goal] || profile.goal}`,
    profile.sex ? `- Sexo: ${profile.sex === 'female' ? 'mujer' : 'hombre'}` : '',
    age != null ? `- Edad: ${age} años` : '',
    profile.heightCm ? `- Altura: ${profile.heightCm} cm` : '',
  ];

  if (latest) {
    lines.push(`- Peso actual: ${latest.weightKg} kg`);
    if (latest.bodyFatPct != null) lines.push(`- Grasa corporal: ${latest.bodyFatPct}%`);
    if (latest.muscleMassKg != null) lines.push(`- Masa muscular: ${latest.muscleMassKg} kg`);
  }

  if (targets) {
    lines.push(
      '',
      'OBJETIVOS DIARIOS CALCULADOS:',
      `- Calorías: ${targets.calories} kcal`,
      `- Proteína: ${targets.protein} g`,
      `- Carbohidratos: ${targets.carbs} g`,
      `- Grasa: ${targets.fat} g`,
    );
  }

  lines.push(
    '',
    'YA INGERIDO HOY (antes de esta comida):',
    `- ${eatenToday.calories} kcal | Proteína ${eatenToday.protein} g | Carbos ${eatenToday.carbs} g | Grasa ${eatenToday.fat} g`,
    '',
    'INSTRUCCIONES:',
    '- Estima cantidades con sentido común si el usuario no las especifica (ración estándar).',
    '- Valora la comida pensando en su objetivo: para ganar músculo prioriza proteína suficiente (~2 g/kg/día repartida) y calorías adecuadas.',
    '- En "assessment" sé concreto y motivador, sin sermonear. Menciona números cuando ayude.',
    '- En "suggestions" da ideas accionables (ej. "añade 30 g de proteína en polvo para llegar a tu objetivo").',
    '- No inventes datos que no tienes; si algo es ambiguo, elige la interpretación más común.',
  );

  return lines.filter(l => l !== '').join('\n');
}

/*
 * Analiza una comida escrita en lenguaje natural.
 * Devuelve el objeto estructurado (foods, assessment, verdict, ...).
 * Lanza Error con mensaje legible si algo falla.
 */
async function analyzeMeal(mealText, context) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_KEY');

  const body = {
    model: MODEL,
    max_tokens: 1500,
    system: buildSystemPrompt(context),
    messages: [
      { role: 'user', content: `He comido esto:\n\n"${mealText}"\n\nInterprétalo, estima los macros y valóralo para mi objetivo.` },
    ],
    output_config: {
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
  };

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Necesario para llamar a la API directamente desde el navegador
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error('NETWORK');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.message || '';
    } catch { /* ignore */ }
    if (res.status === 401) throw new Error('BAD_KEY');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`API_${res.status}${detail ? ': ' + detail : ''}`);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find(b => b.type === 'text');
  if (!textBlock) throw new Error('EMPTY');

  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error('PARSE');
  }
  return parsed;
}

function errorMessage(err) {
  const map = {
    NO_KEY: 'Configura tu API key de Anthropic en la pestaña Perfil.',
    BAD_KEY: 'La API key no es válida. Revísala en Perfil.',
    RATE_LIMIT: 'Demasiadas peticiones. Espera un momento e inténtalo otra vez.',
    NETWORK: 'No se pudo conectar. Revisa tu conexión a internet.',
    EMPTY: 'La IA no devolvió respuesta. Inténtalo de nuevo.',
    PARSE: 'Respuesta de la IA no válida. Inténtalo de nuevo.',
  };
  return map[err.message] || `Error al analizar: ${err.message}`;
}

window.AICoach = {
  getApiKey,
  setApiKey,
  hasApiKey,
  analyzeMeal,
  errorMessage,
};
