import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Mail,
  Briefcase,
  BookOpen,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function AuthModal({ isOpen, onClose }) {
  const {
    login,
    signup,
    campuses,
    selectedCampus,
    setSelectedCampus,
  } = usePortal();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [role, setRole] = useState('student'); // 'student', 'supervisor', 'incharge', 'hod'
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const switchTab = (nextTab) => {
    setError('');
    setPassword('');
    setRegNo('');
    setActiveTab(nextTab);
  };

  // Signup fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('BS Computer Science');
  const [company, setCompany] = useState('');
  const [semester, setSemester] = useState('7th Semester');

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!regNo.trim()) {
      setError('Please enter your Registration Number or Employee ID.');
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

    if (!name.trim() || !regNo.trim() || !email.trim()) {
      setError('Please fill in all mandatory fields.');
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
      email,
      role,
      program,
      internshipCompany: company || 'Pending Placement',
      semester: semester || '7th Semester',
    });

    if (result.success) {
      onClose();
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

        {/* ── Executive Tab Pill Bar: Sign In vs Create Account ── */}
        <div className="p-4 sm:p-5 pb-0">
          <div className="p-1.5 bg-slate-100/90 rounded-2xl flex gap-1.5 border border-slate-200 shadow-inner">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-center text-sm sm:text-base font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-[#002147] text-white shadow-[0_6px_16px_rgba(0,33,71,0.18)]'
                  : 'text-slate-600 hover:text-[#002147]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 py-3 text-center text-sm sm:text-base font-bold rounded-xl transition-all ${
                activeTab === 'signup'
                  ? 'bg-[#002147] text-white shadow-[0_6px_16px_rgba(0,33,71,0.18)]'
                  : 'text-slate-600 hover:text-[#002147]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-[13px] sm:text-[14px]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center gap-2.5 font-medium animate-fade-in">
              <span className="font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-lg text-xs">Error</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Role Selector Pill Grid ── */}
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
                    className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs font-bold ${
                      isSelected
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

          {/* ── Campus Selector ── */}
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

          <div className="relative overflow-hidden">
            <div
              className={`transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeTab === 'login' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 absolute inset-0 pointer-events-none'
              }`}
            >
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {role === 'student' ? 'Student Registration Number:' : 'Employee / Faculty ID:'}
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
                            : role === 'supervisor'
                            ? 'e.g. EMP-CS-108'
                            : role === 'incharge'
                            ? 'e.g. INC-CS-002'
                            : 'e.g. HOD-CS-001'
                        }
                        className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] uppercase font-mono font-bold text-slate-800 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Portal Password:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your confidential password"
                        className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] text-slate-800 shadow-sm"
                      />
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
            </div>

            <div
              className={`transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeTab === 'signup' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute inset-0 pointer-events-none'
              }`}
            >
              {activeTab === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="space-y-4 pt-1">
              <div className="mb-1">
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#002147]">
                  {role === 'student' ? 'Student Registration' : 'Account Registration'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name:
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {role === 'student' ? 'Reg Number:' : 'Employee ID:'}
                  </label>
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder={role === 'student' ? 'FA22-BCS-099' : 'EMP-CS-401'}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Email:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@isb.comsats.edu.pk"
                      className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm font-medium"
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
                        Host Internship Company:
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
                          className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-sm font-semibold text-slate-800"
                        >
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                          <option value="3rd Semester">3rd Semester</option>
                          <option value="4th Semester">4th Semester</option>
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
                    <span>Complete Registration &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4 text-[#facc15] group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>
          </div>

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
