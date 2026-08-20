import React, { useState } from 'react';
import { Wifi, X, ArrowRight, HelpCircle } from 'lucide-react';

interface WirelessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (ip: string, port?: number) => void;
  isLoading: boolean;
}

export const WirelessModal: React.FC<WirelessModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isLoading,
}) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('5555');
  const [recentIps, setRecentIps] = useState<string[]>([
    '192.168.1.145',
    '192.168.1.102',
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;
    onConnect(ip.trim(), Number(port) || 5555);
    if (!recentIps.includes(ip.trim())) {
      setRecentIps((prev) => [ip.trim(), ...prev.slice(0, 3)]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-md shadow-2xl overflow-hidden text-[#E2E8F0]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363D] bg-[#0D1117]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E2E8F0]">Wireless ADB Pairing</h3>
              <p className="text-[11px] text-gray-400">Connect your Android device over Wi-Fi network</p>
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
        <div className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1.5">
                Device Wi-Fi IP Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.50"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-[#E2E8F0] focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="5555"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-20 px-3 py-2 bg-[#0D1117] border border-[#30363D] rounded-md text-xs text-[#E2E8F0] text-center focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Recent IPs */}
            {recentIps.length > 0 && (
              <div>
                <span className="text-[10px] text-gray-400 block mb-1">Recent endpoints:</span>
                <div className="flex flex-wrap gap-1.5">
                  {recentIps.map((recent) => (
                    <button
                      key={recent}
                      type="button"
                      onClick={() => setIp(recent)}
                      className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[11px] font-mono text-blue-400 border border-[#30363D] transition-colors"
                    >
                      {recent}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !ip.trim()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Executing adb tcpip & connect...' : 'Connect Wireless Device'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Guide */}
          <div className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-blue-400 font-medium text-[11px]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How to establish wireless ADB:</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-gray-400 space-y-1">
              <li>Connect phone via USB cable once with USB Debugging enabled.</li>
              <li>Ensure phone and computer are on the same Wi-Fi network.</li>
              <li>Click Connect above (Scrcpy Hub executes <code className="text-gray-300 font-mono">adb tcpip 5555</code>).</li>
              <li>Unplug USB cable and enjoy wireless screen mirroring!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
