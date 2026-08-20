import React from 'react';
import { Play, Square, Volume2, Mic, VolumeX, Tv, Gauge, Film, BatteryCharging } from 'lucide-react';
import { AudioSourceOption, Device, ScrcpyConfig, VideoCodecOption } from '../types';

interface CoreControlsProps {
  config: ScrcpyConfig;
  onChangeConfig: (newConfig: Partial<ScrcpyConfig>) => void;
  selectedDevice: Device | null;
  isMirroring: boolean;
  onStartMirroring: () => void;
  onStopMirroring: () => void;
  isLoading: boolean;
}

export const CoreControls: React.FC<CoreControlsProps> = ({
  config,
  onChangeConfig,
  selectedDevice,
  isMirroring,
  onStartMirroring,
  onStopMirroring,
  isLoading,
}) => {
  const resolutionPresets = [
    { label: '1080p', value: 1080, desc: 'FHD Standard' },
    { label: '720p', value: 720, desc: 'Performance' },
    { label: '480p', value: 480, desc: 'Low Latency' },
    { label: 'Native', value: 0, desc: 'Full Quality' },
  ];

  const fpsOptions = [30, 60, 90, 120];

  const audioOptions: { id: AudioSourceOption; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'internal', label: 'Internal Audio', icon: <Volume2 className="w-4 h-4 text-blue-400" />, desc: 'Stream device apps & audio' },
    { id: 'mic', label: 'Microphone', icon: <Mic className="w-4 h-4 text-green-400" />, desc: 'Stream device mic input' },
    { id: 'disabled', label: 'Disabled', icon: <VolumeX className="w-4 h-4 text-gray-500" />, desc: 'Mute audio streaming' },
  ];

  const codecOptions: { id: VideoCodecOption; label: string; tag: string }[] = [
    { id: 'h264', label: 'H.264 (AVC)', tag: 'Best Compatibility' },
    { id: 'h265', label: 'H.265 (HEVC)', tag: 'High Efficiency' },
    { id: 'av1', label: 'AV1', tag: 'Next Gen' },
  ];

  return (
    <div className="space-y-4">
      {/* Active Device Info Card */}
      {selectedDevice && (
        <div className="p-3.5 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-[#E2E8F0] flex items-center gap-2">
              <span>{selectedDevice.model}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#30363D] text-gray-400">
                {selectedDevice.serial}
              </span>
            </div>
            <p className="text-gray-400 text-[11px]">
              {selectedDevice.androidVersion || 'Android OS'} • {selectedDevice.screenResolution || '1080x2400'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedDevice.battery !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <BatteryCharging className="w-3 h-3" />
                <span>{selectedDevice.battery}%</span>
              </div>
            )}
            <span className={`w-2 h-2 rounded-full ${isMirroring ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
          </div>
        </div>
      )}

      {/* Prominent Action Button: Start / Stop Mirroring */}
      <div className="bg-[#161B22] rounded-xl p-5 border border-[#30363D]">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Primary Actions</h2>
        {!isMirroring ? (
          <button
            id="start-mirroring-btn"
            onClick={onStartMirroring}
            disabled={!selectedDevice || isLoading}
            className="w-full py-7 bg-blue-600 hover:bg-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all border border-blue-400/20 group active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
            <span className="text-lg font-bold text-white">
              {isLoading ? 'Starting Scrcpy Session...' : 'Start Mirroring'}
            </span>
            <span className="text-xs text-blue-200 opacity-80 font-mono">
              Current: {config.maxSize === 0 ? 'Native' : `${config.maxSize}p`} @ {config.maxFps} FPS
            </span>
          </button>
        ) : (
          <button
            id="stop-mirroring-btn"
            onClick={onStopMirroring}
            disabled={isLoading}
            className="w-full py-7 bg-rose-600 hover:bg-rose-500 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all border border-rose-400/20 active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1">
              <Square className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <span className="text-lg font-bold text-white">Stop Active Mirroring</span>
            <span className="text-xs text-rose-200 opacity-80 font-mono">Session in progress</span>
          </button>
        )}
      </div>

      {/* Resolution Selector & Presets */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E2E8F0]">
            <Tv className="w-4 h-4 text-blue-400" />
            <span>Resolution (Max Size)</span>
          </div>
          <span className="text-xs font-mono font-medium text-blue-400 px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D]">
            {config.maxSize === 0 ? 'Native / Uncapped' : `${config.maxSize}p`}
          </span>
        </div>

        {/* Preset Chips */}
        <div className="grid grid-cols-4 gap-2">
          {resolutionPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChangeConfig({ maxSize: preset.value })}
              className={`py-2 px-1 rounded-md text-center transition-all ${
                config.maxSize === preset.value
                  ? 'bg-blue-600/20 border border-blue-500 text-blue-300 font-semibold'
                  : 'bg-[#0D1117] hover:bg-[#1f242c] border border-[#30363D] text-gray-400 hover:text-[#E2E8F0]'
              }`}
            >
              <div className="text-xs font-medium">{preset.label}</div>
              <div className="text-[10px] text-gray-500">{preset.desc}</div>
            </button>
          ))}
        </div>

        {/* Custom Range Slider */}
        <div className="pt-1">
          <input
            type="range"
            min="480"
            max="2560"
            step="120"
            value={config.maxSize === 0 ? 2560 : config.maxSize}
            onChange={(e) => onChangeConfig({ maxSize: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#30363D] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-medium mt-2">
            <span>480p</span>
            <span>720p</span>
            <span>1080p</span>
            <span>1440p+</span>
          </div>
        </div>
      </div>

      {/* Frame Rate (FPS) Selector */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E2E8F0]">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span>Framerate Limit</span>
          </div>
          <span className="text-xs font-mono font-medium text-blue-400 px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D]">
            {config.maxFps} FPS
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {fpsOptions.map((fps) => (
            <button
              key={fps}
              type="button"
              onClick={() => onChangeConfig({ maxFps: fps })}
              className={`py-2 rounded-md text-xs font-semibold transition-all ${
                config.maxFps === fps
                  ? 'bg-blue-600/20 border border-blue-500 text-blue-300'
                  : 'bg-[#0D1117] hover:bg-[#1f242c] border border-[#30363D] text-gray-400 hover:text-[#E2E8F0]'
              }`}
            >
              {fps} FPS
            </button>
          ))}
        </div>

        <div className="pt-1">
          <input
            type="range"
            min="30"
            max="120"
            step="30"
            value={config.maxFps}
            onChange={(e) => onChangeConfig({ maxFps: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#30363D] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-medium mt-2">
            <span>30 FPS</span>
            <span>60 FPS</span>
            <span>90 FPS</span>
            <span>120 FPS</span>
          </div>
        </div>
      </div>

      {/* Audio Routing Selector */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#E2E8F0]">
          <Volume2 className="w-4 h-4 text-green-400" />
          <span>Audio Routing</span>
        </div>

        <div className="space-y-2">
          {audioOptions.map((opt) => (
            <label
              key={opt.id}
              onClick={() => onChangeConfig({ audioSource: opt.id })}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                config.audioSource === opt.id
                  ? 'bg-[#0D1117] border-blue-500 text-[#E2E8F0]'
                  : 'bg-[#0D1117] hover:bg-[#1a202c] border-[#30363D] text-gray-400 hover:text-[#E2E8F0]'
              }`}
            >
              <div className="flex items-center gap-3">
                {opt.icon}
                <div>
                  <div className="text-xs font-medium text-[#E2E8F0]">{opt.label}</div>
                  <div className="text-[10px] text-gray-500">{opt.desc}</div>
                </div>
              </div>
              <input
                type="radio"
                name="audioSource"
                checked={config.audioSource === opt.id}
                onChange={() => {}}
                className="accent-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Video Bitrate & Codec Settings */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E2E8F0]">
            <Film className="w-4 h-4 text-orange-400" />
            <span>Video Bitrate & Codec</span>
          </div>
          <span className="text-xs font-mono font-medium text-blue-400 px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D]">
            {config.videoBitRate} Mbps
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="2"
            max="32"
            step="2"
            value={config.videoBitRate}
            onChange={(e) => onChangeConfig({ videoBitRate: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#30363D] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-medium">
            <span>2 Mbps (Smooth)</span>
            <span>8 Mbps (Default)</span>
            <span>32 Mbps (Lossless)</span>
          </div>
        </div>

        {/* Video Codec */}
        <div className="pt-1">
          <label className="text-[11px] text-gray-400 mb-2 block">Video Codec Encoder</label>
          <div className="grid grid-cols-3 gap-2">
            {codecOptions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChangeConfig({ videoCodec: c.id })}
                className={`p-2.5 rounded-md text-left transition-all ${
                  config.videoCodec === c.id
                    ? 'bg-blue-600/20 border border-blue-500 text-blue-300'
                    : 'bg-[#0D1117] hover:bg-[#1a202c] border border-[#30363D] text-gray-400'
                }`}
              >
                <div className="text-[11px] font-semibold">{c.label}</div>
                <div className="text-[9px] text-gray-500 truncate">{c.tag}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
