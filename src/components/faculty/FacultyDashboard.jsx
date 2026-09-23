import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Eye,
  Send,
  Building2,
  GraduationCap,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  LayoutDashboard,
  FolderOpen,
  Download,
  BookOpen,
} from 'lucide-react';
import { usePortal, downloadTemplateFile, isOfficialUniversityEmail } from '../../context/PortalContext';
import StudentFilterBar from '../common/StudentFilterBar';

export default function FacultyDashboard({ activeTab = 'dashboard', setActiveTab, onOpenSignatureModal, onOpenDocumentViewer }) {
  const {
    currentUser,
    getFilteredStudents,
    templates,
    signDocument,
    showToast,
    sendReminder,
    updateUserAvatar,
    updateUserProfile,
    isStudentFullyCleared,
    setSubmissionFilter,
    setSearchQuery,
    setSelectedSupervisorFilter,
  } = usePortal();

  const supervisedStudents = getFilteredStudents(currentUser?.id);
  const totalAssigned = supervisedStudents.length;
  const pendingSubmissionCount = supervisedStudents.filter(
    (s) => (!s.documents || s.documents.length === 0) || s.status === 'pending_submission'
  ).length;
  const pendingReviewCount = supervisedStudents.filter((s) => s.status === 'pending_supervisor').length;
  const approvedCount = supervisedStudents.filter(
    (s) => s.status === 'pending_incharge' || s.status === 'pending_hod' || s.status === 'completed'
  ).length;

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
    designation: currentUser?.designation || '',
    department: currentUser?.department || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });
  const [savedProfile, setSavedProfile] = useState({ ...profileDraft });

  useEffect(() => {
    const updated = {
      name: currentUser?.name || '',
      designation: currentUser?.designation || '',
      department: currentUser?.department || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
    };
    setProfileDraft(updated);
    setSavedProfile(updated);
  }, [currentUser]);

  const handleSaveProfile = () => {
    if (profileDraft.email && !isOfficialUniversityEmail(profileDraft.email)) {
      showToast('Official email must end with @isbfaculty.comsats.edu.pk or @isbstudents.comsats.edu.pk', 'error');
      return;
    }
    updateUserProfile({
      name: profileDraft.name || null,
      designation: profileDraft.designation || null,
      department: profileDraft.department || null,
      email: profileDraft.email || null,
      phone: profileDraft.phone || null,
    });
    setSavedProfile({ ...profileDraft });
    setEditingProfile(false);
  };
  const handleCancelProfile = () => {
    setProfileDraft({ ...savedProfile });
    setEditingProfile(false);
  };

  const handleSendReminder = (student) => {
    sendReminder(student.id);
  };

  const handleDownloadTemplate = (tpl) => {
    downloadTemplateFile(tpl);
  };

  const getStatusBadge = (student) => {
    const hasDocs = student.documents && student.documents.length > 0;
    if (isStudentFullyCleared(student))
      return { label: 'Fully Cleared (3 Cr)', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-400' };
    if (!hasDocs || student.status === 'pending_submission')
      return { label: 'Requires Submission', color: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-400' };
    if (student.status === 'pending_supervisor')
      return { label: 'Awaiting My Signature', color: 'bg-sky-100 text-sky-900 border-sky-300', dot: 'bg-sky-400', pulse: true };
    if (student.status === 'pending_incharge')
      return { label: 'Endorsed · With Incharge', color: 'bg-indigo-100 text-indigo-900 border-indigo-300', dot: 'bg-indigo-400' };
    if (student.status === 'pending_hod')
      return { label: 'Incharge Done · With HOD', color: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-400' };
    return { label: 'Awaiting Review', color: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400' };
  };

  // ── Shared profile card (used in every tab view) ──
  const ProfileCard = () => (
    <div
      className="relative rounded-3xl overflow-hidden shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #00132a 0%, #02255a 40%, #082e5b 70%, #0a3a70 100%)' }}
    >
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(14,116,144,0.25) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,155,56,0.18) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#fff 39px,#fff 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#fff 39px,#fff 40px)' }} />

      <div className="relative z-10 p-8 sm:p-10">
        {/* Top ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(194,155,56,0.18)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.38)' }}>
            <GraduationCap className="w-3.5 h-3.5" />
            Faculty Supervisor Console · Level-2 Endorsement
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
              <button onClick={() => setEditingProfile(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.10)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.35)', backdropFilter: 'blur(8px)' }}>
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-3xl p-[3px] shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#c29b38,#f0d060,#c29b38)' }}>
              <div className="w-full h-full rounded-[20px] overflow-hidden cursor-pointer group relative"
                onClick={() => avatarInputRef.current?.click()}>
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Supervisor" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#00132a,#082e5b)' }}>
                    <GraduationCap className="w-14 h-14 text-white opacity-70" />
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-[20px]"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}>
                  <Camera className="w-7 h-7 text-white" />
                  <span className="text-white text-[10px] font-bold tracking-wide">Change Photo</span>
                </div>
              </div>
            </div>
            <button onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-2.5 -right-2.5 w-9 h-9 rounded-xl border-2 border-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
              style={{ background: 'linear-gradient(135deg,#c29b38,#f0d060)' }} title="Upload photo">
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Identity / Edit */}
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-4">
                <p className="text-sm font-bold" style={{ color: '#e8c96a' }}>Edit Profile Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'name', label: 'Full Name', placeholder: 'Dr. / Mr. Full Name' },
                    { key: 'designation', label: 'Designation', placeholder: 'Lecturer / Assistant Professor' },
                    { key: 'department', label: 'Department', placeholder: 'Computer Science' },
                    { key: 'email', label: 'Official University Email', placeholder: 'e.g. name@isbfaculty.comsats.edu.pk' },
                    { key: 'phone', label: 'Phone / Ext.', placeholder: 'e.g. 051-90495049' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                        style={{ color: 'rgba(232,201,106,0.75)' }}>{label}</label>
                      <input type="text" value={profileDraft[key]}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-900 border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm"
                        style={{ background: 'rgba(255,255,255,0.93)' }} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={handleSaveProfile}
                    className="px-6 py-2.5 rounded-xl text-sm font-black text-slate-900 flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#c29b38,#f0d060)' }}>
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                  <button onClick={handleCancelProfile}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                    {savedProfile.name || currentUser?.name || 'NULL'}
                  </h2>
                  <p className="mt-1.5 text-base font-semibold" style={{ color: 'rgba(232,201,106,0.90)' }}>
                    {savedProfile.designation || currentUser?.designation || 'NULL'}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.52)' }}>
                    {savedProfile.department || currentUser?.department ? `Department of ${savedProfile.department || currentUser?.department}` : 'Department: NULL'}&nbsp;·&nbsp;
                    <span className="font-mono font-bold" style={{ color: '#e8c96a' }}>{currentUser?.regNo || 'NULL'}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.20)', backdropFilter: 'blur(6px)' }}>
                    <Mail className="w-4 h-4 text-sky-300 shrink-0" />
                    <span className="font-bold text-sky-200">Official Email:</span>
                    <span className="font-mono font-bold">{savedProfile.email || currentUser?.email || 'NULL'}</span>
                  </span>
                  {savedProfile.phone ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)' }}>
                      <Phone className="w-4 h-4 text-sky-300 shrink-0" />{savedProfile.phone}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)' }}>
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />Phone: NULL
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: 'rgba(194,155,56,0.20)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.42)' }}>
                    <ShieldCheck className="w-4 h-4 shrink-0" /> Level-2 Academic Endorsement
                  </span>
                </div>
                <div className="flex flex-wrap gap-6 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
                  {[
                    { label: 'Assigned', value: totalAssigned, color: 'text-white' },
                    { label: 'Awaiting Sign', value: pendingReviewCount, color: 'text-sky-400' },
                    { label: 'Endorsed', value: approvedCount, color: 'text-emerald-400' },
                    { label: 'Pending Docs', value: pendingSubmissionCount, color: 'text-amber-300' },
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
  );

  // ── KPI Cards ──
  const KpiCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Assigned Students', value: totalAssigned, sub: 'Under my supervision', bg: 'bg-white', border: 'border-slate-200', val: 'text-slate-900', icon: <Users className="w-5 h-5 text-slate-500" />, iconBg: 'bg-slate-100', filterId: 'all' },
        { label: 'Pending Submissions', value: pendingSubmissionCount, sub: 'Require student action', bg: 'bg-amber-50', border: 'border-amber-200', val: 'text-amber-800', icon: <AlertCircle className="w-5 h-5 text-amber-600" />, iconBg: 'bg-amber-100', filterId: 'pending_submission' },
        { label: 'Awaiting My Sign', value: pendingReviewCount, sub: 'Ready for review', bg: 'bg-sky-50', border: 'border-sky-200', val: 'text-sky-800', icon: <Clock className="w-5 h-5 text-sky-600" />, iconBg: 'bg-sky-100', filterId: 'pending_supervisor' },
        { label: 'Supervisor Endorsed', value: approvedCount, sub: 'Forwarded to Incharge/HOD', bg: 'bg-emerald-50', border: 'border-emerald-200', val: 'text-emerald-800', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, iconBg: 'bg-emerald-100', filterId: 'supervisor_endorsed' },
      ].map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => {
            setSubmissionFilter(card.filterId);
            setSearchQuery('');
            setSelectedSupervisorFilter('all');
            if (setActiveTab) setActiveTab('my_students');
          }}
          className={`${card.bg} ${card.border} border rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 text-left`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className={`text-3xl font-black mt-1 ${card.val}`}>{card.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>{card.icon}</div>
        </button>
      ))}
    </div>
  );

  // ── Section banner ──
  const SectionBanner = ({ icon, label, title, desc }) => (
    <div className="relative rounded-2xl overflow-hidden shadow-xl"
      style={{ background: 'linear-gradient(135deg, #00132a 0%, #082e5b 60%, #0a3a70 100%)' }}>
      <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg,#c29b38,#e8c96a)' }}>
          {icon}
        </div>
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1"
            style={{ background: 'rgba(194,155,56,0.18)', color: '#e8c96a', border: '1px solid rgba(194,155,56,0.3)' }}>{label}</span>
          <h2 className="text-xl font-extrabold text-white">{title}</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>{desc}</p>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════
  // TAB: DASHBOARD (overview)
  // ═══════════════════════════════════
  if (activeTab === 'dashboard' || !activeTab) {
    return (
      <div className="space-y-6 fade-in">
        <ProfileCard />
        <KpiCards />
        <div className="flex items-center gap-2 text-xs text-slate-400 italic px-1">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Use the portal navigation to view your assigned students, sign queue, or university forms.
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════
  // TAB: MY STUDENTS
  // ═══════════════════════════════════
  if (activeTab === 'my_students') {
    return (
      <div className="space-y-6 fade-in">
        <SectionBanner icon={<Users className="w-7 h-7 text-white" />} label="Supervisor View"
          title="Students Under My Supervision"
          desc="Review company placements, verify logbooks, and affix digital endorsement" />
        <KpiCards />
        <StudentFilterBar showSupervisorSelect={false} />
        <StudentRoster students={supervisedStudents} onOpenSignatureModal={onOpenSignatureModal}
          onOpenDocumentViewer={onOpenDocumentViewer} getStatusBadge={getStatusBadge}
          signDocument={signDocument} handleSendReminder={handleSendReminder} />
      </div>
    );
  }

  // ═══════════════════════════════════
  // TAB: SIGN QUEUE
  // ═══════════════════════════════════
  if (activeTab === 'sign_queue') {
    const signQueue = supervisedStudents
      .map((student) => ({
        ...student,
        pendingDocs: (student.documents || []).filter((doc) => doc.studentSigned && !doc.supervisorSigned),
      }))
      .filter((student) => student.pendingDocs.length > 0);

    return (
      <div className="space-y-6 fade-in">
        <SectionBanner icon={<ShieldCheck className="w-7 h-7 text-white" />} label="Action Required"
          title={`Review & Sign Queue (${signQueue.length})`}
          desc="Students who have submitted and signed — awaiting your endorsement" />
        <StudentRoster students={signQueue} onOpenSignatureModal={onOpenSignatureModal}
          onOpenDocumentViewer={onOpenDocumentViewer} getStatusBadge={getStatusBadge}
          signDocument={signDocument} handleSendReminder={handleSendReminder}
          emptyMsg="No documents pending your signature." />
      </div>
    );
  }

  // ═══════════════════════════════════
  // TAB: UNIVERSITY FORMS / TEMPLATES
  // ═══════════════════════════════════
  if (activeTab === 'templates') {
    return (
      <div className="space-y-6 fade-in">
        <SectionBanner icon={<FolderOpen className="w-7 h-7 text-white" />} label="Reference Documents"
          title="University Official Forms"
          desc="Official internship documents for reference and distribution" />
        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3 text-sky-700">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No University Templates Available</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              The Internship Incharge Office has not published any official document templates yet. When templates are uploaded, you can download the exact files here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-sky-200 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{tpl.code}</span>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full uppercase border border-sky-200">{tpl.category}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{tpl.title}</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{tpl.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span>Published by: <span className="font-semibold text-slate-600">{tpl.uploadedBy}</span></span>
                  <span className="flex items-center gap-1 font-mono"><Download className="w-3 h-3" />{tpl.fileSize}</span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button onClick={() => handleDownloadTemplate(tpl)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#00132a] text-white hover:bg-[#082e5b] transition-colors flex items-center gap-1.5 shadow-sm" title="Download template file as uploaded">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ── Shared student roster component ──
function StudentRoster({ students, onOpenSignatureModal, onOpenDocumentViewer, getStatusBadge, signDocument, handleSendReminder, emptyMsg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100"
        style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00132a,#082e5b)' }}>
            <Users className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Student List</h3>
            <p className="text-[11px] text-slate-500">Review performance, verify logbooks, and affix digital endorsement</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {students.length} students
        </span>
      </div>

      {students.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {students.map((student) => {
            const hasDocs = student.documents && student.documents.length > 0;
            const allDocs = student.documents || [];
            const pendingDocs = student.pendingDocs || allDocs.filter((d) => d.studentSigned && !d.supervisorSigned);
            const primaryDoc = allDocs[0];
            const status = getStatusBadge(student);
            const activeDoc = pendingDocs[0] || primaryDoc;
            return (
              <div key={student.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shadow-sm shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{student.regNo}</span>
                        <span className="text-[11px] text-slate-400">{student.program} · {student.semester}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="font-medium text-slate-700">{student.internshipCompany || 'Company Not Declared'}</span>
                        </span>
                        {student.internshipRole && <span>· {student.internshipRole}</span>}
                        <span className="font-mono font-semibold text-slate-600">CGPA {student.cgpa}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${status.color} ${status.pulse ? 'animate-pulse' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    {(!hasDocs || student.status === 'pending_submission') && (
                      <button onClick={() => handleSendReminder(student)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-sm transition-all">
                        <Send className="w-3 h-3 text-slate-500" /> Remind
                      </button>
                    )}
                    {student.status === 'pending_supervisor' && activeDoc && (
                      <button onClick={() => onOpenSignatureModal('supervisor', student, activeDoc,
                        (sigUrl, note) => { signDocument(student.id, activeDoc.id, 'supervisor', sigUrl, note); })}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#0369a1,#0284c7)' }}>
                        <PenTool className="w-3.5 h-3.5" /> Sign / Endorse
                      </button>
                    )}
                  </div>
                </div>
                {hasDocs && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
                    {allDocs.map((doc) => {
                      const docIsPending = doc.studentSigned && !doc.supervisorSigned;

                      return (
                        <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-slate-200 rounded-lg bg-slate-50 px-3 py-2">
                          <span><span className="font-semibold text-slate-700">Document:</span> {doc.title} ({doc.fileName})</span>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <button
                              onClick={() => onOpenDocumentViewer(student, doc)}
                              className="px-3 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center gap-1.5"
                            >
                              <Eye className="w-3 h-3 text-yellow-600" /> View Form
                            </button>

                            {docIsPending ? (
                              <button
                                onClick={() => onOpenSignatureModal('supervisor', student, doc, (sigUrl, note) => { signDocument(student.id, doc.id, 'supervisor', sigUrl, note); })}
                                className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold"
                              >
                                Sign This Document
                              </button>
                            ) : (
                              <span className={`inline-flex items-center gap-1 font-semibold ${doc.supervisorSigned ? 'text-sky-700' : 'text-emerald-700'}`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {doc.supervisorSigned ? `Supervisor Endorsed${doc.supervisorSignedAt ? ` (${new Date(doc.supervisorSignedAt).toLocaleDateString('en-GB')})` : ''}` : 'Student Signed'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
          <h4 className="font-bold text-slate-600 text-sm">No Students Found</h4>
          <p className="text-xs text-slate-400 mt-1">{emptyMsg || 'Adjust the filter above to view assigned students.'}</p>
        </div>
      )}
    </div>
  );
}
