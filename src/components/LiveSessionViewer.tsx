import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  Battery,
  Volume2,
  VolumeX,
  RotateCw,
  Power,
  Camera,
  Play,
  Sparkles,
  Signal,
  Eye,
} from 'lucide-react';
import { Device, ScrcpyConfig } from '../types';

interface LiveSessionViewerProps {
  device: Device | null;
  config: ScrcpyConfig;
  isMirroring: boolean;
  onStartMirroring: () => void;
  onStopMirroring: () => void;
  onTriggerAction: (action: string) => void;
}

export const LiveSessionViewer: React.FC<LiveSessionViewerProps> = ({
  device,
  config,
  isMirroring,
  onStartMirroring,
  onStopMirroring,
  onTriggerAction,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [currentTime, setCurrentTime] = useState('09:41');
  const [fpsCounter, setFpsCounter] = useState<number | 'N/A'>('N/A');
  const [activeApp, setActiveApp] = useState<'home' | 'camera' | 'settings' | 'gallery' | 'browser'>('home');
  const [touchRipples, setTouchRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [flashScreen, setFlashScreen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  // FPS is displayed as N/A as real telemetry is not implemented from scrcpy logs yet
  useEffect(() => {
    if (!isMirroring) {
      setFpsCounter('N/A');
      return;
    }
  }, [isMirroring]);

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (config.readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();

    if (config.showTouches || true) {
      setTouchRipples((prev) => [...prev.slice(-4), { id: rippleId, x, y }]);
      setTimeout(() => {
        setTouchRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 600);
    }
  };

  const handleScreenshot = () => {
    setFlashScreen(true);
    setTimeout(() => setFlashScreen(false), 200);
    onTriggerAction('screenshot');
  };

  return (
    <div className="flex flex-col h-full bg-[#161B22] rounded-xl border border-[#30363D] p-4 sm:p-6 relative overflow-hidden items-center justify-center min-h-[540px]">
      {/* Background ambient lighting */}
      <div className={`absolute -inset-4 bg-blue-600/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${isMirroring ? 'opacity-100' : 'opacity-20'}`} />

      {/* Floating HUD status during live session */}
      {isMirroring && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2 bg-[#0D1117]/95 px-3 py-1.5 rounded-full border border-[#30363D] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono font-semibold text-emerald-400">
              {fpsCounter}{typeof fpsCounter === 'number' ? ' FPS' : ''}
            </span>
            <span className="text-[#30363D] text-xs">•</span>
            <span className="text-[11px] font-mono text-gray-300">
              {config.videoBitRate} Mbps
            </span>
            <span className="text-[#30363D] text-xs">•</span>
            <span className="text-[11px] font-mono text-blue-400">
              {config.maxSize ? `${config.maxSize}p` : 'Native'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0D1117]/95 px-3 py-1.5 rounded-full border border-[#30363D] shadow-lg text-[11px] text-gray-300">
            {config.audioSource === 'internal' ? (
              <span className="flex items-center gap-1 text-blue-300">
                <Volume2 className="w-3.5 h-3.5" /> Audio Internal
              </span>
            ) : config.audioSource === 'mic' ? (
              <span className="flex items-center gap-1 text-emerald-300">
                <Volume2 className="w-3.5 h-3.5" /> Mic Input
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-500">
                <VolumeX className="w-3.5 h-3.5" /> Muted
              </span>
            )}
            {config.turnScreenOff && (
              <span className="text-orange-400 text-[10px] bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">
                Screen Off
              </span>
            )}
            {config.record && (
              <span className="text-red-400 text-[10px] bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Smartphone Shell */}
      <div
        className={`relative transition-all duration-500 ease-out z-10 flex flex-col items-center ${
          orientation === 'landscape'
            ? 'w-[480px] h-[270px]'
            : 'w-[260px] sm:w-[280px] h-[480px] sm:h-[510px]'
        }`}
      >
        {/* Outer Phone Bezel */}
        <div className="w-full h-full bg-[#0D1117] rounded-[38px] p-2.5 shadow-2xl border-4 border-[#30363D] flex flex-col relative overflow-hidden">
          {/* Camera Notch / Island */}
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#090D11] rounded-full z-30 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#161B22] ring-1 ring-[#30363D] inline-block" />
          </div>

          {/* Inner Screen Display */}
          <div
            onClick={handleScreenClick}
            className={`w-full h-full rounded-[28px] overflow-hidden relative flex flex-col justify-between select-none cursor-pointer transition-colors duration-300 ${
              isMirroring
                ? config.turnScreenOff
                  ? 'bg-[#090D11] text-gray-500'
                  : 'bg-gradient-to-br from-[#111827] via-[#0F1115] to-[#1E293B] text-[#E2E8F0]'
                : 'bg-[#090D11] text-gray-500'
            }`}
          >
            {/* Flash animation on screenshot */}
            {flashScreen && (
              <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
            )}

            {/* Touch Ripple Visualizer */}
            {touchRipples.map((ripple) => (
              <span
                key={ripple.id}
                style={{ left: ripple.x - 16, top: ripple.y - 16 }}
                className="absolute w-8 h-8 rounded-full bg-blue-500/40 border border-blue-400 pointer-events-none animate-ping z-40"
              />
            ))}

            {/* Android Status Bar */}
            <div className="pt-2 px-4 flex items-center justify-between text-[10px] font-medium tracking-tight text-gray-400 z-20">
              <span className="font-semibold text-gray-300">{currentTime}</span>
              <div className="flex items-center gap-1.5">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3 h-3" />
              </div>
            </div>

            {/* Screen Content Body */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              {isMirroring ? (
                config.turnScreenOff ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center mx-auto text-orange-400">
                      <Eye className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-300 font-medium">Screen Blacked Out</p>
                    <p className="text-[10px] text-gray-500 max-w-[160px]">
                      Display is off on physical device while mirroring continues in background.
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col justify-between pt-4 pb-2">
                    {/* App Grid Simulation */}
                    <div className="grid grid-cols-4 gap-2.5 pt-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveApp('camera');
                        }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-md text-white text-xs">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] text-gray-300">Camera</span>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveApp('browser');
                        }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white text-xs">
                          🌐
                        </div>
                        <span className="text-[9px] text-gray-300">Chrome</span>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveApp('gallery');
                        }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md text-white text-xs">
                          🖼️
                        </div>
                        <span className="text-[9px] text-gray-300">Photos</span>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveApp('settings');
                        }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#30363D] flex items-center justify-center shadow-md text-white text-xs">
                          ⚙️
                        </div>
                        <span className="text-[9px] text-gray-300">Settings</span>
                      </div>
                    </div>

                    {/* Active App preview widget */}
                    <div className="bg-[#161B22]/90 rounded-xl p-3 border border-[#30363D] text-left space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-blue-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Scrcpy Feed
                        </span>
                        <span className="text-[9px] text-emerald-400 font-mono">Synced</span>
                      </div>
                      <p className="text-[10px] text-gray-300 leading-tight">
                        Displaying {device?.model || 'Device'} • Low latency pipeline
                      </p>
                    </div>

                    {/* Dock Apps */}
                    <div className="bg-[#0D1117]/80 rounded-2xl p-2 flex items-center justify-around border border-[#30363D]">
                      <span className="text-base cursor-pointer hover:scale-110 transition-transform">📞</span>
                      <span className="text-base cursor-pointer hover:scale-110 transition-transform">💬</span>
                      <span className="text-base cursor-pointer hover:scale-110 transition-transform">📧</span>
                      <span className="text-base cursor-pointer hover:scale-110 transition-transform">🎵</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-3 px-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#161B22] border border-[#30363D] flex items-center justify-center mx-auto text-gray-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#E2E8F0]">Ready to Mirror</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {device ? `${device.model} connected` : 'Select a device and start session'}
                    </p>
                  </div>
                  <button
                    onClick={onStartMirroring}
                    disabled={!device}
                    className="px-3.5 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 text-[11px] font-semibold transition-all inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Launch Scrcpy</span>
                  </button>
                </div>
              )}
            </div>

            {/* Android Navigation Bar (Back, Home, Overview) */}
            <div className="h-9 bg-[#0D1117] border-t border-[#30363D] flex items-center justify-around px-4 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerAction('back');
                }}
                className="text-gray-400 hover:text-white p-1 text-sm transition-transform active:scale-90"
                title="Back Key"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerAction('home');
                }}
                className="text-gray-400 hover:text-white p-1 text-sm transition-transform active:scale-90"
                title="Home Key"
              >
                ●
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerAction('app_switch');
                }}
                className="text-gray-400 hover:text-white p-1 text-sm transition-transform active:scale-90"
                title="App Switcher"
              >
                ■
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hardware Quick Action Strip */}
      <div className="mt-4 flex items-center gap-1.5 bg-[#0D1117] p-1.5 rounded-xl border border-[#30363D] shadow-xl z-20">
        <button
          type="button"
          onClick={() => onTriggerAction('power')}
          className="p-2 rounded-lg bg-[#161B22] hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 border border-[#30363D] transition-all text-xs"
          title="Device Power Button (Wake/Sleep)"
        >
          <Power className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onTriggerAction('volume_up')}
          className="p-2 rounded-lg bg-[#161B22] hover:bg-[#30363D] text-gray-400 hover:text-white border border-[#30363D] transition-all text-xs"
          title="Volume Up"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onTriggerAction('volume_down')}
          className="p-2 rounded-lg bg-[#161B22] hover:bg-[#30363D] text-gray-400 hover:text-white border border-[#30363D] transition-all text-xs"
          title="Volume Down"
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[#30363D] mx-1" />

        <button
          type="button"
          onClick={() => setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
          className="p-2 rounded-lg bg-[#161B22] hover:bg-blue-600/20 hover:text-blue-400 text-gray-400 border border-[#30363D] transition-all text-xs"
          title="Rotate Display View"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleScreenshot}
          className="p-2 rounded-lg bg-[#161B22] hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-400 border border-[#30363D] transition-all text-xs"
          title="Capture Screenshot"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
