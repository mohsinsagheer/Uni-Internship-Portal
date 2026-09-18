import React from 'react';
import { ShieldCheck, BookOpen, FileText } from 'lucide-react';

export default function Footer({ onOpenDirectives }) {
  return (
    <footer className="mt-16 bg-gradient-to-r from-[#001530] via-[#002147] to-[#082a52] text-slate-200 border-t-2 border-[#c29b38]/40 shadow-[0_-8px_32px_0_rgba(0,15,40,0.4)]">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">

          {/* Left: University Identity & Official Attached Seal */}
          <div className="flex items-center gap-3 sm:gap-4 max-w-full text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-white p-1 flex items-center justify-center shadow-xl border-2 border-[#c29b38] shrink-0">
              <img
                src="/cui-logo.png"
                alt="COMSATS University Islamabad"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <h2 className="font-serif font-black text-sm sm:text-lg md:text-xl text-white tracking-wide uppercase leading-tight">
                COMSATS University Islamabad
              </h2>
              <p className="text-xs sm:text-sm text-[#facc15] mt-0.5 tracking-wide">
                Internship &amp; Corporate Placement Information Portal
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Developed &amp; Maintained for Student Affairs &amp; Faculty Supervision
              </p>
            </div>
          </div>

          {/* Center / Right: Directives Link & Quick Compliance */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold text-slate-300">
            {/* Directives Link inside Footer */}
            <button
              onClick={onOpenDirectives}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#c29b38] to-[#dfb853] hover:from-[#b38d2f] hover:to-[#c29b38] text-[#001530] font-black cursor-pointer transition-all shadow-md active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Internship Directives &amp; Policy</span>
            </button>

            <a
              href="https://lahore.comsats.edu.pk/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-all"
            >
              Visit CUI
            </a>
            <a
              href="https://sis.comsats.edu.pk/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-all"
            >
              Education Portal
            </a>
            <a
              href="https://ww5.comsats.edu.pk/Alumni/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-all"
            >
              CUI Awards
            </a>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 text-center sm:text-left">
          <p>© 2026 COMSATS University Islamabad. All Rights Reserved. Official Portal for Student Dossier &amp; Digital Clearance.</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-semibold">System Online &amp; Synchronized</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
