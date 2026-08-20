import { Device, ScrcpyConfig, LogEntry, SystemStatus } from '../types';

declare global {
  interface Window {
    api?: {
      getDevices: () => Promise<{ success: boolean; devices: Device[]; error?: string }>;
      connectWireless: (data: { ip: string; port?: number }) => Promise<{ success: boolean; message?: string; error?: string }>;
      disconnectWireless: (target: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      startScrcpy: (config: ScrcpyConfig) => Promise<{ success: boolean; serial?: string; command?: string; error?: string }>;
      stopScrcpy: (serial?: string) => Promise<{ success: boolean; error?: string }>;
      checkBinaries: () => Promise<SystemStatus>;
      openRecordingsFolder: () => Promise<{ success: boolean; path?: string }>;
      onScrcpyLog: (callback: (log: LogEntry) => void) => () => void;
      onSessionStatusChanged: (callback: (status: any) => void) => () => void;
    };
  }
}

export const isElectron = typeof window !== 'undefined' && Boolean(window.api);

export const apiClient = {
  async getDevices(): Promise<{ success: boolean; devices: Device[]; error?: string }> {
    if (isElectron && window.api?.getDevices) {
      return window.api.getDevices();
    }
    try {
      const res = await fetch('/api/devices');
      return await res.json();
    } catch (err: any) {
      return { success: false, devices: [], error: err.message };
    }
  },

  async startScrcpy(config: ScrcpyConfig): Promise<{ success: boolean; serial?: string; command?: string; error?: string }> {
    if (isElectron && window.api?.startScrcpy) {
      return window.api.startScrcpy(config);
    }
    try {
      const res = await fetch('/api/start-scrcpy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async stopScrcpy(serial?: string): Promise<{ success: boolean; error?: string }> {
    if (isElectron && window.api?.stopScrcpy) {
      return window.api.stopScrcpy(serial);
    }
    try {
      const res = await fetch('/api/stop-scrcpy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async connectWireless(ip: string, port = 5555): Promise<{ success: boolean; message?: string; error?: string }> {
    if (isElectron && window.api?.connectWireless) {
      return window.api.connectWireless({ ip, port });
    }
    try {
      const res = await fetch('/api/connect-wireless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async disconnectWireless(target: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (isElectron && window.api?.disconnectWireless) {
      return window.api.disconnectWireless(target);
    }
    try {
      const res = await fetch('/api/disconnect-wireless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async openRecordingsFolder(): Promise<{ success: boolean; path?: string; error?: string }> {
    if (isElectron && window.api?.openRecordingsFolder) {
      return window.api.openRecordingsFolder();
    }
    try {
      const res = await fetch('/api/open-recordings', { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async checkBinaries(): Promise<SystemStatus> {
    if (isElectron && window.api?.checkBinaries) {
      return window.api.checkBinaries();
    }
    try {
      const res = await fetch('/api/check-binaries');
      return await res.json();
    } catch (err) {
      return {
        adb: { available: true, version: 'ADB Web Proxy v1.0.41' },
        scrcpy: { available: true, version: 'scrcpy v2.4 (Virtual Bridge)' },
      };
    }
  },

  async getLogs(): Promise<LogEntry[]> {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      return data.logs || [];
    } catch (e) {
      return [];
    }
  },

  async clearLogs(): Promise<void> {
    try {
      await fetch('/api/clear-logs', { method: 'POST' });
    } catch (e) {}
  },

  async triggerDeviceAction(serial: string, action: string): Promise<void> {
    try {
      await fetch('/api/device-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial, action }),
      });
    } catch (e) {}
  },
};
