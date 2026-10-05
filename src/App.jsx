import React, { useState, useEffect, useCallback, lazy, Suspense, memo } from 'react';
import Header from './components/layout/Header';
import NewsTicker from './components/layout/NewsTicker';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import AuthModal from './components/auth/AuthModal';
import { usePortal } from './context/PortalContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

// Heavy role-dashboards: lazy-loaded so they only download after login
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard'));
const FacultyDashboard = lazy(() => import('./components/faculty/FacultyDashboard'));
const InchargeDashboard = lazy(() => import('./components/incharge/InchargeDashboard'));
const HodDashboard = lazy(() => import('./components/hod/HodDashboard'));

// Modals that are rarely needed: lazy-loaded on demand
const SignatureModal = lazy(() => import('./components/common/SignatureModal'));
const DocumentViewerModal = lazy(() => import('./components/common/DocumentViewerModal'));
const InternshipDirectivesPage = lazy(() => import('./components/common/InternshipDirectivesPage'));
const ProfileCompletionModal = lazy(() => import('./components/common/ProfileCompletionModal'));

// Simple loading skeleton shown while lazy chunks download
function DashboardSkeleton() {
  return (
    <div className="flex-1 w-full animate-pulse space-y-4 pt-2" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-32 bg-slate-200 rounded-2xl" />
      <div className="h-20 bg-slate-200 rounded-2xl" />
      <div className="h-48 bg-slate-200 rounded-2xl" />
    </div>
  );
}

// Toast rendered as a memoized component to avoid re-renders from unrelated state
const Toast = memo(function Toast({ toastMessage }) {
  if (!toastMessage) return null;
  return (
    <div
      className="fixed top-4 right-4 z-[60] animate-fade-in"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border max-w-xs ${toastMessage.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800'
          : toastMessage.type === 'info'
            ? 'bg-sky-50 border-sky-200 text-sky-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
      >
        {toastMessage.type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
        ) : toastMessage.type === 'info' ? (
          <Info className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
        )}
        <span>{toastMessage.message}</span>
      </div>
    </div>
  );
});

export default function App() {
  const {
    currentUser,
    signatureModalConfig,
    setSignatureModalConfig,
    viewingDocument,
    setViewingDocument,
    toastMessage,
  } = usePortal();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(!currentUser);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const prevUserRef = React.useRef(currentUser);

  useEffect(() => {
    const wasLoggedIn = !!prevUserRef.current;
    const isLoggedIn = !!currentUser;
    prevUserRef.current = currentUser;

    if (isLoggedIn) {
      setAuthModalOpen(false);
      setActiveTab('dashboard');
    } else if (wasLoggedIn && !isLoggedIn) {
      setAuthModalOpen(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.needsProfileCompletion) {
      setProfileModalOpen(true);
    }
  }, [currentUser?.id, currentUser?.needsProfileCompletion]);

  // Stable callbacks so child components don't re-render when parent re-renders
  const handleOpenSignatureModal = useCallback((signerRole, targetStudent, targetDoc, onSigned = null) => {
    setSignatureModalConfig({
      isOpen: true,
      signerRole,
      targetStudent,
      documentTitle: targetDoc?.title || 'Internship Clearance Form',
      targetDoc,
      onSigned: onSigned || targetDoc?.onSigned,
    });
  }, [setSignatureModalConfig]);

  const handleCloseSignatureModal = useCallback(() => {
    setSignatureModalConfig(null);
  }, [setSignatureModalConfig]);

  const handleSaveSignature = useCallback((signatureDataUrl, note = '') => {
    if (signatureModalConfig?.onSigned) {
      signatureModalConfig.onSigned(signatureDataUrl, note);
    }
    setSignatureModalConfig(null);
  }, [signatureModalConfig, setSignatureModalConfig]);

  const handleOpenDocumentViewer = useCallback((student, doc) => {
    setViewingDocument({ isOpen: true, student, doc });
  }, [setViewingDocument]);

  const handleCloseDocumentViewer = useCallback(() => {
    setViewingDocument(null);
  }, [setViewingDocument]);

  const openAuth = useCallback(() => setAuthModalOpen(true), []);
  const closeAuth = useCallback(() => setAuthModalOpen(false), []);
  const closeProfile = useCallback(() => setProfileModalOpen(false), []);
  const goBack = useCallback(() => setActiveTab('dashboard'), []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-800">
      <Toast toastMessage={toastMessage} />

      {/* Official Top Bar */}
      <Header onOpenAuth={openAuth} />

      {/* COMSATS SIS Scrolling News Ticker */}
      <NewsTicker />

      {/* Main Workspace */}
      <main className="portal-main flex-1 w-full min-w-0 px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column: CUOnline User ID & Sidebar Nav (Sticky) */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Right Column: Role Dashboards or Directives Page */}
          <div
            key={`${currentUser?.role}-${activeTab}`}
            className="flex-1 w-full min-w-0 overflow-hidden animate-fade-in"
          >
            <Suspense fallback={<DashboardSkeleton />}>
              {activeTab === 'directives' ? (
                <InternshipDirectivesPage onBack={goBack} />
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
            </Suspense>
          </div>
        </div>
      </main>

      {/* Official CUI Footer */}
      <Footer onOpenDirectives={() => setActiveTab('directives')} />

      {/* Authentication & User Switching Modal */}
      <AuthModal isOpen={authModalOpen} onClose={closeAuth} />

      {/* Lazy-loaded modals — only mount when needed */}
      <Suspense fallback={null}>
        {profileModalOpen && (
          <ProfileCompletionModal isOpen={profileModalOpen} onClose={closeProfile} />
        )}
      </Suspense>

      <Suspense fallback={null}>
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
      </Suspense>

      <Suspense fallback={null}>
        {viewingDocument && (
          <DocumentViewerModal
            isOpen={viewingDocument.isOpen}
            onClose={handleCloseDocumentViewer}
            student={viewingDocument.student}
            document={viewingDocument.doc}
            onOpenSignatureModal={handleOpenSignatureModal}
          />
        )}
      </Suspense>
    </div>
  );
}
