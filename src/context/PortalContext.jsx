import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { CAMPUSES, NOTICES } from '../data/initialData';
import { hashPassword, ensureHashedPassword } from '../utils/crypto';
import {
  persistStudents,
  persistUsers,
  hydrateStudents,
  hydrateUsers,
  deleteDocumentBlobs,
} from '../utils/blobStore';
import {
  auth,
  firebaseSignup,
  firebaseLogin,
  firebaseLogout,
  firebaseResetPassword,
  firebaseSendEmailVerification,
  firebaseResendVerification,
  formatFirebaseError,
  saveUserRoleToFirestore,
  getUserRoleFromFirestore,
  getUsersByRoleFromFirestore,
  getTemplatesFromFirestore,
  saveTemplateToFirestore,
  deleteTemplateFromFirestore,
  deleteUserFromFirestore,
  findUserInFirestoreByEmail,
  firebaseDeleteCurrentUser,
} from '../firebase';

const PortalContext = createContext();

export const isOfficialUniversityEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const lower = email.trim().toLowerCase();
  return lower.endsWith('@isbstudents.comsats.edu.pk') || lower.endsWith('@isbfaculty.comsats.edu.pk');
};

const findPersonalEmailAccount = (users, email) => {
  const cleanEmail = email.trim().toLowerCase();
  return users.find((user) => (user.personalEmail || '').trim().toLowerCase() === cleanEmail);
};

const PROFILE_FIELDS = [
  'name',
  'phone',
  'program',
  'semester',
  'cgpa',
  'creditHoursCompleted',
  'internshipCompany',
  'internshipRole',
  'internshipMode',
  'internshipDuration',
  'department',
  'designation',
  'office',
  'email',
  'officialEmail',
];

const ACCOUNT_FIELDS = [
  ...PROFILE_FIELDS,
  'avatar',
  'signature',
  'documents',
  'notifications',
  'status',
  'assignedSupervisorId',
  'assignedSupervisorUid',
];

const getAccountFields = (data) => Object.fromEntries(
  ACCOUNT_FIELDS
    .filter((field) => data?.[field] !== undefined)
    .map((field) => [field, data[field]])
);

