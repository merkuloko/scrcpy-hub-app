import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { TerminalLogs } from './components/TerminalLogs';
import { WirelessModal } from './components/WirelessModal';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { apiClient, isElectron } from './lib/api';
import { Device, ScrcpyConfig, LogEntry } from './types';
import {
  Play,
  Square,
  Sliders,
  Tv,
  Gauge,
  Volume2,
  VolumeX,
  Mic,
  Smartphone,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Eye,
  EyeOff,
  Video,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Power,
  Camera,
  Layers,
  ArrowRight,
  HelpCircle,
  Cpu,
  Monitor,
  Radio,
} from 'lucide-react';

const defaultConfig: ScrcpyConfig = {
  serial: '',
  maxSize: 1080,
  maxFps: 60,
  audioSource: 'internal',
  videoBitRate: 8,
  videoCodec: 'h264',
  turnScreenOff: false,
  stayAwake: true,
  alwaysOnTop: false,
  showTouches: false,
  readOnly: false,
  record: false,
  recordFileName: '',
  customArgs: '',
};

export default function App() {
  // Device & Connection State
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnectingWireless, setIsConnectingWireless] = useState(false);

  // Wireless form inputs in right column
  const [wirelessIp, setWirelessIp] = useState('');
  const [wirelessPort, setWirelessPort] = useState('5555');
  const [recentIps, setRecentIps] = useState<string[]>(['192.168.1.50', '192.168.0.105']);

  // Scrcpy Mirroring Configuration State
  const [config, setConfig] = useState<ScrcpyConfig>(() => {
    const saved = localStorage.getItem('scrcpy-hub-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultConfig, ...parsed, serial: '' };
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
    return defaultConfig;
  });

  // Auto-save configuration on change (excluding serial to avoid "dead serial" issues on boot)
  useEffect(() => {
    const { serial, ...rest } = config;
    localStorage.setItem('scrcpy-hub-config', JSON.stringify(rest));
  }, [config]);

  // Session & UI States
  const [isMirroring, setIsMirroring] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Modals & Panels
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isWirelessModalOpen, setIsWirelessModalOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Scan for connected devices
  const fetchDevices = useCallback(async (silently = false) => {
    if (!silently) setIsRefreshing(true);
    try {
      const res = await apiClient.getDevices();
      if (res.success && res.devices) {
        setDevices(res.devices);

        // Keep selected device or auto-select first available
        if (res.devices.length > 0) {
          setSelectedDevice((current) => {
            if (!current) return res.devices[0];
            const found = res.devices.find((d) => d.serial === current.serial);
            return found || res.devices[0];
          });
        } else {
          setSelectedDevice(null);
        }
      }
    } catch (err: any) {
      if (!silently) showNotification(`Failed to scan devices: ${err.message}`, 'error');
    } finally {
      if (!silently) setIsRefreshing(false);
    }
  }, [showNotification]);

  // Initial mount & log listeners
  useEffect(() => {
    fetchDevices();

    // Check for onboarding
    const onboardingComplete = localStorage.getItem('scrcpy-hub-onboarding-complete');
    if (onboardingComplete !== 'true') {
      setShowOnboarding(true);
    }

    // Listen to logs from Electron IPC or poll from server
    if (isElectron && window.api?.onScrcpyLog) {
      const unsubscribe = window.api.onScrcpyLog((entry: LogEntry) => {
        setLogs((prev) => [...prev.slice(-300), entry]);
      });

      const unsubscribeStatus = window.api.onSessionStatusChanged((data: { serial: string; status: string; error?: string }) => {
        if (data.status === 'stopped' || data.status === 'error') {
          setDevices(prev => prev.map(d => d.serial === data.serial ? { ...d, isMirroring: false } : d));
          setSelectedDevice(current => {
            if (current && current.serial === data.serial) {
              setIsMirroring(false);
              return { ...current, isMirroring: false };
            }
            return current;
          });
          if (data.status === 'error' && data.error) {
            showNotification(`Session error for ${data.serial}: ${data.error}`, 'error');
          }
        }
      });

      return () => {
        unsubscribe();
        unsubscribeStatus();
      };
    } else {
      // Web fallback log polling
      const logInterval = setInterval(async () => {
        const remoteLogs = await apiClient.getLogs();
        if (remoteLogs && remoteLogs.length > 0) {
          setLogs(remoteLogs);
        }
      }, 2000);
      return () => clearInterval(logInterval);
    }
  }, []);

  // Update serial in config whenever selected device changes
  useEffect(() => {
    if (selectedDevice) {
      setConfig((prev) => ({ ...prev, serial: selectedDevice.serial }));
      setIsMirroring(Boolean(selectedDevice.isMirroring));
    }
  }, [selectedDevice]);

  // Partial config updater
  const handleConfigChange = useCallback((newConfig: Partial<ScrcpyConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // Compute live scrcpy command line
  const generatedCommand = useMemo(() => {
    const args: string[] = ['scrcpy'];
    if (config.serial) args.push('-s', config.serial);
    if (config.maxSize && config.maxSize > 0) args.push('-m', String(config.maxSize));
    if (config.maxFps) args.push('--max-fps', String(config.maxFps));
    if (config.videoBitRate) args.push('-b', `${config.videoBitRate}M`);
    if (config.videoCodec && config.videoCodec !== 'default') args.push('--video-codec', config.videoCodec);
    if (config.audioSource === 'disabled') args.push('--no-audio');
    else if (config.audioSource === 'mic') args.push('--audio-source=mic');
    if (config.turnScreenOff) args.push('--turn-screen-off');
    if (config.stayAwake) args.push('--stay-awake');
    if (config.alwaysOnTop) args.push('--always-on-top');
    if (config.showTouches) args.push('--show-touches');
    if (config.readOnly) args.push('--no-control');
    if (config.record) {
      const name = config.recordFileName || 'record';
      args.push('--record', `${name}.mp4`);
    }
    if (config.customArgs.trim()) {
      args.push(config.customArgs.trim());
    }
    return args.join(' ');
  }, [config]);

  // Start Scrcpy Mirroring
  const handleStartMirroring = useCallback(async () => {
    if (!selectedDevice) {
      showNotification('Please select a connected device first', 'error');
      return;
    }

    setIsLoadingSession(true);
    try {
      const res = await apiClient.startScrcpy({
        ...config,
        serial: selectedDevice.serial,
      });

      if (res.success) {
        setIsMirroring(true);
        showNotification(`Mirroring started for ${selectedDevice.model}`, 'success');
        fetchDevices(true);
      } else {
        showNotification(res.error || 'Failed to launch scrcpy', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoadingSession(false);
    }
  }, [config, fetchDevices, selectedDevice, showNotification]);

  // Stop Scrcpy Mirroring
  const handleStopMirroring = useCallback(async () => {
    setIsLoadingSession(true);
    try {
      const res = await apiClient.stopScrcpy(selectedDevice?.serial);
      if (res.success) {
        setIsMirroring(false);
        showNotification('Scrcpy session closed', 'info');
        fetchDevices(true);
      } else {
        showNotification(res.error || 'Failed to stop session', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoadingSession(false);
    }
  }, [fetchDevices, selectedDevice?.serial, showNotification]);

  // Connect Wireless Device
  const handleConnectWireless = useCallback(async (ip: string, port = 5555) => {
    if (!ip.trim()) {
      showNotification('Please enter a valid IP address', 'error');
      return;
    }
    setIsConnectingWireless(true);
    try {
      const res = await apiClient.connectWireless(ip, port);
      if (res.success) {
        showNotification(res.message || `Connected to ${ip}:${port}`, 'success');
        if (!recentIps.includes(ip)) {
          setRecentIps((prev) => [ip, ...prev.slice(0, 3)]);
        }
        setIsWirelessModalOpen(false);
        await fetchDevices();
      } else {
        showNotification(res.error || 'Wireless connection failed', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsConnectingWireless(false);
    }
  }, [fetchDevices, recentIps, showNotification]);

  const handleDisconnectWireless = useCallback(async (serial: string) => {
    try {
      const res = await apiClient.disconnectWireless(serial);
      if (res.success) {
        showNotification(`Disconnected ${serial}`, 'info');
        await fetchDevices();
      } else {
        showNotification(res.error || 'Failed to disconnect', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  }, [fetchDevices, showNotification]);

  // Trigger Device Hardware Key / Action
  const handleTriggerAction = useCallback(async (action: string) => {
    if (!selectedDevice) return;
    await apiClient.triggerDeviceAction(selectedDevice.serial, action);
    showNotification(`Sent key event: ${action}`, 'info');
  }, [selectedDevice, showNotification]);

  const handleCopyCommand = useCallback(() => {
    navigator.clipboard.writeText(generatedCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
    showNotification('Command copied to clipboard', 'info');
  }, [generatedCommand, showNotification]);

  const handleOpenRecordings = useCallback(async () => {
    const res = await apiClient.openRecordingsFolder();
    if (res.success) {
      showNotification(`Opened recordings: ${res.path}`, 'info');
    } else {
      showNotification(res.error || 'Could not open recordings directory', 'error');
    }
  }, [showNotification]);

  const handleClearLogs = useCallback(async () => {
    await apiClient.clearLogs();
    setLogs([]);
  }, []);

  const handleCloseOnboarding = useCallback(() => {
    localStorage.setItem('scrcpy-hub-onboarding-complete', 'true');
    setShowOnboarding(false);
  }, []);

  const connectedDevices = useMemo(() => devices.filter((device) => device.state === 'device'), [devices]);
  const selectedStatusClass = useMemo(() => isMirroring
    ? 'status-success'
    : selectedDevice?.state === 'device'
    ? 'status-warning'
    : 'status-error', [isMirroring, selectedDevice]);

  return (
    <div className="app-shell">
      <Header
        devices={devices}
        selectedDevice={selectedDevice}
        onSelectDevice={(dev) => setSelectedDevice(dev)}
        onRefresh={() => fetchDevices()}
        isRefreshing={isRefreshing}
        onOpenWireless={() => setIsWirelessModalOpen(true)}
        onToggleTerminal={() => setIsTerminalOpen((prev) => !prev)}
        isTerminalOpen={isTerminalOpen}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        isMirroringActive={isMirroring}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {notification && (
        <div className="fixed right-5 top-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="surface flex max-w-sm items-center gap-2.5 px-3.5 py-3 text-[12px] font-medium">
            {notification.type === 'success' && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
            {notification.type === 'error' && <AlertTriangle className="h-4 w-4 text-[var(--error)]" />}
            {notification.type === 'info' && <Sparkles className="h-4 w-4 text-[var(--accent)]" />}
            <span className="text-[var(--text-secondary)]">{notification.message}</span>
          </div>
        </div>
      )}

      <main className="main-content scrollbar-soft">
        <div className="window-drag-region sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(13,15,18,0.8)] px-5 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-end">
            <div className="no-drag flex items-center gap-2">
              <button type="button" onClick={() => fetchDevices()} className="btn btn-icon" title="Refresh devices">
                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={() => setIsWirelessModalOpen(true)} className="btn" title="Wireless ADB">
                <Wifi className="h-3.5 w-3.5" />
                Wireless
              </button>
            </div>
          </div>
        </div>

        <div className="page-shell">
          <header className="page-header">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className={`status-dot ${connectedDevices.length ? 'status-success' : 'status-error'}`} />
                <span className="label">{connectedDevices.length} connected</span>
              </div>
              <h1 className="page-title">Android devices</h1>
              <p className="page-subtitle">Select a device, adjust the session, and mirror with a focused, polished workflow.</p>
            </div>

            <div className="toolbar">
              <button type="button" onClick={() => fetchDevices()} disabled={isRefreshing} className="btn">
                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button type="button" onClick={() => setIsWirelessModalOpen(true)} className="btn">
                <Wifi className="h-3.5 w-3.5" />
                Connect Wi‑Fi
              </button>
              <button
                type="button"
                onClick={isMirroring ? handleStopMirroring : handleStartMirroring}
                disabled={isLoadingSession || (!selectedDevice && !isMirroring)}
                className={isMirroring ? 'btn btn-danger' : 'btn btn-primary'}
              >
                {isMirroring ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                {isLoadingSession ? 'Working' : isMirroring ? 'Stop mirror' : 'Mirror'}
              </button>
            </div>
          </header>

          <section className="workspace-grid">
            <div className="main-column">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Devices</h2>
                    <p className="panel-subtitle">USB and wireless ADB transports</p>
                  </div>
                  <span className="mono caption">tcp:5037</span>
                </div>

                <div className="panel-body tight">
                  {devices.length === 0 ? (
                    <div className="empty-state">
                      <Smartphone className="mb-4 h-9 w-9 text-[var(--text-muted)]" />
                      <h3 className="text-[15px] font-semibold text-[var(--text)]">No Android devices connected</h3>
                      <p className="mt-2 max-w-sm text-[13px] leading-6 text-[var(--text-secondary)]">
                        Connect through USB or add a wireless ADB endpoint to start mirroring.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <button type="button" onClick={() => fetchDevices()} className="btn">Refresh</button>
                        <button type="button" onClick={() => setIsWirelessModalOpen(true)} className="btn btn-primary">Connect device</button>
                      </div>
                    </div>
                  ) : (
                    <div className="device-list">
                      {devices.map((device) => {
                        const isSelected = selectedDevice?.serial === device.serial;
                        const stateClass =
                          device.state === 'device'
                            ? 'status-success'
                            : device.state === 'unauthorized'
                            ? 'status-warning'
                            : 'status-error';

                        return (
                          <button
                            key={device.serial}
                            type="button"
                            onClick={() => setSelectedDevice(device)}
                            className={`device-row ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="device-icon">
                              {device.isWireless ? <Wifi className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                            </div>
                            <div className="device-name-wrap">
                              <div className="device-name">
                                <span className="device-name-text">{device.model}</span>
                                {device.isMirroring && <span className="live-pill">Live</span>}
                              </div>
                              <div className="device-meta">
                                <span className="mono truncate">{device.serial}</span>
                                <span>{device.isWireless ? 'Wi‑Fi' : 'USB'}</span>
                                {device.product && <span>{device.product}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="hidden items-center gap-2 text-[12px] text-[var(--text-secondary)] sm:flex">
                                <span className={`status-dot ${stateClass}`} />
                                {device.state}
                              </span>
                              <span className={isSelected ? 'btn btn-primary pointer-events-none' : 'btn pointer-events-none'}>
                                {isSelected ? 'Selected' : 'Select'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Session</h2>
                    <p className="panel-subtitle">Primary mirroring controls</p>
                  </div>
                  <span className="mono caption">
                    {config.maxSize === 0 ? 'native' : `${config.maxSize}p`} · {config.maxFps} fps
                  </span>
                </div>

                <div className="panel-body">
                  <div className="surface-subtle p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`status-dot ${selectedStatusClass}`} />
                          <span className="text-[13px] font-semibold text-[var(--text)]">
                            {selectedDevice ? selectedDevice.model : 'No device selected'}
                          </span>
                        </div>
                        <p className="mt-2 max-w-xl text-[12px] leading-5 text-[var(--text-secondary)]">
                          {selectedDevice
                            ? `${selectedDevice.isWireless ? 'Wireless' : 'USB'} transport is ${selectedDevice.state}.`
                            : 'Choose a connected Android device from the list above.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={isMirroring ? handleStopMirroring : handleStartMirroring}
                          disabled={isLoadingSession || (!selectedDevice && !isMirroring)}
                          className={isMirroring ? 'btn btn-danger' : 'btn btn-primary'}
                        >
                          {isMirroring ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                          {isLoadingSession ? 'Starting' : isMirroring ? 'Stop' : 'Start'}
                        </button>
                        {selectedDevice?.isWireless && (
                          <button type="button" onClick={() => handleDisconnectWireless(selectedDevice.serial)} className="btn btn-danger">
                            <WifiOff className="h-3.5 w-3.5" />
                            Disconnect
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-4">
                      {[
                        { label: 'Resolution', value: config.maxSize === 0 ? 'Native' : `${config.maxSize}p` },
                        { label: 'Frame rate', value: `${config.maxFps} FPS` },
                        { label: 'Bitrate', value: `${config.videoBitRate} Mbps` },
                        { label: 'Codec', value: config.videoCodec.toUpperCase() },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="caption">{item.label}</div>
                          <div className="mono mt-1 text-[13px] text-[var(--text)]">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-4">
                      <button type="button" onClick={() => handleTriggerAction('back')} disabled={!selectedDevice} className="btn btn-icon" title="Back">
                        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                      </button>
                      <button type="button" onClick={() => handleTriggerAction('home')} disabled={!selectedDevice} className="btn btn-icon" title="Home">
                        <Monitor className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => handleTriggerAction('app_switch')} disabled={!selectedDevice} className="btn btn-icon" title="App switcher">
                        <Layers className="h-3.5 w-3.5" />
                      </button>
                      <div className="mx-1 h-5 w-px bg-[var(--border)]" />
                      <button type="button" onClick={() => handleTriggerAction('power')} disabled={!selectedDevice} className="btn btn-icon" title="Power">
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => handleTriggerAction('volume_up')} disabled={!selectedDevice} className="btn btn-icon" title="Volume up">
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => handleTriggerAction('volume_down')} disabled={!selectedDevice} className="btn btn-icon" title="Volume down">
                        <VolumeX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="sidebar-column">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Wireless</h2>
                    <p className="panel-subtitle">ADB over TCP/IP</p>
                  </div>
                </div>
                <div className="panel-body">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleConnectWireless(wirelessIp, Number(wirelessPort) || 5555);
                    }}
                    className="surface-subtle p-4"
                  >
                    <div className="grid grid-cols-[1fr_76px] gap-2">
                      <input
                        type="text"
                        placeholder="192.168.1.50"
                        value={wirelessIp}
                        onChange={(event) => setWirelessIp(event.target.value)}
                        className="field mono"
                      />
                      <input
                        type="text"
                        placeholder="5555"
                        value={wirelessPort}
                        onChange={(event) => setWirelessPort(event.target.value)}
                        className="field mono text-center"
                      />
                    </div>
                    {recentIps.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {recentIps.map((ip) => (
                          <button key={ip} type="button" onClick={() => setWirelessIp(ip)} className="btn min-h-7 px-2 mono text-[11px]">
                            {ip}
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="submit" disabled={isConnectingWireless || !wirelessIp.trim()} className="btn btn-primary mt-4 w-full">
                      <Wifi className="h-3.5 w-3.5" />
                      {isConnectingWireless ? 'Connecting' : 'Connect'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Mirroring</h2>
                    <p className="panel-subtitle">Session quality and behavior</p>
                  </div>
                  <Sliders className="h-4 w-4 text-[var(--text-muted)]" />
                </div>

                <div className="panel-body tight">
                  <div className="surface-subtle px-4">
                    <div className="setting-row">
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text)]">Resolution</div>
                        <div className="caption">Maximum mirrored size</div>
                      </div>
                      <select value={config.maxSize} onChange={(event) => handleConfigChange({ maxSize: Number(event.target.value) })} className="field w-32">
                        <option value="480">480p</option>
                        <option value="720">720p</option>
                        <option value="1080">1080p</option>
                        <option value="1440">1440p</option>
                        <option value="0">Native</option>
                      </select>
                    </div>
                    <div className="setting-row">
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text)]">Frame rate</div>
                        <div className="caption">Upper FPS limit</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="30"
                          max="120"
                          step="10"
                          value={config.maxFps}
                          onChange={(event) => handleConfigChange({ maxFps: Number(event.target.value) })}
                          className="w-28 accent-[var(--accent)]"
                        />
                        <span className="mono w-12 text-right text-[12px] text-[var(--text-secondary)]">{config.maxFps}</span>
                      </div>
                    </div>
                    <div className="setting-row">
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text)]">Audio</div>
                        <div className="caption">Source forwarded by scrcpy</div>
                      </div>
                      <select value={config.audioSource} onChange={(event) => handleConfigChange({ audioSource: event.target.value as any })} className="field w-36">
                        <option value="internal">Internal</option>
                        <option value="mic">Microphone</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                    <div className="setting-row">
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text)]">Video bitrate</div>
                        <div className="caption">Encoder target rate</div>
                      </div>
                      <select value={config.videoBitRate} onChange={(event) => handleConfigChange({ videoBitRate: Number(event.target.value) })} className="field w-32">
                        <option value="4">4 Mbps</option>
                        <option value="8">8 Mbps</option>
                        <option value="16">16 Mbps</option>
                        <option value="32">32 Mbps</option>
                      </select>
                    </div>
                    <div className="setting-row">
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text)]">Codec</div>
                        <div className="caption">Video encoder preference</div>
                      </div>
                      <select value={config.videoCodec} onChange={(event) => handleConfigChange({ videoCodec: event.target.value as any })} className="field w-32">
                        <option value="h264">H.264</option>
                        <option value="h265">H.265</option>
                        <option value="av1">AV1</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Advanced</h2>
                    <p className="panel-subtitle">Optional scrcpy flags</p>
                  </div>
                </div>
                <div className="panel-body tight">
                  <div className="surface-subtle px-4">
                    {[
                      { key: 'turnScreenOff', label: 'Turn screen off', desc: 'Keep physical display dark', value: config.turnScreenOff, icon: EyeOff },
                      { key: 'stayAwake', label: 'Stay awake', desc: 'Prevent sleep during session', value: config.stayAwake, icon: Power },
                      { key: 'alwaysOnTop', label: 'Always on top', desc: 'Keep mirror window above others', value: config.alwaysOnTop, icon: Layers },
                      { key: 'showTouches', label: 'Show touches', desc: 'Display touch indicators', value: config.showTouches, icon: Radio },
                      { key: 'readOnly', label: 'Read only', desc: 'Disable input forwarding', value: config.readOnly, icon: Eye },
                      { key: 'record', label: 'Record session', desc: 'Save session to MP4', value: config.record, icon: Video },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <label key={item.key} className="setting-row">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                            <div>
                              <div className="text-[13px] font-medium text-[var(--text)]">{item.label}</div>
                              <div className="caption">{item.desc}</div>
                            </div>
                          </div>
                          <span className="toggle">
                            <input
                              type="checkbox"
                              checked={item.value}
                              onChange={(event) => handleConfigChange({ [item.key]: event.target.checked } as Partial<ScrcpyConfig>)}
                            />
                            <span />
                          </span>
                        </label>
                      );
                    })}
                    {config.record && (
                      <div className="flex items-center gap-2 border-t border-[var(--border)] py-3">
                        <input
                          type="text"
                          placeholder="recording name"
                          value={config.recordFileName}
                          onChange={(event) => handleConfigChange({ recordFileName: event.target.value })}
                          className="field mono min-w-0 flex-1"
                        />
                        <button type="button" onClick={handleOpenRecordings} className="btn btn-icon" title="Open recordings folder">
                          <FolderOpen className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Command</h2>
                  </div>
                  <button type="button" onClick={handleCopyCommand} className="btn min-h-7 px-2.5">
                    {copiedCommand ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCommand ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="panel-body">
                  <div className="rounded-[10px] border border-[var(--border)] bg-[#0d0f12] p-3">
                    <code className="mono block break-all text-[11px] leading-5 text-[var(--text-secondary)]">{generatedCommand}</code>
                    <input
                      type="text"
                      placeholder="Additional scrcpy arguments"
                      value={config.customArgs}
                      onChange={(event) => handleConfigChange({ customArgs: event.target.value })}
                      className="field mono mt-3 w-full"
                    />
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </div>

        <TerminalLogs
          logs={logs}
          onClearLogs={handleClearLogs}
          isOpen={isTerminalOpen}
          onToggle={() => setIsTerminalOpen((prev) => !prev)}
        />
      </main>

      <WirelessModal
        isOpen={isWirelessModalOpen}
        onClose={() => setIsWirelessModalOpen(false)}
        onConnect={handleConnectWireless}
        isLoading={isConnectingWireless}
      />

      <CodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
