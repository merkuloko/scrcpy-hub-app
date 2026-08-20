import React from 'react';
import { Smartphone, Usb, CheckCircle, Wifi, X } from 'lucide-react';

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      title: "Step 1: Enable USB Debugging",
      description: "Go to Settings > Developer Options and turn on 'USB Debugging'.",
      note: "Note: To unlock Developer Options, tap 'Build Number' 7 times in About Phone.",
      icon: <Smartphone className="w-6 h-6 text-blue-400" />
    },
    {
      title: "Step 2: Connect via USB",
      description: "Plug your phone into your Mac using a high-quality USB cable.",
      icon: <Usb className="w-6 h-6 text-emerald-400" />
    },
    {
      title: "Step 3: Authorize Mac",
      description: "Check your phone screen and tap 'Allow' on the 'Allow USB debugging?' prompt.",
      icon: <CheckCircle className="w-6 h-6 text-purple-400" />
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0D1117]/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#E2E8F0] flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to Scrcpy Hub</h2>
          <p className="text-gray-400 text-sm">Follow these simple steps to start mirroring your Android device.</p>
        </div>

        {/* Steps */}
        <div className="p-8 space-y-6">
          <div className="grid gap-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-5 p-4 bg-[#0D1117] border border-[#30363D] rounded-xl hover:border-blue-500/30 transition-colors group">
                <div className="shrink-0 w-12 h-12 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                  {step.note && (
                    <p className="mt-2 text-[11px] text-blue-400/80 italic">{step.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bonus Tip */}
          <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
            <Wifi className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Bonus Tip: Wireless Mode</span>
              <p className="text-[11px] text-gray-400">
                Once connected via USB, use the <span className="text-blue-300 font-medium">Wireless Connection</span> box in the header to switch to Wi-Fi and unplug the cable.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-64 py-3.5 bg-blue-600 hover:bg-blue-50 text-white hover:text-blue-900 font-bold rounded-xl shadow-lg shadow-blue-950/20 transition-all active:scale-[0.98]"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};
