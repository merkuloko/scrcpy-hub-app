import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'MOD + f', description: 'Toggle fullscreen' },
    { key: 'MOD + g', description: 'Resize window to 1:1 scale' },
    { key: 'MOD + x', description: 'Remove black borders' },
    { key: 'MOD + h', description: 'Home button' },
    { key: 'MOD + b', description: 'Back button' },
    { key: 'MOD + s', description: 'App switcher' },
    { key: 'MOD + p', description: 'Power button' },
    { key: 'MOD + o', description: 'Turn device screen off' },
    { key: 'MOD + Shift + o', description: 'Turn device screen on' },
    { key: 'MOD + r', description: 'Rotate display' },
    { key: 'MOD + n', description: 'Expand notifications' },
    { key: 'MOD + c', description: 'Copy device clipboard' },
    { key: 'MOD + v', description: 'Paste to device' },
    { key: 'Right click', description: 'Back' },
    { key: 'Middle click', description: 'Home' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[86vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text)] shadow-[var(--shadow-popover)]">
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[9px] border border-[var(--border)] bg-white/[0.045] text-[var(--accent)]">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">Keyboard shortcuts</h3>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Common scrcpy controls for active sessions.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-icon h-7 min-h-7 w-7" title="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="scrollbar-soft overflow-y-auto px-5 py-4">
          <div className="mb-4 rounded-[10px] border border-[var(--border)] bg-white/[0.03] px-3 py-2 text-[12px] text-[var(--text-secondary)]">
            MOD defaults to Left Alt or Left Super.
          </div>

          <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
            {shortcuts.map((shortcut) => (
              <div key={`${shortcut.key}-${shortcut.description}`} className="flex items-center justify-between gap-4 border-t border-[var(--border)] py-2.5 first:border-t-0 md:[&:nth-child(2)]:border-t-0">
                <span className="text-[12px] text-[var(--text-secondary)]">{shortcut.description}</span>
                <kbd className="mono shrink-0 rounded-[6px] border border-[var(--border)] bg-white/[0.045] px-2 py-1 text-[11px] text-[var(--text)]">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-[var(--border)] px-5 py-3">
          <button type="button" onClick={onClose} className="btn">Close</button>
        </div>
      </div>
    </div>
  );
};
