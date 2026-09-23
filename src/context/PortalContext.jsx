import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  CAMPUSES,
  INITIAL_STUDENTS,
  INITIAL_SUPERVISORS,
  INITIAL_INCHARGES,
  INITIAL_HODS,
  OFFICIAL_TEMPLATES,
  NOTICES
} from '../data/initialData';
import { hashPassword, verifyPasswordHash, ensureHashedPassword } from '../utils/crypto';
import {
  persistStudents,
  persistUsers,
  persistTemplates,
  hydrateStudents,
  hydrateUsers,
  hydrateTemplates,
  deleteDocumentBlobs,
  deleteTemplateBlobs,
} from '../utils/blobStore';

const PortalContext = createContext();

export const isOfficialUniversityEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const lower = email.trim().toLowerCase();
  return lower.endsWith('@isbstudents.comsats.edu.pk') || lower.endsWith('@isbfaculty.comsats.edu.pk');
};

export const isUserMatch = (user, identifier) => {
  if (!user || !identifier) return false;
  const clean = identifier.trim().toLowerCase();
  const rawId = (user.regNo || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();

  if (userEmail && userEmail === clean) return true;
  if (rawId && rawId === clean) return true;

  const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');
  const rawIdAlpha = rawId.replace(/[^a-z0-9]/g, '');
  if (rawIdAlpha && cleanAlpha && rawIdAlpha === cleanAlpha) return true;

  if (clean.includes('@')) {
    const inputPrefix = clean.split('@')[0];
    const inputPrefixAlpha = inputPrefix.replace(/[^a-z0-9]/g, '');

    if (rawId && (inputPrefix === rawId || inputPrefixAlpha === rawIdAlpha)) return true;

    if (userEmail && userEmail.includes('@')) {
      const userPrefix = userEmail.split('@')[0];
      const userPrefixAlpha = userPrefix.replace(/[^a-z0-9]/g, '');
      if (inputPrefix === userPrefix || inputPrefixAlpha === userPrefixAlpha) return true;
    }
  }

  if (userEmail && userEmail.includes('@')) {
    const userPrefix = userEmail.split('@')[0];
    if (userPrefix === clean || userPrefix.replace(/[^a-z0-9]/g, '') === cleanAlpha) return true;
  }

  if (rawId) {
    const candidates = [
      `${rawId}@isbstudents.comsats.edu.pk`,
      `${rawId}@isbfaculty.comsats.edu.pk`,
      `${rawId}@isb.comsats.edu.pk`,
      `${rawId}@comsats.edu.pk`,
    ];
    if (candidates.includes(clean)) return true;
  }

  if (userEmail && userEmail.includes('@')) {
    const userPrefix = userEmail.split('@')[0];
    const candidates = [
      `${userPrefix}@isbstudents.comsats.edu.pk`,
      `${userPrefix}@isbfaculty.comsats.edu.pk`,
      `${userPrefix}@isb.comsats.edu.pk`,
      `${userPrefix}@comsats.edu.pk`,
    ];
    if (candidates.includes(clean)) return true;
  }

  return false;
};

const STORAGE_KEYS = {
  CURRENT_USER: 'cui_portal_user',
  STUDENTS: 'cui_portal_students',
  SUPERVISORS: 'cui_portal_supervisors',
  INCHARGE: 'cui_portal_incharge',
  HOD: 'cui_portal_hod',
  TEMPLATES: 'cui_portal_templates',
  CAMPUS: 'cui_portal_campus',
};

const readJson = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const asArray = (value, fallback) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [{ ...value, campusId: value.campusId || 'isb' }];
  return fallback;
};

