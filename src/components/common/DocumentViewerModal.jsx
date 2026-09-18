import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Building2,
  Calendar,
  Award,
  ShieldCheck,
  Stamp
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function DocumentViewerModal({
  isOpen,
  onClose,
  student,
  document,
  onOpenSignatureModal
}) {
  const { currentUser, getSupervisorForStudent, inchargeUser, hodUser } = usePortal();

  if (!isOpen || !student || !document) return null;

  const supervisor = getSupervisorForStudent(student);
  const isStudent = currentUser?.role === 'student';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (document.fileDataUrl) {
      const element = document.createElement('a');
      element.href = document.fileDataUrl;
      element.download = document.fileName || `${student.regNo}_${document.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      return;
    }
    const element = document.createElement('a');
    const metadata = [
      `Student: ${student.name} (${student.regNo})`,
      `Department: ${student.department || 'Computer Science'}`,
      `Company: ${student.internshipCompany || 'Not specified'}`,
      `Document: ${document.title}`,
      `Submitted: ${document.submittedAt ? new Date(document.submittedAt).toISOString() : 'N/A'}`,
    ].join('\n');
    const file = new Blob([metadata], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${student.regNo}_${document.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm overflow-y-auto ${isStudent ? 'p-0' : 'p-3 sm:p-6'}`}>
      <div className={`bg-white shadow-2xl border border-slate-300 w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${isStudent ? 'max-w-none rounded-none' : 'max-w-4xl rounded-xl'}`}>
        {/* Modal Top Bar */}
        <div className="bg-cui-navy text-white px-5 py-3 flex items-center justify-between border-b border-cui-gold shrink-0">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-cui-gold" />
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">
                Official Document Endorsement &amp; Multi-Tier Clearance Record
              </h3>
              <p className="text-[11px] text-slate-300">
                {document.title} · Reference: <span className="font-mono text-cui-gold">{document.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5 text-cui-gold" />
              <span>Download</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5 text-cui-gold" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Institutional Document Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          <div className={`${isStudent ? 'max-w-none' : 'max-w-3xl'} mx-auto bg-white border border-slate-300 shadow-md p-8 sm:p-10 text-slate-800 rounded-sm relative`}>
            {/* CUI Official Letterhead */}
            <div className="flex items-center justify-between border-b-2 border-cui-navy pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white p-1 flex items-center justify-center border-2 border-cui-gold shadow-sm shrink-0">
                  <img src="/cui-logo.png" alt="COMSATS University" className="w-full h-full object-contain rounded-full" />
                </div>

                <div>
                  <h1 className="font-serif font-black text-lg sm:text-xl text-cui-navy tracking-wider uppercase">
                    COMSATS University Islamabad
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                    Department of Computer Science · Career Development & Placement Centre
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Park Road, Tarlai Kalan, Islamabad 45550 | Phone: +92-51-9247000
                  </p>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="inline-block bg-cui-navy text-cui-gold font-bold px-2.5 py-1 text-[11px] rounded uppercase tracking-wider">
                  Official Form
                </span>
                <p className="text-[10px] font-mono text-slate-500 mt-1">Ref: CUI-ISB/INT-2026/04</p>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center my-4 bg-slate-50 py-2.5 border-y border-slate-200">
              <h2 className="text-base font-bold text-cui-navy uppercase tracking-wide">
                {document.title}
              </h2>
              <p className="text-xs text-slate-500">
                Academic Year 2025-2026 · Bachelor of Science Degree Internship Clearance
              </p>
            </div>

            {/* Student & Internship Profile Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs py-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 font-medium">Student Full Name:</span>
                <p className="font-bold text-cui-navy text-sm">{student.name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Registration Number:</span>
                <p className="font-bold text-cui-navy font-mono text-sm">{student.regNo}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Academic Program:</span>
                <p className="font-semibold text-slate-800">{student.program || 'BS Computer Science'} ({student.semester || '7th Sem'})</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Cumulative GPA:</span>
                <p className="font-semibold text-slate-800">{student.cgpa || '3.50'} / 4.00</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Host Organization / Employer:</span>
                <p className="font-bold text-slate-800">{student.internshipCompany || 'Registered Partner Firm'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Designation & Duration:</span>
                <p className="font-semibold text-slate-800">{student.internshipRole || 'Intern'} · {student.internshipDuration || '8 Weeks'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Assigned Faculty Supervisor:</span>
                <p className="font-bold text-sky-800">
                  {supervisor ? `${supervisor.name} (${supervisor.regNo})` : 'Pending Allocation'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Submission Date:</span>
                <p className="font-semibold text-slate-800">
                  {document.submittedAt ? new Date(document.submittedAt).toLocaleDateString('en-GB') : 'Just now'}
                </p>
              </div>
            </div>

            {/* Performance Checklist / Remarks */}
            <div className="my-4 text-xs space-y-2">
              <h3 className="font-bold text-cui-navy uppercase tracking-wider text-[11px]">
                Departmental Endorsement Criteria & Evaluation:
              </h3>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>6-8 Weeks Minimum Industry Tenure Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Technical Logbook Verified by Corporate Mentor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Digital Signature Authentication Validated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3 Academic Credit Hours Authorized for Graduation</span>
                </div>
              </div>

              {document.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-900 mt-2">
                  <span className="font-bold">Official Remarks:</span> {document.feedback}
                </div>
              )}
            </div>

            {/* 4-TIER SIGNATURE SECTIONS GRID */}
            <div className="mt-8 pt-4 border-t-2 border-slate-300">
              <div className="text-center font-bold text-xs uppercase tracking-widest text-slate-600 mb-4">
                Authorized Signatures & Official Institutional Stamps
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. STUDENT SIGNATURE SECTION */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col justify-between min-h-[150px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-cui-navy uppercase tracking-wider">
                        1. Student Signature
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Handwritten Draw Only)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      I hereby certify that all submitted reports reflect genuine industrial work performed.
                    </p>
                  </div>

                  {/* Signature display or Action button */}
                  <div className="my-2 flex flex-col items-center justify-center">
                    {document.studentSigned && document.studentSignature ? (
                      <div className="text-center">
                        <img
                          src={document.studentSignature}
                          alt="Student Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Digitally Drawn by {student.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'student' && currentUser?.id === student.id ? (
                          <button
                            onClick={() => onOpenSignatureModal('student', student, document)}
                            className="px-3 py-1.5 bg-cui-navy hover:bg-cui-navy-light text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <PenTool className="w-3.5 h-3.5 text-cui-gold" />
                            <span>Draw Student Signature</span>
                          </button>
                        ) : (
                          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Pending Student Draw Signature
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-500 flex justify-between">
                    <span>{student.name}</span>
                    <span>Date: {document.studentSignedAt ? new Date(document.studentSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>

                {/* 2. FACULTY SUPERVISOR SIGNATURE SECTION */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col justify-between min-h-[150px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-cui-navy uppercase tracking-wider">
                        2. Faculty Supervisor
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Draw or Uploaded Stamp)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Evaluated and endorsed by assigned departmental supervisor.
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {document.supervisorSigned && document.supervisorSignature ? (
                      <div className="text-center">
                        <img
                          src={document.supervisorSignature}
                          alt="Supervisor Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Endorsed by {supervisor?.name || 'Faculty Supervisor'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'supervisor' ? (
                          <button
                            onClick={() => onOpenSignatureModal('supervisor', student, document)}
                            className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <PenTool className="w-3.5 h-3.5 text-cui-gold" />
                            <span>Sign / Upload Endorsement</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Awaiting Faculty Supervisor Endorsement
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-500 flex justify-between">
                    <span>{supervisor?.name || 'Faculty Supervisor'}</span>
                    <span>Date: {document.supervisorSignedAt ? new Date(document.supervisorSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>

                {/* 3. INTERNSHIP INCHARGE SIGNATURE SECTION */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col justify-between min-h-[150px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-cui-navy uppercase tracking-wider">
                        3. Internship Incharge
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Placement Cell Seal)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verified corporate placement criteria and compliance standards.
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {document.inchargeSigned && document.inchargeSignature ? (
                      <div className="text-center">
                        <img
                          src={document.inchargeSignature}
                          alt="Incharge Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Stamped by {inchargeUser?.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'incharge' ? (
                          <button
                            onClick={() => onOpenSignatureModal('incharge', student, document)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Stamp className="w-3.5 h-3.5 text-white" />
                            <span>Affix Incharge Digital Stamp</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Awaiting Internship Cell Stamping
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-500 flex justify-between">
                    <span>{inchargeUser?.name}</span>
                    <span>Date: {document.inchargeSignedAt ? new Date(document.inchargeSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>

                {/* 4. HEAD OF DEPARTMENT (HOD) CLEARANCE */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col justify-between min-h-[150px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-cui-navy uppercase tracking-wider">
                        4. Head of Department
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Final Degree Clearance)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Final departmental clearance and 3 credit hours transcript accreditation.
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {document.hodSigned && document.hodSignature ? (
                      <div className="text-center">
                        <img
                          src={document.hodSignature}
                          alt="HOD Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved by {hodUser?.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'hod' ? (
                          <button
                            onClick={() => onOpenSignatureModal('hod', student, document)}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-cui-gold" />
                            <span>Authorize HOD Final Clearance</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Awaiting Final HOD Approval
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1 text-[10px] text-slate-500 flex justify-between">
                    <span>{hodUser?.name}</span>
                    <span>Date: {document.hodSignedAt ? new Date(document.hodSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
              COMSATS University Islamabad · Student Information System (CUOnline) · Verified Institutional Document
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500">
            Current Active Role: <span className="font-bold text-cui-navy uppercase">{currentUser?.role}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded transition-colors"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}
