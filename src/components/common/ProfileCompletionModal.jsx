import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  GraduationCap,
  Phone,
  Briefcase,
  Sparkles,
  Save,
  CheckCircle2,
  FileText,
  User,
  ShieldAlert,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function ProfileCompletionModal({ isOpen, onClose }) {
  const { currentUser, updateUserProfile } = usePortal();

  const isStudent = currentUser?.role === 'student';

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    program: currentUser?.program || '',
    semester: currentUser?.semester || '',
    cgpa: currentUser?.cgpa || '',
    creditHoursCompleted: currentUser?.creditHoursCompleted || '',
    internshipCompany: currentUser?.internshipCompany || '',
    internshipRole: currentUser?.internshipRole || '',
    internshipMode: currentUser?.internshipMode || '',
    internshipDuration: currentUser?.internshipDuration || '',
    department: currentUser?.department || '',
    designation: currentUser?.designation || '',
    office: currentUser?.office || '',
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSemesterNumber = (value) => {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isStudent) {
      const semesterNumber = getSemesterNumber(formData.semester);
      if (semesterNumber !== null && semesterNumber < 5) {
        setError('You are not eligible for internship course registration. Student semester must be 5th Semester or above.');
        return;
      }
    }

    const sanitizedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
    );

    updateUserProfile(sanitizedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-[0_20px_55px_-18px_rgba(0,25,60,0.55)] border-2 border-[#c29b38] w-full max-w-xl overflow-hidden my-4">
        {/* ── Top Warning & Directive Header ── */}
        <div className="bg-gradient-to-r from-[#00132a] via-[#002147] to-[#082e5b] text-white px-4 sm:px-5 py-4 border-b-2 border-[#c29b38] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-serif font-black text-[9px] tracking-[0.18em] text-[#facc15] uppercase bg-[#001736]/90 px-2 py-0.5 rounded border border-[#c29b38]/50">
                ACTION REQUIRED
              </span>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                Profile Update
              </span>
            </div>
            <h3 className="font-serif font-black text-base sm:text-lg text-white uppercase tracking-wide leading-tight">
              Complete Your Official Profile
            </h3>
            <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
              Fill in the details you know, or leave any blank field empty and it will be stored as null.
            </p>
          </div>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-2xl flex items-center gap-2.5 font-medium animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Official Notice:</strong> You can save this form even if a field is left blank; empty data is stored as null.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Name:
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your full legal name"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-semibold text-slate-800 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number / Mobile:
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-mono font-bold text-slate-800 shadow-sm"
                />
              </div>
            </div>
          </div>

          {isStudent ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Degree Program:
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => handleChange('program', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white font-semibold text-slate-800 shadow-sm"
                  >
                    <option value="BS Computer Science">BS Computer Science</option>
                    <option value="BS Software Engineering">BS Software Engineering</option>
                    <option value="BS Artificial Intelligence">BS Artificial Intelligence</option>
                    <option value="BS Data Science">BS Data Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Semester:
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => handleChange('semester', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white font-semibold text-slate-800 shadow-sm"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                    <option value="Graduated">Graduated / Final Clearance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current CGPA:
                  </label>
                  <input
                    type="text"
                    value={formData.cgpa}
                    onChange={(e) => handleChange('cgpa', e.target.value)}
                    placeholder="e.g. 3.45"
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-mono font-bold text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Credit Hours Completed:
                  </label>
                  <input
                    type="text"
                    value={formData.creditHoursCompleted}
                    onChange={(e) => handleChange('creditHoursCompleted', e.target.value)}
                    placeholder="e.g. 110"
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-mono font-bold text-slate-800 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Internship Mode:
                  </label>
                  <select
                    value={formData.internshipMode}
                    onChange={(e) => handleChange('internshipMode', e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] bg-white font-semibold text-slate-800 shadow-sm"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Host Internship Company:
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.internshipCompany}
                      onChange={(e) => handleChange('internshipCompany', e.target.value)}
                      placeholder="e.g. Systems Limited / Techlogix / Jazz"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-medium text-slate-800 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Internship Role / Job Title:
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.internshipRole}
                      onChange={(e) => handleChange('internshipRole', e.target.value)}
                      placeholder="e.g. Software Engineer Intern"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-medium text-slate-800 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internship Duration:
                </label>
                <input
                  type="text"
                  value={formData.internshipDuration}
                  onChange={(e) => handleChange('internshipDuration', e.target.value)}
                  placeholder="e.g. 8 Weeks (July 2026 - Sept 2026)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-medium text-slate-800 shadow-sm"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Designation:
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  placeholder="e.g. Assistant Professor / Lecturer"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-medium text-slate-800 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Office / Room Location:
                </label>
                <input
                  type="text"
                  value={formData.office}
                  onChange={(e) => handleChange('office', e.target.value)}
                  placeholder="e.g. Room 204, Academic Block 2"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002147] font-medium text-slate-800 shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#002147] via-[#0a3264] to-[#002147] hover:from-[#001738] hover:to-[#06244a] text-white font-black text-xs rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border border-[#c29b38]/40 active:scale-[0.99]"
            >
              <Save className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Save &amp; Complete Official Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
