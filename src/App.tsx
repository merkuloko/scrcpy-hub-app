import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { TerminalLogs } from './components/TerminalLogs';
import { WirelessModal } from './components/WirelessModal';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { OnboardingOverlay } from './components/OnboardingOverlay';
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

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Scan for connected devices
  const fetchDevices = async (silently = false) => {
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
  };

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
      return () => unsubscribe();
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
  const handleConfigChange = (newConfig: Partial<ScrcpyConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

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
  const handleStartMirroring = async () => {
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
  };

  // Stop Scrcpy Mirroring
  const handleStopMirroring = async () => {
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
  };

  // Connect Wireless Device
  const handleConnectWireless = async (ip: string, port = 5555) => {
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
  };

  const handleDisconnectWireless = async (serial: string) => {
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
  };

  // Trigger Device Hardware Key / Action
  const handleTriggerAction = async (action: string) => {
    if (!selectedDevice) return;
    await apiClient.triggerDeviceAction(selectedDevice.serial, action);
    showNotification(`Sent key event: ${action}`, 'info');
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
    showNotification('Command copied to clipboard', 'info');
  };

  const handleOpenRecordings = async () => {
    const res = await apiClient.openRecordingsFolder();
    if (res.success) {
      showNotification(`Opened recordings: ${res.path}`, 'info');
    } else {
      showNotification(res.error || 'Could not open recordings directory', 'error');
    }
  };

  const handleClearLogs = async () => {
    await apiClient.clearLogs();
    setLogs([]);
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem('scrcpy-hub-onboarding-complete', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Onboarding Overlay */}
      <OnboardingOverlay isOpen={showOnboarding} onClose={handleCloseOnboarding} />

      {/* Top Header */}
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

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-md text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-[#161B22] border-emerald-500/50 text-emerald-300 shadow-black/60'
                : notification.type === 'error'
                ? 'bg-[#161B22] border-rose-500/50 text-rose-300 shadow-black/60'
                : 'bg-[#161B22] border-[#30363D] text-[#E2E8F0] shadow-black/60'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {notification.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Grid: 2 Columns */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* ============================================================
              LEFT COLUMN: PRIMARY ACTIONS & CORE HARDWARE SLIDERS
             ============================================================ */}
          <div className="space-y-6">
            {/* Primary Hero Control Card */}
            <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                    Mirroring Controls
                  </h2>
                </div>
                {selectedDevice ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D1117] border border-[#30363D] text-[11px] font-mono text-gray-300">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isMirroring ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
                      }`}
                    />
                    <span className="truncate max-w-[130px]">{selectedDevice.model}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-500 italic">No Device Selected</span>
                )}
              </div>

              {/* Large Prominent Hero Button */}
              {isMirroring ? (
                <button
                  type="button"
                  onClick={handleStopMirroring}
                  disabled={isLoadingSession}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span className="text-base tracking-wide">Stop Mirroring Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartMirroring}
                  disabled={!selectedDevice || isLoadingSession}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-950/50 transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoadingSession ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-base tracking-wide">Launching Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span className="text-base tracking-wide">Start Screen Mirroring</span>
                    </>
                  )}
                </button>
              )}

              {/* Hardware Quick Action Strip (Active during session or for quick control) */}
              <div className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400">Quick Hardware Keys</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTriggerAction('back')}
                    disabled={!selectedDevice}
                    className="p-1.5 rounded bg-[#161B22] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] text-xs transition-colors disabled:opacity-30"
                    title="Back Key (◀)"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerAction('home')}
                    disabled={!selectedDevice}
                    className="p-1.5 rounded bg-[#161B22] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] text-xs transition-colors disabled:opacity-30"
                    title="Home Key (●)"
                  >
                    ●
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerAction('app_switch')}
                    disabled={!selectedDevice}
                    className="p-1.5 rounded bg-[#161B22] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] text-xs transition-colors disabled:opacity-30"
                    title="App Switcher (■)"
                  >
                    ■
                  </button>
                  <div className="w-px h-3.5 bg-[#30363D] mx-0.5" />
                  <button
                    type="button"
                    onClick={() => handleTriggerAction('power')}
                    disabled={!selectedDevice}
                    className="p-1.5 rounded bg-[#161B22] hover:bg-rose-500/20 hover:text-rose-400 text-gray-300 border border-[#30363D] text-xs transition-colors disabled:opacity-30"
                    title="Power Button"
                  >
                    <Power className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerAction('volume_up')}
                    disabled={!selectedDevice}
                    className="p-1.5 rounded bg-[#161B22] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] text-xs transition-colors disabled:opacity-30"
                    title="Volume Up"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Native Range Slider 1: Resolution (480p to 1440p) */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                    <Tv className="w-3.5 h-3.5 text-blue-400" />
                    <span>Resolution (Max Size)</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-blue-400">
                    {config.maxSize === 0 ? 'Native (Uncapped)' : `${config.maxSize}p`}
                  </span>
                </div>

                <input
                  type="range"
                  min="480"
                  max="1440"
                  step="80"
                  value={config.maxSize || 1080}
                  onChange={(e) => handleConfigChange({ maxSize: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#0D1117] rounded-lg appearance-none cursor-pointer accent-blue-500 border border-[#30363D]"
                />

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '480p', value: 480 },
                    { label: '720p HD', value: 720 },
                    { label: '1080p FHD', value: 1080 },
                    { label: '1440p 2K', value: 1440 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleConfigChange({ maxSize: preset.value })}
                      className={`py-1 rounded text-[11px] font-mono transition-colors border ${
                        config.maxSize === preset.value
                          ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold'
                          : 'bg-[#0D1117] border-[#30363D] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Native Range Slider 2: Framerate Limit (30 FPS to 120 FPS) */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Framerate Limit</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-emerald-400">
                    {config.maxFps} FPS
                  </span>
                </div>

                <input
                  type="range"
                  min="30"
                  max="120"
                  step="10"
                  value={config.maxFps}
                  onChange={(e) => handleConfigChange({ maxFps: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#0D1117] rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-[#30363D]"
                />

                {/* FPS Preset Chips */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '30 FPS', value: 30 },
                    { label: '60 FPS', value: 60 },
                    { label: '90 FPS', value: 90 },
                    { label: '120 FPS', value: 120 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleConfigChange({ maxFps: preset.value })}
                      className={`py-1 rounded text-[11px] font-mono transition-colors border ${
                        config.maxFps === preset.value
                          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 font-semibold'
                          : 'bg-[#0D1117] border-[#30363D] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bitrate & Video Codec Section */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#30363D]">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Bitrate (Mbps)
                  </label>
                  <select
                    value={config.videoBitRate}
                    onChange={(e) => handleConfigChange({ videoBitRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="4">4 Mbps (Low Bandwidth)</option>
                    <option value="8">8 Mbps (Default)</option>
                    <option value="16">16 Mbps (High Quality)</option>
                    <option value="32">32 Mbps (Ultra Crisp)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Video Codec
                  </label>
                  <select
                    value={config.videoCodec}
                    onChange={(e) => handleConfigChange({ videoCodec: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="h264">H.264 (Maximum Compatibility)</option>
                    <option value="h265">H.265 / HEVC (Efficient)</option>
                    <option value="av1">AV1 (Next-Gen)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generated Scrcpy CLI Command Box */}
            <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-4 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Generated Command</span>
                <button
                  type="button"
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0D1117] hover:bg-[#30363D] text-gray-300 hover:text-white border border-[#30363D] text-[11px] transition-colors font-medium cursor-pointer"
                >
                  {copiedCommand ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>{copiedCommand ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-[#090D11] rounded-md border border-[#30363D] font-mono text-[11px] text-blue-300 break-all select-all">
                <code>{generatedCommand}</code>
              </div>
            </div>
          </div>

          {/* ============================================================
              RIGHT COLUMN: PREFERENCES & WIRELESS CONNECTION
             ============================================================ */}
          <div className="space-y-6">
            {/* Preferences Card */}
            <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                    Preferences & Flags
                  </h2>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Options</span>
              </div>

              {/* Audio Source Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
                  <span>Audio Source</span>
                  <span className="text-[10px] text-gray-500">Android 11+ required for internal</span>
                </label>
                <select
                  value={config.audioSource}
                  onChange={(e) => handleConfigChange({ audioSource: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="internal">Internal Audio Stream (Forward Device Sound)</option>
                  <option value="mic">Microphone (Capture Device Mic)</option>
                  <option value="disabled">Disabled / Muted (--no-audio, lowest latency)</option>
                </select>
              </div>

              {/* Toggle Switch 1: Turn Screen Off */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-200">
                    <EyeOff className="w-3.5 h-3.5 text-orange-400" />
                    <span>Turn Screen Off on Start</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Keeps physical display dark while mirroring to save battery
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.turnScreenOff}
                    onChange={(e) => handleConfigChange({ turnScreenOff: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#30363D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {/* Toggle Switch 2: Record to MP4 */}
              <div className="space-y-2 p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-200">
                      <Video className="w-3.5 h-3.5 text-rose-400" />
                      <span>Record Session to MP4</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Save screen capture directly to video container
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.record}
                      onChange={(e) => handleConfigChange({ record: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#30363D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
                  </label>
                </div>

                {config.record && (
                  <div className="pt-2 border-t border-[#30363D]/60 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="File name (default: timestamp)"
                      value={config.recordFileName}
                      onChange={(e) => handleConfigChange({ recordFileName: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 bg-[#161B22] border border-[#30363D] rounded text-xs text-gray-200 focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleOpenRecordings}
                      className="px-2 py-1.5 rounded bg-[#161B22] hover:bg-[#30363D] border border-[#30363D] text-[11px] text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                      title="Open recordings folder"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="hidden sm:inline">Folder</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Checkboxes */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded bg-[#0D1117] border border-[#30363D] cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.stayAwake}
                    onChange={(e) => handleConfigChange({ stayAwake: e.target.checked })}
                    className="rounded bg-[#161B22] border-[#30363D] text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-gray-300">Stay Awake</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-[#0D1117] border border-[#30363D] cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.alwaysOnTop}
                    onChange={(e) => handleConfigChange({ alwaysOnTop: e.target.checked })}
                    className="rounded bg-[#161B22] border-[#30363D] text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-gray-300">Always on Top</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-[#0D1117] border border-[#30363D] cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.showTouches}
                    onChange={(e) => handleConfigChange({ showTouches: e.target.checked })}
                    className="rounded bg-[#161B22] border-[#30363D] text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-gray-300">Show Touches</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-[#0D1117] border border-[#30363D] cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.readOnly}
                    onChange={(e) => handleConfigChange({ readOnly: e.target.checked })}
                    className="rounded bg-[#161B22] border-[#30363D] text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-gray-300">Read Only</span>
                </label>
              </div>
            </div>

            {/* Wireless Connection Card */}
            <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                    Wireless ADB Connection
                  </h2>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Wi-Fi TCP/IP</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConnectWireless(wirelessIp, Number(wirelessPort) || 5555);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Device IP & Port
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.50"
                      value={wirelessIp}
                      onChange={(e) => setWirelessIp(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="5555"
                      value={wirelessPort}
                      onChange={(e) => setWirelessPort(e.target.value)}
                      className="w-20 px-2.5 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-gray-200 text-center focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Recent IPs */}
                {recentIps.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-500">Recents:</span>
                    {recentIps.map((ip) => (
                      <button
                        key={ip}
                        type="button"
                        onClick={() => setWirelessIp(ip)}
                        className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[11px] font-mono text-blue-400 border border-[#30363D] transition-colors cursor-pointer"
                      >
                        {ip}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isConnectingWireless || !wirelessIp.trim()}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConnectingWireless ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enabling TCP/IP & Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Connect Wireless Device</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Active wireless disconnect if currently selected is wireless */}
              {selectedDevice?.isWireless && (
                <div className="pt-2 border-t border-[#30363D] flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Current wireless target</span>
                  <button
                    type="button"
                    onClick={() => handleDisconnectWireless(selectedDevice.serial)}
                    className="px-2.5 py-1 rounded bg-[#0D1117] hover:bg-rose-950/40 hover:border-rose-800/60 border border-[#30363D] text-[11px] text-rose-400 flex items-center gap-1 transition-colors"
                  >
                    <WifiOff className="w-3 h-3" />
                    <span>Disconnect {selectedDevice.serial}</span>
                  </button>
                </div>
              )}

              {/* Quick instructions */}
              <div className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-blue-400 font-medium text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How to connect wirelessly:</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  1. Plug in device via USB once • 2. Enter Wi-Fi IP and click Connect • 3. Unplug USB cable!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Terminal Logs Bottom Drawer */}
      <TerminalLogs
        logs={logs}
        onClearLogs={handleClearLogs}
        isOpen={isTerminalOpen}
        onToggle={() => setIsTerminalOpen((prev) => !prev)}
      />

      {/* Wireless Modal (Triggerable from Header) */}
      <WirelessModal
        isOpen={isWirelessModalOpen}
        onClose={() => setIsWirelessModalOpen(false)}
        onConnect={handleConnectWireless}
        isLoading={isConnectingWireless}
      />

      {/* Electron Codebase Inspector Modal */}
      <CodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />
      {/* Keyboard Shortcuts Cheat Sheet */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
