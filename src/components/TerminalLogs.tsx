import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Copy, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  onClearLogs,
  isOpen,
  onToggle,
}) => {
  const [filterText, setFilterText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = !filterText || log.message.toLowerCase().includes(filterText.toLowerCase()) || (log.serial && log.serial.includes(filterText));
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesFilter && matchesLevel;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.serial ? `(${l.serial}) ` : ''}${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-[#30363D] bg-[#0F1115] transition-all">
      {/* Header Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between border-b border-[#30363D] select-none bg-[#161B22]">
        <div
          onClick={onToggle}
          className="flex items-center gap-2 text-xs font-semibold text-[#E2E8F0] cursor-pointer hover:text-white transition-colors"
        >
          <Terminal className="w-4 h-4 text-blue-400" />
          <span>Console & Execution Logs</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-blue-400 font-mono">
            {logs.length} entries
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-400" />}
        </div>

        {isOpen && (
          <div className="flex items-center gap-2">
            {/* Filter Search */}
            <div className="relative flex items-center">
              <Search className="w-3 h-3 text-gray-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-7 pr-2 py-1 bg-[#0D1117] border border-[#30363D] rounded-md text-[11px] text-[#E2E8F0] focus:outline-none focus:border-blue-500 w-36 sm:w-48 font-mono"
              />
            </div>

            {/* Level Selector */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-2 py-1 bg-[#0D1117] border border-[#30363D] rounded-md text-[11px] text-gray-300 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="stdout">Stdout</option>
              <option value="stderr">Stderr</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
            </select>

            <button
              onClick={handleCopyLogs}
              className="p-1 px-2.5 rounded-md bg-[#0D1117] hover:bg-[#30363D] border border-[#30363D] text-gray-300 text-[11px] font-medium transition-colors flex items-center gap-1"
              title="Copy visible logs to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClearLogs}
              className="p-1 px-2.5 rounded-md bg-[#0D1117] hover:bg-rose-950/40 hover:border-rose-800/60 border border-[#30363D] text-gray-400 hover:text-rose-300 text-[11px] font-medium transition-colors flex items-center gap-1"
              title="Clear all logs"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Log Output Area */}
      {isOpen && (
        <div className="h-52 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1 bg-[#090D11] select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-600 italic text-center py-8">
              No console logs matching filter. Start a session to view live ADB / Scrcpy stream.
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              let levelColor = 'text-gray-300';
              let badgeColor = 'bg-[#161B22] text-gray-400 border-[#30363D]';

              if (log.level === 'info') {
                levelColor = 'text-blue-300';
                badgeColor = 'bg-blue-950/60 text-blue-400 border-blue-800/50';
              } else if (log.level === 'warn') {
                levelColor = 'text-yellow-300';
                badgeColor = 'bg-yellow-950/60 text-yellow-400 border-yellow-800/50';
              } else if (log.level === 'error') {
                levelColor = 'text-rose-300';
                badgeColor = 'bg-rose-950/60 text-rose-400 border-rose-800/50';
              } else if (log.level === 'stdout') {
                levelColor = 'text-emerald-300';
                badgeColor = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50';
              } else if (log.level === 'stderr') {
                levelColor = 'text-rose-400';
                badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800';
              }

              return (
                <div key={idx} className="flex items-start gap-2.5 hover:bg-[#161B22]/50 px-2 py-0.5 rounded">
                  <span className="text-gray-500 select-none text-[10px]">{time}</span>
                  <span className={`text-[9px] px-1 rounded uppercase font-semibold border ${badgeColor}`}>
                    {log.level}
                  </span>
                  {log.serial && (
                    <span className="text-[10px] text-purple-400 font-mono">[{log.serial}]</span>
                  )}
                  <span className={`flex-1 break-all ${levelColor}`}>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
};
