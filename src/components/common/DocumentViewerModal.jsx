import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  PenTool,
  Award,
  ShieldCheck,
  Stamp,
  ExternalLink,
  FileText
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function DocumentViewerModal({
  isOpen,
  onClose,
  student,
  document,
  onOpenSignatureModal
}) {
  const { currentUser, getSupervisorForStudent, inchargeUser, hodUser, students } = usePortal();

  if (!isOpen || !student || !document) return null;

  // Keep reactive to real-time state updates in PortalContext
  const currentStudent = (students && students.find(s => s.id === student.id)) || student;
  const currentDoc = (currentStudent.documents && currentStudent.documents.find(d => d.id === document.id)) || document;
  const supervisor = getSupervisorForStudent ? getSupervisorForStudent(currentStudent) : null;
  const isStudent = currentUser?.role === 'student';

  const fileName = currentDoc.fileName || '';
  const fileDataUrl = currentDoc.fileDataUrl || '';
  const isPdf = fileName.toLowerCase().endsWith('.pdf') || (typeof fileDataUrl === 'string' && fileDataUrl.startsWith('data:application/pdf'));
  const isImage = (typeof fileDataUrl === 'string' && fileDataUrl.startsWith('data:image/')) || /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (fileDataUrl) {
      const element = window.document.createElement('a');
      element.href = fileDataUrl;
      element.download = fileName || `${currentStudent.regNo}_${currentDoc.title.replace(/\s+/g, '_')}`;
      window.document.body.appendChild(element);
      element.click();
      window.document.body.removeChild(element);
      return;
    }
    const element = window.document.createElement('a');
    const metadata = [
      `COMSATS University Islamabad - Internship Portal`,
      `Student: ${currentStudent.name} (${currentStudent.regNo})`,
      `Department: ${currentStudent.department || 'Computer Science'}`,
      `Company: ${currentStudent.internshipCompany || 'Not specified'}`,
      `Document: ${currentDoc.title}`,
      `Submitted: ${currentDoc.submittedAt ? new Date(currentDoc.submittedAt).toISOString() : 'N/A'}`,
    ].join('\n');
    const file = new Blob([metadata], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${currentStudent.regNo}_${currentDoc.title.replace(/\s+/g, '_')}.txt`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const handleOpenExternal = () => {
    if (fileDataUrl) {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${fileDataUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm overflow-y-auto ${isStudent ? 'p-0' : 'p-3 sm:p-6'}`}>
      <div className={`bg-white shadow-2xl border border-slate-300 w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${isStudent ? 'max-w-none rounded-none' : 'max-w-4xl rounded-xl'}`}>
        
        {/* Modal Top Navigation Bar */}
        <div className="bg-[#001530] text-white px-5 py-3 flex items-center justify-between border-b-2 border-[#c29b38] shrink-0">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#c29b38]" />
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">
                Submitted Internship Document &amp; Official Endorsements
              </h3>
              <p className="text-[11px] text-slate-300">
                {currentDoc.title} · Ref: <span className="font-mono text-[#facc15]">{currentDoc.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fileDataUrl && (
              <button
                type="button"
                onClick={handleOpenExternal}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#facc15]" />
                <span className="hidden sm:inline">Open</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/75">
          <div className={`${isStudent ? 'max-w-none' : 'max-w-3xl'} mx-auto bg-white border border-slate-300 shadow-md p-6 sm:p-8 text-slate-800 rounded-xl space-y-6`}>
            
            {/* 1. OFFICIAL INSTITUTIONAL HEADER & SUBMISSION DOSSIER */}
            <div className="border-b-2 border-[#002147] pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-white p-1 flex items-center justify-center border-2 border-[#c29b38] shadow-sm shrink-0">
                    <img src="/cui-logo.png" alt="COMSATS University" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div>
                    <h1 className="font-serif font-black text-base sm:text-lg text-[#002147] tracking-wider uppercase">
                      COMSATS University Islamabad
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      Department of Computer Science · Career Development &amp; Placement Centre
                    </p>
                    <p className="text-[10px] text-slate-400">
                      CUOnline SIS Internship Verification System · Academic Year 2025–2026
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="inline-block bg-[#002147] text-[#facc15] font-bold px-2.5 py-1 text-[10px] rounded uppercase tracking-wider">
                    Student Submission
                  </span>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">Ref: {currentDoc.id}</p>
                </div>
              </div>

              {/* Dossier Metadata Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Candidate</span>
                  <p className="font-bold text-[#002147]">{currentStudent.name}</p>
                  <p className="font-mono text-[11px] text-slate-600">{currentStudent.regNo}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Academic Program</span>
                  <p className="font-semibold text-slate-800">{currentStudent.program || 'BS Computer Science'}</p>
                  <p className="text-[11px] text-slate-500">{currentStudent.semester || '7th Semester'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Host Enterprise</span>
                  <p className="font-semibold text-slate-800">{currentStudent.internshipCompany || 'Registered Enterprise'}</p>
                  <p className="text-[11px] text-slate-500">{currentStudent.internshipRole || 'Intern'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Submission Date</span>
                  <p className="font-semibold text-slate-800">
                    {currentDoc.submittedAt ? new Date(currentDoc.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">{currentDoc.fileSize || 'Standard'}</p>
                </div>
              </div>
            </div>

            {/* 2. AUTHENTIC SUBMITTED DOCUMENT CONTENT (Formatting strictly preserved) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#c29b38]" />
                  <h2 className="font-bold text-sm text-[#002147] uppercase tracking-wide">
                    {currentDoc.title}
                  </h2>
                </div>
                {fileName && (
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {fileName}
                  </span>
                )}
              </div>

              {/* Responsive Container Preserving Original Formatting */}
              {isPdf && fileDataUrl ? (
                <div className="w-full rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-50">
                  <div className="p-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs text-slate-600 px-3">
                    <span className="font-medium flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-red-600" />
                      PDF Document View ({fileName || 'Uploaded Document'})
                    </span>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="text-xs font-bold text-[#002147] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Download PDF
                    </button>
                  </div>
                  <iframe
                    src={fileDataUrl}
                    title={currentDoc.title}
                    className="w-full h-[650px] border-0"
                  />
                </div>
              ) : isImage && fileDataUrl ? (
                <div className="w-full rounded-xl border border-slate-300 p-3 bg-slate-50 flex justify-center shadow-inner">
                  <img
                    src={fileDataUrl}
                    alt={currentDoc.title}
                    className="max-w-full h-auto object-contain rounded-lg border border-slate-200 shadow-sm"
                  />
                </div>
              ) : (
                <div className="w-full bg-slate-50/70 p-6 sm:p-8 rounded-xl border border-slate-300 text-center space-y-3">
                  <div className="w-14 h-14 bg-blue-50 text-[#002147] rounded-2xl flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
                    <FileText className="w-7 h-7 text-[#c29b38]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#002147]">{fileName || currentDoc.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uploaded File · {currentDoc.fileSize || 'Standard size'}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">
                      The formatting, structure, and binary content of this submitted document are preserved exactly as uploaded.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-4 py-2 bg-[#002147] hover:bg-[#003366] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#facc15]" />
                      <span>Download Submitted File ({fileName || 'Document'})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. AUTHORIZED SIGNATURES & OFFICIAL INSTITUTIONAL STAMPS SECTION (Appended to document) */}
            <div className="pt-6 border-t-2 border-slate-300 space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                  <Stamp className="w-4 h-4 text-[#c29b38]" />
                  <span className="font-bold text-xs uppercase tracking-widest text-[#002147]">
                    Authorized Signatures &amp; Official Institutional Stamps
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Official multi-tier endorsement pipeline attached to student dossier
                </p>
              </div>

              {/* 4-Tier Signature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. STUDENT SIGNATURE */}
                <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 flex flex-col justify-between min-h-[160px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-[#002147] uppercase tracking-wider">
                        1. Student Signature
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Handwritten Canvas Draw)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      I hereby certify that all submitted reports reflect genuine industrial work performed.
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {currentDoc.studentSigned && currentDoc.studentSignature ? (
                      <div className="text-center">
                        <img
                          src={currentDoc.studentSignature}
                          alt="Student Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Digitally Drawn by {currentStudent.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'student' && currentUser?.id === currentStudent.id ? (
                          <button
                            type="button"
                            onClick={() => onOpenSignatureModal('student', currentStudent, currentDoc)}
                            className="px-3 py-1.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5 text-[#facc15]" />
                            <span>Draw Student Signature</span>
                          </button>
                        ) : (
                          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            Pending Student Draw Signature
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1.5 text-[10px] text-slate-500 flex justify-between">
                    <span className="font-medium text-slate-700">{currentStudent.name}</span>
                    <span>Date: {currentDoc.studentSignedAt ? new Date(currentDoc.studentSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>

                {/* 2. FACULTY SUPERVISOR SIGNATURE */}
                <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 flex flex-col justify-between min-h-[160px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-[#002147] uppercase tracking-wider">
                        2. Faculty Supervisor
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Faculty Mentor)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Evaluated and endorsed by assigned departmental supervisor.
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {currentDoc.supervisorSigned && currentDoc.supervisorSignature ? (
                      <div className="text-center">
                        <img
                          src={currentDoc.supervisorSignature}
                          alt="Supervisor Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Endorsed by {supervisor?.name || 'Faculty Supervisor'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'supervisor' ? (
                          <button
                            type="button"
                            onClick={() => onOpenSignatureModal('supervisor', currentStudent, currentDoc)}
                            className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5 text-[#facc15]" />
                            <span>Sign / Endorse Document</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Awaiting Faculty Supervisor Endorsement
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-1.5 text-[10px] text-slate-500 flex justify-between">
                    <span className="font-medium text-slate-700">{supervisor?.name || 'Faculty Supervisor'}</span>
                    <span>Date: {currentDoc.supervisorSignedAt ? new Date(currentDoc.supervisorSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>

                {/* 3. INTERNSHIP INCHARGE SIGNATURE & STAMP */}
                <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 flex flex-col justify-between min-h-[160px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-[#002147] uppercase tracking-wider">
                        3. Internship Incharge
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Placement Cell Seal)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verified corporate placement criteria and departmental compliance standards.
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {currentDoc.inchargeSigned && currentDoc.inchargeSignature ? (
                      <div className="text-center">
                        <img
                          src={currentDoc.inchargeSignature}
                          alt="Incharge Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Stamped by {inchargeUser?.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'incharge' ? (
                          <button
                            type="button"
                            onClick={() => onOpenSignatureModal('incharge', currentStudent, currentDoc)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
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

                  <div className="border-t border-slate-200 pt-1.5 text-[10px] text-slate-500 flex justify-between">
                    <span className="font-medium text-slate-700">{inchargeUser?.name || 'Internship Incharge'}</span>
                    <span>Date: {currentDoc.inchargeSignedAt ? new Date(currentDoc.inchargeSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>

                {/* 4. HEAD OF DEPARTMENT (HOD) FINAL CLEARANCE */}
                <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 flex flex-col justify-between min-h-[160px] relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-[#002147] uppercase tracking-wider">
                        4. Head of Department
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Degree Clearance)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Final departmental clearance and 3 credit hours transcript accreditation.
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center">
                    {currentDoc.hodSigned && currentDoc.hodSignature ? (
                      <div className="text-center">
                        <img
                          src={currentDoc.hodSignature}
                          alt="HOD Signature"
                          className="max-h-14 object-contain mx-auto"
                        />
                        <div className="text-[10px] text-purple-700 font-semibold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                          <span>Approved by {hodUser?.name} · 3 Credits</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        {currentUser?.role === 'hod' ? (
                          <button
                            type="button"
                            onClick={() => onOpenSignatureModal('hod', currentStudent, currentDoc)}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#facc15]" />
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

                  <div className="border-t border-slate-200 pt-1.5 text-[10px] text-slate-500 flex justify-between">
                    <span className="font-medium text-slate-700">{hodUser?.name || 'Head of Department'}</span>
                    <span>Date: {currentDoc.hodSignedAt ? new Date(currentDoc.hodSignedAt).toLocaleDateString('en-GB') : '___/___/2026'}</span>
                  </div>
                </div>

              </div>

              {/* Endorsement Feedback / Notes if present */}
              {currentDoc.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 mt-2">
                  <span className="font-bold">Endorsement Remarks:</span> {currentDoc.feedback}
                </div>
              )}
            </div>

            {/* Official Institutional Verification Seal Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[10px] font-mono">
              <span>COMSATS University Islamabad · Student Information System (CUOnline)</span>
              <span>Authentic Digital Verification Seal · CUI-ISB</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500">
            Active User Role: <span className="font-bold text-[#002147] uppercase">{currentUser?.role}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Document
          </button>
        </div>

      </div>
    </div>
  );
}
