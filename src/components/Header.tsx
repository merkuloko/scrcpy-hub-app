import React from 'react';
import {
  Code2,
  Keyboard,
  Monitor,
  PanelLeft,
  RefreshCw,
  Smartphone,
  Terminal,
  Usb,
  Wifi,
} from 'lucide-react';
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
  const connectedCount = devices.filter((device) => device.state === 'device').length;

  return (
    <aside className="mac-sidebar window-drag-region hidden w-[240px] shrink-0 flex-col px-3 pb-4 pt-4 lg:flex">
      <div className="h-8" />

      <div className="no-drag flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border)] bg-white/[0.04] text-[var(--accent)]">
          <Monitor className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-4 text-[var(--text)]">Scrcpy Hub</div>
          <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            {isElectron ? 'macOS utility' : 'web fallback'}
          </div>
        </div>
      </div>

      <nav className="no-drag mt-6 space-y-1">
        <button className="flex w-full items-center gap-2.5 rounded-[9px] bg-white/[0.06] px-2.5 py-2 text-left text-[12px] font-medium text-[var(--text)] ring-1 ring-inset ring-white/[0.04]">
          <Smartphone className="h-4 w-4 text-[var(--accent)]" />
          Devices
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[12px] font-medium text-[var(--text-muted)] transition hover:bg-white/[0.03] hover:text-[var(--text-secondary)]">
          <Monitor className="h-4 w-4" />
          Mirror
        </button>
        <button
          type="button"
          onClick={onToggleTerminal}
          className={`flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[12px] font-medium transition ${
            isTerminalOpen
              ? 'bg-white/[0.06] text-[var(--text)] ring-1 ring-inset ring-white/[0.04]'
              : 'text-[var(--text-muted)] hover:bg-white/[0.03] hover:text-[var(--text-secondary)]'
          }`}
        >
          <Terminal className="h-4 w-4" />
          Logs
        </button>
      </nav>

      <div className="no-drag mt-6 border-t border-[var(--border)] pt-4">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="label">Selected device</span>
          <button
            id="refresh-devices-btn"
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Scan for connected ADB devices"
            className="btn btn-icon h-7 min-h-7 w-7"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
          </button>
        </div>

        <div className="relative">
          <select
            id="device-selector"
            value={selectedDevice?.serial || ''}
            onChange={(event) => {
              const target = devices.find((device) => device.serial === event.target.value);
              if (target) onSelectDevice(target);
            }}
            className="field w-full appearance-none pl-9 pr-8"
          >
            {devices.length === 0 ? (
              <option value="" disabled>No devices detected</option>
            ) : (
              devices.map((device) => (
                <option key={device.serial} value={device.serial}>
                  {device.model} ({device.isWireless ? 'Wi-Fi' : 'USB'})
                </option>
              ))
            )}
          </select>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {selectedDevice?.isWireless ? <Wifi className="h-3.5 w-3.5" /> : <Usb className="h-3.5 w-3.5" />}
          </div>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">
            v
          </div>
        </div>

        <div className="mt-3 rounded-[10px] border border-[var(--border)] bg-white/[0.025] p-3">
          <div className="flex items-center justify-between">
            <span className="caption">Connected</span>
            <span className="mono text-[12px] text-[var(--text-secondary)]">{connectedCount}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`status-dot ${isMirroringActive ? 'status-success' : connectedCount ? 'status-warning' : 'status-error'}`} />
            <span className="text-[12px] text-[var(--text-secondary)]">
              {isMirroringActive ? 'Mirroring active' : connectedCount ? 'Ready' : 'No hardware'}
            </span>
          </div>
        </div>
      </div>

      <div className="no-drag mt-auto space-y-1 border-t border-[var(--border)] pt-4">
        <button
          id="wireless-pair-btn"
          type="button"
          onClick={onOpenWireless}
          className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[12px] font-medium text-[var(--text-muted)] transition hover:bg-white/[0.03] hover:text-[var(--text-secondary)]"
          title="Wireless ADB Pair / Connect"
        >
          <Wifi className="h-4 w-4" />
          Wireless
        </button>
        <button
          id="view-codebase-btn"
          type="button"
          onClick={onOpenCodeViewer}
          className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[12px] font-medium text-[var(--text-muted)] transition hover:bg-white/[0.03] hover:text-[var(--text-secondary)]"
          title="Inspect Electron Files"
        >
          <Code2 className="h-4 w-4" />
          Electron Files
        </button>
        <button
          id="open-shortcuts-btn"
          type="button"
          onClick={onOpenShortcuts}
          className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[12px] font-medium text-[var(--text-muted)] transition hover:bg-white/[0.03] hover:text-[var(--text-secondary)]"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="h-4 w-4" />
          Shortcuts
        </button>
        <div className="flex items-center gap-2 px-2.5 pt-3 text-[11px] text-[var(--text-muted)]">
          <PanelLeft className="h-3.5 w-3.5" />
          <span>ADB 5037</span>
        </div>
      </div>
    </aside>
  );
};
