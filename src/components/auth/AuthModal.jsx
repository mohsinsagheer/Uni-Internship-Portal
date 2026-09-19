import React, { useState } from 'react';
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
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function AuthModal({ isOpen, onClose }) {
  const {
    login,
    signup,
    requestPasswordReset,
    resetPassword,
    campuses,
    selectedCampus,
    setSelectedCampus,
  } = usePortal();

  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'forgot', 'reset'
  const [role, setRole] = useState('student'); // 'student', 'supervisor', 'incharge', 'hod'
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Signup fields (Official email removed as requested)
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

  const switchTab = (nextTab) => {
    setError('');
    setInfoMessage('');
    setPassword('');
    setRegNo('');
    setActiveTab(nextTab);
  };

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!regNo.trim()) {
      setError('Please enter your Registration Number or Employee ID.');
      return;
    }
    if (!password) {
      setError('Please enter your confidential account password.');
      return;
    }

    const result = login(regNo, password, role);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Login failed. Please verify credentials.');
    }
  };

  const getSemesterNumber = (value) => {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !regNo.trim()) {
      setError('Please fill in all mandatory account identity fields.');
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

    const result = signup({
      name,
      regNo,
      password: signupPassword,
      role,
      program,
      internshipCompany: company || null,
      semester: semester || null,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Registration failed. Please check your details.');
    }
  };

  const handleRequestResetSubmit = (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!forgotEmail.trim()) {
      setError('Please enter your account email.');
      return;
    }

    const result = requestPasswordReset(forgotEmail);
    if (result.success) {
      setForgotData(result);
      setInfoMessage(`Password reset link generated for ${result.user.name}!`);
    } else {
      setError(result.error || 'Account not found for this email address.');
    }
  };

  const handleResetPasswordSubmit = (e) => {
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
    const result = resetPassword(emailToReset, newPassword);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in">
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

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-white/10 shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Executive Tab Pill Bar ── */}
        <div className="p-4 sm:p-5 pb-0">
          <div className="p-1.5 bg-slate-100/90 rounded-2xl flex gap-1.5 border border-slate-200 shadow-inner">
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
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-[13px] sm:text-[14px]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center gap-2.5 font-medium animate-fade-in">
              <span className="font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-lg text-xs">Error</span>
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center gap-2.5 font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* ── Role Selector Pill Grid (shown on login and signup) ── */}
          {(activeTab === 'login' || activeTab === 'signup') && (
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-[0.16em] mb-2">
                Select Your Official Designation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {rolesList.map((r) => {
                  const IconComponent = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs font-bold ${isSelected
                        ? 'bg-[#002147] text-white border-[#c29b38] shadow-md ring-2 ring-[#c29b38]/40'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-[#facc15]' : 'text-slate-500'}`} />
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
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-[0.16em] mb-2">
                Select Campus Location
              </label>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white text-slate-800 font-semibold shadow-sm"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ═════════ TAB 1: SIGN IN ═════════ */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1 animate-fade-in">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {role === 'student' ? 'Student Registration Number:' : 'Account Email:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder={
                      role === 'student'
                        ? 'e.g. FA21-BCS-045'
                        : 'e.g. faculty@isbfaculty.comsats.edu.pk'
                    }
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-mono font-bold text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Portal Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab('forgot')}
                    className="text-[11px] sm:text-xs font-bold text-[#c29b38] hover:text-[#002147] transition-colors flex items-center gap-1 hover:underline"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your confidential account password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 group active:scale-[0.99]"
              >
                <span>Sign In to CUOnline Portal</span>
                <ArrowRight className="w-4 h-4 text-[#facc15] group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* ═════════ TAB 2: CREATE ACCOUNT (Official Email Removed, Password Added) ═════════ */}
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
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {role === 'student' ? 'Registration Number:' : 'Account Email:'}
                </label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. FA22-BCS-099' : 'e.g. faculty@isbfaculty.comsats.edu.pk'}
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
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 group active:scale-[0.99]"
              >
                <span>Create Account with Password</span>
                <ArrowRight className="w-4 h-4 text-[#facc15] group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* ═════════ TAB 3: FORGOT PASSWORD (Enter Account Email & Send Link) ═════════ */}
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
                    Provide your account email to receive a secure link to set a new password.
                  </p>
                </div>
              </div>

              {!forgotData ? (
                <form onSubmit={handleRequestResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Account Email:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Portal Account Email"
                        className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4 text-[#facc15]" />
                    <span>Send Password Reset Link</span>
                  </button>
                </form>
              ) : (
                /* Step B: Simulated generated reset link notification */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                      <KeyRound className="w-4 h-4 text-[#c29b38]" />
                      <span>Password Reset Link Dispatched</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      A password recovery link has been generated for account holder{' '}
                      <strong>{forgotData.user?.name}</strong> at{' '}
                      <span className="font-mono font-semibold text-[#002147]">{forgotData.email}</span>.
                    </p>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate">{forgotData.resetLink}</span>
                      <span className="shrink-0 text-[10px] font-bold text-[#002147] bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        RESET LINK
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reset')}
                    className="w-full py-3 bg-[#c29b38] hover:bg-[#d4ac47] text-[#001530] font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Click Link to Add New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="text-xs font-bold text-slate-600 hover:text-[#002147] underline"
                    >
                      Return to Sign In
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
