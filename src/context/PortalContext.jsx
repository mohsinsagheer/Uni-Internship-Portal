import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CAMPUSES,
  INITIAL_STUDENTS,
  INITIAL_SUPERVISORS,
  INITIAL_INCHARGE,
  INITIAL_HOD,
  OFFICIAL_TEMPLATES,
  NOTICES
} from '../data/initialData';

const PortalContext = createContext();

const STORAGE_KEYS = {
  CURRENT_USER: 'cui_portal_user',
  STUDENTS: 'cui_portal_students',
  SUPERVISORS: 'cui_portal_supervisors',
  TEMPLATES: 'cui_portal_templates',
  CAMPUS: 'cui_portal_campus',
};

export const downloadTemplateFile = (tpl) => {
  if (!tpl) return;
  const link = document.createElement('a');
  if (tpl.fileDataUrl) {
    link.href = tpl.fileDataUrl;
    link.download = tpl.fileName || `${tpl.code || 'template'}_${tpl.title ? tpl.title.replace(/\s+/g, '_') : 'document'}`;
  } else {
    const metadata = `COMSATS UNIVERSITY ISLAMABAD\nOfficial Document Template\n\nTitle: ${tpl.title}\nCode: ${tpl.code}\nCategory: ${tpl.category}\nVersion: ${tpl.version || 'v1.0'}\nPublished By: ${tpl.uploadedBy || 'Internship Incharge'}\nDate: ${tpl.updatedDate || '2026'}`;
    const file = new Blob([metadata], { type: 'text/plain;charset=utf-8' });
    link.href = URL.createObjectURL(file);
    link.download = `${tpl.code || 'DOC'}_${tpl.title ? tpl.title.replace(/\s+/g, '_') : 'document'}.txt`;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const PortalProvider = ({ children }) => {
  // Current Campus
  const [selectedCampus, setSelectedCampus] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CAMPUS) || 'isb';
  });

  // Supervisors List
  const [supervisors, setSupervisors] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPERVISORS);
    return saved ? JSON.parse(saved) : INITIAL_SUPERVISORS;
  });

  // Students List
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean out legacy student documents referencing deleted default templates tpl-1..tpl-4
        const hasLegacyDocs = Array.isArray(parsed) && parsed.some(s =>
          s.documents && s.documents.some(d => ['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4'].includes(d.templateId))
        );
        if (hasLegacyDocs) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
          return INITIAL_STUDENTS;
        }
        return parsed;
      } catch {
        return INITIAL_STUDENTS;
      }
    }
    return INITIAL_STUDENTS;
  });

  // Official Document Templates
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If localStorage contains legacy default template formats (tpl-1 through tpl-4), clear them
        const hasLegacyDefaults = Array.isArray(parsed) && parsed.some(t => ['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4'].includes(t.id));
        if (hasLegacyDefaults) {
          localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return OFFICIAL_TEMPLATES;
  });

  // Incharge & HOD static references
  const inchargeUser = INITIAL_INCHARGE;
  const hodUser = INITIAL_HOD;

  // Active User (default to first student for easy demonstration)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      return JSON.parse(saved);
    }
    // Default logged-in as Muhammad Hamza (Student)
    return {
      ...INITIAL_STUDENTS[0],
      role: 'student',
    };
  });

  // Global filters
  const [submissionFilter, setSubmissionFilter] = useState('all'); // 'all', status filters, or 'supervisor_endorsed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState('all');

  // Modal states
  const [signatureModalConfig, setSignatureModalConfig] = useState(null); // { studentId, docId, role, onSigned }
  const [viewingDocument, setViewingDocument] = useState(null); // { student, doc, template }
  const [toastMessage, setToastMessage] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPERVISORS, JSON.stringify(supervisors));
  }, [supervisors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPUS, selectedCampus);
  }, [selectedCampus]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick switch role helper (Student, Supervisor, Incharge, HOD)
  const switchRole = (role, id = null) => {
    if (role === 'student') {
      const std = id ? students.find(s => s.id === id) : students[0];
      if (std) {
        setCurrentUser({ ...std, role: 'student' });
        showToast(`Switched view to Student: ${std.name} (${std.regNo})`, 'info');
      }
    } else if (role === 'supervisor') {
      const sup = id ? supervisors.find(s => s.id === id) : supervisors[0];
      if (sup) {
        setCurrentUser({ ...sup, role: 'supervisor' });
        showToast(`Switched view to Faculty Supervisor: ${sup.name} (${sup.regNo})`, 'info');
      }
    } else if (role === 'incharge') {
      setCurrentUser({ ...inchargeUser, role: 'incharge' });
      showToast(`Switched view to Internship Incharge: ${inchargeUser.name}`, 'info');
    } else if (role === 'hod') {
      setCurrentUser({ ...hodUser, role: 'hod' });
      showToast(`Switched view to Head of Department (HOD): ${hodUser.name}`, 'info');
    }
  };

  // Login handler
  const login = (regNo, password, role) => {
    if (role === 'student') {
      const match = students.find(s => s.regNo.toLowerCase() === regNo.toLowerCase());
      if (match) {
        setCurrentUser({ ...match, role: 'student' });
        showToast(`Welcome back, ${match.name}! Logged in successfully.`);
        return { success: true };
      }
      return { success: false, error: 'No student found with registration number: ' + regNo };
    } else if (role === 'supervisor') {
      const match = supervisors.find(s => s.regNo.toLowerCase() === regNo.toLowerCase());
      if (match) {
        setCurrentUser({ ...match, role: 'supervisor' });
        showToast(`Welcome Dr./Engr. ${match.name}! Logged in as Faculty Supervisor.`);
        return { success: true };
      }
      return { success: false, error: 'No supervisor found with Employee ID: ' + regNo };
    } else if (role === 'incharge') {
      setCurrentUser({ ...inchargeUser, role: 'incharge' });
      showToast(`Welcome Dr. Usama Nadeem! Logged in as Internship Incharge.`);
      return { success: true };
    } else if (role === 'hod') {
      setCurrentUser({ ...hodUser, role: 'hod' });
      showToast(`Welcome Prof. Dr. Majid Iqbal! Logged in as Head of Department.`);
      return { success: true };
    }
    return { success: false, error: 'Invalid role selection' };
  };

  // Register / Sign up new user
  const signup = (userData) => {
    if (userData.role === 'student') {
      const newStudent = {
        id: `std-${Date.now()}`,
        regNo: userData.regNo.toUpperCase(),
        name: userData.name,
        email: userData.email,
        program: userData.program || null,
        semester: userData.semester || '7th Semester',
        cgpa: null,
        creditHoursCompleted: null,
        phone: null,
        assignedSupervisorId: null,
        internshipCompany: userData.internshipCompany || null,
        internshipRole: userData.internshipRole || null,
        internshipMode: null,
        internshipDuration: null,
        status: 'pending_submission',
        avatar: null,
        documents: [],
        needsProfileCompletion: true,
      };
      setStudents(prev => [newStudent, ...prev]);
      setCurrentUser({ ...newStudent, role: 'student' });
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ ...newStudent, role: 'student' }));
      showToast(`Account created for ${newStudent.name}! Please complete your profile details.`);
      return { success: true };
    } else if (userData.role === 'supervisor') {
      const newSupervisor = {
        id: `sup-${Date.now()}`,
        regNo: userData.regNo.toUpperCase(),
        name: userData.name,
        email: userData.email,
        designation: null,
        department: null,
        office: null,
        phone: null,
        signature: null,
        avatar: null,
        needsProfileCompletion: true,
      };
      setSupervisors(prev => [...prev, newSupervisor]);
      setCurrentUser({ ...newSupervisor, role: 'supervisor' });
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ ...newSupervisor, role: 'supervisor' }));
      showToast(`Faculty account registered for ${newSupervisor.name}. Please complete your profile.`);
      return { success: true };
    } else {
      const newUser = {
        id: `usr-${Date.now()}`,
        regNo: userData.regNo.toUpperCase(),
        name: userData.name,
        email: userData.email,
        designation: null,
        department: null,
        office: null,
        phone: null,
        role: userData.role,
        avatar: null,
        needsProfileCompletion: true,
      };
      setCurrentUser(newUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      showToast(`Account registered. Please complete your profile.`);
      return { success: true };
    }
  };

  // Update user profile information
  const updateUserProfile = (updatedFields) => {
    if (!currentUser) return;

    const sanitizedFields = Object.fromEntries(
      Object.entries(updatedFields || {}).map(([key, value]) => [key, value === '' ? null : value])
    );

    const updated = {
      ...currentUser,
      ...sanitizedFields,
      needsProfileCompletion: false,
    };
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));

    if (currentUser.role === 'student') {
      setStudents(prev => prev.map(std => std.id === currentUser.id ? { ...std, ...updatedFields, needsProfileCompletion: false } : std));
    } else if (currentUser.role === 'supervisor') {
      setSupervisors(prev => prev.map(sup => sup.id === currentUser.id ? { ...sup, ...updatedFields, needsProfileCompletion: false } : sup));
    }
    showToast('Official profile details updated successfully!');
  };

  // Update user avatar (photo upload)
  const updateUserAvatar = (newAvatarUrl) => {
    if (!currentUser) return;
    setCurrentUser(prev => ({ ...prev, avatar: newAvatarUrl }));
    if (currentUser.role === 'student') {
      setStudents(prev => prev.map(std => std.id === currentUser.id ? { ...std, avatar: newAvatarUrl } : std));
    } else if (currentUser.role === 'supervisor') {
      setSupervisors(prev => prev.map(sup => sup.id === currentUser.id ? { ...sup, avatar: newAvatarUrl } : sup));
    }
    showToast('Profile photo updated successfully!');
  };

  // Assign Supervisor to a student (Incharge feature)
  const assignSupervisor = (studentId, supervisorId) => {
    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        return {
          ...std,
          assignedSupervisorId: supervisorId,
        };
      }
      return std;
    }));

    // If current logged-in user is this student, sync currentUser state too
    if (currentUser?.id === studentId) {
      setCurrentUser(prev => ({ ...prev, assignedSupervisorId: supervisorId }));
    }

    const supObj = supervisors.find(s => s.id === supervisorId);
    showToast(`Assigned supervisor ${supObj ? supObj.name : 'None'} to student.`);
  };

  // Student uploads a document for a template
  const uploadStudentDocument = (studentId, { templateId, title, fileName, fileSize = '450 KB', studentSignatureDataUrl, fileDataUrl = null }) => {
    const newDocId = `doc-${studentId}-${Date.now()}`;
    const newDoc = {
      id: newDocId,
      templateId,
      title,
      fileName,
      fileSize,
      fileDataUrl,
      submittedAt: new Date().toISOString(),
      studentSigned: true,
      studentSignature: studentSignatureDataUrl,
      studentSignedAt: new Date().toISOString(),
      supervisorSigned: false,
      supervisorSignature: null,
      supervisorSignedAt: null,
      inchargeSigned: false,
      inchargeSignature: null,
      inchargeSignedAt: null,
      hodSigned: false,
      hodSignature: null,
      hodSignedAt: null,
      feedback: 'Document submitted by student with digital canvas signature.'
    };

    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        const updatedDocs = [...(std.documents || []), newDoc];
        return {
          ...std,
          documents: updatedDocs,
          status: 'pending_supervisor'
        };
      }
      return std;
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc],
        status: 'pending_supervisor'
      }));
    }

    showToast('Internship document uploaded & signed successfully! Forwarded to Faculty Supervisor.');
  };

  // Student deletes a submitted document from their submission history
  const deleteStudentDocument = (studentId, docId) => {
    const removed = (students.find(std => std.id === studentId)?.documents || []).find(doc => doc.id === docId);
    if (!removed) return;

    setStudents(prev => prev.map(std => {
      if (std.id !== studentId) return std;

      const updatedDocs = (std.documents || []).filter(doc => doc.id !== docId);
      return {
        ...std,
        documents: updatedDocs,
        status: updatedDocs.length === 0 ? 'pending_submission' : std.status,
      };
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser(prev => {
        const updatedDocs = (prev.documents || []).filter(doc => doc.id !== docId);
        return {
          ...prev,
          documents: updatedDocs,
          status: updatedDocs.length === 0 ? 'pending_submission' : prev.status,
        };
      });
    }

    showToast(`Document "${removed.title}" deleted from your submissions.`);
  };

  // Multi-tier signature application
  const signDocument = (studentId, docId, signerRole, signatureDataUrl, note = '') => {
    const now = new Date().toISOString();

    setStudents(prev => prev.map(std => {
      if (std.id !== studentId) return std;

      let newStatus = std.status;
      const updatedDocs = (std.documents || []).map(doc => {
        if (doc.id !== docId) return doc;

        const updatedDoc = { ...doc };

        if (signerRole === 'student') {
          updatedDoc.studentSigned = true;
          updatedDoc.studentSignature = signatureDataUrl;
          updatedDoc.studentSignedAt = now;
          newStatus = 'pending_supervisor';
        } else if (signerRole === 'supervisor') {
          updatedDoc.supervisorSigned = true;
          updatedDoc.supervisorSignature = signatureDataUrl;
          updatedDoc.supervisorSignedAt = now;
          updatedDoc.feedback = note || 'Approved and endorsed by Faculty Supervisor.';
          newStatus = 'pending_incharge';
        } else if (signerRole === 'incharge') {
          updatedDoc.inchargeSigned = true;
          updatedDoc.inchargeSignature = signatureDataUrl;
          updatedDoc.inchargeSignedAt = now;
          updatedDoc.feedback = note || 'Vetted and stamped by Internship Incharge.';
          newStatus = 'pending_hod';
        } else if (signerRole === 'hod') {
          updatedDoc.hodSigned = true;
          updatedDoc.hodSignature = signatureDataUrl;
          updatedDoc.hodSignedAt = now;
          updatedDoc.feedback = note || 'Final approval granted by Head of Department. 3 Credits awarded.';
          newStatus = 'completed';
        }

        return updatedDoc;
      });

      return {
        ...std,
        status: newStatus,
        documents: updatedDocs
      };
    }));

    // Update currentUser if applicable
    if (currentUser?.id === studentId) {
      setCurrentUser(prev => {
        const updatedDocs = (prev.documents || []).map(doc => {
          if (doc.id !== docId) return doc;
          return {
            ...doc,
            [`${signerRole}Signed`]: true,
            [`${signerRole}Signature`]: signatureDataUrl,
            [`${signerRole}SignedAt`]: now,
          };
        });
        return { ...prev, documents: updatedDocs };
      });
    }

    showToast(`Signature endorsed as ${signerRole.toUpperCase()} successfully!`);
  };

  // Incharge / University uploads a new template
  const addTemplate = (templateData) => {
    const newTpl = {
      id: `tpl-${Date.now()}`,
      code: templateData.code || `CUI-INT-FORM-0${templates.length + 1}`,
      title: templateData.title,
      category: templateData.category || 'General',
      description: templateData.description || 'Official document template issued by the Internship Incharge Office.',
      version: templateData.version || 'v1.0 (2026)',
      fileName: templateData.fileName || `${templateData.title || 'template'}.pdf`,
      fileSize: templateData.fileSize || '380 KB',
      fileType: templateData.fileType || 'application/octet-stream',
      fileDataUrl: templateData.fileDataUrl || null,
      updatedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      uploadedBy: currentUser?.name || 'Internship Incharge Office',
      requiredSignatures: templateData.requiredSignatures || ['student', 'supervisor', 'incharge'],
    };
    setTemplates(prev => [newTpl, ...prev]);
    showToast(`New official template "${newTpl.title}" published to portal.`);
  };

  const deleteTemplate = (templateId) => {
    const removed = templates.find(t => t.id === templateId);
    if (!removed) return;

    setTemplates(prev => prev.filter(t => t.id !== templateId));
    showToast(`Official template "${removed.title}" deleted from the repository.`);
  };

  // Helper to get supervisor object for a student
  const getSupervisorForStudent = (student) => {
    if (!student || !student.assignedSupervisorId) return null;
    return supervisors.find(s => s.id === student.assignedSupervisorId) || null;
  };

  // Filtered students list based on search, submissionFilter, supervisorFilter
  const getFilteredStudents = (forSupervisorId = null) => {
    return students.filter(student => {
      // If scoped to a specific supervisor
      if (forSupervisorId && student.assignedSupervisorId !== forSupervisorId) {
        return false;
      }

      // Supervisor filter dropdown
      if (selectedSupervisorFilter !== 'all' && student.assignedSupervisorId !== selectedSupervisorFilter) {
        return false;
      }

      // Submission / Status filter
      if (submissionFilter === 'pending_submission') {
        // Students who still require to submit documents
        const hasSubmittedDocs = student.documents && student.documents.length > 0;
        if (hasSubmittedDocs && student.status !== 'pending_submission') return false;
      } else if (submissionFilter === 'pending_supervisor') {
        if (student.status !== 'pending_supervisor') return false;
      } else if (submissionFilter === 'pending_incharge') {
        if (student.status !== 'pending_incharge') return false;
      } else if (submissionFilter === 'pending_hod') {
        if (student.status !== 'pending_hod') return false;
      } else if (submissionFilter === 'completed') {
        if (student.status !== 'completed') return false;
      } else if (submissionFilter === 'supervisor_endorsed') {
        if (!['pending_incharge', 'pending_hod', 'completed'].includes(student.status)) return false;
      }

      // Search query filter (Name, RegNo, Company)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = student.name.toLowerCase().includes(q);
        const matchReg = student.regNo.toLowerCase().includes(q);
        const matchCompany = (student.internshipCompany || '').toLowerCase().includes(q);
        const sup = getSupervisorForStudent(student);
        const matchSupervisor = sup ? sup.name.toLowerCase().includes(q) : false;
        if (!matchName && !matchReg && !matchCompany && !matchSupervisor) {
          return false;
        }
      }

      return true;
    });
  };

  // Counts for filter pills
  const stats = {
    totalStudents: students.length,
    pendingSubmission: students.filter(s => (!s.documents || s.documents.length === 0) || s.status === 'pending_submission').length,
    pendingSupervisor: students.filter(s => s.status === 'pending_supervisor').length,
    pendingIncharge: students.filter(s => s.status === 'pending_incharge').length,
    pendingHod: students.filter(s => s.status === 'pending_hod').length,
    completed: students.filter(s => s.status === 'completed').length,
    supervisorEndorsed: students.filter(s => ['pending_incharge', 'pending_hod', 'completed'].includes(s.status)).length,
  };

  return (
    <PortalContext.Provider
      value={{
        selectedCampus,
        setSelectedCampus,
        campuses: CAMPUSES,
        currentUser,
        setCurrentUser,
        supervisors,
        students,
        templates,
        notices: NOTICES,
        inchargeUser,
        hodUser,
        // Methods
        login,
        signup,
        updateUserProfile,
        switchRole,
        assignSupervisor,
        uploadStudentDocument,
        deleteStudentDocument,
        updateUserAvatar,
        signDocument,
        addTemplate,
        deleteTemplate,
        downloadTemplateFile,
        getSupervisorForStudent,
        getFilteredStudents,
        stats,
        // Filter states
        submissionFilter,
        setSubmissionFilter,
        searchQuery,
        setSearchQuery,
        selectedSupervisorFilter,
        setSelectedSupervisorFilter,
        // Modals & UI
        signatureModalConfig,
        setSignatureModalConfig,
        viewingDocument,
        setViewingDocument,
        toastMessage,
        showToast
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => useContext(PortalContext);
