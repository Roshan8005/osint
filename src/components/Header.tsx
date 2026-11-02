import React from 'react';
import {
  Shield,
  Activity,
  Download,
  FileText,
  Lock,
  Database,
  Terminal,
} from 'lucide-react';
import type { InvestigationCase } from '../types/osint';

interface HeaderProps {
  currentCase?: InvestigationCase | null;
  onOpenReport: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  isScanning: boolean;
  activeScanType?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentCase,
  onOpenReport,
  onExportCsv,
  onExportJson,
  isScanning,
  activeScanType,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-inner">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              ContactTrace <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">v3.0 FREE OSINT</span>
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              OPEN-SOURCE ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Independent Intelligence Engine &bull; Zero Paid Broker APIs &bull; Self-Hosted
          </p>
        </div>
      </div>

      {/* Target status / active state */}
      <div className="flex items-center gap-3 flex-wrap">
        {currentCase ? (
          <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md text-xs">
            <span className="text-slate-400">Active Target:</span>
            <span className="font-mono text-cyan-300 font-semibold max-w-[140px] truncate">
              {currentCase.target}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {currentCase.targetType}
            </span>
          </div>
        ) : null}

        {isScanning && (
          <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded bg-amber-950/50 text-amber-300 border border-amber-800/60 animate-pulse">
            <Activity className="w-3.5 h-3.5 animate-spin" />
            <span>Scanning {activeScanType || 'targets'}...</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenReport}
            title="Generate Dossier PDF"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dossier Report</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              onClick={onExportCsv}
              title="Export findings as CSV"
              className="flex items-center gap-1 text-xs px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={onExportJson}
              title="Export full case as JSON"
              className="flex items-center gap-1 text-xs px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
