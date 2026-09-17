import React, { useState } from 'react';
import { GoogleWorkspaceState } from '../types';
import { listUserSpreadsheets, inspectSpreadsheetData } from '../lib/workspace';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Database,
  TrendingUp,
  CreditCard,
  Target
} from 'lucide-react';

interface SheetConnectorProps {
  workspace: GoogleWorkspaceState;
  onSelectSheet: (sheetId: string, sheetName: string, summary: any) => void;
  onConnectGoogle: () => void;
  isLoading: boolean;
}

export const SheetConnector: React.FC<SheetConnectorProps> = ({
  workspace,
  onSelectSheet,
  onConnectGoogle,
  isLoading,
}) => {
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDriveSheets = async () => {
    if (!workspace.accessToken) return;
    setLoadingSheets(true);
    setErrorMsg(null);
    try {
      const files = await listUserSpreadsheets(workspace.accessToken);
      setSpreadsheets(files);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error listando archivos de Google Drive');
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleInspectAndSelect = async (sheetId: string, name: string) => {
    if (!workspace.accessToken) return;
    setLoadingSheets(true);
    setErrorMsg(null);
    try {
      const summary = await inspectSpreadsheetData(workspace.accessToken, sheetId);
      onSelectSheet(sheetId, name, summary);
    } catch (err: any) {
      setErrorMsg(`No se pudo leer la hoja: ${err.message}. Asegúrate de tener permisos.`);
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSheetInput.trim()) return;
    // Extract ID from URL if full URL is pasted
    let id = manualSheetInput.trim();
    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }
    handleInspectAndSelect(id, 'Hoja Vinculada');
  };

  return (
    <div id="sheet-connector-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm tracking-wide">
              Conexión Google Sheets & Drive
            </h3>
            <p className="text-xs text-slate-400">
              Cruce automático de 'Ventas', 'Gastos' y 'Proyecciones'
            </p>
          </div>
        </div>

        {workspace.isConnected ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-600/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
          </span>
        ) : (
          <button
            onClick={onConnectGoogle}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            Conectar Google Workspace
          </button>
        )}
      </div>

      {workspace.isConnected ? (
        <div className="space-y-4">
          {workspace.activeSheetId ? (
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                    {workspace.activeSheetName || 'Hoja Activa'}
                  </span>
                </div>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${workspace.activeSheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {workspace.sheetDataSummary && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700/50">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <TrendingUp className="w-3 h-3 text-emerald-400" /> Ventas
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      ${workspace.sheetDataSummary.totalSalesDetected?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700/50">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <CreditCard className="w-3 h-3 text-rose-400" /> Gastos
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      ${workspace.sheetDataSummary.totalExpensesDetected?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700/50">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Target className="w-3 h-3 text-cyan-400" /> Proyección
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      ${workspace.sheetDataSummary.projectionsDetected?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  Selecciona una hoja de cálculo existente o pega su URL/ID:
                </p>
                <button
                  onClick={fetchDriveSheets}
                  disabled={loadingSheets}
                  className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingSheets ? 'animate-spin' : ''}`} /> Buscar en Drive
                </button>
              </div>

              {spreadsheets.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {spreadsheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => handleInspectAndSelect(sheet.id, sheet.name)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs flex items-center justify-between text-slate-200 hover:text-white transition-colors"
                    >
                      <span className="truncate max-w-[220px] font-medium">{sheet.name}</span>
                      <span className="text-[10px] text-emerald-400">Vincular &rarr;</span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pega URL o ID de Google Sheets..."
                  value={manualSheetInput}
                  onChange={(e) => setManualSheetInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={loadingSheets || !manualSheetInput.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                >
                  Conectar
                </button>
              </form>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-2 px-1">
          <p className="text-xs text-slate-400 leading-relaxed">
            Conecta tu cuenta para contrastar en vivo tus proyecciones con tus ingresos y gastos registrados en Drive & Sheets.
          </p>
        </div>
      )}
    </div>
  );
};
