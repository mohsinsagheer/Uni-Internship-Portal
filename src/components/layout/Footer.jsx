import React, { memo } from 'react';
import { BookOpen } from 'lucide-react';

export default memo(function Footer({ onOpenDirectives }) {
  return (
    <footer className="mt-16 bg-gradient-to-r from-[#001530] via-[#002147] to-[#082a52] text-slate-200 border-t-2 border-[#c29b38]/40 shadow-[0_-8px_32px_0_rgba(0,15,40,0.4)]">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">

          {/* Left: University Identity & Official Seal */}
          <div className="flex items-center gap-3 sm:gap-4 max-w-full text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-white p-1 flex items-center justify-center shadow-xl border-2 border-[#c29b38] shrink-0">
              <img
                src="/cui-logo.png"
                alt="COMSATS University Islamabad official seal"
                width="128"
                height="128"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <p className="font-serif font-black text-sm sm:text-lg md:text-xl text-white tracking-wide uppercase leading-tight">
                COMSATS University Islamabad
              </p>
              <p className="text-xs sm:text-sm text-[#facc15] mt-0.5 tracking-wide">
                Internship &amp; Corporate Placement Information Portal
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Developed &amp; Maintained for Student Affairs &amp; Faculty Supervision
              </p>
            </div>
          </div>

          {/* Right: Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold text-slate-300">
            <button
              onClick={onOpenDirectives}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#c29b38] to-[#dfb853] hover:from-[#b38d2f] hover:to-[#c29b38] text-[#001530] font-black cursor-pointer transition-colors shadow-md active:scale-95"
              aria-label="View Internship Directives and Policy"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Internship Directives &amp; Policy</span>
            </button>

            <a
              href="https://lahore.comsats.edu.pk/"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Visit COMSATS University website (opens in new tab)"
            >
              Visit CUI
            </a>
            <a
              href="https://sis.comsats.edu.pk/"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="COMSATS Education Portal (opens in new tab)"
            >
              Education Portal
            </a>
            <a
              href="https://admissions.comsats.edu.pk/"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="COMSATS Admissions (opens in new tab)"
            >
              CUI Admissions
            </a>
          </nav>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 text-center">
          <p>© 2026 COMSATS University Islamabad. All Rights Reserved. Official Portal for Student Dossier &amp; Digital Clearance.</p>
        </div>
      </div>
    </footer>
  );
});
