import React, { useState, useEffect, memo } from 'react';
import {
  LogOut,
  Shield,
  GraduationCap,
  Building2,
  User,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

// Memoized so Header doesn't re-render unless currentUser or scroll state changes
export default memo(function Header({ onOpenAuth }) {
  const { currentUser, logout } = usePortal();
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
      case 'student': return { label: 'Student', Icon: GraduationCap };
      case 'supervisor': return { label: 'Faculty Supervisor', Icon: Building2 };
      case 'incharge': return { label: 'Internship Incharge', Icon: Shield };
      case 'hod': return { label: 'Head of Department', Icon: Sparkles };
      default: return { label: 'User', Icon: User };
    }
  };

  const roleMeta = getRoleMeta(currentUser?.role);
  const userDesignation = currentUser?.designation || roleMeta.label;

  return (
    <header
      className={`sticky top-0 z-40 transition-[box-shadow] duration-300 ease-in-out ${scrolled
          ? 'bg-[#001736]/95 shadow-[0_8px_24px_rgba(0,18,48,0.4)]'
          : 'bg-gradient-to-r from-[#00132a] via-[#002147] to-[#082e5b] shadow-xl border-b border-[#c29b38]/30'
        }`}
    >
      {/* ── FOREGROUND CONTENT ── */}
      <div className="relative w-full px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-5 py-3 sm:py-4">

          {/* ── LEFT: Branding ── */}
          <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-5 min-w-0 flex-1">
            {/* University Emblem — LCP image: explicit size prevents CLS, fetchpriority=high */}
            <div
              className={`shrink-0 rounded-full bg-white p-1 flex items-center justify-center shadow-2xl border-2 sm:border-3 border-[#c29b38] transition-all duration-300 ease-in-out ${scrolled ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 xl:w-24 xl:h-24'
                }`}
            >
              <img
                src="/cui-logo.png"
                alt="COMSATS University Islamabad official seal"
                width="96"
                height="96"
                fetchpriority="high"
                decoding="sync"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            {/* CUOnline & University Titles */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif font-black tracking-widest text-[#facc15] uppercase bg-[#001736]/90 rounded-md border border-[#c29b38]/50 text-[10px] sm:text-xs px-2 py-0.5">
                  CUONLINE
                </span>
              </div>
              {/* h1 is the page's primary landmark — one per page */}
              <h1 className="font-serif font-black tracking-wide text-white uppercase leading-tight truncate text-base sm:text-xl md:text-2xl lg:text-[26px]">
                COMSATS University Islamabad
              </h1>
              <p className="text-[#facc15] font-semibold tracking-wider uppercase text-[10px] sm:text-xs md:text-sm mt-1">
                Internship &amp; Corporate Placement Information Portal
              </p>
            </div>
          </div>

          {/* ── RIGHT: Profile & Actions ── */}
          <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0 lg:ml-auto max-w-full">
            <div className={`w-px bg-white/20 ${scrolled ? 'h-6' : 'h-8'}`} aria-hidden="true" />

            {/* Executive Profile Card */}
            {currentUser ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/25 shadow-lg transition-colors min-w-0 px-3 py-1.5 sm:px-3.5 sm:py-2">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className={`rounded-xl overflow-hidden border-2 border-[#c29b38] shadow-md ${scrolled ? 'w-8 h-8' : 'w-10 h-10 sm:w-11 sm:h-11'}`}>
                      <img
                        src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                        alt={`${currentUser?.name} profile photo`}
                        width="44"
                        height="44"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-[#001736] shadow-sm" aria-label="Online" />
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
            ) : (
              <div className="hidden sm:flex flex-col text-right pr-2" aria-label="Authentication status">
                <span className="text-white font-bold text-xs">Not Signed In</span>
                <span className="text-[#facc15] text-[10px]">Firebase Auth Required</span>
              </div>
            )}

            {/* Account / Logout Actions */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-3 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#c29b38] to-[#dfb853] hover:from-[#b38d2f] hover:to-[#c29b38] text-[#001530] font-black rounded-xl transition-colors shadow-md border border-[#c29b38]/60 shrink-0 active:scale-95 h-8 sm:h-9 text-xs sm:text-sm"
                  aria-label="Open account details"
                >
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Account</span>
                </button>
                <button
                  onClick={logout}
                  className="px-3 sm:px-3.5 flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-md border border-red-400/40 shrink-0 active:scale-95 h-8 sm:h-9 text-xs sm:text-sm"
                  aria-label="Sign out of CUOnline"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-[#c29b38] via-[#e5c158] to-[#c29b38] text-[#001530] font-black rounded-xl shadow-lg hover:shadow-xl border border-[#facc15] active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
                aria-label="Sign in or register to CUOnline"
              >
                <UserCheck className="w-4 h-4" aria-hidden="true" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
