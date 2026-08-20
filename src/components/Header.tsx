import React from 'react';
import { RefreshCw, Wifi, Usb, Terminal, Code2, Monitor, Radio, Keyboard } from 'lucide-react';
import { Device } from '../types';
import { isElectron } from '../lib/api';

interface HeaderProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenWireless: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  onOpenCodeViewer: () => void;
  isMirroringActive: boolean;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onRefresh,
  isRefreshing,
  onOpenWireless,
  onToggleTerminal,
  isTerminalOpen,
  onOpenCodeViewer,
  isMirroringActive,
  onOpenShortcuts,
}) => {
  return (
    <header className="border-b border-[#30363D] bg-[#161B22] sticky top-0 z-30 select-none">
      {/* macOS Native Titlebar Area */}
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Left: Window Traffic Lights & Brand */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
          </div>

          <div className="h-4 w-px bg-[#30363D] hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-[#E2E8F0]">Scrcpy Hub</h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-blue-400 font-mono">
                  {isElectron ? 'Electron' : 'v2.4 GUI'}
                </span>
                {isMirroringActive && (
                  <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Device Selector & Scanner */}
        <div className="flex items-center gap-2.5 max-w-md w-full justify-center">
          <div className="relative flex-1 max-w-xs">
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                {selectedDevice?.isWireless ? (
                  <Wifi className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Usb className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <select
                id="device-selector"
                value={selectedDevice?.serial || ''}
                onChange={(e) => {
                  const target = devices.find((d) => d.serial === e.target.value);
                  if (target) onSelectDevice(target);
                }}
                className="w-full pl-8 pr-8 py-1.5 bg-[#0D1117] hover:bg-[#111620] border border-[#30363D] rounded-md text-xs font-medium text-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer truncate"
              >
                {devices.length === 0 ? (
                  <option value="" disabled>No devices detected</option>
                ) : (
                  devices.map((dev) => (
                    <option key={dev.serial} value={dev.serial}>
                      {dev.model} ({dev.isWireless ? 'Wi-Fi' : 'USB'} • {dev.serial})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-3 pointer-events-none text-[10px] text-gray-500">
                ▾
              </div>
            </div>
          </div>

          <button
            id="refresh-devices-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Scan for connected ADB devices"
            className="p-2 bg-[#0D1117] hover:bg-[#30363D] active:scale-95 border border-[#30363D] rounded-md text-gray-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
          </button>

          <button
            id="wireless-pair-btn"
            onClick={onOpenWireless}
            title="Wireless ADB Pair / Connect"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1117] hover:bg-[#30363D] border border-[#30363D] rounded-md text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            <Wifi className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Wireless</span>
          </button>
        </div>

        {/* Right: Tools & Utilities */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-terminal-btn"
            onClick={onToggleTerminal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              isTerminalOpen
                ? 'bg-[#30363D] text-blue-400 border-[#30363D]'
                : 'bg-[#0D1117] text-gray-400 border-[#30363D] hover:text-gray-200 hover:bg-[#30363D]'
            }`}
            title="Toggle Console Output"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logs</span>
          </button>

          <button
            id="view-codebase-btn"
            onClick={onOpenCodeViewer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1117] hover:bg-[#30363D] text-gray-400 hover:text-gray-200 border border-[#30363D] rounded-md text-xs font-medium transition-colors"
            title="Inspect Electron Files (main.js, preload.cjs, package.json)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Electron Files</span>
          </button>

          <button
            id="open-shortcuts-btn"
            onClick={onOpenShortcuts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1117] hover:bg-[#30363D] text-gray-400 hover:text-gray-200 border border-[#30363D] rounded-md text-xs font-medium transition-colors"
            title="Keyboard Shortcuts Cheat Sheet"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Shortcuts</span>
          </button>
        </div>
      </div>
    </header>
  );
};
