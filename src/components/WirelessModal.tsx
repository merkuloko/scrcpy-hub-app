import React, { useState } from 'react';
import { ArrowRight, Wifi, X } from 'lucide-react';

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ip.trim()) return;
    onConnect(ip.trim(), Number(port) || 5555);
    if (!recentIps.includes(ip.trim())) {
      setRecentIps((prev) => [ip.trim(), ...prev.slice(0, 3)]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-[420px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text)] shadow-[var(--shadow-popover)]">
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[9px] border border-[var(--border)] bg-white/[0.045] text-[var(--accent)]">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">Connect over Wi-Fi</h3>
              <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">
                Enter the device endpoint after enabling wireless ADB.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-icon h-7 min-h-7 w-7" title="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className="label mb-1.5 block">Endpoint</label>
            <div className="grid grid-cols-[1fr_76px] gap-2">
              <input
                type="text"
                placeholder="192.168.1.50"
                value={ip}
                onChange={(event) => setIp(event.target.value)}
                className="field mono"
                autoFocus
              />
              <input
                type="text"
                placeholder="5555"
                value={port}
                onChange={(event) => setPort(event.target.value)}
                className="field mono text-center"
              />
            </div>
          </div>

          {recentIps.length > 0 && (
            <div>
              <span className="caption mb-1.5 block">Recent</span>
              <div className="flex flex-wrap gap-1.5">
                {recentIps.map((recent) => (
                  <button key={recent} type="button" onClick={() => setIp(recent)} className="btn min-h-7 px-2 mono text-[11px]">
                    {recent}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[10px] border border-[var(--border)] bg-white/[0.03] p-3">
            <p className="text-[12px] leading-5 text-[var(--text-secondary)]">
              Connect once via USB with debugging enabled, keep both devices on the same network, then connect to the phone's IP address.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={isLoading || !ip.trim()} className="btn btn-primary">
              {isLoading ? 'Connecting' : 'Connect'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
