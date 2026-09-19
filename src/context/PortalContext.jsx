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

  const isStudentFullyCleared = (student) => {
    const docs = Array.isArray(student?.documents) ? student.documents : [];
    if (docs.length === 0) return false;

    const requiredTemplateIds = (templates || []).map((tpl) => tpl.id).filter(Boolean);
    if (requiredTemplateIds.length > 0) {
      const submittedTemplateIds = new Set(
        docs.filter((doc) => doc?.templateId && requiredTemplateIds.includes(doc.templateId)).map((doc) => doc.templateId)
      );
      if (!requiredTemplateIds.every((templateId) => submittedTemplateIds.has(templateId))) {
        return false;
      }
    }

    return docs.every((doc) => doc.studentSigned && doc.supervisorSigned && doc.inchargeSigned && doc.hodSigned);
  };

  const getStudentOverallStatus = (documents = []) => {
    if (!Array.isArray(documents) || documents.length === 0) return 'pending_submission';

    const requiredTemplateIds = (templates || []).map((tpl) => tpl.id).filter(Boolean);
    const allRequiredTemplatesSubmitted = requiredTemplateIds.length === 0 || requiredTemplateIds.every((templateId) =>
      documents.some((doc) => doc.templateId === templateId)
    );

    const allDocsCompleted = documents.every(doc =>
      doc.studentSigned && doc.supervisorSigned && doc.inchargeSigned && doc.hodSigned
    );
    if (allDocsCompleted && allRequiredTemplatesSubmitted) return 'completed';

    if (documents.some(doc => doc.studentSigned && !doc.supervisorSigned)) return 'pending_supervisor';
    if (documents.some(doc => doc.supervisorSigned && !doc.inchargeSigned)) return 'pending_incharge';
    if (documents.some(doc => doc.inchargeSigned && !doc.hodSigned)) return 'pending_hod';

    return 'pending_submission';
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
    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter your password.' };
    }

    if (role === 'student') {
      const match = students.find(s => s.regNo.toLowerCase() === regNo.toLowerCase());
      if (match) {
        if (match.password && match.password !== password) {
          return { success: false, error: 'Invalid password. Please check your credentials or use Forgot Password.' };
        }
        setCurrentUser({ ...match, role: 'student' });
        showToast(`Welcome back, ${match.name}! Logged in successfully.`);
        return { success: true };
      }
      return { success: false, error: 'No student found with registration number: ' + regNo };
    } else if (role === 'supervisor') {
      const match = supervisors.find(s => s.regNo.toLowerCase() === regNo.toLowerCase());
      if (match) {
        if (match.password && match.password !== password) {
          return { success: false, error: 'Invalid password. Please check your credentials or use Forgot Password.' };
        }
        setCurrentUser({ ...match, role: 'supervisor' });
        showToast(`Welcome Dr./Engr. ${match.name}! Logged in as Faculty Supervisor.`);
        return { success: true };
      }
      return { success: false, error: 'No supervisor found with Employee ID: ' + regNo };
    } else if (role === 'incharge') {
      if (inchargeUser.password && inchargeUser.password !== password) {
        return { success: false, error: 'Invalid password. Please check your credentials or use Forgot Password.' };
      }
      setCurrentUser({ ...inchargeUser, role: 'incharge' });
      showToast(`Welcome Dr. Usama Nadeem! Logged in as Internship Incharge.`);
      return { success: true };
    } else if (role === 'hod') {
      if (hodUser.password && hodUser.password !== password) {
        return { success: false, error: 'Invalid password. Please check your credentials or use Forgot Password.' };
      }
      setCurrentUser({ ...hodUser, role: 'hod' });
      showToast(`Welcome Prof. Dr. Majid Iqbal! Logged in as Head of Department.`);
      return { success: true };
    }
    return { success: false, error: 'Invalid role selection' };
  };

  // Register / Sign up new user
  const signup = (userData) => {
    const cleanRegNo = userData.regNo.trim().toUpperCase();
    const campusCode = selectedCampus || 'isb';
    
    // Dynamically assign official university email based on registration number / role
    const officialEmail = userData.role === 'student'
      ? `${cleanRegNo.toLowerCase()}@${campusCode}.comsats.edu.pk`
      : `${cleanRegNo.toLowerCase()}@comsats.edu.pk`;

    if (userData.role === 'student') {
      const newStudent = {
        id: `std-${Date.now()}`,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: userData.password,
        program: userData.program || null,
        semester: userData.semester || null,
        cgpa: null,
        creditHoursCompleted: null,
        phone: null,
        department: null,
        office: null,
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
      showToast(`Account created for ${newStudent.name}! Official email: ${officialEmail}`);
      return { success: true };
    } else if (userData.role === 'supervisor') {
      const newSupervisor = {
        id: `sup-${Date.now()}`,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: userData.password,
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
      showToast(`Faculty account registered for ${newSupervisor.name}. Official email: ${officialEmail}`);
      return { success: true };
    } else {
      const newUser = {
        id: `usr-${Date.now()}`,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: userData.password,
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
      showToast(`Account registered for ${newUser.name}. Official email: ${officialEmail}`);
      return { success: true };
    }
  };

  // Find user by official email
  const findUserByEmail = (email) => {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    
    // Check students
    const std = students.find(s => 
      (s.email && s.email.toLowerCase() === clean) ||
      (s.regNo && `${s.regNo.toLowerCase()}@${selectedCampus || 'isb'}.comsats.edu.pk` === clean) ||
      (s.regNo && `${s.regNo.toLowerCase()}@isb.comsats.edu.pk` === clean)
    );
    if (std) return { user: std, role: 'student' };

    // Check supervisors
    const sup = supervisors.find(s => 
      (s.email && s.email.toLowerCase() === clean) ||
      (s.regNo && `${s.regNo.toLowerCase()}@comsats.edu.pk` === clean)
    );
    if (sup) return { user: sup, role: 'supervisor' };

    // Check incharge
    if (inchargeUser.email && inchargeUser.email.toLowerCase() === clean) {
      return { user: inchargeUser, role: 'incharge' };
    }

    // Check HOD
    if (hodUser.email && hodUser.email.toLowerCase() === clean) {
      return { user: hodUser, role: 'hod' };
    }

    return null;
  };

  // Request password reset link by account email
  const requestPasswordReset = (email) => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Please enter your account official email.' };
    }

    const match = findUserByEmail(email);
    if (!match) {
      return {
        success: false,
        error: `No registered account found matching "${email}". Please ensure you entered your official COMSATS email.`
      };
    }

    const resetToken = `rst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const officialAccountEmail = match.user.email || email.trim().toLowerCase();
    const resetLink = `https://cuonline.comsats.edu.pk/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(officialAccountEmail)}`;

    return {
      success: true,
      user: match.user,
      role: match.role,
      email: officialAccountEmail,
      resetToken,
      resetLink,
      message: `Reset link generated for ${match.user.name} (${officialAccountEmail}).`
    };
  };

  // Reset password and save new password
  const resetPassword = (email, newPassword) => {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const match = findUserByEmail(email);
    if (!match) {
      return { success: false, error: 'Account not found. Cannot reset password.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    if (match.role === 'student') {
      setStudents(prev => prev.map(s => {
        const isMatch = (s.email && s.email.toLowerCase() === cleanEmail) ||
          (s.regNo && `${s.regNo.toLowerCase()}@${selectedCampus || 'isb'}.comsats.edu.pk` === cleanEmail) ||
          s.id === match.user.id;
        return isMatch ? { ...s, password: newPassword } : s;
      }));
    } else if (match.role === 'supervisor') {
      setSupervisors(prev => prev.map(s => {
        const isMatch = (s.email && s.email.toLowerCase() === cleanEmail) ||
          (s.regNo && `${s.regNo.toLowerCase()}@comsats.edu.pk` === cleanEmail) ||
          s.id === match.user.id;
        return isMatch ? { ...s, password: newPassword } : s;
      }));
    }

    // If current user is this user, update password in currentUser too
    if (currentUser?.id === match.user.id || (currentUser?.email && currentUser.email.toLowerCase() === cleanEmail)) {
      const updated = { ...currentUser, password: newPassword };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    }

    showToast(`Password successfully reset for ${match.user.name}! You can now sign in with your new password.`);
    return { success: true, user: match.user, role: match.role };
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
      setStudents(prev => prev.map(std => std.id === currentUser.id ? { ...std, ...sanitizedFields, needsProfileCompletion: false } : std));
    } else if (currentUser.role === 'supervisor') {
      setSupervisors(prev => prev.map(sup => sup.id === currentUser.id ? { ...sup, ...sanitizedFields, needsProfileCompletion: false } : sup));
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
          status: getStudentOverallStatus(updatedDocs)
        };
      }
      return std;
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser(prev => {
        const updatedDocs = [...(prev.documents || []), newDoc];
        return {
          ...prev,
          documents: updatedDocs,
          status: getStudentOverallStatus(updatedDocs)
        };
      });
    }

    showToast('Internship document uploaded & signed successfully! Forwarded to Faculty Supervisor.');
  };

  // Student deletes a submitted document from their submission history
  const deleteStudentDocument = (studentId, docId) => {
    const removed = (students.find(std => std.id === studentId)?.documents || []).find(doc => doc.id === docId);
    if (!removed) return;

    if (removed.inchargeSigned || removed.hodSigned) {
      showToast('This document is already approved by the Incharge or HOD and cannot be deleted.');
      return;
    }

    setStudents(prev => prev.map(std => {
      if (std.id !== studentId) return std;

      const updatedDocs = (std.documents || []).filter(doc => doc.id !== docId);
      return {
        ...std,
        documents: updatedDocs,
        status: getStudentOverallStatus(updatedDocs),
      };
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser(prev => {
        const updatedDocs = (prev.documents || []).filter(doc => doc.id !== docId);
        return {
          ...prev,
          documents: updatedDocs,
          status: getStudentOverallStatus(updatedDocs),
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

      const updatedDocs = (std.documents || []).map(doc => {
        if (doc.id !== docId) return doc;

        const updatedDoc = { ...doc };

        if (signerRole === 'student') {
          updatedDoc.studentSigned = true;
          updatedDoc.studentSignature = signatureDataUrl;
          updatedDoc.studentSignedAt = now;
        } else if (signerRole === 'supervisor') {
          updatedDoc.supervisorSigned = true;
          updatedDoc.supervisorSignature = signatureDataUrl;
          updatedDoc.supervisorSignedAt = now;
          updatedDoc.feedback = note || 'Approved and endorsed by Faculty Supervisor.';
        } else if (signerRole === 'incharge') {
          updatedDoc.inchargeSigned = true;
          updatedDoc.inchargeSignature = signatureDataUrl;
          updatedDoc.inchargeSignedAt = now;
          updatedDoc.feedback = note || 'Vetted and stamped by Internship Incharge.';
        } else if (signerRole === 'hod') {
          updatedDoc.hodSigned = true;
          updatedDoc.hodSignature = signatureDataUrl;
          updatedDoc.hodSignedAt = now;
          updatedDoc.feedback = note || 'Departmental approval granted for this document. Remaining internship files must also be completed before 3 credits are awarded.';
        }

        return updatedDoc;
      });

      return {
        ...std,
        status: getStudentOverallStatus(updatedDocs),
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
        return { ...prev, documents: updatedDocs, status: getStudentOverallStatus(updatedDocs) };
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

  const getStudentLiveStatus = (student) => {
    if (!student) return 'pending_submission';
    return getStudentOverallStatus(Array.isArray(student.documents) ? student.documents : []);
  };

  // Filtered students list based on search, submissionFilter, supervisorFilter
  const getFilteredStudents = (forSupervisorId = null) => {
    return students.filter(student => {
      const liveStatus = getStudentLiveStatus(student);

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
        const hasSubmittedDocs = student.documents && student.documents.length > 0;
        if (hasSubmittedDocs && liveStatus !== 'pending_submission') return false;
      } else if (submissionFilter === 'pending_supervisor') {
        if (liveStatus !== 'pending_supervisor') return false;
      } else if (submissionFilter === 'pending_incharge') {
        if (liveStatus !== 'pending_incharge') return false;
      } else if (submissionFilter === 'pending_hod') {
        if (liveStatus !== 'pending_hod') return false;
      } else if (submissionFilter === 'completed') {
        if (!isStudentFullyCleared(student)) return false;
      } else if (submissionFilter === 'supervisor_endorsed') {
        if (!['pending_incharge', 'pending_hod', 'completed'].includes(liveStatus)) return false;
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
    pendingSubmission: students.filter(s => {
      const status = getStudentOverallStatus(Array.isArray(s.documents) ? s.documents : []);
      return (!s.documents || s.documents.length === 0) || status === 'pending_submission';
    }).length,
    pendingSupervisor: students.filter(s => getStudentOverallStatus(Array.isArray(s.documents) ? s.documents : []) === 'pending_supervisor').length,
    pendingIncharge: students.filter(s => getStudentOverallStatus(Array.isArray(s.documents) ? s.documents : []) === 'pending_incharge').length,
    pendingHod: students.filter(s => getStudentOverallStatus(Array.isArray(s.documents) ? s.documents : []) === 'pending_hod').length,
    completed: students.filter(s => isStudentFullyCleared(s)).length,
    supervisorEndorsed: students.filter(s => {
      const status = getStudentOverallStatus(Array.isArray(s.documents) ? s.documents : []);
      return ['pending_incharge', 'pending_hod', 'completed'].includes(status);
    }).length,
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
        requestPasswordReset,
        resetPassword,
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
        isStudentFullyCleared,
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
