declare global {
  interface Window {
    google?: any;
  }
}

// Scopes required
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
];

export async function requestGoogleToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services library not loaded yet. Check your connection.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: WORKSPACE_SCOPES.join(' '),
        callback: (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
          } else if (resp.access_token) {
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token returned.'));
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

// Fetch user's Spreadsheets from Drive to easily pick or link
export async function listUserSpreadsheets(accessToken: string) {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=10`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list spreadsheets: ${errorText}`);
  }
  const data = await res.json();
  return data.files || [];
}

// Inspect Sheet columns for 'Ventas', 'Gastos', 'Proyecciones'
export async function inspectSpreadsheetData(accessToken: string, spreadsheetId: string) {
  // First get metadata about sheets
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metaRes.ok) {
    throw new Error('No se pudo acceder a la hoja de cálculo. Verifica permisos.');
  }
  const meta = await metaRes.json();
  const firstSheetTitle = meta.sheets?.[0]?.properties?.title || 'Sheet1';

  // Read data (first 50 rows)
  const range = `${firstSheetTitle}!A1:Z60`;
  const dataRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!dataRes.ok) {
    throw new Error('No se pudieron leer los valores de la hoja.');
  }
  const sheetValues = await dataRes.json();
  const rows: any[][] = sheetValues.values || [];

  if (rows.length === 0) {
    return {
      title: firstSheetTitle,
      rowsCount: 0,
      detectedSales: 0,
      detectedExpenses: 0,
      detectedProjections: 0,
      columnsFound: [],
      rawSample: [],
    };
  }

  // Header detection
  const headerRow = rows[0].map(c => String(c).trim().toLowerCase());
  let salesIdx = -1;
  let expenseIdx = -1;
  let projectionIdx = -1;

  headerRow.forEach((h, idx) => {
    if (h.includes('venta') || h.includes('ingreso') || h.includes('revenue') || h.includes('sales')) {
      if (salesIdx === -1) salesIdx = idx;
    }
    if (h.includes('gasto') || h.includes('egreso') || h.includes('cost') || h.includes('expense')) {
      if (expenseIdx === -1) expenseIdx = idx;
    }
    if (h.includes('proyecci') || h.includes('forecast') || h.includes('target') || h.includes('meta')) {
      if (projectionIdx === -1) projectionIdx = idx;
    }
  });

  let totalSales = 0;
  let totalExpenses = 0;
  let totalProjections = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (salesIdx >= 0 && row[salesIdx]) {
      const val = parseFloat(String(row[salesIdx]).replace(/[^0-9.-]/g, ''));
      if (!isNaN(val)) totalSales += val;
    }
    if (expenseIdx >= 0 && row[expenseIdx]) {
      const val = parseFloat(String(row[expenseIdx]).replace(/[^0-9.-]/g, ''));
      if (!isNaN(val)) totalExpenses += val;
    }
    if (projectionIdx >= 0 && row[projectionIdx]) {
      const val = parseFloat(String(row[projectionIdx]).replace(/[^0-9.-]/g, ''));
      if (!isNaN(val)) totalProjections += val;
    }
  }

  return {
    title: firstSheetTitle,
    rowsCount: rows.length - 1,
    detectedSales: Math.round(totalSales),
    detectedExpenses: Math.round(totalExpenses),
    detectedProjections: Math.round(totalProjections),
    columnsFound: rows[0].map(String),
    rawSample: rows.slice(0, 6),
  };
}

