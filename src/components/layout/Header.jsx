import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Shield,
  ChevronDown,
  GraduationCap,
  Building2,
  User,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function Header({ onOpenAuth }) {
  const { currentUser } = usePortal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 25);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getRoleMeta = (role) => {
    switch (role) {
      case 'student':
        return { label: 'Student', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', Icon: GraduationCap };
      case 'supervisor':
        return { label: 'Faculty Supervisor', color: 'bg-sky-500/20 text-sky-300 border-sky-400/40', Icon: Building2 };
      case 'incharge':
        return { label: 'Internship Incharge', color: 'bg-amber-500/20 text-amber-300 border-amber-400/40', Icon: Shield };
      case 'hod':
        return { label: 'Head of Department', color: 'bg-purple-600/20 text-purple-300 border-purple-400/40', Icon: Sparkles };
      default:
        return { label: 'User', color: 'bg-slate-600/20 text-slate-300 border-slate-400/40', Icon: User };
    }
  };

  const roleMeta = getRoleMeta(currentUser?.role);
  const userDesignation = currentUser?.designation || roleMeta.label;

  return (
    <header
      className="sticky top-0 z-40 relative will-change-transform transition-[background-color,box-shadow] duration-300 ease-in-out"
      style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
    >
      {/* ── BACKGROUND LAYER 1: Deep Solid University Gradient ── */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-[#00132a] via-[#002147] to-[#082e5b] shadow-xl border-b border-[#c29b38]/30 transition-opacity duration-300 ease-in-out ${
          scrolled ? 'opacity-95' : 'opacity-100'
        }`}
      />

      {/* ── BACKGROUND LAYER 2: Crystal Glassmorphic Translucent Layer When Scrolled ── */}
      <div
        className={`absolute inset-0 bg-[#001736]/60 backdrop-blur-xl backdrop-saturate-150 border-b border-white/20 shadow-[0_10px_32px_0_rgba(0,18,48,0.38)] transition-all duration-300 ease-in-out ${
          scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── FOREGROUND CONTENT: Stable Layout for Smooth Scroll ── */}
      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-5 py-3 sm:py-4">
          {/* ── LEFT: Prominent CUOnline Branding, Attached Official Logo & University Typography ── */}
          <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-5 min-w-0 flex-1">
            {/* University Emblem Seal - Attached Official Picture */}
            <div
              className={`portal-emblem shrink-0 rounded-full bg-white p-1 flex items-center justify-center shadow-2xl border-2 sm:border-3 border-[#c29b38] transition-all duration-300 ease-in-out ${
                scrolled ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 xl:w-24 xl:h-24'
              }`}
            >
              <img
                src="/cui-logo.png"
                alt="COMSATS University Islamabad"
                className="w-full h-full object-contain rounded-full shadow-inner"
              />
            </div>

            {/* CUOnline & University Titles */}
              <div className="flex flex-col justify-center min-w-0">
              {/* Visible CUOnline Heading */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-serif font-black tracking-widest text-[#facc15] uppercase bg-[#001736]/90 rounded-md border border-[#c29b38]/50 shadow-sm transition-all duration-300 text-[10px] sm:text-xs px-2 py-0.5"
                >
                  CUONLINE
                </span>
              </div>

              <h1
                className="font-serif font-black tracking-wide text-white uppercase leading-tight truncate transition-all duration-300 text-base sm:text-xl md:text-2xl lg:text-[26px]"
              >
                COMSATS University Islamabad
              </h1>
              <p
                className="text-[#facc15] font-semibold tracking-wider uppercase transition-all duration-300 text-[10px] sm:text-xs md:text-sm mt-1"
              >
                Internship &amp; Corporate Placement Information Portal
              </p>
            </div>
          </div>

          {/* ── RIGHT: Compact Executive User Profile & Action Toolbar ── */}
          <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0 lg:ml-auto max-w-full">
            {/* Subtle Divider */}
            <div className={`w-px bg-white/20 transition-all ${scrolled ? 'h-6' : 'h-8'}`}></div>

            {/* ── Executive Profile Card ── */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/25 shadow-lg transition-all min-w-0 px-3 py-1.5 sm:px-3.5 sm:py-2">
              {/* Identity: Avatar + Name + Designation */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className={`rounded-xl overflow-hidden border-2 border-[#c29b38] shadow-md transition-all ${
                      scrolled ? 'w-8 h-8' : 'w-10 h-10 sm:w-11 sm:h-11'
                    }`}
                  >
                    <img
                      src={
                        currentUser?.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'
                      }
                      alt={currentUser?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-[#001736] shadow-sm"></span>
                </div>

                <div className="flex min-w-0 max-w-[9rem] sm:max-w-[11rem] flex-col justify-center">
                  <span className="font-serif font-black text-white tracking-wide text-xs sm:text-base leading-tight truncate">
                    {currentUser?.name}
                  </span>
                  <span className="text-[#facc15] font-semibold text-[10px] sm:text-[11px] leading-tight truncate">
                    {userDesignation}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Account Button ── */}
            <button
              onClick={onOpenAuth}
              className="px-3 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#c29b38] to-[#dfb853] hover:from-[#b38d2f] hover:to-[#c29b38] text-[#001530] font-black rounded-xl transition-all shadow-md hover:shadow-lg border border-[#c29b38]/60 shrink-0 active:scale-95 h-8 sm:h-9 text-xs sm:text-sm"
              title="Account Settings & Session Switch"
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Account</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
