import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  UserCheck,
  Calendar,
  PenTool,
  ShieldAlert,
  Award,
  ArrowRight,
  Eye,
  FileCheck2,
  Mail,
  Phone,
  Trash2,
  Edit3,
  Save,
  X,
  GraduationCap,
  FolderOpen,
  ShieldCheck,
  ChevronLeft,
  User,
  Sparkles,
  BookOpen,
  Camera,
} from 'lucide-react';
import { usePortal, downloadTemplateFile, isOfficialUniversityEmail } from '../../context/PortalContext';

export default function StudentDashboard({
  activeTab = 'dashboard',
  setActiveTab = () => { },
  onOpenSignatureModal,
  onOpenDocumentViewer,
}) {
  const {
    currentUser,
    templates,
    getSupervisorForStudent,
    uploadStudentDocument,
    deleteStudentDocument,
    updateUserAvatar,
    updateUserProfile,
    showToast,
    markNotificationsRead,
  } = usePortal();

  const avatarInputRef = useRef(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size exceeds 5MB limit. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && updateUserAvatar) {
          updateUserAvatar(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getOrdinalSuffix = (value) => {
    const num = Number(value);
    if (!Number.isInteger(num)) return '';

    const remainder10 = num % 10;
    const remainder100 = num % 100;

    if (remainder10 === 1 && remainder100 !== 11) return 'st';
    if (remainder10 === 2 && remainder100 !== 12) return 'nd';
    if (remainder10 === 3 && remainder100 !== 13) return 'rd';
    return 'th';
  };

  const formatSemester = (value) => {
    if (!value && value !== 0) return 'NULL';

    if (typeof value === 'number') {
      return `${value}${getOrdinalSuffix(value)} Semester`;
    }

    const match = String(value).match(/\d+/);
    if (match) {
      const number = Number(match[0]);
      return `${number}${getOrdinalSuffix(number)} Semester`;
    }

    return value;
  };

  const getAcademicYearLabel = (value) => {
    const match = String(value || '').match(/\d+/);
    const semesterNumber = match ? Number(match[0]) : null;

    if (semesterNumber === null) return 'NULL';
    if (semesterNumber > 2 && semesterNumber < 5) return 'Second Year';
    if (semesterNumber > 4 && semesterNumber < 7) return 'Third Year';
    if (semesterNumber > 6) return 'Senior';
    return 'First Year';
  };

  const supervisor = getSupervisorForStudent(currentUser);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [documentTitle, setDocumentTitle] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Corporate Internship Placement edit state
  const [editingPlacement, setEditingPlacement] = useState(false);
  const [editDraft, setEditDraft] = useState({
    company: currentUser?.internshipCompany || '',
    role: currentUser?.internshipRole || '',
    mode: currentUser?.internshipMode || '',
    duration: currentUser?.internshipDuration || '',
    cgpa: currentUser?.cgpa || '',
    creditHoursCompleted: currentUser?.creditHoursCompleted || '',
  });

  useEffect(() => {
    setEditDraft({
      company: currentUser?.internshipCompany || '',
      role: currentUser?.internshipRole || '',
      mode: currentUser?.internshipMode || '',
      duration: currentUser?.internshipDuration || '',
      cgpa: currentUser?.cgpa || '',
      creditHoursCompleted: currentUser?.creditHoursCompleted || '',
    });
  }, [currentUser]);

  const handleSavePlacement = () => {
    updateUserProfile({
      internshipCompany: editDraft.company || null,
      internshipRole: editDraft.role || null,
      internshipMode: editDraft.mode || null,
      internshipDuration: editDraft.duration || null,
      cgpa: editDraft.cgpa || null,
      creditHoursCompleted: editDraft.creditHoursCompleted || null,
    });
    setEditingPlacement(false);
  };
  const handleCancelPlacement = () => {
    setEditDraft({
      company: currentUser?.internshipCompany || '',
      role: currentUser?.internshipRole || '',
      mode: currentUser?.internshipMode || '',
      duration: currentUser?.internshipDuration || '',
      cgpa: currentUser?.cgpa || '',
      creditHoursCompleted: currentUser?.creditHoursCompleted || '',
    });
    setEditingPlacement(false);
  };

  // Official university email edit state
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(currentUser?.email || '');

  useEffect(() => {
    setEmailDraft(currentUser?.email || '');
  }, [currentUser?.email]);

  const handleSaveEmail = () => {
    const trimmed = emailDraft.trim();
    if (trimmed && !isOfficialUniversityEmail(trimmed)) {
      showToast('Official university email must end with @isbstudents.comsats.edu.pk or @isbfaculty.comsats.edu.pk', 'error');
      return;
    }
    updateUserProfile({ email: trimmed || null });
    setEditingEmail(false);
  };
  const handleCancelEmail = () => {
    setEmailDraft(currentUser?.email || '');
    setEditingEmail(false);
  };

  // Status computation
  const hasDocuments = currentUser?.documents && currentUser.documents.length > 0;
  const isCompleted = currentUser?.status === 'completed';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setSubmissionError('');
      if (!documentTitle) {
        setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleStartSubmission = () => {
    if (!uploadedFile) {
      setSubmissionError('Please attach a document file before continuing to the canvas signature step.');
      return;
    }
    setSubmissionError('');

    const tpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    const subTitle = documentTitle || (tpl ? tpl.title : uploadedFile.name);

    const reader = new FileReader();
    reader.onload = () => {
      const fileDataUrl = reader.result;
      onOpenSignatureModal('student', currentUser, {
        title: subTitle,
        onSigned: (signatureDataUrl) => {
          uploadStudentDocument(currentUser.id, {
            templateId: selectedTemplateId || (tpl ? tpl.id : null),
            title: subTitle,
            fileName: uploadedFile.name,
            fileSize: `${Math.round(uploadedFile.size / 1024)} KB`,
            fileDataUrl,
            studentSignatureDataUrl: signatureDataUrl,
          });
          setShowUploadForm(false);
          setUploadedFile(null);
          setDocumentTitle('');
        },
      });
    };
    reader.readAsDataURL(uploadedFile);
  };

  return (
    <div className="space-y-6 w-full">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. STUDENT DASHBOARD TAB (Only when activeTab === 'dashboard')       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="space-y-6">
          {(currentUser?.notifications || []).some((n) => !n.read) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-900">Supervisor reminders</p>
                <ul className="mt-2 space-y-1.5">
                  {(currentUser.notifications || []).filter((n) => !n.read).map((n) => (
                    <li key={n.id} className="text-xs text-amber-800">
                      <span className="font-semibold">{n.fromName}:</span> {n.message}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => markNotificationsRead(currentUser.id)}
                className="text-xs font-bold text-amber-900 underline shrink-0"
              >
                Mark read
              </button>
            </div>
          )}

          {/* ── WIDE & PROFESSIONAL STUDENT PROFILE CARD ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Top Navy/Gold Banner Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#001530] via-[#002147] to-[#0b3569] border-b-2 border-[#c29b38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <GraduationCap className="w-5 h-5 text-[#c29b38]" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-white text-base sm:text-lg tracking-wide uppercase">
                    Official Student Internship Dossier
                  </h2>
                  <p className="text-xs text-slate-300">
                    COMSATS University Islamabad · Student Affairs &amp; Department of Computer Science
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('directives')}
                  className="px-3 py-1.5 bg-[#c29b38]/20 hover:bg-[#c29b38]/30 border border-[#c29b38]/50 text-[#facc15] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="View Official University Internship Directives"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#facc15]" />
                  <span>Internship Directives</span>
                </button>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Enrolled
                </span>
                <span className="px-3 py-1 bg-[#c29b38]/20 border border-[#c29b38]/40 text-[#facc15] font-mono text-xs font-bold rounded-full">
                  Fall 2026 Term
                </span>
              </div>
            </div>

            {/* Profile Body: Photo + Primary Info + Metrics Grid */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                {/* Student Identity Left Block */}
                <div className="flex items-start sm:items-center gap-5">
                  <div className="relative shrink-0 group">
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                    />
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-3 border-[#002147] group-hover:border-[#c29b38] shadow-xl relative cursor-pointer transition-all"
                      title="Click to upload or change profile picture"
                    >
                      <img
                        src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=260&q=80'}
                        alt={currentUser?.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Hover Overlay with Camera Icon */}
                      <div className="absolute inset-0 bg-[#001736]/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                        <Camera className="w-6 h-6 text-[#facc15] mb-1" />
                        <span className="text-[10px] font-bold text-center leading-tight">Change Photo</span>
                      </div>
                    </div>

                    {/* Camera Upload Badge Button */}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 bg-[#002147] hover:bg-[#c29b38] text-white hover:text-[#001530] p-2 rounded-full shadow-xl border-2 border-white transition-all z-10"
                      title="Upload or Change Profile Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#002147] leading-tight">
                        {currentUser?.name}
                      </h3>
                      <span className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold rounded-lg font-mono">
                        {currentUser?.regNo}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-700">
                      {currentUser?.program || 'NULL'}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentUser?.department || 'NULL'}</span>
                    </p>
                    {/* Official University Email – editable */}
                    {editingEmail ? (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-[#c29b38]/40 shadow-sm max-w-md space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[#002147] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#c29b38]" />
                            <span>Edit Official University Email</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">Endorsement Requirement</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="email"
                            value={emailDraft}
                            onChange={(e) => setEmailDraft(e.target.value)}
                            placeholder="e.g. FA21-BCS-045@isbstudents.comsats.edu.pk"
                            className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white text-slate-800"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEmail();
                              } else if (e.key === 'Escape') {
                                handleCancelEmail();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleSaveEmail}
                            className="px-2.5 py-1.5 bg-[#002147] hover:bg-[#001736] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm shrink-0"
                            title="Save Official Email"
                          >
                            <Save className="w-3.5 h-3.5 text-[#facc15]" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEmail}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Must end with <span className="font-mono font-bold text-[#002147]">@isbstudents.comsats.edu.pk</span> or <span className="font-mono font-bold text-[#002147]">@isbfaculty.comsats.edu.pk</span>
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="text-xs text-slate-700 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex">
                          <Mail className="w-3.5 h-3.5 text-[#c29b38]" />
                          <span className="font-bold text-slate-500">Official Email:</span>
                          <span className="font-mono font-bold text-[#002147]">
                            {currentUser?.email || 'NULL'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailDraft(currentUser?.email || '');
                            setEditingEmail(true);
                          }}
                          className="px-2 py-1 text-slate-600 hover:text-[#002147] hover:bg-slate-100 rounded-lg transition-all inline-flex items-center gap-1 text-[11px] font-bold border border-slate-200/80 shadow-xs"
                          title="Edit Official University Email"
                        >
                          <Edit3 className="w-3 h-3 text-[#c29b38]" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall Clearance Status Ribbon */}
                <div className="w-full xl:w-auto p-4 rounded-xl bg-slate-50 border border-slate-200 flex sm:flex-row xl:flex-col justify-between items-start sm:items-center xl:items-end gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                      Internship Clearance
                    </span>
                    <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                      {isCompleted ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Fully Cleared (3 Credits Awarded)
                        </span>
                      ) : hasDocuments ? (
                        <span className="text-sky-700 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-sky-600" />
                          Dossier Submitted · Review Underway
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Pending Submission
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                    Official Term: Fall 2026
                  </span>
                </div>
              </div>

              {/* Academic & Internship Progress Highlights Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Semester
                  </span>
                  <div className="text-base font-extrabold text-[#002147] mt-1">
                    {currentUser?.semester ? formatSemester(currentUser.semester) : 'NULL'}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {currentUser?.semester ? getAcademicYearLabel(currentUser.semester) : 'NULL'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cumulative GPA
                  </span>
                  <div className="text-base font-extrabold text-emerald-700 font-mono mt-1">
                    {currentUser?.cgpa ? `${currentUser.cgpa} / 4.00` : 'NULL'}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {currentUser?.cgpa ? (Number(currentUser.cgpa) >= 2.0 ? 'Eligible for Internship' : 'Academic Alert') : 'NULL'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Credit Hours Completed
                  </span>
                  <div className="text-base font-extrabold text-[#002147] font-mono mt-1">
                    {currentUser?.creditHoursCompleted ? `${currentUser.creditHoursCompleted} Cr` : 'NULL'}
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#002147] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${currentUser?.creditHoursCompleted ? Math.min(100, Math.round((Number(currentUser.creditHoursCompleted) / 130) * 100)) : 0}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Degree Requirement
                  </span>
                  <div className="text-base font-extrabold text-[#c29b38] mt-1">
                    Mandatory 3 Cr
                  </div>
                  <span className="text-[10px] text-slate-500">HEC Pakistan Standard</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── TWO-COLUMN SECTION: Supervisor & Editable Corporate Placement ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Assigned Faculty Supervisor Card */}
            <div className="bg-gradient-to-br from-sky-50 via-white to-slate-50 rounded-2xl border border-sky-200 shadow-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <span className="text-xs font-black text-[#002147] uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4.5 h-4.5 text-[#c29b38]" />
                    Assigned Faculty Supervisor
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${supervisor ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {supervisor ? 'Faculty Mentor' : 'Pending'}
                  </span>
                </div>

                {supervisor ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-5">
                      <img
                        src={supervisor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
                        alt={supervisor.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-sky-500 shadow-lg shrink-0"
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="font-black text-xl sm:text-2xl text-[#002147] leading-tight">
                          {supervisor.name}
                        </h4>
                        <p className="text-sm text-sky-800 font-bold">
                          {supervisor.designation || 'NULL'}
                        </p>
                        <a
                          href={`mailto:${supervisor.email || ''}`}
                          className="text-base text-slate-700 font-mono font-bold hover:text-[#002147] inline-flex items-center gap-1.5 truncate"
                          title={`Email ${supervisor.name}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{supervisor.email || 'NULL'}</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                      <div className="flex justify-between gap-3 py-1 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Faculty Office:</span>
                        <span className="font-semibold text-slate-800 text-right">{supervisor.office || 'NULL'}</span>
                      </div>
                      <div className="flex justify-between gap-3 py-1 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Department:</span>
                        <span className="font-semibold text-slate-800 text-right">{supervisor.department || 'NULL'}</span>
                      </div>
                      <div className="flex justify-between gap-3 py-1">
                        <span className="text-slate-500 font-medium">Clearance Authority:</span>
                        <span className="font-bold text-emerald-700 text-right">Stage 2 Endorsement &amp; Rubric</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50/70 border border-dashed border-amber-300 rounded-xl text-center">
                    <AlertCircle className="w-7 h-7 text-amber-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-amber-900">No Supervisor Allocated Yet</p>
                    <p className="text-[11px] text-amber-700 mt-1">
                      The Internship Incharge will assign a faculty mentor to evaluate your dossier.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center gap-3">
                <span>Role: Academic Verification &amp; Evaluation</span>
                <span className="text-emerald-700 font-bold">Active Academic Term</span>
              </div>
            </div>

            {/* 2. Corporate Internship Placement Card (Editable) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <span className="text-xs font-black text-[#002147] uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-[#c29b38]" />
                    Corporate Internship Placement
                  </span>
                  {!editingPlacement ? (
                    <button
                      onClick={() => {
                        setEditDraft({ ...placementData });
                        setEditingPlacement(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-[#002147] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all group"
                      title="Edit corporate internship details"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#c29b38]" />
                      Edit Placement
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSavePlacement}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelPlacement}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {!editingPlacement ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Host Enterprise:</span>
                      <span className="font-bold text-slate-900">{currentUser?.internshipCompany || 'NULL'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Job Role / Designation:</span>
                      <span className="font-semibold text-slate-800">{currentUser?.internshipRole || 'NULL'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Internship Mode:</span>
                      <span className="font-semibold text-slate-800">{currentUser?.internshipMode || 'NULL'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Duration:</span>
                      <span className="font-semibold text-slate-800">{currentUser?.internshipDuration || 'NULL'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Credit Hours Completed:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {currentUser?.creditHoursCompleted ? `${currentUser.creditHoursCompleted} Cr` : 'NULL'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Verification Status:</span>
                      <span className="font-bold text-emerald-700">
                        {currentUser?.internshipCompany ? 'Enterprise Registered' : 'NULL'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Host Enterprise / Company:</label>
                      <input
                        type="text"
                        value={editDraft.company}
                        onChange={(e) => setEditDraft({ ...editDraft, company: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] text-xs font-semibold"
                        placeholder="e.g. Systems Limited, Jazz, Nayatel"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Job Role / Designation:</label>
                      <input
                        type="text"
                        value={editDraft.role}
                        onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] text-xs font-semibold"
                        placeholder="e.g. Software Engineering Intern"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Internship Mode:</label>
                      <select
                        value={editDraft.mode}
                        onChange={(e) => setEditDraft({ ...editDraft, mode: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] text-xs font-semibold"
                      >
                        <option value="On-site">On-site</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Virtual">Virtual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Duration:</label>
                      <input
                        type="text"
                        value={editDraft.duration}
                        onChange={(e) => setEditDraft({ ...editDraft, duration: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] text-xs font-semibold"
                        placeholder="e.g. 8 Weeks (Mandatory)"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Credit Hours Completed:</label>
                      <input
                        type="text"
                        value={editDraft.creditHoursCompleted}
                        onChange={(e) => setEditDraft({ ...editDraft, creditHoursCompleted: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] text-xs font-semibold"
                        placeholder="e.g. 110"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                <span>Official Evaluation Dossier</span>
                <span className="text-[#002147] font-bold">Fall 2026</span>
              </div>
            </div>
          </div>

          {/* ── QUICK PORTAL NAVIGATION SHORTCUT CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              onClick={() => setActiveTab('templates')}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#c29b38] shadow-md hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#002147] text-[#002147] group-hover:text-white flex items-center justify-center transition-all">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#002147] group-hover:text-[#c29b38] transition-colors">
                    University Document Templates
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download standard forms &amp; upload signed documents
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#002147] group-hover:translate-x-1 transition-all" />
            </div>

            <div
              onClick={() => setActiveTab('submissions')}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#c29b38] shadow-md hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-700 text-emerald-700 group-hover:text-white flex items-center justify-center transition-all">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#002147] group-hover:text-[#c29b38] transition-colors">
                    Submitted Documents &amp; Signatures
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track multi-tier approval progress across faculty &amp; HOD
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. UNIVERSITY PRE-UPLOADED TEMPLATES TAB (Only on 'templates')      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="space-y-5">
          {/* Navigation Bar Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#002147] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Student Dashboard</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">Standard University Forms Repository</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#001530] via-[#002147] to-[#0b3569] border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-[#c29b38]" />
                  <span>University Pre-Uploaded Internship Templates</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Download standard university forms, complete details, and upload with your digital signature.
                </p>
              </div>

              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-4 py-2 bg-[#c29b38] hover:bg-[#a68022] text-[#001530] text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Submit Internship Document &amp; Sign</span>
              </button>
            </div>

            {/* Upload Form Accordion / Slide-down */}
            {showUploadForm && (
              <div className="p-6 bg-blue-50/50 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#002147] mb-3 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#c29b38]" />
                  <span>Submit Document for Faculty Supervisor Endorsement</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {templates.length > 0 ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Select Relevant Form Template:
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#002147]"
                      >
                        <option value="">-- General / Custom Submission --</option>
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.code}: {tpl.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Submission Category:
                      </label>
                      <div className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#c29b38]" />
                        <span>General Internship Document / Report</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Custom Submission Title:
                    </label>
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="e.g. FA21-BCS-045 Internship Completion Form"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#002147]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Select Document File (PDF, DOCX, Scanned report):
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#002147] file:text-white hover:file:bg-[#003366] cursor-pointer border border-slate-300 rounded-xl bg-white p-1"
                    />
                    {uploadedFile && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selected: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                </div>

                {/* Notice about Student Digital Signature */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Digital Signature Requirement:</span> Upon clicking continue, you will draw your handwritten signature on the official digital canvas pad. Students can only sign in their designated box.
                  </div>
                </div>

                {submissionError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{submissionError}</span>
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartSubmission}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Continue to Canvas Signature &amp; Submit</span>
                  </button>
                </div>
              </div>
            )}

            {/* Templates Table */}
            {templates.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base">No University Document Templates Available</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  The university template repository is currently empty. The Internship Incharge will publish official forms and documents here for download.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-[#002147] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-5">Form Code</th>
                      <th className="py-3 px-5">Document Title</th>
                      <th className="py-3 px-5">Category</th>
                      <th className="py-3 px-5">Uploaded By</th>
                      <th className="py-3 px-5">Signatures Required</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {templates.map((tpl) => {
                      const submittedTemplateIds = new Set((currentUser?.documents || []).filter(doc => doc.templateId).map(doc => doc.templateId));
                      const isSubmitted = submittedTemplateIds.has(tpl.id);

                      return (
                        <tr key={tpl.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#002147]">
                            {tpl.code}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-bold text-slate-800 text-sm">{tpl.title}</div>
                              {!isSubmitted && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-wide">
                                  Not Submitted
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{tpl.description}</div>
                          </td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                            {tpl.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 font-medium">
                          {tpl.uploadedBy}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex gap-1.5 flex-wrap">
                            {tpl.requiredSignatures.map((sig) => (
                              <span
                                key={sig}
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${sig === 'student'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sig === 'supervisor'
                                    ? 'bg-sky-100 text-sky-800'
                                    : sig === 'incharge'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}
                              >
                                {sig}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => downloadTemplateFile(tpl)}
                              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#002147] hover:text-[#002147] text-slate-700 rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm"
                              title="Download official template as uploaded"
                            >
                              <Download className="w-3.5 h-3.5 text-[#c29b38]" />
                              <span>Download</span>
                            </button>
                          </div>
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. SUBMISSIONS & CLEARANCE TAB (Only on submissions / clearance)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'submissions' || activeTab === 'clearance') && (
        <div className="space-y-5">
          {/* Navigation Bar Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#002147] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Student Dashboard</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">Multi-Tier Approval Pipeline</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#001530] via-[#002147] to-[#0b3569] border-b border-slate-200 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4.5 h-4.5 text-emerald-400" />
                  <span>My Submitted Internship Documents &amp; Approval Progress</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Track multi-tier signatures across Student, Faculty Supervisor, Incharge, and HOD.
                </p>
              </div>

              <span className="text-xs font-bold text-[#001530] bg-[#c29b38] px-3 py-1 rounded-full">
                {currentUser?.documents?.length || 0} Submitted
              </span>
            </div>

            {currentUser?.documents && currentUser.documents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {currentUser.documents.map((doc) => (
                  <div key={doc.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-base text-[#002147]">
                            {doc.title}
                          </h4>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {doc.fileSize}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Submitted on: {new Date(doc.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onOpenDocumentViewer(currentUser, doc)}
                          className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-[#c29b38]" />
                          <span>View Submitted Document &amp; Signatures</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!(doc.inchargeSigned || doc.hodSigned)) {
                              deleteStudentDocument(currentUser.id, doc.id);
                            }
                          }}
                          disabled={doc.inchargeSigned || doc.hodSigned}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                            doc.inchargeSigned || doc.hodSigned
                              ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'border border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
                          }`}
                          title={doc.inchargeSigned || doc.hodSigned ? 'This document is already approved and cannot be deleted.' : 'Delete this submitted document'}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{doc.inchargeSigned || doc.hodSigned ? 'Locked' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 4-Tier Signature Pipeline Status Indicators */}
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Student Signature */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">1. Student</span>
                        <div className="mt-1 flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Drawn on Canvas</span>
                        </div>
                      </div>

                      {/* Supervisor Signature */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">2. Supervisor</span>
                        {doc.supervisorSigned ? (
                          <div className="mt-1 flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Signed &amp; Endorsed</span>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5 text-sky-700 font-medium text-xs">
                            <Clock className="w-4 h-4" />
                            <span>Under Review</span>
                          </div>
                        )}
                      </div>

                      {/* Incharge Signature */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">3. Incharge</span>
                        {doc.inchargeSigned ? (
                          <div className="mt-1 flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Stamped</span>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5 text-slate-400 text-xs">
                            <Clock className="w-4 h-4" />
                            <span>Pending Stage 2</span>
                          </div>
                        )}
                      </div>

                      {/* HOD Signature */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">4. HOD</span>
                        {doc.hodSigned ? (
                          <div className="mt-1 flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                            <Award className="w-4 h-4" />
                            <span>Stamped</span>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1.5 text-slate-400 text-xs">
                            <Clock className="w-4 h-4" />
                            <span>Awaiting HOD</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-white">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
                <h4 className="font-bold text-slate-800 text-base">No Documents Submitted Yet</h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                  You have not submitted your internship forms yet. Open "University Document Templates" to download the official forms and submit them with your digital canvas signature.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="mt-4 px-5 py-2.5 bg-[#002147] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 text-[#c29b38]" />
                  <span>Go to Templates &amp; Submit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
