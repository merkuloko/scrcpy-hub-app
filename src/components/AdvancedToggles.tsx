import React, { useState } from 'react';
import {
  MonitorOff,
  Video,
  Moon,
  Layers,
  Touchpad,
  Lock,
  Wifi,
  Terminal,
  ArrowRight,
} from 'lucide-react';
import { ScrcpyConfig } from '../types';

interface AdvancedTogglesProps {
  config: ScrcpyConfig;
  onChangeConfig: (newConfig: Partial<ScrcpyConfig>) => void;
  onConnectWireless: (ip: string, port?: number) => void;
  isConnectingWireless: boolean;
  generatedCommand: string;
}

export const AdvancedToggles: React.FC<AdvancedTogglesProps> = ({
  config,
  onChangeConfig,
  onConnectWireless,
  isConnectingWireless,
  generatedCommand,
}) => {
  const [wirelessIp, setWirelessIp] = useState('');
  const [wirelessPort, setWirelessPort] = useState('5555');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleWirelessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wirelessIp.trim()) return;
    onConnectWireless(wirelessIp.trim(), Number(wirelessPort) || 5555);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const quickFlags = [
    { label: '--fullscreen', desc: 'Full Screen Mode' },
    { label: '--window-borderless', desc: 'No Title Bar' },
    { label: '--display-buffer=50', desc: '50ms Buffer' },
    { label: '--power-off-on-close', desc: 'Sleep On Exit' },
    { label: '--no-mipmaps', desc: 'Fast Scaling' },
  ];

  return (
    <div className="space-y-4">
      {/* Toggles Grid */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferences</h2>
          <span className="text-[10px] text-gray-500 font-mono">ADB / Scrcpy v2.x</span>
        </div>

        <div className="space-y-2.5">
          {/* Turn Screen Off */}
          <div className="flex items-center justify-between p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
            <div className="flex items-center gap-3">
              <MonitorOff className="w-5 h-5 text-orange-400" />
              <div>
                <span className="text-sm font-medium text-[#E2E8F0]">Turn screen off on start</span>
                <p className="text-[11px] text-gray-500">Keeps device screen blacked out to save battery</p>
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-screen-off"
              checked={config.turnScreenOff}
              onChange={(e) => onChangeConfig({ turnScreenOff: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 bg-gray-700 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Start Recording */}
          <div className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-red-400" />
                <div>
                  <span className="text-sm font-medium text-[#E2E8F0]">Record to MP4</span>
                  <p className="text-[11px] text-gray-500">Direct hardware video capture saved locally</p>
                </div>
              </div>
              <input
                type="checkbox"
                id="toggle-recording"
                checked={config.record}
                onChange={(e) => onChangeConfig({ record: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 bg-gray-700 accent-blue-500 cursor-pointer"
              />
            </div>

            {config.record && (
              <div className="pt-2 border-t border-[#30363D]">
                <label className="text-[11px] text-gray-400 block mb-1">Output File Name (.mp4)</label>
                <input
                  type="text"
                  placeholder="e.g. gameplay_session_1"
                  value={config.recordFileName}
                  onChange={(e) => onChangeConfig({ recordFileName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#161B22] border border-[#30363D] rounded text-xs text-[#E2E8F0] focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Stay Awake */}
          <div className="flex items-center justify-between p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-sm font-medium text-[#E2E8F0]">Stay Awake</span>
                <p className="text-[11px] text-gray-500">Prevent device from sleeping during session</p>
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-stay-awake"
              checked={config.stayAwake}
              onChange={(e) => onChangeConfig({ stayAwake: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 bg-gray-700 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Always on Top */}
          <div className="flex items-center justify-between p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-sm font-medium text-[#E2E8F0]">Always on Top</span>
                <p className="text-[11px] text-gray-500">Keep mirroring window pinned above other apps</p>
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-always-on-top"
              checked={config.alwaysOnTop}
              onChange={(e) => onChangeConfig({ alwaysOnTop: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 bg-gray-700 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Show Touches */}
          <div className="flex items-center justify-between p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
            <div className="flex items-center gap-3">
              <Touchpad className="w-5 h-5 text-green-400" />
              <div>
                <span className="text-sm font-medium text-[#E2E8F0]">Show Physical Touches</span>
                <p className="text-[11px] text-gray-500">Render visible touch indicators during demo</p>
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-show-touches"
              checked={config.showTouches}
              onChange={(e) => onChangeConfig({ showTouches: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 bg-gray-700 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Read Only (No Control) */}
          <div className="flex items-center justify-between p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-sm font-medium text-[#E2E8F0]">View Only (No Touch Input)</span>
                <p className="text-[11px] text-gray-500">Disable mouse and keyboard input forwarding</p>
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-read-only"
              checked={config.readOnly}
              onChange={(e) => onChangeConfig({ readOnly: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 bg-gray-700 accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Wireless Connect Quick Box */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wireless Connection</h2>
          <span className="text-[10px] text-blue-400 font-mono">Port 5555</span>
        </div>
        <p className="text-xs text-gray-500">Ensure ADB over TCP is enabled on your device before connecting.</p>

        <form onSubmit={handleWirelessSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              id="wireless-ip-input"
              placeholder="192.168.1.55"
              value={wirelessIp}
              onChange={(e) => setWirelessIp(e.target.value)}
              className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E2E8F0] focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
            />
            <input
              type="text"
              placeholder="5555"
              value={wirelessPort}
              onChange={(e) => setWirelessPort(e.target.value)}
              className="w-16 bg-[#0D1117] border border-[#30363D] rounded-md px-2 py-2 text-sm text-[#E2E8F0] text-center focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              id="wireless-connect-submit"
              disabled={isConnectingWireless || !wirelessIp.trim()}
              className="px-4 py-2 bg-[#30363D] hover:bg-[#3c444d] active:scale-95 text-[#E2E8F0] text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isConnectingWireless ? 'Connecting...' : 'Connect'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pt-3 border-t border-[#30363D] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              ADB Server is running (v41)
            </div>
            <span className="text-[10px] text-gray-500 font-mono">adb tcpip 5555</span>
          </div>
        </form>
      </div>

      {/* Custom Arguments Input & Helpers */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E2E8F0]">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Additional Scrcpy Flags</span>
          </div>
        </div>

        <input
          type="text"
          id="custom-args-input"
          placeholder="e.g. --window-title 'My Device' --window-x 100"
          value={config.customArgs}
          onChange={(e) => onChangeConfig({ customArgs: e.target.value })}
          className="w-full px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
        />

        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickFlags.map((flag) => (
            <button
              key={flag.label}
              type="button"
              onClick={() => {
                const current = config.customArgs.trim();
                if (!current.includes(flag.label)) {
                  onChangeConfig({ customArgs: current ? `${current} ${flag.label}` : flag.label });
                }
              }}
              className="px-2.5 py-1 rounded bg-[#0D1117] hover:bg-[#1a202c] text-[11px] font-mono text-gray-400 hover:text-blue-400 border border-[#30363D] transition-colors"
              title={flag.desc}
            >
              +{flag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generated CLI Command Preview Box */}
      <div className="p-4 bg-[#161B22] rounded-xl border border-[#30363D] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Executed CLI Command</span>
          <button
            onClick={handleCopyCommand}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {copiedCmd ? 'Copied!' : 'Copy CLI'}
          </button>
        </div>
        <div className="font-mono text-xs text-gray-300 bg-[#0D1117] p-3 rounded-md border border-[#30363D] overflow-x-auto select-all whitespace-nowrap">
          {generatedCommand}
        </div>
      </div>
    </div>
  );
};
