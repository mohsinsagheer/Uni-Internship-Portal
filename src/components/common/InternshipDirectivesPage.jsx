import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck,
  Building2,
  Award,
  ArrowLeft,
  PhoneCall,
  Mail,
  Download,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function InternshipDirectivesPage({ onBack }) {
  const { templates = [] } = usePortal();
  const directives = [
    {
      id: 'd1',
      title: 'Mandatory Tenure & Credit Hour Weightage',
      badge: 'Mandatory Policy',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-400/30',
      icon: Clock,
      points: [
        'Undergraduate internships require a continuous tenure of 6 to 8 weeks in an officially recognized organization.',
        'Successful completion and institutional clearance grants 3 non-negotiable academic credit hours required for graduation.',
        'Part-time or fragmented internships across multiple disconnected periods will not be credited.',
      ],
    },
    {
      id: 'd2',
      title: 'Digital Canvas Signature Authentication',
      badge: 'Security Rule',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      icon: ShieldCheck,
      points: [
        'Students must physically draw their handwritten signature on the digital canvas within the portal.',
        'Uploading scanned signature image files or third-party digital stamps is strictly disabled for student submissions.',
        'Any fraudulent submission or misrepresented signature will result in disciplinary committee review.',
      ],
    },
    {
      id: 'd3',
      title: 'Four-Tier Sequential Approval Workflow',
      badge: 'Protocol',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      icon: UserCheck,
      points: [
        'Tier 1 (Student): Uploads official CUI internship documents with digital canvas signature.',
        'Tier 2 (Faculty Supervisor): Reviews weekly diary logs, verifies industry mentor evaluation, and digitally signs.',
        'Tier 3 (Internship Incharge): Departmental review, corporate compliance vetting, and institutional endorsement stamp.',
        'Tier 4 (Head of Department): Final institutional clearance, academic audit sign-off, and credit hour issuance.',
      ],
    },
    {
      id: 'd4',
      title: 'Weekly Progress Logs & Corporate Mentor Evaluation',
      badge: 'Documentation',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: FileText,
      points: [
        'Students are required to maintain weekly progress logs (Form CUI-INT-02) detailing tasks and skills gained.',
        'The host corporate mentor must sign off on the weekly logs and complete the confidential industry evaluation.',
        'Failure to submit weekly logs on schedule will lead to provisional hold on final departmental clearance.',
      ],
    },
  ];

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* ── Top University Header Banner ── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-[#00132a] via-[#002147] to-[#082e5b] text-white p-6 sm:p-10 border-2 border-[#c29b38]/50">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#c29b38]/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/15">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1.5 flex items-center justify-center border-2 border-[#c29b38] shadow-2xl shrink-0">
                <img src="/cui-logo.png" alt="COMSATS University" className="w-full h-full object-contain rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif font-black text-xs tracking-widest text-[#facc15] uppercase bg-[#001736]/90 px-2.5 py-0.5 rounded border border-[#c29b38]/50">
                    CUONLINE
                  </span>
                  <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                    Academic Directive Document
                  </span>
                </div>
                <h1 className="font-serif font-black text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-wide">
                  COMSATS University Islamabad
                </h1>
                <p className="text-xs sm:text-sm text-[#facc15] font-semibold tracking-wider uppercase mt-0.5">
                  Official Internship Directives, Regulations &amp; Clearance Policy
                </p>
              </div>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all shadow-md active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-[#facc15]" />
                <span>Return to Dashboard</span>
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5 font-mono text-[#facc15] bg-black/40 px-3 py-1 rounded-lg border border-[#c29b38]/30">
              <BookOpen className="w-4 h-4 text-[#facc15]" />
              Policy Ref: CUI-DIR-INT-2026/V4
            </span>
            <span>· Academic Term: Fall 2026 / Spring 2027</span>
            <span>· Authorized by Principal Seat Academic Council &amp; HEC Pakistan</span>
          </div>
        </div>
      </div>

      {/* ── Key Directives Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {directives.map((dir) => {
          const Icon = dir.icon;
          return (
            <div
              key={dir.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#002147] text-[#facc15] flex items-center justify-center shadow-md shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-black text-slate-900 text-base leading-tight">
                      {dir.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${dir.badgeColor}`}>
                    {dir.badge}
                  </span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  {dir.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-[#002147]">Institutional Compliance Required</span>
                <span className="font-mono text-[11px] text-slate-400">Section {dir.id.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Official Clearance Checklist ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-[#c29b38]/20 border border-[#c29b38]/40 flex items-center justify-center text-[#002147]">
            <Award className="w-5 h-5 text-[#c29b38]" />
          </div>
          <div>
            <h2 className="font-serif font-black text-lg sm:text-xl text-[#002147] uppercase tracking-wide">
              Official Institutional Templates Checklist
            </h2>
            <p className="text-xs text-slate-500">
              Each student must complete, sign, and endorse official templates published by the Incharge to receive graduation clearance.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-semibold">No official templates published yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">The Internship Incharge Office will upload official document forms for download and submission.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-mono font-bold text-xs text-[#002147] bg-white px-2 py-0.5 rounded border border-slate-200 block w-fit">
                  {tpl.code}
                </span>
                <h4 className="font-bold text-sm text-slate-900 leading-snug">{tpl.title}</h4>
                <p className="text-[11px] text-slate-600 font-medium">Category: {tpl.category}</p>
                <div className="flex gap-1 flex-wrap pt-1">
                  {tpl.requiredSignatures.map((sig) => (
                    <span key={sig} className="text-[9px] px-1.5 py-0.5 bg-white text-slate-700 font-bold uppercase rounded border border-slate-200">
                      {sig}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Official Contact & Student Service Centre Helpdesk ── */}
      <div className="bg-gradient-to-r from-[#001530] to-[#002b5c] rounded-2xl text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-[#c29b38]/40 shadow-xl">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#facc15] shrink-0">
            <PhoneCall className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-white uppercase tracking-wide">
              Placement &amp; Student Service Centre (SSC)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              For policy inquiries, employer verifications, or dispute resolutions, contact the placement desk.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="tel:+92519049000"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-[#facc15]" />
            <span>Ext. 9049 / 9050</span>
          </a>
          <a
            href="mailto:internship.cs@comsats.edu.pk"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c29b38] to-[#dfb853] text-[#001530] font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>internship.cs@comsats.edu.pk</span>
          </a>
        </div>
      </div>
    </div>
  );
}
