import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Award,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building2,
  Eye,
  BarChart3,
  Edit3,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import StudentFilterBar from '../common/StudentFilterBar';
import confetti from 'canvas-confetti';

export default function HodDashboard({ activeTab = 'dashboard', setActiveTab, onOpenSignatureModal, onOpenDocumentViewer }) {
  const {
    currentUser,
    students,
    supervisors,
    getFilteredStudents,
    getSupervisorForStudent,
    signDocument,
    stats,
    setSubmissionFilter,
    setSearchQuery,
    setSelectedSupervisorFilter,
    updateUserAvatar,
    showToast,
  } = usePortal();

  const filteredStudents = getFilteredStudents();

  // ── Avatar upload ──
  const avatarInputRef = useRef(null);
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image exceeds 5 MB limit.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result && updateUserAvatar) updateUserAvatar(ev.target.result); };
    reader.readAsDataURL(file);
  };

  // ── Profile edit ──
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: currentUser?.name || '',
    designation: currentUser?.designation || 'Head of Department',
    department: currentUser?.department || 'Computer Science',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });
  const [savedProfile, setSavedProfile] = useState({ ...profileDraft });

  const handleSaveProfile = () => {
    setSavedProfile({ ...profileDraft });
    setEditingProfile(false);
    showToast('Profile details updated successfully.');
  };
  const handleCancelProfile = () => {
    setProfileDraft({ ...savedProfile });
    setEditingProfile(false);
  };

  // ── HOD clearance ──
  const handleHodApprove = (student, doc) => {
    onOpenSignatureModal('hod', student, doc, (signatureUrl, note) => {
      signDocument(student.id, doc.id, 'hod', signatureUrl, note);
      try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch (_) {}
    });
  };

  const getStatusBadge = (student) => {
    const hasDocs = student.documents && student.documents.length > 0;
    if (!hasDocs || student.status === 'pending_submission')
      return { label: 'Requires Submission', cls: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-400' };
    if (student.status === 'pending_supervisor')
      return { label: 'With Supervisor', cls: 'bg-sky-100 text-sky-900 border-sky-300', dot: 'bg-sky-400' };
    if (student.status === 'pending_incharge')
      return { label: 'With Incharge', cls: 'bg-indigo-100 text-indigo-900 border-indigo-300', dot: 'bg-indigo-400' };
    if (student.status === 'pending_hod')
      return { label: 'Awaiting HOD Seal', cls: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-400', pulse: true };
    return { label: 'Degree Cleared (3 Cr)', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-400' };
  };

  // ═══════════════════════════════════════════════════════════════
  // TAB: DASHBOARD (HOD Profile overview + KPI cards)
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 fade-in">

        {/* ─── HOD PROFILE CARD ─── */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}
        >
          {/* Decorative glowing orbs */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(194,155,56,0.20) 0%, transparent 70%)' }}
          />
          {/* Fine grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.04,
              backgroundImage:
                'repeating-linear-gradient(0deg,transparent,transparent 39px,#fff 39px,#fff 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#fff 39px,#fff 40px)',
            }}
          />

          <div className="relative z-10 p-8 sm:p-10">
            {/* Top ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <span
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(194,155,56,0.18)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.38)' }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Executive Departmental Authority · HOD Console
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('directives')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-md active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#facc15', border: '1px solid rgba(194,155,56,0.45)', backdropFilter: 'blur(8px)' }}
                  title="View Official University Internship Directives"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#facc15]" />
                  <span>Internship Directives</span>
                </button>

                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background: 'rgba(255,255,255,0.10)',
                      color: '#e8c96a',
                      border: '1px solid rgba(194,155,56,0.35)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Main profile row */}
            <div className="flex flex-col md:flex-row items-start gap-8">

              {/* ── Avatar ── */}
              <div className="relative shrink-0">
                {/* Gold ring frame */}
                <div
                  className="w-32 h-32 rounded-3xl p-[3px] shadow-2xl"
                  style={{ background: 'linear-gradient(135deg,#c29b38,#f0d060,#c29b38)' }}
                >
                  <div
                    className="w-full h-full rounded-[20px] overflow-hidden cursor-pointer group relative"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="HOD" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)' }}
                      >
                        <ShieldCheck className="w-14 h-14 text-white opacity-80" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-[20px]"
                      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
                    >
                      <Camera className="w-7 h-7 text-white" />
                      <span className="text-white text-[10px] font-bold tracking-wide">Change Photo</span>
                    </div>
                  </div>
                </div>

                {/* Gold camera badge */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2.5 -right-2.5 w-9 h-9 rounded-xl border-2 border-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
                  style={{ background: 'linear-gradient(135deg,#c29b38,#f0d060)' }}
                  title="Upload photo"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* ── Identity / Edit form ── */}
              <div className="flex-1 min-w-0">
                {editingProfile ? (
                  /* EDIT MODE */
                  <div className="space-y-4">
                    <p className="text-sm font-bold" style={{ color: '#e8c96a' }}>Edit Profile Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'name',        label: 'Full Name',     placeholder: 'Dr. Full Name' },
                        { key: 'designation', label: 'Designation',   placeholder: 'Head of Department' },
                        { key: 'department',  label: 'Department',    placeholder: 'Computer Science' },
                        { key: 'email',       label: 'Email',         placeholder: 'hod@comsats.edu.pk' },
                        { key: 'phone',       label: 'Phone / Ext.',  placeholder: 'e.g. 051-90495049' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label
                            className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'rgba(232,201,106,0.75)' }}
                          >
                            {label}
                          </label>
                          <input
                            type="text"
                            value={profileDraft[key]}
                            onChange={(e) => setProfileDraft((d) => ({ ...d, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-900 border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm"
                            style={{ background: 'rgba(255,255,255,0.93)' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-2.5 rounded-xl text-sm font-black text-slate-900 flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg,#c29b38,#f0d060)' }}
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                      <button
                        onClick={handleCancelProfile}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors hover:text-white"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="space-y-5">
                    {/* Name + title */}
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                        {savedProfile.name || currentUser?.name}
                      </h2>
                      <p className="mt-1.5 text-base font-semibold" style={{ color: 'rgba(232,201,106,0.90)' }}>
                        {savedProfile.designation}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.52)' }}>
                        Department of {savedProfile.department}&nbsp;·&nbsp;COMSATS University Islamabad
                      </p>
                    </div>

                    {/* Contact + authority pills */}
                    <div className="flex flex-wrap gap-2.5">
                      {savedProfile.email && (
                        <span
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                          style={{
                            background: 'rgba(255,255,255,0.10)',
                            color: 'rgba(255,255,255,0.80)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          <Mail className="w-4 h-4 text-purple-300 shrink-0" />
                          {savedProfile.email}
                        </span>
                      )}
                      {savedProfile.phone && (
                        <span
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                          style={{
                            background: 'rgba(255,255,255,0.10)',
                            color: 'rgba(255,255,255,0.80)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          <Phone className="w-4 h-4 text-purple-300 shrink-0" />
                          {savedProfile.phone}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(194,155,56,0.20)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.42)' }}
                      >
                        <Award className="w-4 h-4 shrink-0" />
                        Final Tier-4 Clearance Authority
                      </span>
                    </div>

                    {/* Quick stat strip */}
                    <div className="flex flex-wrap gap-6 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
                      {[
                        { label: 'Total Students', value: stats.totalStudents, color: 'text-white' },
                        { label: 'Cleared',         value: stats.completed,    color: 'text-emerald-400' },
                        { label: 'Pending HOD Seal',value: stats.pendingHod,   color: 'text-yellow-400' },
                        { label: 'Pending Submit',  value: stats.pendingSubmission, color: 'text-amber-300' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className={`text-2xl font-black ${color}`}>{value}</div>
                          <div className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.42)' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── KPI CARDS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Enrolled',
              value: stats.totalStudents,
              sub: 'BS CS / BS SE Programs',
              bg: 'bg-white', border: 'border-slate-200', val: 'text-slate-900',
              icon: <Users className="w-5 h-5 text-slate-500" />, iconBg: 'bg-slate-100',
              filterId: 'all',
            },
            {
              label: 'Pending Submissions',
              value: stats.pendingSubmission,
              sub: 'Require student action',
              bg: 'bg-amber-50', border: 'border-amber-200', val: 'text-amber-800',
              icon: <AlertCircle className="w-5 h-5 text-amber-600" />, iconBg: 'bg-amber-100',
              filterId: 'pending_submission',
            },
            {
              label: 'Pending HOD Seal',
              value: stats.pendingHod,
              sub: 'Ready for final clearance',
              bg: 'bg-purple-50', border: 'border-purple-200', val: 'text-purple-800',
              icon: <Clock className="w-5 h-5 text-purple-600" />, iconBg: 'bg-purple-100',
              filterId: 'pending_hod',
            },
            {
              label: 'Degree Credits Cleared',
              value: stats.completed,
              sub: '3 Credits Awarded',
              bg: 'bg-emerald-50', border: 'border-emerald-200', val: 'text-emerald-800',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, iconBg: 'bg-emerald-100',
              filterId: 'completed',
            },
          ].map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                setSubmissionFilter(card.filterId);
                setSearchQuery('');
                setSelectedSupervisorFilter('all');
                if (setActiveTab) setActiveTab('department_students');
              }}
              className={`${card.bg} ${card.border} border rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 text-left`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                <p className={`text-3xl font-black mt-1 ${card.val}`}>{card.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                {card.icon}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation hint */}
        <div className="flex items-center gap-2 text-xs text-slate-400 italic px-1">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Use the portal navigation to view Faculty Workload or manage the Department Roster &amp; Clearance.
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: FACULTY SUPERVISION WORKLOAD
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'faculty_workload') {
    return (
      <div className="space-y-6 fade-in">
        {/* Section banner */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}
        >
          <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#c29b38,#e8c96a)' }}
            >
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span
                className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1"
                style={{ background: 'rgba(194,155,56,0.18)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.3)' }}
              >
                HOD Analysis View
              </span>
              <h2 className="text-xl font-extrabold text-white">Faculty Supervision Distribution</h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Departmental workload overview &nbsp;·&nbsp; Session Fall 2026
              </p>
            </div>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Faculty Members</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{supervisors.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Actively supervising</p>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5 shadow-sm text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Assigned</p>
            <p className="text-3xl font-black text-purple-800 mt-1">{stats.totalStudents}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all supervisors</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 shadow-sm text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dept. Clearance Rate</p>
            <p className="text-3xl font-black text-emerald-800 mt-1">
              {stats.totalStudents > 0 ? Math.round((stats.completed / stats.totalStudents) * 100) : 0}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.completed} fully cleared</p>
          </div>
        </div>

        {/* Per-faculty breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"
            style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)' }}>
                <BarChart3 className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Per-Faculty Supervision Breakdown</h3>
                <p className="text-[11px] text-slate-500">Progress bar reflects each supervisor's clearance rate</p>
              </div>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {supervisors.map((sup) => {
              const total = students.filter((s) => s.assignedSupervisorId === sup.id).length;
              const cleared = students.filter((s) => s.assignedSupervisorId === sup.id && s.status === 'completed').length;
              const pending = students.filter((s) => s.assignedSupervisorId === sup.id && s.status === 'pending_supervisor').length;
              const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
              const initial = sup.name.split(' ').pop()[0];

              return (
                <div key={sup.id}
                  className="p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
                        style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)' }}
                      >
                        {initial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{sup.name}</div>
                        <div className="text-[11px] text-slate-500">{sup.designation}</div>
                        <div className="text-[10px] font-mono text-slate-400">{sup.regNo}</div>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-purple-700">{total}</span>
                  </div>

                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{cleared} cleared &nbsp;·&nbsp; {pending} with supervisor</span>
                    <span className="font-bold text-purple-700">{pct}% done</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: DEPARTMENT ROSTER (candidate dossiers + final clearance)
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'department_students') {
    const clearanceStudents = filteredStudents.filter((student) => student.status !== 'completed');
    const fullyEndorsedStudents = students.filter((student) => student.status === 'completed');
    return (
      <div className="space-y-6 fade-in">
        {/* Section banner */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}
        >
          <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#c29b38,#e8c96a)' }}
            >
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <span
                className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1"
                style={{ background: 'rgba(194,155,56,0.18)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.3)' }}
              >
                Department Roster
              </span>
              <h2 className="text-xl font-extrabold text-white">Candidate Dossiers &amp; Final Clearance</h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Authorize degree clearance by affixing the HOD departmental seal
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <StudentFilterBar showSupervisorSelect={true} />

        {/* Dossier list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100"
            style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00132a,#002b5c)' }}>
                <Users className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Departmental Candidate Roster</h3>
                <p className="text-[11px] text-slate-500">
                  {stats.pendingHod > 0 && (
                    <span className="text-purple-700 font-bold">{stats.pendingHod} awaiting your seal &nbsp;·&nbsp; </span>
                  )}
                  All clearance stages shown
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {clearanceStudents.length} students
            </span>
          </div>

          {clearanceStudents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {clearanceStudents.map((student) => {
                const supervisor = getSupervisorForStudent(student);
                const hasDocs = student.documents && student.documents.length > 0;
                const primaryDoc = student.documents?.[0];
                const status = getStatusBadge(student);

                return (
                  <div key={student.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Student info */}
                      <div className="flex items-center gap-4">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {student.regNo}
                            </span>
                            <span className="text-[11px] text-slate-400">{student.program} · CGPA {student.cgpa}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="font-medium text-slate-700">
                                {student.internshipCompany || 'No Company Registered'}
                              </span>
                            </span>
                            <span>
                              · Supervisor:{' '}
                              <span className="font-semibold text-slate-700">
                                {supervisor ? supervisor.name : <span className="text-amber-600 font-bold">Unassigned</span>}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & HOD action */}
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${status.cls} ${status.pulse ? 'animate-pulse' : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>

                        {student.status === 'pending_hod' && primaryDoc && (
                          <button
                            onClick={() => handleHodApprove(student, primaryDoc)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#5b21b6,#7c3aed)' }}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Sign &amp; Seal
                          </button>
                        )}

                        {hasDocs && (
                          <button
                            onClick={() => onOpenDocumentViewer(student, primaryDoc)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-yellow-600" />
                            View Form
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="font-bold text-slate-600 text-sm">No Students Found</h4>
              <p className="text-xs text-slate-400 mt-1">Try resetting the filter above.</p>
            </div>
          )}
        </div>

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: FULLY ENDORSED STUDENTS
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'fully_endorsed') {
    const fullyEndorsedStudents = students.filter((student) => student.status === 'completed');
    return (
      <div className="space-y-6 fade-in">
        <div className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}>
          <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg bg-emerald-600">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1 bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                Clearance Complete
              </span>
              <h2 className="text-xl font-extrabold text-white">Fully Endorsed Students</h2>
              <p className="text-sm mt-0.5 text-white/60">Students with complete clearance and awarded internship credits</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cleared Student Dossiers</h3>
              <p className="text-[11px] text-slate-500">Student, supervisor, incharge, and HOD endorsements completed</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              {fullyEndorsedStudents.length} cleared
            </span>
          </div>

          {fullyEndorsedStudents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {fullyEndorsedStudents.map((student) => {
                const supervisor = getSupervisorForStudent(student);
                const primaryDoc = student.documents?.[0];
                return (
                  <div key={student.id} className="p-5 hover:bg-emerald-50/40 transition-colors">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-200 shadow-sm shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{student.regNo}</span>
                            <span className="text-[11px] text-slate-400">{student.program || 'Program not specified'} · CGPA {student.cgpa || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /><span className="font-medium text-slate-700">{student.internshipCompany || 'No Company Registered'}</span></span>
                            <span>· Supervisor: <span className="font-semibold text-slate-700">{supervisor?.name || 'Unassigned'}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border bg-emerald-100 text-emerald-900 border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Fully Endorsed · 3 Cr
                        </span>
                        {primaryDoc && (
                          <button onClick={() => onOpenDocumentViewer(student, primaryDoc)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-emerald-200 hover:bg-emerald-50 text-slate-700 flex items-center gap-1.5 shadow-sm transition-all">
                            <Eye className="w-3.5 h-3.5 text-emerald-600" /> View Form
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-400">No fully endorsed students yet.</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
