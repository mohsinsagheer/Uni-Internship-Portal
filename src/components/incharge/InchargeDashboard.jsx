import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  UserPlus,
  FolderOpen,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Stamp,
  Eye,
  UploadCloud,
  Building2,
  ShieldCheck,
  Briefcase,
  X,
  Edit3,
  Save,
  Camera,
  Mail,
  Phone,
  LayoutDashboard,
  Download,
  BookOpen,
} from 'lucide-react';
import { usePortal, downloadTemplateFile, isOfficialUniversityEmail } from '../../context/PortalContext';
import StudentFilterBar from '../common/StudentFilterBar';

export default function InchargeDashboard({ activeTab = 'dashboard', setActiveTab, onOpenSignatureModal, onOpenDocumentViewer }) {
  const {
    currentUser,
    students,
    supervisors,
    templates,
    getFilteredStudents,
    getSupervisorForStudent,
    assignSupervisor,
    isStudentFullyCleared,
    signDocument,
    addTemplate,
    deleteTemplate,
    stats,
    updateUserProfile,
    setSubmissionFilter,
    setSearchQuery,
    setSelectedSupervisorFilter,
    showToast,
    updateUserAvatar,
  } = usePortal();

  const filteredStudents = getFilteredStudents();
  const fullyEndorsedStudents = students.filter((student) => isStudentFullyCleared(student));

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

  // ── Template form & management ──
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplateCode, setNewTemplateCode] = useState('');
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Evaluation');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateFile, setNewTemplateFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) {
      showToast('Please enter a document title.');
      return;
    }

    if (newTemplateFile) {
      const reader = new FileReader();
      reader.onload = () => {
        addTemplate({
          code: newTemplateCode.trim() || `CUI-INT-FORM-0${templates.length + 1}`,
          title: newTemplateTitle.trim(),
          category: newTemplateCategory,
          description: newTemplateDescription.trim() || 'Official document issued by the Internship Incharge Office.',
          fileSize: `${Math.round(newTemplateFile.size / 1024)} KB`,
          fileName: newTemplateFile.name,
          fileType: newTemplateFile.type || 'application/octet-stream',
          fileDataUrl: reader.result,
          requiredSignatures: ['student', 'supervisor', 'incharge'],
        });
        setShowAddTemplateModal(false);
        setNewTemplateCode('');
        setNewTemplateTitle('');
        setNewTemplateDescription('');
        setNewTemplateFile(null);
      };
      reader.readAsDataURL(newTemplateFile);
    } else {
      addTemplate({
        code: newTemplateCode.trim() || `CUI-INT-FORM-0${templates.length + 1}`,
        title: newTemplateTitle.trim(),
        category: newTemplateCategory,
        description: newTemplateDescription.trim() || 'Official document issued by the Internship Incharge Office.',
        fileSize: '350 KB',
        fileName: `${(newTemplateCode.trim() || 'CUI-FORM')}.pdf`,
        fileType: 'application/pdf',
        fileDataUrl: null,
        requiredSignatures: ['student', 'supervisor', 'incharge'],
      });
      setShowAddTemplateModal(false);
      setNewTemplateCode('');
      setNewTemplateTitle('');
      setNewTemplateDescription('');
      setNewTemplateFile(null);
    }
  };

  const handleDownloadTemplate = (tpl) => {
    downloadTemplateFile(tpl);
  };

  const DeleteWarningModal = ({ template, onClose, onConfirm }) => {
    if (!template) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-200 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">Warning</p>
              <h3 className="font-bold text-sm text-slate-900">Delete document permanently?</h3>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs text-slate-600">
            <p>
              This action will permanently remove <span className="font-bold text-slate-800">{template.title}</span> from the university document repository.
            </p>
            <p className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 font-semibold">
              This cannot be undone and may affect student access to the document.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm">
                <X className="w-3.5 h-3.5" /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSupervisorChange = (studentId, newSupervisorId) => {
    assignSupervisor(studentId, newSupervisorId || null);
  };

  const getStatusConfig = (student) => {
    const hasDocs = student.documents && student.documents.length > 0;
    if (isStudentFullyCleared(student))
      return { label: 'Fully Endorsed (3 Cr)', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-400' };
    if (!hasDocs || student.status === 'pending_submission')
      return { label: 'Requires Submission', cls: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-400' };
    if (student.status === 'pending_supervisor')
      return { label: 'With Supervisor', cls: 'bg-sky-100 text-sky-900 border-sky-300', dot: 'bg-sky-400' };
    if (student.status === 'pending_incharge')
      return { label: 'Ready for Incharge Stamp', cls: 'bg-indigo-100 text-indigo-900 border-indigo-300', dot: 'bg-indigo-400', pulse: true };
    if (student.status === 'pending_hod')
      return { label: 'Incharge Done · With HOD', cls: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-400' };
    return { label: 'Awaiting Review', cls: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400' };
  };

  // ── Shared section banner ──
  const SectionBanner = ({ icon, label, title, desc }) => (
    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#c29b38]/40"
      style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}>
      <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(194,155,56,0.4)' }}>
          {icon}
        </div>
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#facc15', border: '1px solid rgba(194,155,56,0.4)' }}>{label}</span>
          <h2 className="text-xl font-extrabold text-white">{title}</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>{desc}</p>
        </div>
      </div>
    </div>
  );

  // ── KPI Cards ──
  const KpiCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {[
        { label: 'Total Registered', value: stats.totalStudents, sub: 'All students', bg: 'bg-[#f3f4f6]', border: 'border-[#d1d5db]', val: 'text-[#0f172a]', icon: <Users className="w-4 h-4 text-[#374151]" />, iconBg: 'bg-[#e5e7eb]', filterId: 'all' },
        { label: 'Pending Submissions', value: stats.pendingSubmission, sub: 'Require student action', bg: 'bg-[#fdf2f8]', border: 'border-[#f9a8d4]', val: 'text-[#831843]', icon: <AlertCircle className="w-4 h-4 text-[#be185d]" />, iconBg: 'bg-[#fce7f3]', filterId: 'pending_submission' },
        { label: 'With Supervisor', value: stats.pendingSupervisor, sub: 'Awaiting endorsement', bg: 'bg-[#f3f4f6]', border: 'border-[#cbd5e1]', val: 'text-[#1e293b]', icon: <Clock className="w-4 h-4 text-[#475569]" />, iconBg: 'bg-[#e2e8f0]', filterId: 'pending_supervisor' },
        { label: 'Awaiting Incharge', value: stats.pendingIncharge, sub: 'Ready for my stamp', bg: 'bg-[#f5f3ff]', border: 'border-[#c4b5fd]', val: 'text-[#4c1d95]', icon: <Stamp className="w-4 h-4 text-[#6d28d9]" />, iconBg: 'bg-[#ede9fe]', filterId: 'pending_incharge' },
        { label: 'Completed & Cleared', value: stats.completed, sub: '3 Credits awarded', bg: 'bg-[#f0fdf4]', border: 'border-[#86efac]', val: 'text-[#166534]', icon: <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />, iconBg: 'bg-[#dcfce7]', filterId: 'completed' },
      ].map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => {
            setSubmissionFilter(card.filterId);
            setSelectedSupervisorFilter('all');
            setSearchQuery('');
            if (setActiveTab) setActiveTab('allocation');
          }}
          className={`${card.bg} ${card.border} border rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 text-left`}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className={`text-2xl font-black mt-1 ${card.val}`}>{card.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{card.sub}</p>
          </div>
          <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0 shadow-inner`}>
            {card.icon}
          </div>
        </button>
      ))}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // TAB: DASHBOARD (Incharge profile overview + KPI)
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'dashboard' || !activeTab) {
    return (
      <div className="space-y-6 fade-in">
        {/* ─── INCHARGE PROFILE CARD (Matching Website Header Gradient) ─── */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#c29b38]/40"
          style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}>
          {/* Glowing orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(194,155,56,0.22) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)' }} />
          {/* Fine grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#fff 39px,#fff 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#fff 39px,#fff 40px)' }} />

          <div className="relative z-10 p-8 sm:p-10">
            {/* Top ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#facc15', border: '1px solid rgba(194,155,56,0.40)' }}>
                <Briefcase className="w-3.5 h-3.5 text-[#facc15]" />
                Career &amp; Internship Placement Cell · Incharge Console
              </span>

              <div className="flex items-center gap-2.5">
                {/* Link to Directives inside Incharge Card */}
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('directives')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-md active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#facc15', border: '1px solid rgba(194,155,56,0.45)', backdropFilter: 'blur(8px)' }}
                  title="View Official University Internship Directives & Guidelines"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#facc15]" />
                  <span>Internship Directives</span>
                </button>

                {!editingProfile && (
                  <button onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.30)', backdropFilter: 'blur(8px)' }}>
                    <Edit3 className="w-3.5 h-3.5 text-[#facc15]" /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar with Gold Ring */}
              <div className="relative shrink-0">
                <div className="w-32 h-32 rounded-3xl p-[3px] shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #c29b38, #facc15, #c29b38)' }}>
                  <div className="w-full h-full rounded-[20px] overflow-hidden cursor-pointer group relative"
                    onClick={() => avatarInputRef.current?.click()}>
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="Incharge" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #001736, #002b5c)' }}>
                        <Briefcase className="w-14 h-14 text-white opacity-80" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-[20px]"
                      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}>
                      <Camera className="w-7 h-7 text-[#facc15]" />
                      <span className="text-white text-[10px] font-bold tracking-wide">Change Photo</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2.5 -right-2.5 w-9 h-9 rounded-xl border-2 border-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
                  style={{ background: 'linear-gradient(135deg,#c29b38,#facc15)' }} title="Upload photo">
                  <Camera className="w-4 h-4 text-[#001530]" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Identity / Edit form */}
              <div className="flex-1 min-w-0">
                {editingProfile ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold" style={{ color: '#fef3c7' }}>Edit Profile Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'name', label: 'Full Name', placeholder: 'Dr. / Mr. Full Name' },
                        { key: 'designation', label: 'Designation', placeholder: 'Internship Incharge' },
                        { key: 'department', label: 'Department', placeholder: 'Computer Science' },
                        { key: 'email', label: 'Official University Email', placeholder: 'e.g. name@isbfaculty.comsats.edu.pk' },
                        { key: 'phone', label: 'Phone / Ext.', placeholder: 'e.g. 051-90495049' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: 'rgba(254,243,199,0.75)' }}>{label}</label>
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
                        style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}>
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
                      <p className="mt-1.5 text-base font-semibold" style={{ color: 'rgba(254,243,199,0.90)' }}>
                        {savedProfile.designation || currentUser?.designation || 'NULL'}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.52)' }}>
                        {savedProfile.department || currentUser?.department ? `Department of ${savedProfile.department || currentUser?.department}` : 'Department: NULL'}&nbsp;·&nbsp;
                        <span className="font-mono font-bold" style={{ color: '#fef3c7' }}>{currentUser?.regNo || 'NULL'}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)' }}>
                        <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="font-bold text-amber-200">Official Email:</span>
                        <span className="font-mono font-bold">{savedProfile.email || currentUser?.email || 'NULL'}</span>
                      </span>
                      {savedProfile.phone ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                          style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
                          <Phone className="w-4 h-4 text-amber-300 shrink-0" />{savedProfile.phone}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                          style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />Phone: NULL
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(255,255,255,0.18)', color: '#fef3c7', border: '1px solid rgba(255,255,255,0.30)' }}>
                        <ShieldCheck className="w-4 h-4 shrink-0" /> Tier-3 Incharge Clearance
                      </span>
                    </div>
                    {/* Quick stat strip */}
                    <div className="flex flex-wrap gap-6 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                      {[
                        { label: 'Total Students', value: stats.totalStudents, color: 'text-white' },
                        { label: 'Awaiting Stamp', value: stats.pendingIncharge, color: 'text-yellow-300' },
                        { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
                        { label: 'Pending Submit', value: stats.pendingSubmission, color: 'text-amber-300' },
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

        <KpiCards />
        <div className="flex items-center gap-2 text-xs text-slate-400 italic px-1">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Use the portal navigation to manage student allocation, sign endorsements, or the document repository.
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: ALLOCATION (master roster + supervisor assignment)
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'allocation' || activeTab === 'all_students') {
    const allocationStudents = filteredStudents.filter((student) => student.status !== 'completed');
    return (
      <div className="space-y-6 fade-in">
        <SectionBanner icon={<UserPlus className="w-7 h-7 text-white" />}
          label="Incharge Management"
          title="Master Roster &amp; Supervisor Allocation"
          desc="Assign or reassign faculty mentors and endorse verified candidate submissions" />
        <StudentFilterBar showSupervisorSelect={true} />

        <div className="bg-white rounded-2xl border border-[#c29b38]/35 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#c29b38]/30"
            style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#c29b38,#facc15)' }}>
                <UserPlus className="w-4 h-4 text-[#001530]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Student–Faculty Allocation Table</h3>
                <p className="text-[11px] text-slate-300">Assign or reassign supervisors and affix incharge endorsement stamps</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#001530] bg-[#facc15] px-3 py-1 rounded-full border border-[#c29b38] shadow-sm">
              {allocationStudents.length} students
            </span>
          </div>

          {allocationStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Company &amp; Role</th>
                    <th className="py-3 px-4">Faculty Supervisor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocationStudents.map((student) => {
                    const supervisor = getSupervisorForStudent(student);
                    const hasDocs = student.documents && student.documents.length > 0;
                    const primaryDoc = student.documents?.[0];
                    const canSign = primaryDoc && primaryDoc.studentSigned && primaryDoc.supervisorSigned && !primaryDoc.inchargeSigned;
                    const status = getStatusConfig(student);
                    return (
                      <tr key={student.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">{student.name}</div>
                              <div className="font-mono text-[11px] text-amber-700 font-bold">{student.regNo}</div>
                              <div className="text-[10px] text-slate-400">{student.program}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{student.internshipCompany || 'Not Assigned'}</div>
                          <div className="text-[11px] text-slate-500">{student.internshipRole}</div>
                          <div className="text-[10px] font-mono text-slate-400">{student.internshipDuration}</div>
                        </td>
                        <td className="py-3 px-4">
                          <select value={student.assignedSupervisorId || ''}
                            onChange={(e) => handleSupervisorChange(student.id, e.target.value)}
                            className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${supervisor ? 'bg-sky-50 text-sky-900 border-sky-200' : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'}`}>
                            <option value="">— Not Assigned —</option>
                            {supervisors.map((sup) => (
                              <option key={sup.id} value={sup.id}>{sup.name} ({sup.regNo})</option>
                            ))}
                          </select>
                          {supervisor && <div className="text-[10px] text-slate-400 mt-1">{supervisor.department}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.cls} ${status.pulse ? 'animate-pulse' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canSign && (
                              <button
                                onClick={() => onOpenSignatureModal('incharge', student, primaryDoc,
                                  (sigUrl, note) => { signDocument(student.id, primaryDoc.id, 'incharge', sigUrl, note); })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#b45309,#d97706)' }}>
                                <Stamp className="w-3.5 h-3.5" /> Affix Stamp
                              </button>
                            )}
                            {hasDocs && (
                              <button onClick={() => onOpenDocumentViewer(student, primaryDoc)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-sm">
                                <Eye className="w-3.5 h-3.5 text-amber-600" /> View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
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
    return (
      <div className="space-y-6 fade-in">
        <SectionBanner icon={<CheckCircle2 className="w-7 h-7 text-white" />}
          label="Clearance Complete"
          title="Fully Endorsed Students"
          desc="Students with complete student, supervisor, incharge, and HOD clearance" />

        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cleared Student Dossiers</h3>
              <p className="text-[11px] text-slate-500">All three clearance endorsements completed</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              {fullyEndorsedStudents.length} cleared
            </span>
          </div>

          {fullyEndorsedStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Program</th>
                    <th className="py-3 px-4">Company &amp; Role</th>
                    <th className="py-3 px-4">Faculty Supervisor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fullyEndorsedStudents.map((student) => {
                    const supervisor = getSupervisorForStudent(student);
                    const primaryDoc = student.documents?.[0];
                    return (
                      <tr key={student.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-xl object-cover border border-emerald-200 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">{student.name}</div>
                              <div className="font-mono text-[11px] text-emerald-700 font-bold">{student.regNo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{student.program || 'Not specified'}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{student.internshipCompany || 'Not Assigned'}</div>
                          <div className="text-[11px] text-slate-500">{student.internshipRole || 'Internship placement'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{supervisor?.name || 'Unassigned'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-100 text-emerald-900 border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Fully Endorsed
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {primaryDoc && (
                            <button onClick={() => onOpenDocumentViewer(student, primaryDoc)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-200 hover:bg-emerald-50 text-slate-700 flex items-center gap-1.5 shadow-sm ml-auto">
                              <Eye className="w-3.5 h-3.5 text-emerald-600" /> View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-400">No fully endorsed students yet.</div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: INCHARGE SIGNATURE QUEUE
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'incharge_signatures') {
    const signQueue = filteredStudents
      .map((student) => ({
        ...student,
        pendingDocs: (student.documents || []).filter((doc) => doc.supervisorSigned && !doc.inchargeSigned),
      }))
      .filter((student) => student.pendingDocs.length > 0);

    return (
      <div className="space-y-6 fade-in">
        <SectionBanner icon={<Stamp className="w-7 h-7 text-white" />}
          label="Action Required"
          title={`Incharge Endorsement Queue (${signQueue.length})`}
          desc="Students fully signed by supervisor — ready for your official incharge stamp" />
        <KpiCards />

        <div className="bg-white rounded-2xl border border-[#c29b38]/35 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#c29b38]/30"
            style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#c29b38,#facc15)' }}>
                <Stamp className="w-4 h-4 text-[#001530]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Pending Incharge Stamp</h3>
                <p className="text-[11px] text-slate-300">Review and affix your official endorsement stamp</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#001530] bg-[#facc15] px-3 py-1 rounded-full border border-[#c29b38] shadow-sm">
              {signQueue.length} ready
            </span>
          </div>

          {signQueue.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {signQueue.map((student) => {
                const supervisor = getSupervisorForStudent(student);
                const pendingDocs = student.pendingDocs || [];
                const primaryDoc = pendingDocs[0] || student.documents?.[0];
                return (
                  <div key={student.id} className="p-5 hover:bg-amber-50/30 transition-colors">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shadow-sm shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{student.regNo}</span>
                            <span className="text-[11px] text-slate-400">{student.program}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="font-medium text-slate-700">{student.internshipCompany || 'No Company'}</span>
                            </span>
                            <span>· Supervisor: <span className="font-semibold text-slate-700">{supervisor?.name || 'Unassigned'}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border bg-indigo-100 text-indigo-900 border-indigo-300 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          Ready for Incharge Stamp
                        </span>
                        {primaryDoc && (
                          <button onClick={() => onOpenSignatureModal('incharge', student, primaryDoc,
                            (sigUrl, note) => { signDocument(student.id, primaryDoc.id, 'incharge', sigUrl, note); })}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#b45309,#d97706)' }}>
                            <Stamp className="w-3.5 h-3.5" /> Affix Stamp
                          </button>
                        )}
                        {primaryDoc && (
                          <button onClick={() => onOpenDocumentViewer(student, primaryDoc)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-sm">
                            <Eye className="w-3.5 h-3.5 text-amber-600" /> View
                          </button>
                        )}
                      </div>
                    </div>
                    {pendingDocs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
                        {pendingDocs.map((doc) => (
                          <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-slate-200 rounded-lg bg-amber-50 px-3 py-2">
                            <span><span className="font-semibold text-slate-700">Document:</span> {doc.title} ({doc.fileName})</span>
                            <button
                              onClick={() => onOpenSignatureModal('incharge', student, doc, (sigUrl, note) => { signDocument(student.id, doc.id, 'incharge', sigUrl, note); })}
                              className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold"
                            >
                              Stamp This Document
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div>
              <h4 className="font-bold text-slate-600 text-sm">All Caught Up!</h4>
              <p className="text-xs text-slate-400 mt-1">No documents are currently awaiting your stamp.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: DOCUMENT REPOSITORY (template management)
  // ═══════════════════════════════════════════════════════════════
  if (activeTab === 'template_manager') {
    return (
      <div className="space-y-6 fade-in">
        <SectionBanner icon={<FolderOpen className="w-7 h-7 text-white" />}
          label="Document Management"
          title="University Document Repository"
          desc="Manage official forms pre-uploaded for students to download, sign and submit" />

        {/* Header + upload button */}
        <div className="rounded-2xl border border-[#c29b38]/40 shadow-sm p-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #00132a 0%, #002147 40%, #002b5c 70%, #082e5b 100%)' }}>
          <div>
            <h3 className="font-bold text-sm text-white">Published Templates ({templates.length})</h3>
            <p className="text-[11px] text-slate-300 mt-0.5">Click "Upload New Template" to publish a new official form</p>
          </div>
          <button onClick={() => setShowAddTemplateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#001530] flex items-center gap-2 shadow-md transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#c29b38,#facc15)' }}>
            <PlusCircle className="w-4 h-4 text-[#001530]" /> Upload New Template
          </button>
        </div>

        {/* Upload form */}
        {showAddTemplateModal && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-6 relative">
            <button onClick={() => setShowAddTemplateModal(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-4">
              <UploadCloud className="w-5 h-5 text-amber-600" /> Publish New Official Internship Form
            </h4>
            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Template Code</label>
                  <input type="text" value={newTemplateCode} onChange={(e) => setNewTemplateCode(e.target.value)}
                    placeholder="e.g. CUI-INT-FORM-05"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">Document Title *</label>
                  <input type="text" value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)}
                    placeholder="e.g. Industry Employer Appraisal & Rating Rubric"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
                  <select value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="Application">Application &amp; NOC</option>
                    <option value="Logbook">Logbook &amp; Attendance</option>
                    <option value="Evaluation">Supervisor Evaluation</option>
                    <option value="Clearance & Certificate">Clearance &amp; Certificate</option>
                    <option value="Special Clearance">Special Clearance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Select Document Template File (PDF/DOC/DOCX)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setNewTemplateFile(file);
                        if (!newTemplateTitle) {
                          setNewTemplateTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 cursor-pointer border border-slate-200 rounded-lg p-1.5"
                  />
                  {newTemplateFile && (
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selected: {newTemplateFile.name} ({Math.round(newTemplateFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Instructions / Description</label>
                <textarea rows={2} value={newTemplateDescription} onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Provide guidelines for students and supervisors..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddTemplateModal(false); setNewTemplateFile(null); }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#00132a,#082e5b)' }}>
                  Publish to Student Portal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Template grid */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3 text-amber-600">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Document Templates Published Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              The university document repository is currently empty. Click "Upload New Template" above to upload an official document template. Uploaded files will be preserved as they are with original inner content and formatting.
            </p>
            <button
              onClick={() => setShowAddTemplateModal(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-[#001530] inline-flex items-center gap-2 shadow-md transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#c29b38,#facc15)' }}
            >
              <PlusCircle className="w-4 h-4 text-[#001530]" /> Upload First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-amber-200 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{tpl.code}</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full uppercase border border-amber-200">{tpl.category}</span>
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
                  <button onClick={() => setDeleteTarget(tpl)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {deleteTarget && (
          <DeleteWarningModal
            template={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => {
              deleteTemplate(deleteTarget.id);
              setDeleteTarget(null);
            }}
          />
        )}
      </div>
    );
  }

  return null;
}
