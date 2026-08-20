import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'MOD + f', description: 'Toggle Fullscreen' },
    { key: 'MOD + g', description: 'Resize window to 1:1 scale' },
    { key: 'MOD + x', description: 'Resize window to remove black borders' },
    { key: 'MOD + h', description: 'Press HOME button' },
    { key: 'MOD + b', description: 'Press BACK button' },
    { key: 'MOD + s', description: 'Open App Switcher (Recents)' },
    { key: 'MOD + m', description: 'Press MENU button' },
    { key: 'MOD + p', description: 'Press POWER button' },
    { key: 'MOD + o', description: 'Turn device screen OFF (mirroring stays ON)' },
    { key: 'MOD + Shift + o', description: 'Turn device screen ON' },
    { key: 'MOD + r', description: 'Rotate device display' },
    { key: 'MOD + n', description: 'Expand notification panel' },
    { key: 'MOD + Shift + n', description: 'Collapse notification panel' },
    { key: 'MOD + c', description: 'Copy device clipboard to computer' },
    { key: 'MOD + v', description: 'Paste computer clipboard to device' },
    { key: 'MOD + Shift + v', description: 'Inject computer clipboard as text' },
    { key: 'MOD + i', description: 'Toggle FPS counter in terminal' },
    { key: 'Right-Click', description: 'Press BACK (or turn screen on if off)' },
    { key: 'Middle-Click', description: 'Press HOME button' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#E2E8F0] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363D] bg-[#0D1117] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E2E8F0]">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-gray-400">Essential controls for Scrcpy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#30363D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <div className="mb-4 p-3 bg-blue-600/5 border border-blue-500/20 rounded-lg">
            <p className="text-[11px] text-blue-400">
              <span className="font-semibold uppercase mr-1">Note:</span> 
              MOD defaults to <span className="text-blue-300 font-mono">Left Alt</span> or <span className="text-blue-300 font-mono">Left Super</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2.5 bg-[#0D1117] border border-[#30363D] rounded-lg hover:border-[#444c56] transition-colors"
              >
                <span className="text-[11px] text-gray-300">{shortcut.description}</span>
                <kbd className="px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-[10px] font-mono text-blue-400 shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#30363D] bg-[#0D1117] shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#30363D] hover:bg-[#444c56] text-white text-xs font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
