import React, { useState } from 'react';
import { ScenarioProjections, GoogleWorkspaceState } from '../types';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Calendar, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  DollarSign,
  Activity,
  Layers
} from 'lucide-react';
import { createGoogleSheetReport, scheduleStrategicCheckpointsInCalendar } from '../lib/workspace';
import confetti from 'canvas-confetti';

interface ScenarioVisualizerProps {
  report: ScenarioProjections;
  workspace: GoogleWorkspaceState;
  onConnectGoogle: () => void;
}

export const ScenarioVisualizer: React.FC<ScenarioVisualizerProps> = ({
  report,
  workspace,
  onConnectGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ideal' | 'crash' | 'crisis'>('all');
  const [exportingSheet, setExportingSheet] = useState(false);
  const [schedulingCalendar, setSchedulingCalendar] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);
  const [calendarSuccess, setCalendarSuccess] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleExportToSheets = async () => {
    if (!workspace.isConnected || !workspace.accessToken) {
      onConnectGoogle();
      return;
    }
    setExportingSheet(true);
    setFeedbackMsg(null);
    try {
      const result = await createGoogleSheetReport(
        workspace.accessToken,
        'Plan Anual 360 - Estrategia Financiera',
        report
      );
      setExportedSheetUrl(result.webViewLink);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setFeedbackMsg('¡Hoja de cálculo creada exitosamente en tu Google Drive!');
    } catch (err: any) {
      setFeedbackMsg(`Error exportando a Google Sheets: ${err.message}`);
    } finally {
      setExportingSheet(false);
    }
  };

  const handleScheduleCalendar = async () => {
    if (!workspace.isConnected || !workspace.accessToken) {
      onConnectGoogle();
      return;
    }
    setSchedulingCalendar(true);
    setFeedbackMsg(null);
    try {
      await scheduleStrategicCheckpointsInCalendar(
        workspace.accessToken,
        'Estrategia Anual 360'
      );
      setCalendarSuccess(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setFeedbackMsg('¡4 Checkpoints trimestrales agendados en tu Google Calendar!');
    } catch (err: any) {
      setFeedbackMsg(`Error agendando en Calendar: ${err.message}`);
    } finally {
      setSchedulingCalendar(false);
    }
  };

  return (
    <div id="scenario-visualizer-container" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Visualizador Mental 360° Completado
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Los Tres Escenarios de tu Próximo Año
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Proyecciones matemáticas y de contingencia para maximizar tu crecimiento y blindar tu economía ante cualquier crash a mitad de año.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="export-sheet-btn"
              onClick={handleExportToSheets}
              disabled={exportingSheet}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {exportingSheet ? 'Creando Sheet...' : 'Guardar en Google Sheets'}
            </button>

            <button
              id="schedule-calendar-btn"
              onClick={handleScheduleCalendar}
              disabled={schedulingCalendar || calendarSuccess}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
            >
              <Calendar className="w-4 h-4" />
              {schedulingCalendar ? 'Agendando...' : calendarSuccess ? 'Checkpoints Listos' : 'Agendar Hitos en Calendar'}
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <span>{feedbackMsg}</span>
            {exportedSheetUrl && (
              <a
                href={exportedSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold ml-2 hover:text-white"
              >
                Abrir Sheet en nueva pestaña &rarr;
              </a>
            )}
          </div>
        )}

        {/* Navigation Tabs for Views */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vista Panorámica (360°)
          </button>
          <button
            onClick={() => setActiveTab('ideal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'ideal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            1. Año Positivo (Ideal)
          </button>
          <button
            onClick={() => setActiveTab('crash')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'crash'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            2. Año Realista (Crash)
          </button>
          <button
            onClick={() => setActiveTab('crisis')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'crisis'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            3. Gestión de Crisis & Soluciones
          </button>
        </div>
      </div>

      {/* Grid of the 3 Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario 1: Año Positivo */}
        {(activeTab === 'all' || activeTab === 'ideal') && (
          <div
            id="scenario-ideal-card"
            className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                  +{report.ideal.growthPct}% Crecimiento
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {report.ideal.name}
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Proyección en optimización máxima: metas de negocio y experiencias logradas sin fricción.
              </p>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                  <div className="text-[11px] text-slate-400">Ingresos Anuales</div>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                    ${report.ideal.annualRevenue?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                  <div className="text-[11px] text-slate-400">Ahorro / Flujo Neto</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">
                    ${report.ideal.netSavings?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 mb-4">
                <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                  Narrativa Estratégica
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.ideal.narrative}
                </p>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Hitos Trimestrales Clave
                </h4>
                {report.ideal.keyMilestones?.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-750">
                    <span className="font-bold text-emerald-400 shrink-0">{m.quarter}:</span>
                    <div>
                      <div className="font-semibold text-white">{m.title}</div>
                      <div className="text-slate-400 text-[11px]">{m.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scenario 2: Año Realista con Crash */}
        {(activeTab === 'all' || activeTab === 'crash') && (
          <div
            id="scenario-crash-card"
            className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2.5 py-1 rounded-full border border-amber-800">
                  Crash Simulado en {report.crash.crashMonth}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {report.crash.name}
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Stress-test real: caída del {report.crash.impactRevenueDropPct}% por {report.crash.crashEvent}.
              </p>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                  <div className="text-[11px] text-slate-400">Ingreso Ajustado</div>
                  <div className="text-lg font-extrabold text-amber-400 mt-0.5">
                    ${report.crash.annualRevenue?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                  <div className="text-[11px] text-slate-400">Colchón Restante</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">
                    {report.crash.runwayMonthsLeft} Meses
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 mb-4">
                <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                  Impacto y Resiliencia
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.crash.narrative}
                </p>
              </div>

              {/* Contingency Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Plan de Choque & Contingencia
                </h4>
                {report.crash.contingencyActions?.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-750">
                    <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scenario 3: Gestión de Crisis / Soluciones */}
        {(activeTab === 'all' || activeTab === 'crisis') && (
          <div
            id="scenario-crisis-card"
            className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800">
                  {report.crisisManagement.recommendedFinancing.toUpperCase()}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {report.crisisManagement.name}
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Decisiones de apalancamiento, blindaje de capital y umbral de rentabilidad.
              </p>

              {/* Strategy Details */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 mb-4 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                    Crédito vs Reinversión
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.crisisManagement.creditRecommendation}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Regla de ROI Exigido
                  </h4>
                  <p className="text-xs text-slate-300">
                    {report.crisisManagement.roiThreshold}
                  </p>
                </div>
              </div>

              {/* Immediate Cuts */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-2">
                  Recortes de Primer Orden (24-48h)
                </h4>
                <div className="space-y-1.5">
                  {report.crisisManagement.immediateCuts?.map((cut, idx) => (
                    <div key={idx} className="text-xs text-slate-300 bg-rose-950/30 border border-rose-900/40 p-2 rounded-lg flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{cut}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Plan */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Acciones Inmediatas (Hoja de Ruta)
                </h4>
                {report.crisisManagement.immediateActionPlan?.slice(0, 3).map((plan, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-750">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{plan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