export const isUserMatch = (user, identifier) => {
  if (!user || !identifier) return false;
  const clean = identifier.trim().toLowerCase();
  const rawId = (user.regNo || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();
  const personalEmail = (user.personalEmail || '').trim().toLowerCase();

  if (personalEmail && personalEmail === clean) return true;
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
  STUDENTS: 'cui_portal_students',
  SUPERVISORS: 'cui_portal_supervisors',
  INCHARGE: 'cui_portal_incharge',
  HOD: 'cui_portal_hod',
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

const deduplicateStudents = (students) => {
  const seenIdentities = new Set();
  return students.filter((student) => {
    const identities = [
      student.firebaseUid && `uid:${student.firebaseUid.toLowerCase()}`,
      student.regNo && `reg:${student.regNo.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      student.personalEmail && `email:${student.personalEmail.trim().toLowerCase()}`,
      student.email && `email:${student.email.trim().toLowerCase()}`,
      student.id && `id:${student.id}`,
    ].filter(Boolean);
    const isDuplicate = identities.some((identity) => seenIdentities.has(identity));
    identities.forEach((identity) => seenIdentities.add(identity));
    return !isDuplicate;
  });
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
  const persistReady = useRef(false);
  const resetTokensRef = useRef({});

  const [selectedCampus, setSelectedCampus] = useState(() => localStorage.getItem(STORAGE_KEYS.CAMPUS) || 'isb');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [supervisors, setSupervisors] = useState(() => {
    const saved = asArray(readJson(STORAGE_KEYS.SUPERVISORS, null), []);
    return saved.map((item) => withCampus(item));
  });

  const [students, setStudents] = useState(() => {
    const saved = readJson(STORAGE_KEYS.STUDENTS, null);
    if (Array.isArray(saved)) {
      return deduplicateStudents(saved.map((item) => withCampus({
        ...item,
        notifications: item.notifications || [],
      })));
    }
    return [];
  });

  const [templates, setTemplates] = useState([]);

  const [inchargeUsers, setInchargeUsers] = useState(() =>
    asArray(readJson(STORAGE_KEYS.INCHARGE, null), []).map((item) => withCampus({ ...item, role: 'incharge' }))
  );

  const [hodUsers, setHodUsers] = useState(() =>
    asArray(readJson(STORAGE_KEYS.HOD, null), []).map((item) => withCampus({ ...item, role: 'hod' }))
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [inchargeRoster, setInchargeRoster] = useState({ students: [], supervisors: [] });
  const [inchargeRosterLoading, setInchargeRosterLoading] = useState(false);

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
    localStorage.removeItem('cui_portal_user');
  }, []);

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
      const [hydratedStudents, hydratedSupervisors, hydratedIncharge, hydratedHod] = await Promise.all([
        hydrateStudents(students),
        hydrateUsers(supervisors),
        hydrateUsers(inchargeUsers),
        hydrateUsers(hodUsers),
      ]);

      const hashedStudents = await Promise.all(hydratedStudents.map(ensureHashedPassword));
      const hashedSupervisors = await Promise.all(hydratedSupervisors.map(ensureHashedPassword));
      const hashedIncharge = await Promise.all(hydratedIncharge.map(ensureHashedPassword));
      const hashedHod = await Promise.all(hydratedHod.map(ensureHashedPassword));

      if (cancelled) return;
      setStudents(deduplicateStudents(hashedStudents));
      setSupervisors(hashedSupervisors);
      setInchargeUsers(hashedIncharge);
      setHodUsers(hashedHod);
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
    localStorage.setItem(STORAGE_KEYS.CAMPUS, selectedCampus);
  }, [selectedCampus]);

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
        // Enforce email verification on auth state restoration
        if (!fbUser.emailVerified) {
          return;
        }
        try {
          const firestoreData = await getUserRoleFromFirestore(fbUser.uid);
          if (!firestoreData?.role || !['student', 'supervisor', 'incharge', 'hod'].includes(firestoreData.role)) {
            await firebaseLogout();
            return;
          }
          const role = firestoreData.role;
          const roleUsers = role === 'student' ? latestStudents.current
            : role === 'supervisor' ? latestSupervisors.current
              : role === 'incharge' ? latestInchargeUsers.current
                : role === 'hod' ? latestHodUsers.current : [];
          const cachedUser = roleUsers.find((user) => user.firebaseUid === fbUser.uid);
          const userCampus = firestoreData.campusId || cachedUser?.campusId || 'isb';
          const restoredUser = {
            ...getAccountFields(cachedUser),
            ...getAccountFields(firestoreData),
            id: `${role.slice(0, 3)}-${fbUser.uid}`,
            regNo: firestoreData.regNo || cachedUser?.regNo || fbUser.email.split('@')[0].toUpperCase(),
            name: firestoreData.name || cachedUser?.name || fbUser.displayName || fbUser.email,
            email: firestoreData.officialEmail || cachedUser?.email || fbUser.email,
            personalEmail: fbUser.email,
            role,
            campusId: userCampus,
            firebaseUid: fbUser.uid,
            needsProfileCompletion: firestoreData?.profileCompleted === true
              ? false : cachedUser?.needsProfileCompletion ?? true,
          };
          if (role === 'student') {
            setStudents((prev) => deduplicateStudents([
              restoredUser,
              ...prev.filter((user) => user.firebaseUid !== fbUser.uid),
            ]));
          } else if (role === 'supervisor') {
            setSupervisors((prev) => [restoredUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid)]);
          } else if (role === 'incharge') {
            setInchargeUsers((prev) => [restoredUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid)]);
          } else if (role === 'hod') {
            setHodUsers((prev) => [restoredUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid)]);
          }
          setCurrentUser(restoredUser);
          setSelectedCampus(userCampus);
          if (cachedUser) {
            saveUserRoleToFirestore(
              fbUser.uid,
              fbUser.email,
              role,
              getAccountFields(restoredUser)
            ).catch((err) => {
              console.error('Failed to sync locally cached account data to Firebase:', err);
            });
          }
        } catch (err) {
          console.error('Failed to restore signed-in account from Firebase:', err);
          await firebaseLogout().catch((logoutError) => {
            console.error('Failed to sign out after account restoration error:', logoutError);
          });
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

  const inchargeCampus = currentUser?.campusId || selectedCampus;
  useEffect(() => {
    if (!currentUser || currentUser.role === 'student') {
      setInchargeRoster({ students: [], supervisors: [] });
      setInchargeRosterLoading(false);
      return undefined;
    }

    let cancelled = false;
    setInchargeRoster({ students: [], supervisors: [] });
    setInchargeRosterLoading(true);

    const loadInchargeRoster = async () => {
      try {
        const [firebaseStudents, firebaseSupervisors] = await Promise.all([
          getUsersByRoleFromFirestore('student'),
          getUsersByRoleFromFirestore('supervisor'),
        ]);
        if (cancelled) return;

        const matchesCampus = (user) => (user.campusId || 'isb') === inchargeCampus;
        const supervisorsForCampus = firebaseSupervisors
          .filter(matchesCampus)
          .map((user) => {
            const local = latestSupervisors.current.find((candidate) => candidate.firebaseUid === user.firebaseUid);
            return {
              ...local,
              ...user,
              id: local?.id || `sup-${user.firebaseUid}`,
              firebaseUid: user.firebaseUid,
              role: 'supervisor',
              name: user.name || local?.name || user.regNo || user.firebaseUid,
              regNo: user.regNo || local?.regNo || '',
              email: user.officialEmail || local?.email || user.email || '',
              personalEmail: user.personalEmail || user.email || local?.personalEmail || '',
              campusId: user.campusId || local?.campusId || 'isb',
            };
          });
        const supervisorByUid = new Map(
          supervisorsForCampus.map((supervisor) => [supervisor.firebaseUid, supervisor])
        );
        const supervisorIds = new Set(supervisorsForCampus.map((supervisor) => supervisor.id));
        const studentsForCampus = deduplicateStudents(firebaseStudents
          .filter(matchesCampus)
          .map((user) => {
            const local = latestStudents.current.find((candidate) => candidate.firebaseUid === user.firebaseUid);
            const assignedSupervisorId = user.assignedSupervisorUid
              ? supervisorByUid.get(user.assignedSupervisorUid)?.id || ''
              : (user.assignedSupervisorId || local?.assignedSupervisorId || '');
            return {
              ...local,
              ...user,
              id: local?.id || `std-${user.firebaseUid}`,
              firebaseUid: user.firebaseUid,
              role: 'student',
              name: user.name || local?.name || user.regNo || user.firebaseUid,
              regNo: user.regNo || local?.regNo || '',
              email: user.officialEmail || local?.email || user.email || '',
              personalEmail: user.personalEmail || user.email || local?.personalEmail || '',
              campusId: user.campusId || local?.campusId || 'isb',
              documents: user.documents || local?.documents || [],
              notifications: user.notifications || local?.notifications || [],
              status: user.status || local?.status || 'pending_submission',
              assignedSupervisorId: supervisorIds.has(assignedSupervisorId) ? assignedSupervisorId : '',
            };
          }));

        setStudents(studentsForCampus);
        setSupervisors(supervisorsForCampus);
        setInchargeRoster({ students: studentsForCampus, supervisors: supervisorsForCampus });
      } catch (err) {
        console.error('Failed to load incharge Firebase roster:', err);
        if (!cancelled) {
          setInchargeRoster({ students: [], supervisors: [] });
          showToast('Could not load registered students and supervisors from Firebase.', 'error');
        }
      } finally {
        if (!cancelled) setInchargeRosterLoading(false);
      }
    };

    loadInchargeRoster();
    return () => {
      cancelled = true;
    };
  // Local arrays are read through refs so local changes do not repeatedly query Firebase.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, inchargeCampus]);

  useEffect(() => {
    if (!currentUser) {
      setTemplates([]);
      return undefined;
    }

    let cancelled = false;
    const campusId = currentUser.campusId || selectedCampus;
    getTemplatesFromFirestore(campusId)
      .then((loadedTemplates) => {
        if (!cancelled) setTemplates(loadedTemplates);
      })
      .catch((err) => {
        console.error('Failed to load campus templates from Firebase:', err);
        if (!cancelled) {
          setTemplates([]);
          showToast(`Could not load campus templates from Firebase: ${formatFirebaseError(err)}`, 'error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.firebaseUid, currentUser?.campusId, selectedCampus]);

  const viewCampus = currentUser?.role === 'student'
    ? (currentUser.campusId || selectedCampus)
    : selectedCampus;

  const campusStudents = currentUser ? inchargeRoster.students : [];
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

  const findAccountByPersonalEmail = (email) => {
    const accountLists = [
      [students, 'student'],
      [supervisors, 'supervisor'],
      [inchargeUsers, 'incharge'],
      [hodUsers, 'hod'],
    ];
    for (const [users, role] of accountLists) {
      const user = findPersonalEmailAccount(users, email);
      if (user) return { user, role };
    }
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

  const login = async (personalEmail, password, selectedRole = 'student') => {
    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter your password.' };
    }
    if (!personalEmail || !personalEmail.trim()) {
      return { success: false, error: 'Please enter your personal email address.' };
    }

    const cleanEmail = personalEmail.trim().toLowerCase();
    if (isOfficialUniversityEmail(cleanEmail)) {
      return { success: false, error: 'Please sign in with your personal email address, not your university email.' };
    }

    let fbUser;
    try {
      const credential = await firebaseLogin(cleanEmail, password);
      fbUser = credential.user;
    } catch (err) {
      return { success: false, error: formatFirebaseError(err) };
    }

    await fbUser.reload();
    if (!fbUser.emailVerified) {
      await firebaseLogout();
      return {
        success: false,
        requiresVerification: true,
        email: cleanEmail,
        password,
        error: 'Your email address is not verified yet. Please check your inbox and click the verification link before logging in.'
      };
    }

    let firestoreData;
    try {
      firestoreData = await getUserRoleFromFirestore(fbUser.uid, 8000);
    } catch (err) {
      await firebaseLogout();
      return { success: false, error: `Could not load your account data from Firebase: ${err.message}` };
    }
    if (!firestoreData?.role) {
      await firebaseLogout();
      return {
        success: false,
        error: 'This Firebase account has no registered portal profile. Please create an account or contact the portal administrator.'
      };
    }
    if (firestoreData.role !== selectedRole) {
      await firebaseLogout();
      const actualRoleName = ROLE_NAMES[firestoreData.role] || firestoreData.role;
      const attemptedRoleName = ROLE_NAMES[selectedRole] || selectedRole;
      return {
        success: false,
        error: `Cross-Role Access Denied: Your Firebase account is registered as "${actualRoleName}". You cannot log in as "${attemptedRoleName}".`
      };
    }

    // ── CAMPUS VERIFICATION CHECK: Firestore & User Record Campus Enforcement ──
    const registeredCampusId = firestoreData.campusId || selectedCampus;
    if (registeredCampusId && registeredCampusId !== selectedCampus) {
      await firebaseLogout();
      const registeredCampusObj = CAMPUSES.find((c) => c.id === registeredCampusId);
      const selectedCampusObj = CAMPUSES.find((c) => c.id === selectedCampus);
      const registeredCampusName = registeredCampusObj ? registeredCampusObj.name : registeredCampusId;
      const selectedCampusName = selectedCampusObj ? selectedCampusObj.name : selectedCampus;
      return {
        success: false,
        error: `Campus Mismatch Error: Your account is registered under "${registeredCampusName}". You selected "${selectedCampusName}". Please select your correct campus to log in.`
      };
    }

    const accountList = selectedRole === 'student' ? latestStudents.current
      : selectedRole === 'supervisor' ? latestSupervisors.current
        : selectedRole === 'incharge' ? latestInchargeUsers.current : latestHodUsers.current;
    const cachedUser = accountList.find((user) => user.firebaseUid === fbUser.uid);
    const updatedUser = {
      ...getAccountFields(cachedUser),
      ...getAccountFields(firestoreData),
      id: `${selectedRole.slice(0, 3)}-${fbUser.uid}`,
      regNo: firestoreData.regNo || cachedUser?.regNo || cleanEmail.split('@')[0].toUpperCase(),
      name: firestoreData.name || cachedUser?.name || fbUser.displayName || cleanEmail,
      email: firestoreData.officialEmail || cachedUser?.email || cleanEmail,
      personalEmail: cleanEmail,
      role: selectedRole,
      campusId: registeredCampusId,
      firebaseUid: fbUser.uid,
      emailVerified: true,
      needsProfileCompletion: firestoreData.profileCompleted === true ? false : true,
    };
    if (selectedRole === 'student') {
      setStudents((prev) => deduplicateStudents([updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid)]));
    } else if (selectedRole === 'supervisor') {
      setSupervisors((prev) => [updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid)]);
    } else if (selectedRole === 'incharge') {
      setInchargeUsers((prev) => [updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid)]);
    } else {
      setHodUsers((prev) => [updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid)]);
    }
    setSelectedCampus(registeredCampusId);
    setCurrentUser(updatedUser);

    saveUserRoleToFirestore(
      fbUser.uid,
      cleanEmail,
      selectedRole,
      getAccountFields(updatedUser)
    ).catch((err) => {
      console.error('Failed to sync account data to Firebase:', err);
      showToast(`Could not sync saved account data to Firebase: ${formatFirebaseError(err)}`, 'error');
    });

    showToast(`Welcome back, ${updatedUser.name}! Logged in as ${ROLE_NAMES[selectedRole] || selectedRole}.`);
    return { success: true };
  };

  const signup = async (userData) => {
    if (!userData.regNo?.trim() || !userData.name?.trim()) {
      return { success: false, error: 'Please enter your name and registration/employee ID.' };
    }
    const rawInput = userData.regNo.trim();
    const personalEmail = userData.personalEmail?.trim().toLowerCase() || '';
    const isStudent = userData.role === 'student';
    const campusId = userData.campusId || selectedCampus;

    if (!personalEmail) {
      return { success: false, error: 'Please enter your personal email address.' };
    }
    if (isOfficialUniversityEmail(personalEmail)) {
      return { success: false, error: 'Please use a personal email address, not your university email.' };
    }

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
    const existing = findAccountByPersonalEmail(personalEmail) || findAccount(officialEmail) || findAccount(cleanRegNo);
    if (existing) {
      let activeInDb;
      try {
        activeInDb = existing.user.firebaseUid
          ? await getUserRoleFromFirestore(existing.user.firebaseUid)
          : await findUserInFirestoreByEmail(personalEmail);
      } catch (err) {
        console.error('Failed to verify duplicate account against Firebase:', err);
        return { success: false, error: `Could not verify existing account data in Firebase: ${formatFirebaseError(err)}` };
      }

      // If it only exists in stale browser state but was deleted from the database, purge it!
      if (!activeInDb) {
        if (existing.role === 'student') {
          setStudents((prev) => prev.filter((u) => u.id !== existing.user.id && (u.personalEmail || '').toLowerCase() !== personalEmail.toLowerCase()));
        } else if (existing.role === 'supervisor') {
          setSupervisors((prev) => prev.filter((u) => u.id !== existing.user.id && (u.personalEmail || '').toLowerCase() !== personalEmail.toLowerCase()));
        } else if (existing.role === 'incharge') {
          setInchargeUsers((prev) => prev.filter((u) => u.id !== existing.user.id && (u.personalEmail || '').toLowerCase() !== personalEmail.toLowerCase()));
        } else if (existing.role === 'hod') {
          setHodUsers((prev) => prev.filter((u) => u.id !== existing.user.id && (u.personalEmail || '').toLowerCase() !== personalEmail.toLowerCase()));
        }
      } else {
        const existingRoleName = ROLE_NAMES[existing.role] || existing.role;
        return {
          success: false,
          error: `Duplicate Account Denied: Registration/employee ID or personal email is already registered as a ${existingRoleName}. Duplicate accounts are prohibited.`
        };
      }
    }

    const newRecord = {
      regNo: cleanRegNo,
      personalEmail,
      officialEmail,
      name: userData.name.trim(),
      campusId,
      program: userData.program || null,
      semester: userData.semester || null,
      internshipCompany: userData.internshipCompany || null,
      internshipRole: userData.internshipRole || null,
      role: userData.role,
      profileCompleted: false,
      emailVerified: false,
      status: 'pending_submission',
      documents: [],
      notifications: [],
    };

    let firebaseUid = null;
    try {
      const userCred = await firebaseSignup(
        personalEmail,
        userData.password,
        userData.name,
        newRecord
      );
      firebaseUid = userCred?.user?.uid || null;
    } catch (fbErr) {
      console.error('Firebase signup error:', fbErr);
      return { success: false, error: formatFirebaseError(fbErr) };
    }

    const localRecord = {
      id: `${userData.role.slice(0, 3)}-${firebaseUid}`,
      firebaseUid,
      ...newRecord,
      cgpa: null,
      creditHoursCompleted: null,
      phone: null,
      department: null,
      office: null,
      assignedSupervisorId: null,
      internshipMode: null,
      internshipDuration: null,
      avatar: null,
      needsProfileCompletion: true,
    };

    if (userData.role === 'student') {
      setStudents((prev) => deduplicateStudents([localRecord, ...prev]));
    } else if (userData.role === 'supervisor') {
      setSupervisors((prev) => [...prev, localRecord]);
    } else if (userData.role === 'incharge') {
      setInchargeUsers((prev) => [...prev, localRecord]);
    } else if (userData.role === 'hod') {
      setHodUsers((prev) => [...prev, localRecord]);
    }

    // IMPORTANT: Do NOT call setCurrentUser!
    // The user must verify their email before accessing the portal.
    showToast(`Verification link sent to ${personalEmail}. Please verify your email before signing in.`, 'info');
    return {
      success: true,
      requiresVerification: true,
      email: personalEmail,
      password: userData.password,
    };
  };

  const findUserByEmail = (email) => {
    if (!email) return null;
    return findAccountByPersonalEmail(email);
  };

  const resendEmailVerification = async (email = null, password = null) => {
    try {
      const targetEmail = email || auth.currentUser?.email;
      if (!targetEmail) {
        return { success: false, error: 'Email address is required to resend verification.' };
      }
      const res = await firebaseResendVerification(targetEmail, password);
      if (res.success) {
        showToast(`Verification link sent to ${targetEmail}! Please check your inbox.`, 'info');
        return { success: true };
      }
      const errMsg = res.error || 'Failed to send verification email.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    } catch (err) {
      const errMsg = formatFirebaseError(err) || 'Failed to send verification email.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const requestPasswordReset = async (email) => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Please enter your personal email address.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (isOfficialUniversityEmail(cleanEmail)) {
      return { success: false, error: 'Please use the personal email address associated with your account.' };
    }
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

  const deleteAccount = async (targetUserId = null, targetFirebaseUid = null, targetEmail = null) => {
    try {
      const isSelf = !targetUserId || (currentUser && currentUser.id === targetUserId);
      const firebaseRosterStudent = currentUser?.role === 'incharge'
        ? inchargeRoster.students.find((student) =>
          student.id === targetUserId || (targetFirebaseUid && student.firebaseUid === targetFirebaseUid)
        )
        : null;
      const userToDelete = isSelf
        ? currentUser
        : firebaseRosterStudent || (findAccountByPersonalEmail(targetEmail) || findAccount(targetUserId))?.user;

      if (!userToDelete) {
        return { success: false, error: 'User account not found to delete.' };
      }

      const uid = targetFirebaseUid || userToDelete.firebaseUid;
      const email = (targetEmail || userToDelete.personalEmail || userToDelete.email || '').toLowerCase();

      // 1. Delete user from Firestore database
      if (uid || email) {
        await deleteUserFromFirestore(uid, email);
      }

      // 2. If deleting self, delete user from Firebase Auth
      if (isSelf) {
        await firebaseDeleteCurrentUser().catch((err) => {
          console.warn('Firebase delete current user notice:', err);
        });
      }

      // 3. Remove user from local state arrays
      if (userToDelete.role === 'student' || userToDelete.id.startsWith('std-')) {
        setStudents((prev) => prev.filter((u) =>
          u.id !== userToDelete.id
          && u.firebaseUid !== uid
          && (u.personalEmail || '').toLowerCase() !== email
        ));
        setInchargeRoster((prev) => ({
          ...prev,
          students: prev.students.filter((student) => student.firebaseUid !== uid),
        }));
      } else if (userToDelete.role === 'supervisor' || userToDelete.id.startsWith('sup-')) {
        setSupervisors((prev) => prev.filter((u) =>
          u.id !== userToDelete.id
          && u.firebaseUid !== uid
          && (u.personalEmail || '').toLowerCase() !== email
        ));
        setInchargeRoster((prev) => ({
          ...prev,
          supervisors: prev.supervisors.filter((supervisor) => supervisor.firebaseUid !== uid),
          students: prev.students.map((student) => student.assignedSupervisorUid === uid
            ? { ...student, assignedSupervisorId: '', assignedSupervisorUid: null }
            : student),
        }));
      } else if (userToDelete.role === 'incharge' || userToDelete.id.startsWith('inc-')) {
        setInchargeUsers((prev) => prev.filter((u) => u.id !== userToDelete.id && (u.personalEmail || '').toLowerCase() !== email));
      } else if (userToDelete.role === 'hod' || userToDelete.id.startsWith('hod-')) {
        setHodUsers((prev) => prev.filter((u) => u.id !== userToDelete.id && (u.personalEmail || '').toLowerCase() !== email));
      }

      // 4. If self, log out and notify
      if (isSelf) {
        await firebaseLogout().catch(() => { });
        setCurrentUser(null);
        showToast('Your account was deleted from the database. This email can now be reused to create a new account.');
      } else {
        showToast(`Account for ${userToDelete.name} was permanently deleted from the database.`);
      }

      return { success: true };
    } catch (err) {
      console.error('deleteAccount error:', err);
      const errMsg = formatFirebaseError(err) || 'Failed to delete account.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const updateUserProfile = async (updatedFields) => {
    if (!currentUser) return;
    if (!currentUser.firebaseUid) {
      showToast('Your signed-in Firebase account is missing. Sign in again before saving changes.', 'error');
      return;
    }

    const sanitizedFields = Object.fromEntries(
      Object.entries(updatedFields || {}).map(([key, value]) => [key, value === '' ? null : value])
    );

    const updated = {
      ...currentUser,
      ...sanitizedFields,
      needsProfileCompletion: false,
    };

    try {
      await saveUserRoleToFirestore(
        currentUser.firebaseUid,
        currentUser.personalEmail || currentUser.email || '',
        currentUser.role,
        { ...sanitizedFields, profileCompleted: true }
      );
    } catch (err) {
      console.error('Failed to save account profile to Firebase:', err);
      showToast(`Could not save your profile to Firebase: ${formatFirebaseError(err)}`, 'error');
      return;
    }

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

  const updateUserAvatar = async (newAvatarUrl) => {
    if (!currentUser) return;
    if (!currentUser.firebaseUid) {
      showToast('Your signed-in Firebase account is missing. Sign in again before saving changes.', 'error');
      return;
    }
    try {
      await saveUserRoleToFirestore(
        currentUser.firebaseUid,
        currentUser.personalEmail || currentUser.email || '',
        currentUser.role,
        { avatar: newAvatarUrl }
      );
    } catch (err) {
      console.error('Failed to save profile photo to Firebase:', err);
      showToast(`Could not save your profile photo to Firebase: ${formatFirebaseError(err)}`, 'error');
      return;
    }
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

  const persistStudentFields = async (student, fields) => {
    if (!student?.firebaseUid) {
      throw new Error('The registered student account has no Firebase UID.');
    }
    await saveUserRoleToFirestore(
      student.firebaseUid,
      student.personalEmail || student.email || '',
      'student',
      fields
    );
  };

  const updateStudentLocally = (updatedStudent) => {
    const matchesStudent = (candidate) => candidate.id === updatedStudent.id
      || Boolean(updatedStudent.firebaseUid && candidate.firebaseUid === updatedStudent.firebaseUid);
    setStudents((previous) => previous.map((candidate) =>
      matchesStudent(candidate) ? updatedStudent : candidate
    ));
    setInchargeRoster((previous) => ({
      ...previous,
      students: previous.students.map((candidate) =>
        matchesStudent(candidate) ? updatedStudent : candidate
      ),
    }));
    if (currentUser?.firebaseUid === updatedStudent.firebaseUid) {
      setCurrentUser((previous) => ({ ...previous, ...updatedStudent }));
    }
  };

  const assignSupervisor = async (studentId, supervisorId) => {
    const student = campusStudents.find((candidate) => candidate.id === studentId);
    if (!student) {
      showToast('Student account is no longer available in Firebase.', 'error');
      return;
    }
    const availableSupervisors = currentUser?.role === 'incharge'
      ? inchargeRoster.supervisors
      : campusSupervisors;
    const supervisor = supervisorId
      ? availableSupervisors.find((candidate) => candidate.id === supervisorId)
      : null;
    if (supervisorId && !supervisor) {
      showToast('Select a registered supervisor account.', 'error');
      return;
    }

    const updatedStudent = {
      ...student,
      assignedSupervisorId: supervisor?.id || '',
      assignedSupervisorUid: supervisor?.firebaseUid || null,
    };
    try {
      await persistStudentFields(updatedStudent, {
        assignedSupervisorId: updatedStudent.assignedSupervisorId || null,
        assignedSupervisorUid: updatedStudent.assignedSupervisorUid,
      });
    } catch (err) {
      console.error('Failed to save supervisor assignment to Firebase:', err);
      showToast(`Could not save supervisor assignment: ${formatFirebaseError(err)}`, 'error');
      return;
    }

    updateStudentLocally(updatedStudent);

    showToast(`Assigned supervisor ${supervisor ? supervisor.name : 'None'} to student.`);
  };

  const uploadStudentDocument = async (studentId, { templateId, title, fileName, fileSize = '450 KB', studentSignatureDataUrl, fileDataUrl = null }) => {
    const student = campusStudents.find((candidate) => candidate.id === studentId)
      || (currentUser?.id === studentId ? currentUser : null);
    if (!student) {
      showToast('Your student account could not be found. Please sign in again.', 'error');
      return;
    }
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
    const updatedDocs = [...(student.documents || []), newDoc];
    const updatedStudent = {
      ...student,
      documents: updatedDocs,
      status: getStudentOverallStatus(updatedDocs, student.campusId),
    };
    try {
      await persistStudentFields(updatedStudent, {
        documents: updatedDocs,
        status: updatedStudent.status,
      });
    } catch (err) {
      console.error('Failed to save student submission to Firebase:', err);
      showToast(`Could not save the document to Firebase: ${formatFirebaseError(err)}`, 'error');
      return;
    }
    updateStudentLocally(updatedStudent);
    showToast('Internship document uploaded & signed successfully! Forwarded to Faculty Supervisor.');
  };

  const deleteStudentDocument = async (studentId, docId) => {
    const student = campusStudents.find((candidate) => candidate.id === studentId)
      || (currentUser?.id === studentId ? currentUser : null);
    const removed = (student?.documents || []).find((doc) => doc.id === docId);
    if (!removed) return;

    if (removed.inchargeSigned || removed.hodSigned) {
      showToast('This document is already approved by the Incharge or HOD and cannot be deleted.');
      return;
    }

    const updatedDocs = student.documents.filter((doc) => doc.id !== docId);
    const updatedStudent = {
      ...student,
      documents: updatedDocs,
      status: getStudentOverallStatus(updatedDocs, student.campusId),
    };
    try {
      await persistStudentFields(updatedStudent, {
        documents: updatedDocs,
        status: updatedStudent.status,
      });
      await deleteDocumentBlobs(removed);
    } catch (err) {
      console.error('Failed to delete student submission from Firebase:', err);
      showToast(`Could not delete the document: ${formatFirebaseError(err)}`, 'error');
      return;
    }
    updateStudentLocally(updatedStudent);
    showToast(`Document "${removed.title}" deleted from your submissions.`);
  };

  const signDocument = async (studentId, docId, signerRole, signatureDataUrl, note = '') => {
    const student = campusStudents.find((candidate) => candidate.id === studentId)
      || (currentUser?.id === studentId ? currentUser : null);
    if (!student) {
      showToast('Student account could not be found in Firebase.', 'error');
      return;
    }
    const now = new Date().toISOString();
    const updatedDocs = (student.documents || []).map((doc) => {
      if (doc.id !== docId) return doc;
      const updatedDoc = {
        ...doc,
        [`${signerRole}Signed`]: true,
        [`${signerRole}Signature`]: signatureDataUrl,
        [`${signerRole}SignedAt`]: now,
      };
      if (signerRole === 'supervisor') {
        updatedDoc.feedback = note || 'Approved and endorsed by Faculty Supervisor.';
      } else if (signerRole === 'incharge') {
        updatedDoc.inchargeSignerId = currentUser?.id || null;
        updatedDoc.feedback = note || 'Vetted and stamped by Internship Incharge.';
      } else if (signerRole === 'hod') {
        updatedDoc.hodSignerId = currentUser?.id || null;
        updatedDoc.feedback = note || 'Departmental approval granted for this document. Remaining internship files must also be completed before 3 credits are awarded.';
      }
      return updatedDoc;
    });
    const updatedStudent = {
      ...student,
      documents: updatedDocs,
      status: getStudentOverallStatus(updatedDocs, student.campusId),
    };
    try {
      await persistStudentFields(updatedStudent, {
        documents: updatedDocs,
        status: updatedStudent.status,
      });
    } catch (err) {
      console.error('Failed to save document signature to Firebase:', err);
      showToast(`Could not save the signature: ${formatFirebaseError(err)}`, 'error');
      return;
    }
    updateStudentLocally(updatedStudent);
    showToast(`Signature endorsed as ${signerRole.toUpperCase()} successfully!`);
  };

  const addTemplate = async (templateData) => {
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
    try {
      await saveTemplateToFirestore(newTpl);
    } catch (err) {
      console.error('Failed to save campus template to Firebase:', err);
      showToast(`Could not save the template to Firebase: ${formatFirebaseError(err)}`, 'error');
      return;
    }
    setTemplates((prev) => [newTpl, ...prev]);
    showToast(`New official template "${newTpl.title}" published to portal.`);
  };

  const deleteTemplate = async (templateId) => {
    const removed = templates.find((t) => t.id === templateId);
    if (!removed) return;
    try {
      await deleteTemplateFromFirestore(removed);
    } catch (err) {
      console.error('Failed to delete campus template from Firebase:', err);
      showToast(`Could not delete the template: ${formatFirebaseError(err)}`, 'error');
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    showToast(`Official template "${removed.title}" deleted from the repository.`);
  };

  const getSupervisorForStudent = (student) => {
    if (!student || !student.assignedSupervisorId) return null;
    const availableSupervisors = currentUser?.role === 'incharge'
      ? inchargeRoster.supervisors
      : supervisors;
    return availableSupervisors.find((s) => s.id === student.assignedSupervisorId) || null;
  };

  const getStudentLiveStatus = (student) => {
    if (!student) return 'pending_submission';
    return getStudentOverallStatus(Array.isArray(student.documents) ? student.documents : [], student.campusId);
  };

  const sendReminder = async (studentId, message) => {
    const student = campusStudents.find((candidate) => candidate.id === studentId);
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
    const updatedStudent = {
      ...student,
      notifications: [notification, ...(student.notifications || [])],
    };
    try {
      await persistStudentFields(updatedStudent, { notifications: updatedStudent.notifications });
    } catch (err) {
      console.error('Failed to save student reminder to Firebase:', err);
      showToast(`Could not save the reminder: ${formatFirebaseError(err)}`, 'error');
      return;
    }
    updateStudentLocally(updatedStudent);
    showToast(`Reminder delivered to ${student.name} (${student.regNo}).`);
  };

  const markNotificationsRead = async (studentId) => {
    const student = campusStudents.find((candidate) => candidate.id === studentId)
      || (currentUser?.id === studentId ? currentUser : null);
    if (!student) return;
    const updatedStudent = {
      ...student,
      notifications: (student.notifications || []).map((notification) => ({ ...notification, read: true })),
    };
    try {
      await persistStudentFields(updatedStudent, { notifications: updatedStudent.notifications });
    } catch (err) {
      console.error('Failed to update student notifications in Firebase:', err);
      showToast(`Could not update notifications: ${formatFirebaseError(err)}`, 'error');
      return;
    }
    updateStudentLocally(updatedStudent);
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
        supervisors: currentUser ? inchargeRoster.supervisors : [],
        students: campusStudents,
        inchargeRosterLoading,
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
        showToast,
        deleteAccount,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => useContext(PortalContext);
