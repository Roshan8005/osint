import React, { useRef, useEffect } from 'react';
import { Terminal, Copy, Trash2, Check } from 'lucide-react';

interface TerminalLogProps {
  logs: string[];
  onClear: () => void;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLog = (line: string) => {
    if (line.includes('[+]') || line.includes('VERIFIED')) {
      return <span className="text-emerald-400 font-semibold">{line}</span>;
    }
    if (line.includes('[-]') || line.includes('NOT FOUND')) {
      return <span className="text-slate-500">{line}</span>;
    }
    if (line.includes('[!]') || line.includes('RATE LIMITED') || line.includes('WARN')) {
      return <span className="text-amber-400">{line}</span>;
    }
    if (line.includes('[*]') || line.includes('SCAN') || line.includes('INIT')) {
      return <span className="text-cyan-400">{line}</span>;
    }
    return <span className="text-slate-300">{line}</span>;
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
      <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">Live OSINT Execution Log</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
            {logs.length} lines
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLogs}
            className="p-1 hover:text-slate-200 text-slate-400 rounded hover:bg-slate-800 transition"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            className="p-1 hover:text-rose-300 text-slate-400 rounded hover:bg-slate-800 transition"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3 max-h-52 overflow-y-auto space-y-1 bg-slate-950 font-mono text-[11px] leading-relaxed">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">Engine idle. Initiate an inquiry to stream audit events...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="font-mono whitespace-pre-wrap break-all">
              {formatLog(log)}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
