import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, Search, Terminal, Trash2 } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TerminalLogs = memo(function TerminalLogs({
  logs,
  onClearLogs,
  isOpen,
  onToggle,
}: TerminalLogsProps) {
  const [filterText, setFilterText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const matchesFilter = !filterText || log.message.toLowerCase().includes(filterText.toLowerCase()) || (log.serial && log.serial.includes(filterText));
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesFilter && matchesLevel;
  }), [filterText, logs, selectedLevel]);

  const handleCopyLogs = useCallback(() => {
    const text = filteredLogs
      .map((log) => `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] ${log.serial ? `(${log.serial}) ` : ''}${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filteredLogs]);

  return (
    <section className="mt-auto border-t border-[var(--border)] bg-[rgba(16,17,19,0.78)] backdrop-blur-xl">
      <div className="flex min-h-11 items-center justify-between gap-3 px-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text)]"
        >
          <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
          Logs
          <span className="mono rounded-[6px] bg-white/[0.045] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
            {logs.length}
          </span>
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        {isOpen && (
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Filter"
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
                className="field mono h-7 min-h-7 w-44 pl-7 text-[11px]"
              />
            </div>

            <select
              value={selectedLevel}
              onChange={(event) => setSelectedLevel(event.target.value)}
              className="field mono h-7 min-h-7 w-28 text-[11px]"
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="stdout">Stdout</option>
              <option value="stderr">Stderr</option>
              <option value="error">Error</option>
              <option value="warn">Warn</option>
            </select>

            <button type="button" onClick={handleCopyLogs} className="btn btn-icon h-7 min-h-7 w-7" title="Copy visible logs">
              {copied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            <button type="button" onClick={onClearLogs} className="btn btn-icon h-7 min-h-7 w-7" title="Clear logs">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="scrollbar-soft h-56 overflow-y-auto border-t border-[var(--border)] bg-[#0c0d0f] px-5 py-3 font-mono text-[11px] leading-5">
          {filteredLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[12px] text-[var(--text-muted)]">
              No matching logs.
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              const levelClass =
                log.level === 'error' || log.level === 'stderr'
                  ? 'text-[var(--error)]'
                  : log.level === 'warn'
                  ? 'text-[var(--warning)]'
                  : log.level === 'stdout'
                  ? 'text-[var(--success)]'
                  : 'text-[var(--accent)]';

              return (
                <div key={`${log.timestamp}-${index}`} className="grid grid-cols-[74px_54px_minmax(0,1fr)] gap-3 rounded-[6px] px-2 py-0.5 text-[var(--text-secondary)] hover:bg-white/[0.035]">
                  <span className="text-[var(--text-muted)]">{time}</span>
                  <span className={`uppercase ${levelClass}`}>{log.level}</span>
                  <span className="min-w-0 break-all">
                    {log.serial && <span className="mr-2 text-[var(--text-muted)]">[{log.serial}]</span>}
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </section>
  );
});
