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
import {
  auth,
  firebaseSignup,
  firebaseLogin,
  firebaseLogout,
  firebaseResetPassword,
  firebaseSendEmailVerification,
  formatFirebaseError,
  saveUserRoleToFirestore,
  getUserRoleFromFirestore,
} from '../firebase';

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
    return null;
  });

  // Ref always holds the latest state values for use in callbacks
  const latestStudents = useRef([]);
  const latestSupervisors = useRef([]);
  const latestInchargeUsers = useRef([]);
  const latestHodUsers = useRef([]);
  const latestCurrentUser = useRef(null);

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
      const [hydratedStudents, hydratedSupervisors, hydratedIncharge, hydratedHod, hydratedTemplates] = await Promise.all([
        hydrateStudents(students),
        hydrateUsers(supervisors),
        hydrateUsers(inchargeUsers),
        hydrateUsers(hodUsers),
        hydrateTemplates(templates),
      ]);

      const hashedStudents = await Promise.all(hydratedStudents.map(ensureHashedPassword));
      const hashedSupervisors = await Promise.all(hydratedSupervisors.map(ensureHashedPassword));
      const hashedIncharge = await Promise.all(hydratedIncharge.map(ensureHashedPassword));
      const hashedHod = await Promise.all(hydratedHod.map(ensureHashedPassword));

      if (currentUser) {
        const hydratedCurrent = await hydrateUsers([currentUser]);
        const hashedCurrent = await ensureHashedPassword(hydratedCurrent[0]);
        if (!cancelled) setCurrentUser(hashedCurrent);
      }

      if (cancelled) return;
      setStudents(hashedStudents);
      setSupervisors(hashedSupervisors);
      setInchargeUsers(hashedIncharge);
      setHodUsers(hashedHod);
      setTemplates(hydratedTemplates);
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
    if (!persistReady.current) return;
    if (currentUser) {
      persistUsers([currentUser]).then((light) => localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(light[0])));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  // Keep refs in sync so onAuthStateChanged closure always sees latest state
  useEffect(() => { latestStudents.current = students; }, [students]);
  useEffect(() => { latestSupervisors.current = supervisors; }, [supervisors]);
  useEffect(() => { latestInchargeUsers.current = inchargeUsers; }, [inchargeUsers]);
  useEffect(() => { latestHodUsers.current = hodUsers; }, [hodUsers]);
  useEffect(() => { latestCurrentUser.current = currentUser; }, [currentUser]);

  // Firebase Auth State Listener — only runs on mount, uses refs for latest state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      // If a currentUser is already set (login() already handled it), do nothing
      if (latestCurrentUser.current) return;

      if (fbUser && fbUser.email) {
        try {
          const firestoreData = await getUserRoleFromFirestore(fbUser.uid);
          // Search across all role arrays using latest ref values
          const allUsers = [
            ...latestStudents.current.map(u => ({ user: u, role: 'student' })),
            ...latestSupervisors.current.map(u => ({ user: u, role: 'supervisor' })),
            ...latestInchargeUsers.current.map(u => ({ user: u, role: 'incharge' })),
            ...latestHodUsers.current.map(u => ({ user: u, role: 'hod' })),
          ];
          const found = allUsers.find(({ user }) => {
            const userEmail = (user.email || '').toLowerCase();
            return userEmail === fbUser.email.toLowerCase();
          });
          if (found) {
            const userCampus = firestoreData?.campusId || found.user.campusId || 'isb';
            setCurrentUser({ ...found.user, role: firestoreData?.role || found.role, campusId: userCampus, firebaseUid: fbUser.uid });
            setSelectedCampus(userCampus);
          }
        } catch (err) {
          console.warn('onAuthStateChanged error:', err);
        }
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    () => templates,
    [templates]
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

    const requiredTemplateIds = templates.map((tpl) => tpl.id).filter(Boolean);
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

    const requiredTemplateIds = templates.map((tpl) => tpl.id).filter(Boolean);
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

  const ROLE_NAMES = {
    student: 'Student',
    supervisor: 'Faculty Supervisor',
    incharge: 'Internship Incharge',
    hod: 'Head of Department (HOD)',
  };

  const switchRole = (role, id = null) => {
    if (currentUser && currentUser.role !== role) {
      showToast(
        `Role-Based Access Control: You are logged in as ${ROLE_NAMES[currentUser.role] || currentUser.role}. To access ${ROLE_NAMES[role] || role} portal, please Sign Out and log in with a ${ROLE_NAMES[role] || role} account.`,
        'error'
      );
      return;
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

  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.warn('Firebase logout warning:', err);
    }
    setCurrentUser(null);
    showToast('Logged out successfully.');
  };

  const login = async (identifier, password, selectedRole = 'student') => {
    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter your password.' };
    }
    if (!identifier || !identifier.trim()) {
      return { success: false, error: selectedRole === 'student' ? 'Please enter your Registration Number.' : 'Please enter your Account Email.' };
    }

    const cleanId = identifier.trim();

    // ── CROSS-ROLE CHECK 1: Local Account Match Role Enforcement ──
    const localMatch = findAccount(cleanId);
    if (localMatch && localMatch.role !== selectedRole) {
      const actualRoleName = ROLE_NAMES[localMatch.role] || localMatch.role;
      const attemptedRoleName = ROLE_NAMES[selectedRole] || selectedRole;
      return {
        success: false,
        error: `Cross-Role Login Denied: Your account is registered as "${actualRoleName}", but you selected "${attemptedRoleName}". Please select "${actualRoleName}" to sign in.`
      };
    }

    // Determine target email address for Firebase Authentication
    let targetEmail = localMatch?.user?.email;
    if (!targetEmail) {
      if (cleanId.includes('@')) {
        targetEmail = cleanId.toLowerCase();
      } else if (selectedRole === 'student') {
        targetEmail = `${cleanId.toLowerCase()}@isbstudents.comsats.edu.pk`;
      } else {
        targetEmail = `${cleanId.toLowerCase()}@isbfaculty.comsats.edu.pk`;
      }
    }

    let fbUserCredential = null;
    let fbUser = null;
    try {
      fbUserCredential = await firebaseLogin(targetEmail, password);
      fbUser = fbUserCredential?.user || null;
    } catch (err) {
      console.warn('Firebase login notice:', err);

      // If local seed user or existing account, try to create in Firebase Auth or check local credentials
      if (localMatch) {
        try {
          fbUserCredential = await firebaseSignup(targetEmail, password, localMatch.user.name);
          fbUser = fbUserCredential?.user || null;
        } catch (signupErr) {
          const isPassValid = localMatch.user.password
            ? await verifyPasswordHash(password, localMatch.user.password)
            : true;

          if (isPassValid) {
            const registeredCampusId = localMatch.user.campusId || selectedCampus;
            if (registeredCampusId && registeredCampusId !== selectedCampus) {
              const registeredCampusObj = CAMPUSES.find((c) => c.id === registeredCampusId);
              const selectedCampusObj = CAMPUSES.find((c) => c.id === selectedCampus);
              const registeredCampusName = registeredCampusObj ? registeredCampusObj.name : registeredCampusId;
              const selectedCampusName = selectedCampusObj ? selectedCampusObj.name : selectedCampus;
              return {
                success: false,
                error: `Campus Mismatch Error: Your account is registered under "${registeredCampusName}". You selected "${selectedCampusName}". Please select your correct campus to log in.`
              };
            }

            const updatedUser = { ...localMatch.user, role: localMatch.role, campusId: registeredCampusId };
            setSelectedCampus(updatedUser.campusId || selectedCampus);
            setCurrentUser(updatedUser);
            showToast(`Welcome back, ${localMatch.user.name}! Logged in as ${ROLE_NAMES[localMatch.role] || localMatch.role}.`);
            return { success: true };
          }
          return { success: false, error: formatFirebaseError(err) };
        }
      } else {
        return { success: false, error: formatFirebaseError(err) };
      }
    }

    // ── CROSS-ROLE CHECK 2: Firestore Stored Role Metadata Enforcement ──
    const firestoreData = fbUser ? await getUserRoleFromFirestore(fbUser.uid) : null;
    if (firestoreData && firestoreData.role && firestoreData.role !== selectedRole) {
      await firebaseLogout().catch(() => {});
      const actualRoleName = ROLE_NAMES[firestoreData.role] || firestoreData.role;
      const attemptedRoleName = ROLE_NAMES[selectedRole] || selectedRole;
      return {
        success: false,
        error: `Cross-Role Access Denied: Your Firebase account is registered as "${actualRoleName}". You cannot log in as "${attemptedRoleName}".`
      };
    }

    // ── CAMPUS VERIFICATION CHECK: Firestore & User Record Campus Enforcement ──
    const registeredCampusId = firestoreData?.campusId || localMatch?.user?.campusId;
    if (registeredCampusId && registeredCampusId !== selectedCampus) {
      await firebaseLogout().catch(() => {});
      const registeredCampusObj = CAMPUSES.find((c) => c.id === registeredCampusId);
      const selectedCampusObj = CAMPUSES.find((c) => c.id === selectedCampus);
      const registeredCampusName = registeredCampusObj ? registeredCampusObj.name : registeredCampusId;
      const selectedCampusName = selectedCampusObj ? selectedCampusObj.name : selectedCampus;
      return {
        success: false,
        error: `Campus Mismatch Error: Your account is registered under "${registeredCampusName}". You selected "${selectedCampusName}". Please select your correct campus to log in.`
      };
    }

    let match = localMatch;

    // If account doesn't exist in local state arrays, create it dynamically under verified role
    if (!match) {
      const cleanRegNo = cleanId.includes('@') ? cleanId.split('@')[0].toUpperCase() : cleanId.toUpperCase();
      const newRecord = {
        id: `${selectedRole.slice(0, 3)}-${Date.now()}`,
        firebaseUid: fbUser?.uid || null,
        regNo: cleanRegNo,
        name: fbUser?.displayName || cleanRegNo,
        email: fbUser?.email || targetEmail,
        campusId: selectedCampus,
        role: selectedRole,
        notifications: [],
        documents: [],
      };

      if (selectedRole === 'student') {
        setStudents((prev) => [newRecord, ...prev]);
      } else if (selectedRole === 'supervisor') {
        setSupervisors((prev) => [...prev, newRecord]);
      } else if (selectedRole === 'incharge') {
        setInchargeUsers((prev) => [...prev, newRecord]);
      } else if (selectedRole === 'hod') {
        setHodUsers((prev) => [...prev, newRecord]);
      }
      match = { user: newRecord, role: selectedRole };

      // Save role mapping & campusId to Firestore for persistent RBAC checks
      if (fbUser?.uid) {
        await saveUserRoleToFirestore(fbUser.uid, targetEmail, selectedRole, {
          regNo: cleanRegNo,
          name: newRecord.name,
          campusId: selectedCampus,
        });
      }
    } else {
      // Sync campusId to Firestore if it wasn't saved previously
      if (fbUser?.uid && firestoreData && !firestoreData.campusId) {
        await saveUserRoleToFirestore(fbUser.uid, targetEmail, selectedRole, {
          campusId: match.user.campusId || selectedCampus,
        });
      }
    }

    const updatedUser = { ...match.user, role: match.role, campusId: registeredCampusId || match.user.campusId || selectedCampus, firebaseUid: fbUser?.uid };
    setSelectedCampus(updatedUser.campusId || selectedCampus);
    setCurrentUser(updatedUser);

    showToast(`Welcome back, ${match.user.name}! Logged in as ${ROLE_NAMES[match.role] || match.role}.`);
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

    // ── DUPLICATE ACCOUNT CHECK across ALL roles ──
    const existing = findAccount(officialEmail) || findAccount(cleanRegNo);
    if (existing) {
      const existingRoleName = ROLE_NAMES[existing.role] || existing.role;
      return {
        success: false,
        error: `Duplicate Account Denied: Registration ID or email "${cleanRegNo}" is already registered as a ${existingRoleName}. Duplicate accounts are prohibited.`
      };
    }

    // Register user in Firebase Authentication
    let firebaseUid = null;
    try {
      const userCred = await firebaseSignup(officialEmail, userData.password, userData.name);
      firebaseUid = userCred?.user?.uid || null;
    } catch (fbErr) {
      console.error('Firebase signup error:', fbErr);
      return { success: false, error: formatFirebaseError(fbErr) };
    }

    // Store user role and email in Firebase Firestore
    if (firebaseUid) {
      await saveUserRoleToFirestore(firebaseUid, officialEmail, userData.role, {
        regNo: cleanRegNo,
        name: userData.name.trim(),
        campusId,
      });
    }

    const hashed = await hashPassword(userData.password);

    if (userData.role === 'student') {
      const newStudent = {
        id: `std-${Date.now()}`,
        firebaseUid,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: hashed,
        campusId,
        role: 'student',
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
      showToast(`Account registered in Firebase for ${newStudent.name}! Welcome to CUOnline.`);
      return { success: true };
    }

    if (userData.role === 'supervisor') {
      const newSupervisor = {
        id: `sup-${Date.now()}`,
        firebaseUid,
        regNo: cleanRegNo,
        name: userData.name.trim(),
        email: officialEmail,
        password: hashed,
        campusId,
        role: 'supervisor',
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
      showToast(`Faculty account registered in Firebase for ${newSupervisor.name}.`);
      return { success: true };
    }

    if (userData.role === 'incharge') {
      const newIncharge = {
        id: `inc-${Date.now()}`,
        firebaseUid,
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
      showToast(`Internship Incharge registered in Firebase for ${newIncharge.name}.`);
      return { success: true };
    }

    if (userData.role === 'hod') {
      const newHod = {
        id: `hod-${Date.now()}`,
        firebaseUid,
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
      showToast(`HOD account registered in Firebase for ${newHod.name}.`);
      return { success: true };
    }

    return { success: false, error: 'Unknown role.' };
  };

  const findUserByEmail = (email) => {
    if (!email) return null;
    return findAccount(email);
  };

  const resendEmailVerification = async () => {
    try {
      await firebaseSendEmailVerification(auth.currentUser);
      showToast('Verification link sent to your email address! Please check your inbox.', 'info');
      return { success: true };
    } catch (err) {
      const errMsg = formatFirebaseError(err) || 'Failed to send verification email.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const requestPasswordReset = async (email) => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Please enter your account email address.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const match = findUserByEmail(cleanEmail);

    let fbSuccess = false;
    let fbError = null;

    try {
      await firebaseResetPassword(cleanEmail);
      fbSuccess = true;
    } catch (fbErr) {
      fbError = fbErr;
      console.warn('Firebase password reset notice:', fbErr);
    }

    if (!fbSuccess && !match) {
      return {
        success: false,
        error: formatFirebaseError(fbError) || `No registered account found matching "${email}". Please check your email address.`
      };
    }

    showToast(`Password reset link dispatched via Firebase to ${cleanEmail}. Please check your inbox.`, 'info');

    return {
      success: true,
      email: cleanEmail,
      user: match?.user || null,
      message: `Password reset link dispatched via Firebase to ${cleanEmail}. Please check your inbox.`,
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
        logout,
        requestPasswordReset,
        resendEmailVerification,
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
