import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Config endpoint to return OAuth Client ID and app status safely
app.get("/api/config", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
  res.json({
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    googleClientId: clientId,
  });
});

// Strategic AI Analysis endpoint
app.post("/api/strategy/analyze-step", async (req, res) => {
  try {
    const { stepIndex, userResponse, currentData, sheetContext } = req.body;
    const ai = getGenAI();

    const systemInstruction = `
Eres un experto estratega financiero y de vida de élite, mentor de negocios y coach financiero 360°.
Tu objetivo es guiar al usuario en una sesión interactiva de preguntas y respuestas para construir un "Visualizador Mental" de su próximo año en 12 meses.
No das respuestas genéricas; adaptas cada recomendación a los números reales que el usuario ingresa o que detectamos en sus hojas de cálculo de Google Sheets conectadas.

Reglas del Flujo:
- Siempre mantén un tono proactivo, analítico, empático y motivador.
- Usa storytelling financiero para ilustrar el impacto de sus decisiones y riesgos.
- En este endpoint estás procesando la respuesta a un paso del flujo (Pasos del 1 al 6).
- Si hay datos de Google Sheets disponibles (columnas como 'Ventas', 'Gastos', 'Proyecciones'), debes contrastar lo que el usuario declara contra los datos reales de su hoja. Haz observaciones inteligentes (ejemplo: "Noté en tu Sheet que registraste $X de ventas promedio, lo cual valida/supera tu proyección...").
- Devuelve SIEMPRE una respuesta estructurada en formato JSON estricto:
{
  "feedback": "Análisis profundo, empático y estratégico de su respuesta con storytelling y números",
  "extractedData": {
    "monthlyIncome": number o null,
    "projectedAnnualIncome": number o null,
    "monthlyFixedExpenses": number o null,
    "monthlyVariableExpenses": number o null,
    "largeExpensesPlanned": string o null,
    "largeExpensesAmount": number o null,
    "primaryGoals": ["string"] o null,
    "travelOrExperiencePlans": string o null,
    "travelBudget": number o null,
    "emergencyFundMonths": number o null,
    "emergencyFundAmount": number o null,
    "crashCutPriorities": ["string"] o null,
    "debtVsReinvestStrategy": "credit" | "reinvest" | "hybrid" | "undecided" o null,
    "debtRiskRationale": string o null
  },
  "sheetValidationNotice": "Comentario específico si se cruzaron datos con Google Sheets, o cadena vacía si no aplica",
  "nextQuestionTransition": "Frase de transición natural hacia la siguiente pregunta",
  "recommendedActionTip": "Un consejo táctico inmediato basado en su número"
}
`;

    const prompt = `
Paso Actual: ${stepIndex} (de 6)
Respuesta del usuario: "${userResponse}"
Datos acumulados previos: ${JSON.stringify(currentData)}
Contexto de Google Sheets conectado: ${JSON.stringify(sheetContext || {})}

Analiza la respuesta del usuario, extrae las magnitudes numéricas o cualitativas pertinentes, cruza con los datos del Sheet si están disponibles, y genera el feedback del estratega.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: "HIGH" as any,
        },
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { feedback: text, extractedData: {} };
    }

    res.json({
      success: true,
      result: parsed,
    });
  } catch (error: any) {
    console.error("Error in /api/strategy/analyze-step:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al procesar el análisis estratégico con Gemini.",
    });
  }
});

// Final 360° Synthesis Report Generator
app.post("/api/strategy/generate-full-report", async (req, res) => {
  try {
    const { financialData, conversationSummary, sheetContext } = req.body;
    const ai = getGenAI();

    const systemInstruction = `
Eres el Gran Estratega Financiero Anual 360°.
Has completado la sesión de 6 preguntas con el usuario.
Ahora debes construir la síntesis definitiva del "Visualizador Mental" para los próximos 12 meses.
Debes estructurar el plan en TRES escenarios obligatorios:
1. Año Positivo (Ideal): Todo sale según lo planeado, metas cumplidas, optimización de ingresos, viajes y crecimiento sostenido.
2. Año Realista (Con imprevistos / Crash a mitad de año): Simula un crash concreto (pérdida de cliente clave, caída de demanda, costo imprevisto en mes 6) y demuestra la resiliencia calculando meses de colchón y plan de choque.
3. Año de Gestión de Crisis/Soluciones: Enfocado en decisiones críticas (inversiones, endeudamiento inteligente vs autofinanciamiento, qué recortar en 24h, umbral de ROI).

Debes devolver un JSON riguroso con la siguiente estructura:
{
  "ideal": {
    "name": "Año Positivo (Ideal)",
    "annualRevenue": number,
    "annualExpenses": number,
    "netSavings": number,
    "growthPct": number,
    "narrative": "Storytelling inspirador y numérico del año perfecto...",
    "keyMilestones": [
      { "quarter": "Q1", "title": "...", "target": "..." },
      { "quarter": "Q2", "title": "...", "target": "..." },
      { "quarter": "Q3", "title": "...", "target": "..." },
      { "quarter": "Q4", "title": "...", "target": "..." }
    ]
  },
  "crash": {
    "name": "Año Realista (Con Crash a Mitad de Año)",
    "crashEvent": "Descripción precisa del imprevisto a mitad de año",
    "crashMonth": "Mes 6",
    "impactRevenueDropPct": number,
    "annualRevenue": number,
    "annualExpenses": number,
    "netCashflow": number,
    "runwayMonthsLeft": number,
    "contingencyActions": ["Acción 1...", "Acción 2...", "Acción 3..."],
    "narrative": "Relato claro del momento del crash y cómo se absorbe el golpe..."
  },
  "crisisManagement": {
    "name": "Gestión de Crisis, Inversión & Crédito",
    "recommendedFinancing": "credit" | "bootstrap" | "hybrid",
    "creditRecommendation": "Análisis riguroso de si conviene o no endeudarse y bajo qué condiciones...",
    "investmentAllocation": "Cómo reinvertir los excedentes o capital...",
    "immediateCuts": ["Recorte 1...", "Recorte 2...", "Recorte 3..."],
    "roiThreshold": "Mínimo retorno exigido para cualquier nuevo proyecto...",
    "immediateActionPlan": [
      "Paso 1 para los primeros 30 días...",
      "Paso 2 para el primer trimestre...",
      "Paso 3 para blindar el colchón...",
      "Paso 4 para ejecutar crecimiento..."
    ]
  },
  "executiveSummary": "Resumen ejecutivo de 2 párrafos para el usuario"
}
`;

    const prompt = `
Datos Financieros Consolidados: ${JSON.stringify(financialData)}
Resumen del Diálogo: ${JSON.stringify(conversationSummary)}
Datos de Sheets Conectados: ${JSON.stringify(sheetContext || {})}

Genera el reporte 360° con matemática coherente basada en sus ingresos y gastos reales.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: "HIGH" as any,
        },
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      report: parsed,
    });
  } catch (error: any) {
    console.error("Error in /api/strategy/generate-full-report:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error generando el reporte estratégico.",
    });
  }
});

export default app;
