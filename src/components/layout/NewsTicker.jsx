import React from 'react';
import { Megaphone } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function NewsTicker() {
  const { notices } = usePortal();

  return (
    <div className="bg-gradient-to-r from-[#edf6ff] via-[#f8fbff] to-[#eaf3ff] border-b border-[#cfe1f5] text-slate-800 py-2.5 sm:py-3 px-4 sm:px-8 flex items-center shadow-[0_2px_12px_rgba(148,163,184,0.18)]">
      {/* ── SIS Notice Badge Card ── */}
      <div className="portal-notice-badge flex items-center gap-2 font-black text-[#002147] bg-white/80 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-sm shrink-0 uppercase tracking-widest text-xs sm:text-sm border border-[#bfd7f5] backdrop-blur-sm">
        <Megaphone className="w-4.5 h-4.5 text-[#0f3f75] animate-bounce shrink-0" />
        <span className="leading-none">SIS Notice:</span>
      </div>

      {/* ── Scrolling Announcement Ticker ── */}
      <div className="overflow-hidden relative w-full ml-4">
        <div className="animate-ticker text-slate-700 font-semibold text-xs sm:text-sm tracking-wide">
          {notices.map((notice, idx) => (
            <span key={idx} className="inline-flex items-center mx-8">
              <span className="w-2 h-2 rounded-full bg-[#5d8ec4] inline-block mr-2.5 shadow-sm shadow-[#5d8ec4]/50 shrink-0"></span>
              <span className="hover:text-[#002147] transition-colors cursor-default">{notice}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