const withCampus = (item, campusId = 'isb') => ({ ...item, campusId: item.campusId || campusId });

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
  const persistReady = useRef(false);
  const resetTokensRef = useRef({});

  const [selectedCampus, setSelectedCampus] = useState(() => localStorage.getItem(STORAGE_KEYS.CAMPUS) || 'isb');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [supervisors, setSupervisors] = useState(() => {
    const saved = asArray(readJson(STORAGE_KEYS.SUPERVISORS, null), INITIAL_SUPERVISORS);
    return saved.map((item) => withCampus(item));
  });

  const [students, setStudents] = useState(() => {
    const saved = readJson(STORAGE_KEYS.STUDENTS, null);
    if (saved) {
      const hasLegacyDocs = Array.isArray(saved) && saved.some((s) =>
        s.documents && s.documents.some((d) => ['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4'].includes(d.templateId))
      );
      if (hasLegacyDocs) return INITIAL_STUDENTS;
      return (Array.isArray(saved) ? saved : INITIAL_STUDENTS).map((item) => withCampus({
        ...item,
        notifications: item.notifications || [],
      }));
    }
    return INITIAL_STUDENTS;
  });

  const [templates, setTemplates] = useState(() => {
    const saved = readJson(STORAGE_KEYS.TEMPLATES, null);
    if (saved) {
      const hasLegacyDefaults = Array.isArray(saved) && saved.some((t) => ['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4'].includes(t.id));
      if (hasLegacyDefaults) {
        localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
        return [];
      }
      return (Array.isArray(saved) ? saved : []).map((item) => withCampus(item));
    }
    return OFFICIAL_TEMPLATES;
  });

  const [inchargeUsers, setInchargeUsers] = useState(() =>
    asArray(readJson(STORAGE_KEYS.INCHARGE, null), INITIAL_INCHARGES).map((item) => withCampus({ ...item, role: 'incharge' }))
  );

  const [hodUsers, setHodUsers] = useState(() =>
    asArray(readJson(STORAGE_KEYS.HOD, null), INITIAL_HODS).map((item) => withCampus({ ...item, role: 'hod' }))
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = readJson(STORAGE_KEYS.CURRENT_USER, null);
    if (saved) return withCampus({ ...saved, notifications: saved.notifications || [] });
    return { ...INITIAL_STUDENTS[0], role: 'student' };
  });

  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState('all');
  const [signatureModalConfig, setSignatureModalConfig] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [hydratedStudents, hydratedSupervisors, hydratedIncharge, hydratedHod, hydratedTemplates, hydratedCurrent] = await Promise.all([
        hydrateStudents(students),
        hydrateUsers(supervisors),
        hydrateUsers(inchargeUsers),
        hydrateUsers(hodUsers),
        hydrateTemplates(templates),
        hydrateUsers([currentUser]),
      ]);

      const hashedStudents = await Promise.all(hydratedStudents.map(ensureHashedPassword));
      const hashedSupervisors = await Promise.all(hydratedSupervisors.map(ensureHashedPassword));
      const hashedIncharge = await Promise.all(hydratedIncharge.map(ensureHashedPassword));
      const hashedHod = await Promise.all(hydratedHod.map(ensureHashedPassword));
      const hashedCurrent = await ensureHashedPassword(hydratedCurrent[0]);

      if (cancelled) return;
      setStudents(hashedStudents);
      setSupervisors(hashedSupervisors);
      setInchargeUsers(hashedIncharge);
      setHodUsers(hashedHod);
      setTemplates(hydratedTemplates);
      setCurrentUser(hashedCurrent);
      persistReady.current = true;
    })();
    return () => { cancelled = true; };
    // Boot hydrate once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!persistReady.current) return;
    persistStudents(students).then((light) => localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(light)));
  }, [students]);

  useEffect(() => {
    if (!persistReady.current) return;
    persistUsers(supervisors).then((light) => localStorage.setItem(STORAGE_KEYS.SUPERVISORS, JSON.stringify(light)));
  }, [supervisors]);

  useEffect(() => {
    if (!persistReady.current) return;
    persistUsers(inchargeUsers).then((light) => localStorage.setItem(STORAGE_KEYS.INCHARGE, JSON.stringify(light)));
  }, [inchargeUsers]);

  useEffect(() => {
    if (!persistReady.current) return;
    persistUsers(hodUsers).then((light) => localStorage.setItem(STORAGE_KEYS.HOD, JSON.stringify(light)));
  }, [hodUsers]);

  useEffect(() => {
    if (!persistReady.current) return;
    persistTemplates(templates).then((light) => localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(light)));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPUS, selectedCampus);
  }, [selectedCampus]);

  useEffect(() => {
    if (!persistReady.current || !currentUser) return;
    persistUsers([currentUser]).then((light) => localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(light[0])));
  }, [currentUser]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const viewCampus = currentUser?.role === 'student'
    ? (currentUser.campusId || selectedCampus)
    : selectedCampus;

  const campusStudents = useMemo(
    () => students.filter((s) => (s.campusId || 'isb') === viewCampus),
    [students, viewCampus]
  );
  const campusSupervisors = useMemo(
    () => supervisors.filter((s) => (s.campusId || 'isb') === viewCampus),
    [supervisors, viewCampus]
  );
  const campusTemplates = useMemo(
    () => templates.filter((t) => (t.campusId || 'isb') === viewCampus),
    [templates, viewCampus]
  );
  const campusIncharges = useMemo(
    () => inchargeUsers.filter((u) => (u.campusId || 'isb') === viewCampus),
    [inchargeUsers, viewCampus]
  );
  const campusHods = useMemo(
    () => hodUsers.filter((u) => (u.campusId || 'isb') === viewCampus),
    [hodUsers, viewCampus]
  );

  const inchargeUser = currentUser?.role === 'incharge'
    ? currentUser
    : (campusIncharges[0] || inchargeUsers[0] || null);
  const hodUser = currentUser?.role === 'hod'
    ? currentUser
    : (campusHods[0] || hodUsers[0] || null);

  const isStudentFullyCleared = (student) => {
    const docs = Array.isArray(student?.documents) ? student.documents : [];
    if (docs.length === 0) return false;

    const requiredTemplateIds = campusTemplates.map((tpl) => tpl.id).filter(Boolean);
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

  const getStudentOverallStatus = (documents = [], campusId = viewCampus) => {
    if (!Array.isArray(documents) || documents.length === 0) return 'pending_submission';

    const requiredTemplateIds = templates
      .filter((tpl) => (tpl.campusId || 'isb') === (campusId || viewCampus))
      .map((tpl) => tpl.id)
      .filter(Boolean);
    const allRequiredTemplatesSubmitted = requiredTemplateIds.length === 0 || requiredTemplateIds.every((templateId) =>
      documents.some((doc) => doc.templateId === templateId)
    );

    const allDocsCompleted = documents.every((doc) =>
      doc.studentSigned && doc.supervisorSigned && doc.inchargeSigned && doc.hodSigned
    );
    if (allDocsCompleted && allRequiredTemplatesSubmitted) return 'completed';

    if (documents.some((doc) => doc.studentSigned && !doc.supervisorSigned)) return 'pending_supervisor';
    if (documents.some((doc) => doc.supervisorSigned && !doc.inchargeSigned)) return 'pending_incharge';
    if (documents.some((doc) => doc.inchargeSigned && !doc.hodSigned)) return 'pending_hod';

    return 'pending_submission';
  };

  const switchRole = (role, id = null) => {
    if (role === 'student') {
      const std = id ? students.find((s) => s.id === id) : (campusStudents[0] || students[0]);
      if (std) {
        setSelectedCampus(std.campusId || selectedCampus);
        setCurrentUser({ ...std, role: 'student' });
        showToast(`Switched view to Student: ${std.name} (${std.regNo})`, 'info');
      }
    } else if (role === 'supervisor') {
      const sup = id ? supervisors.find((s) => s.id === id) : (campusSupervisors[0] || supervisors[0]);
      if (sup) {
        setSelectedCampus(sup.campusId || selectedCampus);
        setCurrentUser({ ...sup, role: 'supervisor' });
        showToast(`Switched view to Faculty Supervisor: ${sup.name} (${sup.regNo})`, 'info');
      } else {
        showToast('No faculty supervisor exists for this campus yet.', 'error');
      }
    } else if (role === 'incharge') {
      const inc = id ? inchargeUsers.find((s) => s.id === id) : (campusIncharges[0] || inchargeUsers[0]);
      if (inc) {
        setSelectedCampus(inc.campusId || selectedCampus);
        setCurrentUser({ ...inc, role: 'incharge' });
        showToast(`Switched view to Internship Incharge: ${inc.name}`, 'info');
      } else {
        showToast('No internship incharge exists for this campus yet.', 'error');
      }
    } else if (role === 'hod') {
      const hod = id ? hodUsers.find((s) => s.id === id) : (campusHods[0] || hodUsers[0]);
      if (hod) {
        setSelectedCampus(hod.campusId || selectedCampus);
        setCurrentUser({ ...hod, role: 'hod' });
        showToast(`Switched view to Head of Department (HOD): ${hod.name}`, 'info');
      } else {
        showToast('No HOD exists for this campus yet.', 'error');
      }
    }
  };

  const findAccount = (identifier) => {
    const cleanId = identifier.trim();
    const foundStudent = students.find((s) => isUserMatch(s, cleanId));
    if (foundStudent) return { user: foundStudent, role: 'student' };
    const foundSupervisor = supervisors.find((s) => isUserMatch(s, cleanId));
    if (foundSupervisor) return { user: foundSupervisor, role: 'supervisor' };
    const foundIncharge = inchargeUsers.find((s) => isUserMatch(s, cleanId));
    if (foundIncharge) return { user: foundIncharge, role: 'incharge' };
    const foundHod = hodUsers.find((s) => isUserMatch(s, cleanId));
    if (foundHod) return { user: foundHod, role: 'hod' };
    return null;
  };

  const persistPasswordOnUser = (match, hashed) => {
    if (match.role === 'student') {
      setStudents((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, password: hashed } : s)));
    } else if (match.role === 'supervisor') {
      setSupervisors((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, password: hashed } : s)));
    } else if (match.role === 'incharge') {
      setInchargeUsers((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, password: hashed } : s)));
    } else if (match.role === 'hod') {
      setHodUsers((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, password: hashed } : s)));
    }
  };

  const login = async (identifier, password, role) => {
    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter your password.' };
    }
    if (!identifier || !identifier.trim()) {
      return { success: false, error: role === 'student' ? 'Please enter your Registration Number.' : 'Please enter your Account Email.' };
    }

    const cleanId = identifier.trim();
    let match = null;

    if (role === 'student') {
      const user = students.find((s) => isUserMatch(s, cleanId));
      if (user) match = { user, role: 'student' };
    } else if (role === 'supervisor') {
      const user = supervisors.find((s) => isUserMatch(s, cleanId));
      if (user) match = { user, role: 'supervisor' };
    } else if (role === 'incharge') {
      const user = inchargeUsers.find((s) => isUserMatch(s, cleanId));
      if (user) match = { user, role: 'incharge' };
    } else if (role === 'hod') {
      const user = hodUsers.find((s) => isUserMatch(s, cleanId));
      if (user) match = { user, role: 'hod' };
    }

    if (!match) match = findAccount(cleanId);
    if (!match) {
      return { success: false, error: `No registered account found for "${identifier}". Please check your email/ID.` };
    }

    const valid = await verifyPasswordHash(password, match.user.password);
    if (!valid) {
      return { success: false, error: 'Invalid password. Please check your credentials or use Forgot Password.' };
    }

    const updatedUser = { ...match.user, role: match.role };
    setSelectedCampus(updatedUser.campusId || selectedCampus);
    setCurrentUser(updatedUser);

    const roleTitles = {
      student: 'Student',
      supervisor: 'Faculty Supervisor',
      incharge: 'Internship Incharge',
      hod: 'Head of Department (HOD)',
    };
    showToast(`Welcome back, ${match.user.name}! Logged in as ${roleTitles[match.role]}.`);
    return { success: true };
  };

  const signup = async (userData) => {
    const rawInput = userData.regNo.trim();
    const isStudent = userData.role === 'student';
    const campusId = userData.campusId || selectedCampus;

    let cleanRegNo = rawInput.toUpperCase();
    let officialEmail = '';

    if (isStudent) {
      officialEmail = `${rawInput.toLowerCase()}@isbstudents.comsats.edu.pk`;
    } else if (rawInput.includes('@')) {
      officialEmail = rawInput.toLowerCase();
      cleanRegNo = rawInput.split('@')[0].toUpperCase();
    } else {
      officialEmail = `${rawInput.toLowerCase()}@isbfaculty.comsats.edu.pk`;
    }

    if (findAccount(officialEmail) || findAccount(cleanRegNo)) {
      return { success: false, error: 'An account with this registration number or email already exists.' };
    }

    const hashed = await hashPassword(userData.password);

    if (userData.role === 'student') {
      const newStudent = {
        id: `std-${Date.now()}`,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: hashed,
        campusId,
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
        notifications: [],
        needsProfileCompletion: true,
      };
      setStudents((prev) => [newStudent, ...prev]);
      setCurrentUser({ ...newStudent, role: 'student' });
      showToast(`Account created for ${newStudent.name}! Welcome to CUOnline.`);
      return { success: true };
    }

    if (userData.role === 'supervisor') {
      const newSupervisor = {
        id: `sup-${Date.now()}`,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: hashed,
        campusId,
        designation: null,
        department: null,
        office: null,
        phone: null,
        signature: null,
        avatar: null,
        needsProfileCompletion: true,
      };
      setSupervisors((prev) => [...prev, newSupervisor]);
      setCurrentUser({ ...newSupervisor, role: 'supervisor' });
      showToast(`Faculty account registered for ${newSupervisor.name}.`);
      return { success: true };
    }

    if (userData.role === 'incharge') {
      const newIncharge = {
        id: `inc-${Date.now()}`,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: hashed,
        campusId,
        designation: 'Convener & Internship Incharge',
        department: 'Department of Computer Science',
        office: 'Placement & Internship Cell, Student Service Centre',
        phone: null,
        signature: null,
        role: 'incharge',
        avatar: null,
      };
      setInchargeUsers((prev) => [...prev, newIncharge]);
      setCurrentUser(newIncharge);
      showToast(`Internship Incharge account registered for ${newIncharge.name}.`);
      return { success: true };
    }

    if (userData.role === 'hod') {
      const newHod = {
        id: `hod-${Date.now()}`,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: hashed,
        campusId,
        designation: 'Head of Department / Chairperson',
        department: 'Department of Computer Science',
        office: 'HoD Secretariat, 3rd Floor, Faculty Block',
        phone: null,
        signature: null,
        role: 'hod',
        avatar: null,
      };
      setHodUsers((prev) => [...prev, newHod]);
      setCurrentUser(newHod);
      showToast(`HOD account registered for ${newHod.name}.`);
      return { success: true };
    }

    return { success: false, error: 'Unknown role.' };
  };

  const findUserByEmail = (email) => {
    if (!email) return null;
    return findAccount(email);
  };

  const requestPasswordReset = (email) => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Please enter your account email.' };
    }

    const match = findUserByEmail(email);
    if (!match) {
      return {
        success: false,
        error: `No registered account found matching "${email}". Please verify your account email.`
      };
    }

    const resetToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const resetTokenExpires = Date.now() + 30 * 60 * 1000;
    const patch = { resetToken, resetTokenExpires };
    resetTokensRef.current[match.user.id] = patch;

    if (match.role === 'student') {
      setStudents((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...patch } : s)));
    } else if (match.role === 'supervisor') {
      setSupervisors((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...patch } : s)));
    } else if (match.role === 'incharge') {
      setInchargeUsers((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...patch } : s)));
    } else if (match.role === 'hod') {
      setHodUsers((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...patch } : s)));
    }

    return {
      success: true,
      user: match.user,
      role: match.role,
      email: match.user.email || email.trim().toLowerCase(),
      resetToken,
      expiresAt: resetTokenExpires,
      message: `Reset token generated for ${match.user.name}. Valid for 30 minutes.`,
    };
  };

  const resetPassword = async (email, newPassword, token) => {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (!token || !token.trim()) {
      return { success: false, error: 'Reset token is required.' };
    }

    const match = findUserByEmail(email);
    if (!match) {
      return { success: false, error: 'Account not found. Cannot reset password.' };
    }

    const storedToken = resetTokensRef.current[match.user.id] || {
      resetToken: match.user.resetToken,
      resetTokenExpires: match.user.resetTokenExpires,
    };
    const tokenOk = storedToken.resetToken === token.trim() && storedToken.resetTokenExpires > Date.now();
    if (!tokenOk) {
      return { success: false, error: 'Invalid or expired reset token. Request a new one.' };
    }

    const hashed = await hashPassword(newPassword);
    delete resetTokensRef.current[match.user.id];
    const cleared = { password: hashed, resetToken: null, resetTokenExpires: null };

    if (match.role === 'student') {
      setStudents((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...cleared } : s)));
    } else if (match.role === 'supervisor') {
      setSupervisors((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...cleared } : s)));
    } else if (match.role === 'incharge') {
      setInchargeUsers((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...cleared } : s)));
    } else if (match.role === 'hod') {
      setHodUsers((prev) => prev.map((s) => (s.id === match.user.id ? { ...s, ...cleared } : s)));
    }

    if (currentUser?.id === match.user.id) {
      setCurrentUser((prev) => ({ ...prev, ...cleared }));
    }

    showToast(`Password successfully reset for ${match.user.name}! You can now sign in with your new password.`);
    return { success: true, user: match.user, role: match.role };
  };

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

    if (currentUser.role === 'student') {
      setStudents((prev) => prev.map((std) => std.id === currentUser.id ? { ...std, ...sanitizedFields, needsProfileCompletion: false } : std));
    } else if (currentUser.role === 'supervisor') {
      setSupervisors((prev) => prev.map((sup) => sup.id === currentUser.id ? { ...sup, ...sanitizedFields, needsProfileCompletion: false } : sup));
    } else if (currentUser.role === 'incharge') {
      setInchargeUsers((prev) => prev.map((u) => u.id === currentUser.id ? { ...u, ...sanitizedFields, needsProfileCompletion: false } : u));
    } else if (currentUser.role === 'hod') {
      setHodUsers((prev) => prev.map((u) => u.id === currentUser.id ? { ...u, ...sanitizedFields, needsProfileCompletion: false } : u));
    }
    showToast('Official profile details updated successfully!');
  };

  const updateUserAvatar = (newAvatarUrl) => {
    if (!currentUser) return;
    setCurrentUser((prev) => ({ ...prev, avatar: newAvatarUrl }));
    if (currentUser.role === 'student') {
      setStudents((prev) => prev.map((std) => std.id === currentUser.id ? { ...std, avatar: newAvatarUrl } : std));
    } else if (currentUser.role === 'supervisor') {
      setSupervisors((prev) => prev.map((sup) => sup.id === currentUser.id ? { ...sup, avatar: newAvatarUrl } : sup));
    } else if (currentUser.role === 'incharge') {
      setInchargeUsers((prev) => prev.map((u) => u.id === currentUser.id ? { ...u, avatar: newAvatarUrl } : u));
    } else if (currentUser.role === 'hod') {
      setHodUsers((prev) => prev.map((u) => u.id === currentUser.id ? { ...u, avatar: newAvatarUrl } : u));
    }
    showToast('Profile photo updated successfully!');
  };

  const assignSupervisor = (studentId, supervisorId) => {
    setStudents((prev) => prev.map((std) => {
      if (std.id === studentId) {
        return { ...std, assignedSupervisorId: supervisorId };
      }
      return std;
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => ({ ...prev, assignedSupervisorId: supervisorId }));
    }

    const supObj = supervisors.find((s) => s.id === supervisorId);
    showToast(`Assigned supervisor ${supObj ? supObj.name : 'None'} to student.`);
  };

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

    setStudents((prev) => prev.map((std) => {
      if (std.id === studentId) {
        const updatedDocs = [...(std.documents || []), newDoc];
        return {
          ...std,
          documents: updatedDocs,
          status: getStudentOverallStatus(updatedDocs, std.campusId)
        };
      }
      return std;
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => {
        const updatedDocs = [...(prev.documents || []), newDoc];
        return {
          ...prev,
          documents: updatedDocs,
          status: getStudentOverallStatus(updatedDocs, prev.campusId)
        };
      });
    }

    showToast('Internship document uploaded & signed successfully! Forwarded to Faculty Supervisor.');
  };

  const deleteStudentDocument = async (studentId, docId) => {
    const removed = (students.find((std) => std.id === studentId)?.documents || []).find((doc) => doc.id === docId);
    if (!removed) return;

    if (removed.inchargeSigned || removed.hodSigned) {
      showToast('This document is already approved by the Incharge or HOD and cannot be deleted.');
      return;
    }

    await deleteDocumentBlobs(removed);

    setStudents((prev) => prev.map((std) => {
      if (std.id !== studentId) return std;
      const updatedDocs = (std.documents || []).filter((doc) => doc.id !== docId);
      return {
        ...std,
        documents: updatedDocs,
        status: getStudentOverallStatus(updatedDocs, std.campusId),
      };
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => {
        const updatedDocs = (prev.documents || []).filter((doc) => doc.id !== docId);
        return {
          ...prev,
          documents: updatedDocs,
          status: getStudentOverallStatus(updatedDocs, prev.campusId),
        };
      });
    }

    showToast(`Document "${removed.title}" deleted from your submissions.`);
  };

  const signDocument = (studentId, docId, signerRole, signatureDataUrl, note = '') => {
    const now = new Date().toISOString();

    setStudents((prev) => prev.map((std) => {
      if (std.id !== studentId) return std;

      const updatedDocs = (std.documents || []).map((doc) => {
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
          updatedDoc.inchargeSignerId = currentUser?.id || null;
          updatedDoc.feedback = note || 'Vetted and stamped by Internship Incharge.';
        } else if (signerRole === 'hod') {
          updatedDoc.hodSigned = true;
          updatedDoc.hodSignature = signatureDataUrl;
          updatedDoc.hodSignedAt = now;
          updatedDoc.hodSignerId = currentUser?.id || null;
          updatedDoc.feedback = note || 'Departmental approval granted for this document. Remaining internship files must also be completed before 3 credits are awarded.';
        }

        return updatedDoc;
      });

      return {
        ...std,
        status: getStudentOverallStatus(updatedDocs, std.campusId),
        documents: updatedDocs
      };
    }));

    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => {
        const updatedDocs = (prev.documents || []).map((doc) => {
          if (doc.id !== docId) return doc;
          return {
            ...doc,
            [`${signerRole}Signed`]: true,
            [`${signerRole}Signature`]: signatureDataUrl,
            [`${signerRole}SignedAt`]: now,
          };
        });
        return { ...prev, documents: updatedDocs, status: getStudentOverallStatus(updatedDocs, prev.campusId) };
      });
    }

    showToast(`Signature endorsed as ${signerRole.toUpperCase()} successfully!`);
  };

  const addTemplate = (templateData) => {
    const newTpl = {
      id: `tpl-${Date.now()}`,
      campusId: currentUser?.campusId || selectedCampus,
      code: templateData.code || `CUI-INT-FORM-0${campusTemplates.length + 1}`,
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
    setTemplates((prev) => [newTpl, ...prev]);
    showToast(`New official template "${newTpl.title}" published to portal.`);
  };

  const deleteTemplate = async (templateId) => {
    const removed = templates.find((t) => t.id === templateId);
    if (!removed) return;
    await deleteTemplateBlobs(removed);
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    showToast(`Official template "${removed.title}" deleted from the repository.`);
  };

  const getSupervisorForStudent = (student) => {
    if (!student || !student.assignedSupervisorId) return null;
    return supervisors.find((s) => s.id === student.assignedSupervisorId) || null;
  };

  const getStudentLiveStatus = (student) => {
    if (!student) return 'pending_submission';
    return getStudentOverallStatus(Array.isArray(student.documents) ? student.documents : [], student.campusId);
  };

  const sendReminder = (studentId, message) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    const notification = {
      id: `ntf-${Date.now()}`,
      fromId: currentUser?.id,
      fromName: currentUser?.name || 'Faculty Supervisor',
      fromRole: currentUser?.role || 'supervisor',
      message: message || `Please submit your internship documents. Reminder from ${currentUser?.name || 'your supervisor'}.`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setStudents((prev) => prev.map((s) => s.id === studentId
      ? { ...s, notifications: [notification, ...(s.notifications || [])] }
      : s));
    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => ({ ...prev, notifications: [notification, ...(prev.notifications || [])] }));
    }
    showToast(`Reminder delivered to ${student.name} (${student.regNo}).`);
  };

  const markNotificationsRead = (studentId) => {
    setStudents((prev) => prev.map((s) => s.id === studentId
      ? { ...s, notifications: (s.notifications || []).map((n) => ({ ...n, read: true })) }
      : s));
    if (currentUser?.id === studentId) {
      setCurrentUser((prev) => ({
        ...prev,
        notifications: (prev.notifications || []).map((n) => ({ ...n, read: true })),
      }));
    }
  };

  const getFilteredStudents = (forSupervisorId = null) => {
    return campusStudents.filter((student) => {
      const liveStatus = getStudentLiveStatus(student);

      if (forSupervisorId && student.assignedSupervisorId !== forSupervisorId) {
        return false;
      }

      if (selectedSupervisorFilter !== 'all' && student.assignedSupervisorId !== selectedSupervisorFilter) {
        return false;
      }

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

  const stats = {
    totalStudents: campusStudents.length,
    pendingSubmission: campusStudents.filter((s) => {
      const status = getStudentLiveStatus(s);
      return (!s.documents || s.documents.length === 0) || status === 'pending_submission';
    }).length,
    pendingSupervisor: campusStudents.filter((s) => getStudentLiveStatus(s) === 'pending_supervisor').length,
    pendingIncharge: campusStudents.filter((s) => getStudentLiveStatus(s) === 'pending_incharge').length,
    pendingHod: campusStudents.filter((s) => getStudentLiveStatus(s) === 'pending_hod').length,
    completed: campusStudents.filter((s) => isStudentFullyCleared(s)).length,
    supervisorEndorsed: campusStudents.filter((s) => ['pending_incharge', 'pending_hod', 'completed'].includes(getStudentLiveStatus(s))).length,
  };

  return (
    <PortalContext.Provider
      value={{
        selectedCampus,
        setSelectedCampus,
        campuses: CAMPUSES,
        currentUser,
        setCurrentUser,
        supervisors: campusSupervisors,
        students: campusStudents,
        templates: campusTemplates,
        notices: NOTICES,
        inchargeUser,
        hodUser,
        inchargeUsers: campusIncharges,
        hodUsers: campusHods,
        isOnline,
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
        sendReminder,
        markNotificationsRead,
        stats,
        submissionFilter,
        setSubmissionFilter,
        searchQuery,
        setSearchQuery,
        selectedSupervisorFilter,
        setSelectedSupervisorFilter,
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