// Export final plan to a new Google Sheet
export async function createGoogleSheetReport(accessToken: string, title: string, reportData: any) {
  const body = {
    properties: {
      title: `${title} - ${new Date().getFullYear()}`,
    },
    sheets: [
      {
        properties: {
          title: 'Resumen Estratégico 360',
          gridProperties: { rowCount: 50, columnCount: 10 },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!createRes.ok) {
    throw new Error('Error al crear la hoja de cálculo en Google Drive.');
  }

  const newSheet = await createRes.json();
  const sheetId = newSheet.spreadsheetId;

  // Insert values
  const values = [
    ['ESTRATEGA DE PLANIFICACIÓN ANUAL 360° - VISUALIZADOR MENTAL', '', '', ''],
    ['Fecha de Generación:', new Date().toLocaleDateString(), 'Versión:', 'Plan Estratégico Integral'],
    [],
    ['1. ESCENARIO IDEAL (AÑO POSITIVO)', '', '', ''],
    ['Ingresos Proyectados:', reportData.ideal?.annualRevenue || 0, 'Gastos Anuales:', reportData.ideal?.annualExpenses || 0],
    ['Ahorro / Flujo Neto Estimado:', reportData.ideal?.netSavings || 0, 'Crecimiento:', `${reportData.ideal?.growthPct || 0}%`],
    ['Narrativa y Visión:', reportData.ideal?.narrative || ''],
    [],
    ['2. ESCENARIO REALISTA (CRASH A MITAD DE AÑO)', '', '', ''],
    ['Evento de Crisis Simulado:', reportData.crash?.crashEvent || 'Imprevisto mayor'],
    ['Mes del Crash:', reportData.crash?.crashMonth || 'Mes 6', 'Caída de Ingresos:', `${reportData.crash?.impactRevenueDropPct || 30}%`],
    ['Ingreso Ajustado con Crash:', reportData.crash?.annualRevenue || 0, 'Meses de Runway Restantes:', reportData.crash?.runwayMonthsLeft || 3],
    ['Acciones de Contingencia:', (reportData.crash?.contingencyActions || []).join(' | ')],
    ['Narrativa de Resiliencia:', reportData.crash?.narrative || ''],
    [],
    ['3. GESTIÓN DE CRISIS & DECISIÓN CRÉDITO VS INVERSIÓN', '', '', ''],
    ['Estrategia de Financiamiento:', reportData.crisisManagement?.recommendedFinancing || 'Reinvertir flujo'],
    ['Recomendación de Crédito:', reportData.crisisManagement?.creditRecommendation || ''],
    ['Asignación de Capital / Inversión:', reportData.crisisManagement?.investmentAllocation || ''],
    ['Recortes Inmediatos en Emergencia:', (reportData.crisisManagement?.immediateCuts || []).join(' | ')],
    [],
    ['4. PLAN DE ACCIÓN INMEDIATO (HOJA DE RUTA 12 MESES)', '', '', ''],
    ...((reportData.crisisManagement?.immediateActionPlan || []).map((step: string, idx: number) => [`Paso ${idx + 1}:`, step, '', ''])),
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:D${values.length}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  return {
    spreadsheetId: sheetId,
    webViewLink: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
  };
}

// Add Quarterly Strategic Checkpoints to Google Calendar
export async function scheduleStrategicCheckpointsInCalendar(accessToken: string, planTitle: string) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const milestones = [
    {
      summary: `[Estratega 360] Q1 Checkpoint: Revisión de Metas e Ingresos`,
      description: `Evaluación de primer trimestre del ${planTitle}. Verificar si la facturación y gastos fijos están en orden.`,
      startDate: new Date(currentYear, 2, 31, 10, 0, 0),
    },
    {
      summary: `[Estratega 360] Q2 Stress-Test: Simulacro Crash & Colchón de Emergencia`,
      description: `Revisión de mitad de año. Análisis de liquidez, imprevistos, y preparación del fondo de contingencia.`,
      startDate: new Date(currentYear, 5, 30, 10, 0, 0),
    },
    {
      summary: `[Estratega 360] Q3 Checkpoint: Decisión de Crédito vs Reinversión`,
      description: `Verificación del ROI de proyectos y evaluación si conviene solicitar apalancamiento financiero o sostener ahorro.`,
      startDate: new Date(currentYear, 8, 30, 10, 0, 0),
    },
    {
      summary: `[Estratega 360] Q4 Cierre Anual & Balance 360°`,
      description: `Balance de resultados del año contra el Escenario Ideal vs Realista.`,
      startDate: new Date(currentYear, 11, 20, 10, 0, 0),
    },
  ];

  const createdEvents = [];
  for (const item of milestones) {
    const endDate = new Date(item.startDate.getTime() + 60 * 60 * 1000); // 1 hour
    const eventBody = {
      summary: item.summary,
      description: item.description,
      start: { dateTime: item.startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 },
          { method: 'email', minutes: 24 * 60 * 2 },
        ],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (res.ok) {
      const ev = await res.json();
      createdEvents.push(ev);
    }
  }

  return createdEvents;
}
