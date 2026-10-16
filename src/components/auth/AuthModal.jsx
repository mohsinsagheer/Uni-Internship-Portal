import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User,
  Building2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Award,
  Mail,
  Briefcase,
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  Send,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  MailCheck,
  Trash2,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { isOfficialUniversityEmail, usePortal } from '../../context/PortalContext';

export default function AuthModal({ isOpen, onClose }) {
  const {
    currentUser,
    login,
    signup,
    requestPasswordReset,
    resetPassword,
    resendEmailVerification,
    deleteAccount,
    campuses,
    selectedCampus,
    setSelectedCampus,
  } = usePortal();

  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'forgot', 'reset', 'verify', 'account'
  const [role, setRole] = useState('student'); // 'student', 'supervisor', 'incharge', 'hod'
  const [regNo, setRegNo] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification states
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Signup fields
  const [name, setName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [program, setProgram] = useState('BS Computer Science');
  const [company, setCompany] = useState('');
  const [semester, setSemester] = useState('7th Semester');

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotData, setForgotData] = useState(null); // { resetLink, email, user }
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Countdown timer for resend verification cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Account deletion states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setActiveTab('account');
      setShowDeleteConfirm(false);
    } else if (isOpen && !currentUser && activeTab === 'account') {
      setActiveTab('login');
    }
  }, [isOpen, currentUser]);

  const handleDeleteAccount = async () => {
    if (!currentUser || isDeletingAccount) return;
    setIsDeletingAccount(true);
    setError('');
    setInfoMessage('');
    try {
      const res = await deleteAccount(
        currentUser.id,
        currentUser.firebaseUid,
        currentUser.personalEmail || currentUser.email
      );
      if (res.success) {
        setShowDeleteConfirm(false);
        setActiveTab('signup');
      } else {
        setError(res.error || 'Failed to delete account.');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred while deleting account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const switchTab = (nextTab) => {
    setError('');
    setInfoMessage('');
    setPassword('');
    setRegNo('');
    setShowDeleteConfirm(false);
    if (nextTab === 'login' && verificationEmail && !personalEmail) {
      setPersonalEmail(verificationEmail);
    }
    setIsSubmitting(false);
    setActiveTab(nextTab);
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setInfoMessage('');

    if (!personalEmail.trim()) {
      setError('Please enter your personal email address.');
      return;
    }
    if (!password) {
      setError('Please enter your confidential account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(personalEmail, password, role);
      if (result.success) {
        // Reset form state then close immediately — dashboard renders right away
        setRegNo('');
        setPersonalEmail('');
        setPassword('');
        setVerificationEmail('');
        setVerificationPassword('');
        onClose();
      } else if (result.requiresVerification) {
        setVerificationEmail(personalEmail.trim().toLowerCase());
        setVerificationPassword(password);
        setActiveTab('verify');
        setError('');
        setInfoMessage('Email address is unverified. Please check your inbox and verify before logging in.');
      } else {
        setError(result.error || 'Login failed. Please verify credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSemesterNumber = (value) => {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!name.trim() || !regNo.trim() || !personalEmail.trim()) {
      setError('Please enter your name, registration/employee ID, and personal email.');
      return;
    }

    if (isOfficialUniversityEmail(personalEmail)) {
      setError('Please use a personal email address, not your university email.');
      return;
    }

    if (!signupPassword) {
      setError('Please choose a secure account password.');
      return;
    }

    if (signupPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (role === 'student') {
      const semesterNumber = getSemesterNumber(semester);
      if (semesterNumber !== null && semesterNumber < 5) {
        setError('You are not eligible for internship course registration. Student semester must be 5th Semester or above.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await signup({
        name,
        regNo,
        personalEmail,
        password: signupPassword,
        role,
        program,
        internshipCompany: company || null,
        semester: semester || null,
        campusId: selectedCampus,
      });

      if (result.success && result.requiresVerification) {
        // Switch to the verification pending view — credentials access is ONLY granted after email is verified
        setVerificationEmail(personalEmail.trim().toLowerCase());
        setVerificationPassword(signupPassword);
        setName('');
        setRegNo('');
        setSignupPassword('');
        setConfirmPassword('');
        setCompany('');
        setActiveTab('verify');
        setError('');
        setInfoMessage(`Verification link dispatched to ${personalEmail}. Please verify your email before logging in.`);
      } else if (result.success) {
        setName('');
        setRegNo('');
        setPersonalEmail('');
        setSignupPassword('');
        setConfirmPassword('');
        setCompany('');
        onClose();
      } else {
        setError(result.error || 'Registration failed. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckVerificationAndLogin = async () => {
    if (isSubmitting) return;
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);
    try {
      const emailToUse = verificationEmail || personalEmail;
      const passToUse = verificationPassword || password;
      if (!emailToUse || !passToUse) {
        setActiveTab('login');
        setPersonalEmail(emailToUse || '');
        return;
      }
      const result = await login(emailToUse, passToUse, role);
      if (result.success) {
        setVerificationEmail('');
        setVerificationPassword('');
        setPersonalEmail('');
        setPassword('');
        onClose();
      } else if (result.requiresVerification) {
        setError('Email address is still not verified. Please click the link sent to your inbox, then try again. (If clicked just now, wait 5 seconds and retry).');
      } else {
        setError(result.error || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerificationLink = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);
    try {
      const emailToUse = verificationEmail || personalEmail;
      const passToUse = verificationPassword || password;
      const result = await resendEmailVerification(emailToUse, passToUse);
      if (result.success) {
        setInfoMessage(`New verification link dispatched to ${emailToUse}! Please check your inbox and spam folder.`);
        setResendCooldown(30);
      } else {
        setError(result.error || 'Failed to resend verification link.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!forgotEmail.trim()) {
      setError('Please enter your personal email address.');
      return;
    }

    const result = await requestPasswordReset(forgotEmail);
    if (result.success) {
      setForgotData(result);
      setInfoMessage(`Firebase password reset email sent to ${result.email}!`);
    } else {
      setError(result.error || 'Account not found for this email address.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please confirm correctly.');
      return;
    }

    const emailToReset = forgotData?.email || forgotEmail;
    const tokenToUse = forgotData?.resetToken || '';
    const result = await resetPassword(emailToReset, newPassword, tokenToUse);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to update password.');
    }
  };

  const rolesList = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'supervisor', label: 'Supervisor', icon: Building2 },
    { id: 'incharge', label: 'Incharge', icon: ShieldCheck },
    { id: 'hod', label: 'HOD', icon: Award },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="CUOnline authentication"
    >
      <div className="bg-white rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,25,60,0.55)] border border-slate-200/80 w-full max-w-2xl max-h-[92vh] overflow-y-auto my-3 sm:my-6">

        {/* ── Top University Branding Header ── */}
        <div className="bg-gradient-to-r from-[#00132a] via-[#002147] to-[#082e5b] text-white px-5 sm:px-7 py-5 border-b-2 border-[#c29b38]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-white p-1.5 flex items-center justify-center border-2 border-[#c29b38] shadow-[0_8px_20px_rgba(194,155,56,0.35)] shrink-0">
                <img src="/cui-logo.png" alt="COMSATS University" className="w-full h-full object-contain rounded-full" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-serif font-black text-[10px] sm:text-[11px] tracking-[0.22em] text-[#facc15] uppercase bg-[#001736]/90 px-2.5 py-1 rounded border border-[#c29b38]/50">
                    CUONLINE
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-300 font-semibold uppercase tracking-[0.18em]">
                    Student Information System
                  </span>
                </div>

                <h3 className="font-serif font-black text-base sm:text-xl text-white uppercase tracking-[0.06em] leading-tight">
                  CUOnline Portal
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
                  COMSATS University Islamabad · Academic &amp; Internship Access
                </p>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-white/10 shrink-0"
                aria-label="Close authentication dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            ) : (
              <span className="text-[10px] font-black text-[#facc15] bg-[#001736] border border-[#c29b38]/60 px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0">
                Sign In Required
              </span>
            )}
          </div>
        </div>

        {/* ── Executive Tab Pill Bar ── */}
        <div className="p-4 sm:p-5 pb-0">
          <div className="p-1.5 bg-slate-100/90 rounded-2xl flex gap-1.5 border border-slate-200 shadow-inner">
            {currentUser && (
              <button
                onClick={() => switchTab('account')}
                className={`flex-1 py-3 text-center text-sm sm:text-base font-bold rounded-xl transition-all ${activeTab === 'account'
                  ? 'bg-[#002147] text-white shadow-[0_6px_16px_rgba(0,33,71,0.18)]'
                  : 'text-slate-600 hover:text-[#002147]'
                  }`}
              >
                My Account
              </button>
            )}
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-center text-sm sm:text-base font-bold rounded-xl transition-all ${activeTab === 'login'
                ? 'bg-[#002147] text-white shadow-[0_6px_16px_rgba(0,33,71,0.18)]'
                : 'text-slate-600 hover:text-[#002147]'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 py-3 text-center text-sm sm:text-base font-bold rounded-xl transition-all ${activeTab === 'signup'
                ? 'bg-[#002147] text-white shadow-[0_6px_16px_rgba(0,33,71,0.18)]'
                : 'text-slate-600 hover:text-[#002147]'
                }`}
            >
              Create Account
            </button>
            {(activeTab === 'forgot' || activeTab === 'reset') && (
              <button
                onClick={() => { }}
                className="flex-1 py-3 text-center text-sm sm:text-base font-bold rounded-xl bg-[#c29b38] text-[#001530] shadow-md transition-all"
              >
                Reset Password
              </button>
            )}
            {activeTab === 'verify' && (
              <button
                onClick={() => { }}
                className="flex-1 py-3 text-center text-sm sm:text-base font-bold rounded-xl bg-[#c29b38] text-[#001530] shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <MailCheck className="w-4 h-4" />
                <span>Verify Email</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-[13px] sm:text-[14px]">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center gap-2.5 font-medium animate-fade-in"
            >
              <span className="font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-lg text-xs" aria-hidden="true">Error</span>
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div
              role="status"
              aria-live="polite"
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center gap-2.5 font-medium animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* ── Role Selector Pill Grid (shown on login and signup) ── */}
          {(activeTab === 'login' || activeTab === 'signup') && (
            <div>
              <p className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-[0.16em] mb-2" id="role-group-label">
                Select Your Official Designation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-labelledby="role-group-label">
                {rolesList.map((r) => {
                  const IconComponent = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      aria-pressed={isSelected}
                      className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors text-[11px] sm:text-xs font-bold ${isSelected
                        ? 'bg-[#002147] text-white border-[#c29b38] shadow-md ring-2 ring-[#c29b38]/40'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-[#facc15]' : 'text-slate-500'}`} aria-hidden="true" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Campus Selector (shown on login and signup) ── */}
          {(activeTab === 'login' || activeTab === 'signup') && (
            <div>
              <label htmlFor="campus-select" className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-[0.16em] mb-2">
                Select Campus Location
              </label>
              <select
                id="campus-select"
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white text-slate-800 font-semibold shadow-sm"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* ═════════ TAB 1: SIGN IN ═════════ */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1 animate-fade-in">
              <div>
                <label htmlFor="login-identifier" className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personal Email:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="login-identifier"
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="Enter your personal email"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-mono font-bold text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Portal Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab('forgot')}
                    className="text-[11px] sm:text-xs font-bold text-[#c29b38] hover:text-[#002147] transition-colors flex items-center gap-1 hover:underline"
                    aria-label="Go to forgot password form"
                  >
                    <KeyRound className="w-3 h-3" aria-hidden="true" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your confidential account password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 group active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#facc15] animate-spin" aria-hidden="true" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to CUOnline Portal</span>
                    <ArrowRight className="w-4 h-4 text-[#facc15] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ═════════ TAB 2: CREATE ACCOUNT ═════════ */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4 pt-1 animate-fade-in">
              <div className="mb-1">
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#002147]">
                  {role === 'student' ? 'Student Registration' : 'Account Registration'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Legal Name:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Asad Ullah"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-personal-email" className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personal Email:
                </label>
                <input
                  id="signup-personal-email"
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="signup-reg-number" className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {role === 'student' ? 'Registration Number (profile):' : 'Employee ID (profile):'}
                </label>
                <input
                  id="signup-reg-number"
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. FA22-BCS-099' : 'e.g. EMP-CS-108'}
                  autoComplete="off"
                  required
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm"
                />
              </div>

              {/* Password Fields (Mandatory for account creation) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Password:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Choose password (min 4 chars)"
                      className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {role === 'student' && (
                <>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Academic Degree Program:
                    </label>
                    <select
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm font-semibold text-slate-800"
                    >
                      <option value="BS Computer Science">BS Computer Science</option>
                      <option value="BS Software Engineering">BS Software Engineering</option>
                      <option value="BS Artificial Intelligence">BS Artificial Intelligence</option>
                      <option value="BS Data Science">BS Data Science</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Host Internship Company (Optional):
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Systems Limited, Jazz"
                          className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Current Semester:
                      </label>
                      <div className="relative">
                        <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm font-semibold text-slate-800"
                        >
                          <option value="5th Semester">5th Semester</option>
                          <option value="6th Semester">6th Semester</option>
                          <option value="7th Semester">7th Semester</option>
                          <option value="8th Semester">8th Semester</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 group active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#facc15] animate-spin" aria-hidden="true" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account with Password</span>
                    <ArrowRight className="w-4 h-4 text-[#facc15] group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ═════════ TAB 3: FORGOT PASSWORD ═════════ */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 pt-1 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-[#002147] transition-colors"
                  title="Back to Sign In"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="font-serif font-black text-base text-[#002147] uppercase tracking-wide">
                    Reset Account Password
                  </h4>
                  <p className="text-xs text-slate-500">
                    Provide the personal email associated with your account to receive a password reset link.
                  </p>
                </div>
              </div>

              {!forgotData ? (
                <form onSubmit={handleRequestResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Personal Email:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Your personal email"
                        autoComplete="email"
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4 text-[#facc15]" />
                    <span>Send Password Reset Email</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-50/90 border border-sky-300 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#002147] font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                      <span>Firebase Reset Email Sent</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      An official password reset email has been dispatched to <strong className="text-[#002147]">{forgotData.email}</strong> via Firebase Auth.
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      Please check your inbox (including Spam/Junk folder) and click the link inside to set your new password.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleRequestResetSubmit}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Resend Reset Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="w-full py-2.5 bg-[#002147] hover:bg-[#001738] text-white font-bold text-xs rounded-xl transition-colors shadow flex items-center justify-center gap-2"
                    >
                      <span>Return to Sign In</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════ TAB 4: SET NEW PASSWORD ═════════ */}
          {activeTab === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-1 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => switchTab('forgot')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-[#002147] transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="font-serif font-black text-base text-[#002147] uppercase tracking-wide">
                    Set New Account Password
                  </h4>
                  <p className="text-xs text-slate-500">
                    Account:{' '}
                    <span className="font-mono font-bold text-[#002147]">
                      {forgotData?.email || forgotEmail}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Confidential Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password (min 4 chars)"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 active:scale-[0.99]"
              >
                <KeyRound className="w-4 h-4 text-[#facc15]" />
                <span>Update Password &amp; Sign In</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-xs font-bold text-slate-600 hover:text-[#002147] underline"
                >
                  Cancel and Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ═════════ TAB 5: EMAIL VERIFICATION REQUIRED ═════════ */}
          {activeTab === 'verify' && (
            <div className="space-y-4 pt-1 animate-fade-in">
              <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/40 border-2 border-amber-300 rounded-2xl p-5 text-center space-y-3.5 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-800 mx-auto flex items-center justify-center shadow-md">
                  <MailCheck className="w-7 h-7" aria-hidden="true" />
                </div>

                <div>
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-amber-200/90 text-amber-900 px-3 py-1 rounded-full mb-1.5 border border-amber-400/60">
                    Mandatory Email Verification
                  </span>
                  <h4 className="font-serif font-black text-lg text-[#002147] uppercase tracking-wide">
                    Verify Your Personal Email Link
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    An official verification link has been dispatched to:
                  </p>
                  <p className="font-mono font-bold text-xs sm:text-sm text-[#002147] bg-white py-1.5 px-3 rounded-xl border border-amber-300 mt-1.5 inline-block shadow-sm">
                    {verificationEmail || personalEmail}
                  </p>
                </div>

                <div className="bg-white/95 rounded-xl p-3.5 text-left text-xs text-slate-700 space-y-2 border border-amber-200 shadow-inner">
                  <p className="font-bold text-[#002147] flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Follow these steps to access your dashboard:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] sm:text-xs text-slate-600 pl-1 leading-relaxed">
                    <li>Open your email inbox (also inspect your <strong>Spam / Junk</strong> folder).</li>
                    <li>Click the link sent from <strong>Firebase / COMSATS CUOnline</strong>.</li>
                    <li>Once verified, click the button below to sign in with your credentials.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCheckVerificationAndLogin}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 group active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 text-[#facc15] animate-spin" aria-hidden="true" />
                      <span>Checking Verification Status...</span>
                    </>
                  ) : (
                    <>
                      <span>I Have Verified My Email — Open Dashboard</span>
                      <ArrowRight className="w-4 h-4 text-[#facc15] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleResendVerificationLink}
                    disabled={isSubmitting || resendCooldown > 0}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5 text-[#002147]" aria-hidden="true" />
                    <span>
                      {resendCooldown > 0
                        ? `Resend Link (${resendCooldown}s)`
                        : 'Resend Verification Link'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPersonalEmail(verificationEmail || personalEmail);
                      switchTab('login');
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 text-[#002147] font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign In with Password</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 5: MY ACCOUNT & DANGER ZONE ═════════ */}
          {activeTab === 'account' && currentUser && (
            <div className="space-y-4 pt-1 animate-fade-in">
              {/* Account Overview Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#c29b38] bg-slate-200 shrink-0">
                  <img
                    src={currentUser?.avatar || '/cui-logo.png'}
                    alt={currentUser?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">{currentUser?.name}</h4>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#002147] text-[#facc15]">
                      {currentUser?.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{currentUser?.personalEmail || currentUser?.email}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{currentUser?.regNo} · {campuses.find((c) => c.id === (currentUser?.campusId || selectedCampus))?.name}</p>
                </div>
              </div>

              {/* Database & Cloud Status */}
              <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Database className="w-3.5 h-3.5 text-sky-700" />
                    <span>Database Record:</span>
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                    Active in Firestore
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MailCheck className="w-3.5 h-3.5 text-sky-700" />
                    <span>Email Verification:</span>
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                    Verified
                  </span>
                </div>
              </div>

              {/* Danger Zone: Account Deletion */}
              <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-red-900 text-xs sm:text-sm">Permanent Account Deletion</h5>
                    <p className="text-[11px] sm:text-xs text-red-700 mt-1 leading-relaxed">
                      Deleting your account will remove your record from the database and Firebase Authentication. Once deleted, <strong>this email address ({currentUser?.personalEmail || currentUser?.email}) will be freed up</strong> so another account can be created using this exact same email address.
                    </p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 px-3 bg-white hover:bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Delete Account from Database</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-red-300 space-y-2.5 animate-fade-in">
                    <p className="text-xs font-bold text-red-900">
                      Are you sure you want to permanently delete your account?
                    </p>
                    <p className="text-[11px] text-slate-600">
                      This removes all database records and allows this email to be registered afresh. This action cannot be reversed.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow disabled:opacity-70"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting from Database...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Confirm Permanent Deletion</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeletingAccount}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Security & Authentication Advisory ── */}
          <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
            <p>
              Official Single Sign-On for Student Affairs, Faculty Supervision &amp; Departmental Clearances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
