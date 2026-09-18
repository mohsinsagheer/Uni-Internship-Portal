import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import NewsTicker from './components/layout/NewsTicker';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import AuthModal from './components/auth/AuthModal';
import SignatureModal from './components/common/SignatureModal';
import DocumentViewerModal from './components/common/DocumentViewerModal';
import InternshipDirectivesPage from './components/common/InternshipDirectivesPage';
import ProfileCompletionModal from './components/common/ProfileCompletionModal';
import StudentDashboard from './components/student/StudentDashboard';
import FacultyDashboard from './components/faculty/FacultyDashboard';
import InchargeDashboard from './components/incharge/InchargeDashboard';
import HodDashboard from './components/hod/HodDashboard';
import { usePortal } from './context/PortalContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const {
    currentUser,
    signatureModalConfig,
    setSignatureModalConfig,
    viewingDocument,
    setViewingDocument,
    toastMessage
  } = usePortal();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Check if current user is newly created with null profile info
  useEffect(() => {
    if (currentUser?.needsProfileCompletion) {
      setProfileModalOpen(true);
    }
  }, [currentUser?.id, currentUser?.needsProfileCompletion]);

  // Helper to open signature modal
  const handleOpenSignatureModal = (signerRole, targetStudent, targetDoc, onSigned = null) => {
    setSignatureModalConfig({
      isOpen: true,
      signerRole,
      targetStudent,
      documentTitle: targetDoc?.title || 'Internship Clearance Form',
      targetDoc,
      onSigned: onSigned || targetDoc?.onSigned,
    });
  };

  const handleCloseSignatureModal = () => {
    setSignatureModalConfig(null);
  };

  const handleSaveSignature = (signatureDataUrl, note = '') => {
    if (signatureModalConfig?.onSigned) {
      signatureModalConfig.onSigned(signatureDataUrl, note);
    }
    setSignatureModalConfig(null);
  };

  // Helper to open document viewer
  const handleOpenDocumentViewer = (student, doc) => {
    setViewingDocument({
      isOpen: true,
      student,
      doc,
    });
  };

  const handleCloseDocumentViewer = () => {
    setViewingDocument(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-800">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border ${
              toastMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : toastMessage.type === 'info'
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Official Top Bar */}
      <Header onOpenAuth={() => setAuthModalOpen(true)} />

      {/* COMSATS SIS Scrolling News Ticker */}
      <NewsTicker />

      {/* Main Workspace */}
      <main className="portal-main flex-1 w-full min-w-0 px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column: CUOnline User ID & Sidebar Nav (Sticky) */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Right Column: Role Dashboards or Directives Page */}
          <div key={`${currentUser?.role}-${activeTab}`} className="flex-1 w-full min-w-0 overflow-hidden animate-fade-in">
            {activeTab === 'directives' ? (
              <InternshipDirectivesPage onBack={() => setActiveTab('dashboard')} />
            ) : (
              <>
                {currentUser?.role === 'student' && (
                  <StudentDashboard
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenSignatureModal={handleOpenSignatureModal}
                    onOpenDocumentViewer={handleOpenDocumentViewer}
                  />
                )}

                {currentUser?.role === 'supervisor' && (
                  <FacultyDashboard
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenSignatureModal={handleOpenSignatureModal}
                    onOpenDocumentViewer={handleOpenDocumentViewer}
                  />
                )}

                {currentUser?.role === 'incharge' && (
                  <InchargeDashboard
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenSignatureModal={handleOpenSignatureModal}
                    onOpenDocumentViewer={handleOpenDocumentViewer}
                  />
                )}

                {currentUser?.role === 'hod' && (
                  <HodDashboard
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenSignatureModal={handleOpenSignatureModal}
                    onOpenDocumentViewer={handleOpenDocumentViewer}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Official CUI Footer */}
      <Footer onOpenDirectives={() => setActiveTab('directives')} />

      {/* Authentication & User Switching Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Immediate Profile Completion Modal for New Accounts */}
      <ProfileCompletionModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Interactive Signature Modal (Canvas Draw vs Image Upload) */}
      {signatureModalConfig && (
        <SignatureModal
          isOpen={signatureModalConfig.isOpen}
          onClose={handleCloseSignatureModal}
          signerRole={signatureModalConfig.signerRole}
          targetStudent={signatureModalConfig.targetStudent}
          documentTitle={signatureModalConfig.documentTitle}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* Official Document Letterhead Viewer Modal */}
      {viewingDocument && (
        <DocumentViewerModal
          isOpen={viewingDocument.isOpen}
          onClose={handleCloseDocumentViewer}
          student={viewingDocument.student}
          document={viewingDocument.doc}
          onOpenSignatureModal={handleOpenSignatureModal}
        />
      )}
    </div>
  );
}
