import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { CAMPUSES, NOTICES, INITIAL_SUPERVISORS, INITIAL_INCHARGES, INITIAL_HODS } from '../data/initialData';
import { hashPassword, ensureHashedPassword } from '../utils/crypto';
import {
  persistStudents,
  persistUsers,
  hydrateStudents,
  hydrateUsers,
  deleteDocumentBlobs,
  persistTemplates,
  hydrateTemplates,
  deleteTemplateBlobs,
  optimizeImage,
  blobGet,
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
  return (
    lower.endsWith('@comsats.edu.pk')
    || lower.endsWith('@isbstudent.comsats.edu.pk')
    || lower.endsWith('@isbstudents.comsats.edu.pk')
    || lower.endsWith('@isbfaculty.comsats.edu.pk')
  );
};

export const buildEmployeeOfficialEmail = (name, fallbackId = '') => {
  const stripped = (name || '')
    .trim()
    .replace(/^(?:(?:prof|dr|mr|mrs|ms|miss|engr|sir|madam)\.?\s+)+/i, '')
    .trim();
  const parts = stripped
    .split(/\s+/)
    .map((part) => part.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}@comsats.edu.pk`;
  }
  if (parts.length === 1) {
    return `${parts[0]}@comsats.edu.pk`;
  }
  const cleanFallback = (fallbackId || 'employee').toLowerCase().replace(/[^a-z0-9]/g, '') || 'employee';
  return `${cleanFallback}@comsats.edu.pk`;
};

export const isValidOfficialEmailForRole = (email, role) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const lower = trimmed.toLowerCase();
  if (role === 'student') {
    return /^[^@\s]+@isbstudent\.comsats\.edu\.pk$/i.test(trimmed);
  }
  return (
    lower.endsWith('@comsats.edu.pk')
    && !lower.endsWith('@isbstudent.comsats.edu.pk')
    && !lower.endsWith('@isbstudents.comsats.edu.pk')
    && !lower.endsWith('@isbfaculty.comsats.edu.pk')
    && /^[^@\s]+@comsats\.edu\.pk$/i.test(trimmed)
  );
};

export const formatOfficialEmailForDisplay = (user) => {
  if (!user) return 'NULL';
  const rawEmail = (user.officialEmail || user.email || '').trim();
  const role = user.role || (user.id?.startsWith('std-') ? 'student' : 'employee');

  if (role === 'student') {
    if (isValidOfficialEmailForRole(rawEmail, 'student')) {
      return rawEmail;
    }
    const regNo = (user.regNo || (rawEmail.includes('@') ? rawEmail.split('@')[0] : '')).trim().toUpperCase();
    return regNo ? `${regNo}@ISBSTUDENT.COMSATS.EDU.PK` : (rawEmail || 'NULL');
  }

  if (isValidOfficialEmailForRole(rawEmail, role)) {
    return rawEmail;
  }
  return buildEmployeeOfficialEmail(user.name, user.regNo);
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
  'personalEmail',
  'regNo',
  'employeeId',
  'campusId',
  'role',
  'profileCompleted',
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
      `${rawId}@isbstudent.comsats.edu.pk`,
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
      `${userPrefix}@isbstudent.comsats.edu.pk`,
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
  CAMPUS: 'cui_portal_campus',
  TEMPLATES: 'cui_portal_templates',
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

export const downloadTemplateFile = async (tpl) => {
  if (!tpl) return;
  let fileDataUrl = tpl.fileDataUrl;
  if (!fileDataUrl && tpl.fileBlobId) {
    try {
      fileDataUrl = await blobGet(tpl.fileBlobId);
    } catch {
      fileDataUrl = null;
    }
  }
  const link = document.createElement('a');
  if (fileDataUrl) {
    link.href = fileDataUrl;
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
    if (Array.isArray(saved)) {
      return deduplicateStudents(saved.map((item) => withCampus({
        ...item,
        notifications: item.notifications || [],
      })));
    }
    return [];
  });

  const [templates, setTemplates] = useState(() => {
    const saved = readJson(STORAGE_KEYS.TEMPLATES, null);
    return Array.isArray(saved) ? saved.map((item) => withCampus(item)) : [];
  });

  const [inchargeUsers, setInchargeUsers] = useState(() =>
    asArray(readJson(STORAGE_KEYS.INCHARGE, null), INITIAL_INCHARGES).map((item) => withCampus({ ...item, role: 'incharge' }))
  );

  const [hodUsers, setHodUsers] = useState(() =>
    asArray(readJson(STORAGE_KEYS.HOD, null), INITIAL_HODS).map((item) => withCampus({ ...item, role: 'hod' }))
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = readJson(STORAGE_KEYS.CURRENT_USER, null);
    return saved ? withCampus({ ...saved, notifications: saved.notifications || [] }) : null;
  });
  const [inchargeRoster, setInchargeRoster] = useState({ students: [], supervisors: [], loaded: false });
  const [inchargeRosterLoading, setInchargeRosterLoading] = useState(false);
  const [firebaseAuthUid, setFirebaseAuthUid] = useState(() => auth.currentUser?.uid || null);

  // Ref always holds the latest state values for use in callbacks
  const latestStudents = useRef([]);
  const latestSupervisors = useRef([]);
  const latestInchargeUsers = useRef([]);
  const latestHodUsers = useRef([]);
  const latestCurrentUser = useRef(null);
  const explicitLoginInProgress = useRef(false);
  const explicitlyHandledAuthUid = useRef(null);

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
      const [hydratedStudents, hydratedSupervisors, hydratedIncharge, hydratedHod, hydratedTpls] = await Promise.all([
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

      if (cancelled) return;
      setStudents(deduplicateStudents(hashedStudents));
      setSupervisors(hashedSupervisors);
      setInchargeUsers(hashedIncharge);
      setHodUsers(hashedHod);
      setTemplates(hydratedTpls);
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

  useEffect(() => {
    if (!persistReady.current) return;
    if (currentUser) {
      persistUsers([currentUser]).then((light) => localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(light[0])));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!persistReady.current) return;
    persistTemplates(templates).then((light) => localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(light)));
  }, [templates]);

  // Keep refs in sync so onAuthStateChanged closure always sees latest state
  useEffect(() => { latestStudents.current = students; }, [students]);
  useEffect(() => { latestSupervisors.current = supervisors; }, [supervisors]);
  useEffect(() => { latestInchargeUsers.current = inchargeUsers; }, [inchargeUsers]);
  useEffect(() => { latestHodUsers.current = hodUsers; }, [hodUsers]);
  useEffect(() => { latestCurrentUser.current = currentUser; }, [currentUser]);

  // Firebase Auth State Listener — only runs on mount, uses refs for latest state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseAuthUid(fbUser?.uid || null);
      // If a currentUser is already set (login() already handled it), do nothing
      if (
        explicitLoginInProgress.current
        || (fbUser && fbUser.uid === explicitlyHandledAuthUid.current)
        || latestCurrentUser.current
      ) return;

      if (fbUser && fbUser.email) {
        // Enforce email verification on auth state restoration
        if (!fbUser.emailVerified) {
          return;
        }
        try {
          const cleanEmail = fbUser.email.toLowerCase();
          const localMatch = findAccountByPersonalEmail(cleanEmail);
          const firestoreData = await getUserRoleFromFirestore(fbUser.uid, 5000).catch(() => null);
          const role = firestoreData?.role || localMatch?.role || latestCurrentUser.current?.role;
          if (!role || !['student', 'supervisor', 'incharge', 'hod'].includes(role)) {
            return;
          }
          const roleUsers = role === 'student' ? latestStudents.current
            : role === 'supervisor' ? latestSupervisors.current
              : role === 'incharge' ? latestInchargeUsers.current
                : role === 'hod' ? latestHodUsers.current : [];
          const cachedUser = roleUsers.find((user) => user.firebaseUid === fbUser.uid || (user.personalEmail && user.personalEmail.toLowerCase() === cleanEmail)) || localMatch?.user;
          const userCampus = firestoreData?.campusId || cachedUser?.campusId || selectedCampus || 'isb';
          const resolvedRegNo = firestoreData?.regNo || cachedUser?.regNo || fbUser.email.split('@')[0].toUpperCase();
          const resolvedName = firestoreData?.name || cachedUser?.name || fbUser.displayName || fbUser.email;
          const officialEmail = formatOfficialEmailForDisplay({
            role,
            regNo: resolvedRegNo,
            name: resolvedName,
            officialEmail: firestoreData?.officialEmail || firestoreData?.email || cachedUser?.officialEmail || cachedUser?.email || '',
          });
          const restoredUser = {
            ...getAccountFields(cachedUser),
            ...getAccountFields(firestoreData),
            id: cachedUser?.id || `${role.slice(0, 3)}-${fbUser.uid}`,
            regNo: resolvedRegNo,
            name: resolvedName,
            email: officialEmail || fbUser.email,
            officialEmail: officialEmail || fbUser.email,
            personalEmail: cleanEmail,
            role,
            campusId: userCampus,
            firebaseUid: fbUser.uid,
            needsProfileCompletion: firestoreData?.profileCompleted === true
              ? false : (cachedUser?.needsProfileCompletion ?? true),
          };
          if (role === 'student') {
            setStudents((prev) => deduplicateStudents([
              restoredUser,
              ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail),
            ]));
          } else if (role === 'supervisor') {
            setSupervisors((prev) => [restoredUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail)]);
          } else if (role === 'incharge') {
            setInchargeUsers((prev) => [restoredUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail)]);
          } else if (role === 'hod') {
            setHodUsers((prev) => [restoredUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail)]);
          }
          setCurrentUser(restoredUser);
          setSelectedCampus(userCampus);
          saveUserRoleToFirestore(
            fbUser.uid,
            fbUser.email,
            role,
            getAccountFields(restoredUser)
          ).catch(() => { });
        } catch (err) {
          console.warn('Notice while restoring signed-in account:', err);
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
      setInchargeRoster({ students: [], supervisors: [], loaded: false });
      setInchargeRosterLoading(false);
      return undefined;
    }

    if (!firebaseAuthUid) {
      setInchargeRosterLoading(true);
      return undefined;
    }

    let cancelled = false;
    setInchargeRosterLoading(true);

    const loadInchargeRoster = async () => {
      try {
        const [studentsRes, supervisorsRes] = await Promise.all([
          getUsersByRoleFromFirestore('student', 10000).then(
            (list) => ({ ok: true, list: Array.isArray(list) ? list : [] }),
            (err) => {
              console.warn('Notice while fetching students from database:', err);
              return { ok: false, list: [] };
            }
          ),
          getUsersByRoleFromFirestore('supervisor', 10000).then(
            (list) => ({ ok: true, list: Array.isArray(list) ? list : [] }),
            (err) => {
              console.warn('Notice while fetching supervisors from database:', err);
              return { ok: false, list: [] };
            }
          ),
        ]);
        if (cancelled) return;

        const matchesCampus = (user) => {
          const userCampus = (user.campusId || 'isb').toLowerCase();
          const targetCampus = (inchargeCampus || 'isb').toLowerCase();
          return userCampus === targetCampus || (userCampus.startsWith('isb') && targetCampus.startsWith('isb'));
        };

        const remoteSupervisors = supervisorsRes.list.filter(matchesCampus);
        let mergedSupervisors;
        if (supervisorsRes.ok) {
          mergedSupervisors = remoteSupervisors.map((remote) => {
            const local = latestSupervisors.current.find(
              (l) => l.firebaseUid === remote.firebaseUid || (l.personalEmail && remote.personalEmail && l.personalEmail.toLowerCase() === remote.personalEmail.toLowerCase())
            );
            return {
              ...(local || {}),
              ...remote,
              id: remote.id || local?.id || `sup-${remote.firebaseUid}`,
              role: 'supervisor',
            };
          });
        } else {
          const validLocalSupervisors = latestSupervisors.current.filter((s) => s.firebaseUid || s.personalEmail);
          mergedSupervisors = validLocalSupervisors;
        }

        const supervisorByUid = new Map(
          mergedSupervisors.map((supervisor) => [supervisor.firebaseUid, supervisor])
        );
        const supervisorIds = new Set(mergedSupervisors.map((supervisor) => supervisor.id));

        const remoteStudents = studentsRes.list.filter(matchesCampus);
        let mergedStudents;
        if (studentsRes.ok) {
          // Database fetch succeeded: only show the actual student users fetched directly from database
          mergedStudents = remoteStudents.map((remote) => {
            const assignedSupervisorId = remote.assignedSupervisorUid
              ? supervisorByUid.get(remote.assignedSupervisorUid)?.id || ''
              : (remote.assignedSupervisorId || '');
            return {
              ...remote,
              id: remote.id || `std-${remote.firebaseUid}`,
              role: 'student',
              notifications: remote.notifications || [],
              documents: remote.documents || [],
              assignedSupervisorId: supervisorIds.has(assignedSupervisorId) ? assignedSupervisorId : '',
            };
          });
        } else {
          mergedStudents = [];
        }

        const deduplicated = deduplicateStudents(mergedStudents);
        setStudents(deduplicated);
        setSupervisors(mergedSupervisors);
        setInchargeRoster({ students: deduplicated, supervisors: mergedSupervisors, loaded: studentsRes.ok });
      } catch (err) {
        console.warn('Notice while loading roster:', err);
        if (!cancelled) {
          setInchargeRoster({ students: [], supervisors: latestSupervisors.current, loaded: false });
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
  }, [currentUser?.role, inchargeCampus, firebaseAuthUid]);

  useEffect(() => {
    if (!currentUser) return undefined;

    let cancelled = false;
    const campusId = currentUser.campusId || selectedCampus;
    getTemplatesFromFirestore(campusId, 1000)
      .then((loadedTemplates) => {
        if (!cancelled && Array.isArray(loadedTemplates) && loadedTemplates.length > 0) {
          setTemplates((prev) => {
            const remoteMap = new Map(loadedTemplates.map((t) => [t.id, t]));
            const merged = prev.map((local) => remoteMap.get(local.id) || local);
            loadedTemplates.forEach((remote) => {
              if (!merged.some((m) => m.id === remote.id)) merged.push(remote);
            });
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn('Notice while loading campus templates from Firebase:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.firebaseUid, currentUser?.campusId, selectedCampus]);

  const viewCampus = currentUser?.role === 'student'
    ? (currentUser.campusId || selectedCampus)
    : selectedCampus;

  const campusStudents = useMemo(() => {
    if (!currentUser) return [];
    const activeCampus = (currentUser?.campusId || selectedCampus || 'isb').toLowerCase();
    // For HOD, Incharge, and Supervisor, ONLY show registered students fetched from the database (never stale localStorage)
    const sourceStudents = currentUser.role !== 'student'
      ? (inchargeRoster.loaded ? (inchargeRoster.students || []) : [])
      : deduplicateStudents([...students, ...(inchargeRoster.students || [])]);
    return sourceStudents.filter((student) => {
      const studentCampus = (student.campusId || 'isb').toLowerCase();
      return studentCampus === activeCampus
        || (studentCampus.startsWith('isb') && activeCampus.startsWith('isb'))
        || !student.campusId;
    });
  }, [currentUser, students, inchargeRoster.students, inchargeRoster.loaded, selectedCampus]);

  const campusSupervisors = useMemo(() => {
    const activeCampus = (viewCampus || 'isb').toLowerCase();
    const pool = supervisors.length > 0 ? supervisors : (inchargeRoster.supervisors || []);
    return pool.filter((s) => {
      const sCampus = (s.campusId || 'isb').toLowerCase();
      return sCampus === activeCampus || (sCampus.startsWith('isb') && activeCampus.startsWith('isb')) || !s.campusId;
    });
  }, [supervisors, inchargeRoster.supervisors, viewCampus]);

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
    explicitLoginInProgress.current = true;
    try {
      const credential = await firebaseLogin(cleanEmail, password);
      fbUser = credential.user;
      explicitlyHandledAuthUid.current = fbUser.uid;
    } catch (err) {
      explicitLoginInProgress.current = false;
      return { success: false, error: formatFirebaseError(err) };
    }

    if (!fbUser.emailVerified) {
      await firebaseLogout();
      explicitLoginInProgress.current = false;
      return {
        success: false,
        requiresVerification: true,
        email: cleanEmail,
        password,
        error: 'Your email address is not verified yet. Please check your inbox and click the verification link before logging in.'
      };
    }

    const localMatch = findAccountByPersonalEmail(cleanEmail) || findAccount(cleanEmail);

    let firestoreData = null;
    try {
      firestoreData = await getUserRoleFromFirestore(fbUser.uid, 5000);
    } catch (err) {
      console.warn('Firestore fetch notice during login:', err);
    }

    // ── ACCOUNT EXISTENCE GATE ──
    // If no record exists in Firestore AND no match in local state, this email
    // has never registered through the portal signup flow. Reject immediately.
    if (!firestoreData && !localMatch) {
      await firebaseLogout();
      explicitLoginInProgress.current = false;
      return {
        success: false,
        error: 'No registered account found for this email address. Please create an account first by clicking "Create Account".'
      };
    }

    // Determine role and enforce cross-role checks
    const userRole = firestoreData?.role || localMatch?.role || selectedRole;
    if (userRole && userRole !== selectedRole) {
      await firebaseLogout();
      explicitLoginInProgress.current = false;
      const actualRoleName = ROLE_NAMES[userRole] || userRole;
      const attemptedRoleName = ROLE_NAMES[selectedRole] || selectedRole;
      return {
        success: false,
        error: `Cross-Role Access Denied: Your account is registered as "${actualRoleName}". You cannot log in as "${attemptedRoleName}".`
      };
    }

    // ── CAMPUS VERIFICATION CHECK: Firestore & User Record Campus Enforcement ──
    const registeredCampusId = firestoreData?.campusId || localMatch?.user?.campusId || selectedCampus;
    if (registeredCampusId && registeredCampusId !== selectedCampus) {
      await firebaseLogout();
      explicitLoginInProgress.current = false;
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
    const cachedUser = accountList.find((user) => user.firebaseUid === fbUser.uid || (user.personalEmail && user.personalEmail.toLowerCase() === cleanEmail)) || localMatch?.user;

    const resolvedRegNo = firestoreData?.regNo || cachedUser?.regNo || cleanEmail.split('@')[0].toUpperCase();
    const resolvedName = firestoreData?.name || cachedUser?.name || fbUser.displayName || cleanEmail;
    const officialEmail = formatOfficialEmailForDisplay({
      role: selectedRole,
      regNo: resolvedRegNo,
      name: resolvedName,
      officialEmail: firestoreData?.officialEmail || firestoreData?.email || cachedUser?.officialEmail || cachedUser?.email || '',
    });
    const updatedUser = {
      ...getAccountFields(cachedUser),
      ...getAccountFields(firestoreData),
      id: cachedUser?.id || `${selectedRole.slice(0, 3)}-${fbUser.uid}`,
      regNo: resolvedRegNo,
      name: resolvedName,
      email: officialEmail || cleanEmail,
      officialEmail: officialEmail || cleanEmail,
      personalEmail: cleanEmail,
      role: selectedRole,
      campusId: registeredCampusId,
      firebaseUid: fbUser.uid,
      emailVerified: true,
      needsProfileCompletion: firestoreData?.profileCompleted === true ? false : (cachedUser?.needsProfileCompletion ?? true),
    };
    if (selectedRole === 'student') {
      setStudents((prev) => deduplicateStudents([updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail)]));
    } else if (selectedRole === 'supervisor') {
      setSupervisors((prev) => [updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail)]);
    } else if (selectedRole === 'incharge') {
      setInchargeUsers((prev) => [updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail)]);
    } else {
      setHodUsers((prev) => [updatedUser, ...prev.filter((user) => user.firebaseUid !== fbUser.uid && (user.personalEmail || '').toLowerCase() !== cleanEmail)]);
    }
    setSelectedCampus(registeredCampusId);
    setCurrentUser(updatedUser);

    saveUserRoleToFirestore(
      fbUser.uid,
      cleanEmail,
      selectedRole,
      getAccountFields(updatedUser)
    ).catch(() => { });

    explicitLoginInProgress.current = false;
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
      officialEmail = `${cleanRegNo}@ISBSTUDENT.COMSATS.EDU.PK`;
    } else if (isValidOfficialEmailForRole(rawInput, userData.role)) {
      officialEmail = rawInput.toLowerCase();
      cleanRegNo = rawInput.split('@')[0].toUpperCase();
    } else {
      officialEmail = buildEmployeeOfficialEmail(userData.name, rawInput);
    }

    // ── DUPLICATE ACCOUNT CHECK across ALL roles ──
    const existing = findAccountByPersonalEmail(personalEmail) || findAccount(officialEmail) || findAccount(cleanRegNo);
    if (existing) {
      let activeInDb = false;
      try {
        activeInDb = existing.user.firebaseUid
          ? await getUserRoleFromFirestore(existing.user.firebaseUid, 2000)
          : await findUserInFirestoreByEmail(personalEmail);
      } catch (err) {
        console.warn('Notice while checking existing account in Firebase:', err);
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
      email: officialEmail,
      name: userData.name.trim(),
      campusId,
      department: userData.department || (isStudent ? 'Department of Computer Science' : null),
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

    // Keep email and officialEmail in sync
    if (sanitizedFields.officialEmail && !sanitizedFields.email) {
      sanitizedFields.email = sanitizedFields.officialEmail;
    } else if (sanitizedFields.email && !sanitizedFields.officialEmail) {
      sanitizedFields.officialEmail = sanitizedFields.email;
    }

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
    const matcher = (u) => u.id === currentUser.id || (currentUser.firebaseUid && u.firebaseUid === currentUser.firebaseUid);
    if (currentUser.role === 'student') {
      setStudents((prev) => prev.map((std) => matcher(std) ? { ...std, ...sanitizedFields, needsProfileCompletion: false } : std));
    } else if (currentUser.role === 'supervisor') {
      setSupervisors((prev) => prev.map((sup) => matcher(sup) ? { ...sup, ...sanitizedFields, needsProfileCompletion: false } : sup));
    } else if (currentUser.role === 'incharge') {
      setInchargeUsers((prev) => prev.map((u) => matcher(u) ? { ...u, ...sanitizedFields, needsProfileCompletion: false } : u));
    } else if (currentUser.role === 'hod') {
      setHodUsers((prev) => prev.map((u) => matcher(u) ? { ...u, ...sanitizedFields, needsProfileCompletion: false } : u));
    }
    showToast('Official profile details updated successfully!');
  };

  const updateUserAvatar = async (newAvatarUrl) => {
    if (!currentUser) return;

    let optimizedAvatar = newAvatarUrl;
    try {
      optimizedAvatar = await optimizeImage(newAvatarUrl, 400, 400, 0.85);
    } catch {
      optimizedAvatar = newAvatarUrl;
    }

    // Immediately update in local state so the user sees the photo updated right away
    setCurrentUser((prev) => ({ ...prev, avatar: optimizedAvatar }));
    const matcher = (u) => u.id === currentUser.id || (currentUser.firebaseUid && u.firebaseUid === currentUser.firebaseUid);
    if (currentUser.role === 'student') {
      setStudents((prev) => prev.map((std) => matcher(std) ? { ...std, avatar: optimizedAvatar } : std));
    } else if (currentUser.role === 'supervisor') {
      setSupervisors((prev) => prev.map((sup) => matcher(sup) ? { ...sup, avatar: optimizedAvatar } : sup));
    } else if (currentUser.role === 'incharge') {
      setInchargeUsers((prev) => prev.map((u) => matcher(u) ? { ...u, avatar: optimizedAvatar } : u));
    } else if (currentUser.role === 'hod') {
      setHodUsers((prev) => prev.map((u) => matcher(u) ? { ...u, avatar: optimizedAvatar } : u));
    }

    // Persist to Firebase in background if signed in via Firebase Auth
    if (currentUser.firebaseUid) {
      saveUserRoleToFirestore(
        currentUser.firebaseUid,
        currentUser.personalEmail || currentUser.email || '',
        currentUser.role,
        { avatar: optimizedAvatar }
      ).catch((err) => {
        console.warn('Firebase avatar sync notice:', err);
      });
    }

    showToast('Profile photo updated successfully!');
  };

  const persistStudentFields = async (student, fields) => {
    if (!student?.firebaseUid) return;
    try {
      await saveUserRoleToFirestore(
        student.firebaseUid,
        student.personalEmail || student.email || '',
        'student',
        fields
      );
    } catch (err) {
      console.warn('Notice while syncing student fields to Firebase:', err);
    }
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
    const student = campusStudents.find((candidate) => candidate.id === studentId)
      || students.find((candidate) => candidate.id === studentId);
    if (!student) {
      showToast('Student account could not be found.', 'error');
      return;
    }
    const availableSupervisors = (inchargeRoster.supervisors && inchargeRoster.supervisors.length > 0)
      ? inchargeRoster.supervisors
      : (campusSupervisors.length > 0 ? campusSupervisors : supervisors);
    const supervisor = supervisorId
      ? availableSupervisors.find((candidate) => candidate.id === supervisorId || candidate.firebaseUid === supervisorId)
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

    updateStudentLocally(updatedStudent);
    showToast(`Assigned supervisor ${supervisor ? supervisor.name : 'None'} to student.`);

    persistStudentFields(updatedStudent, {
      assignedSupervisorId: updatedStudent.assignedSupervisorId || null,
      assignedSupervisorUid: updatedStudent.assignedSupervisorUid,
    }).catch((err) => {
      console.warn('Notice while saving supervisor assignment:', err);
    });
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
    updateStudentLocally(updatedStudent);
    showToast('Internship document uploaded & signed successfully! Forwarded to Faculty Supervisor.');

    persistStudentFields(updatedStudent, {
      documents: updatedDocs,
      status: updatedStudent.status,
    }).catch((err) => {
      console.warn('Notice while saving student document:', err);
    });
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
    updateStudentLocally(updatedStudent);
    deleteDocumentBlobs(removed).catch(() => { });
    showToast(`Document "${removed.title}" deleted from your submissions.`);

    persistStudentFields(updatedStudent, {
      documents: updatedDocs,
      status: updatedStudent.status,
    }).catch((err) => {
      console.warn('Notice while deleting student document:', err);
    });
  };

  const signDocument = async (studentId, docId, signerRole, signatureDataUrl, note = '') => {
    const student = campusStudents.find((candidate) => candidate.id === studentId)
      || (currentUser?.id === studentId ? currentUser : null);
    if (!student) {
      showToast('Student account could not be found.', 'error');
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
    updateStudentLocally(updatedStudent);
    showToast(`Signature endorsed as ${signerRole.toUpperCase()} successfully!`);

    persistStudentFields(updatedStudent, {
      documents: updatedDocs,
      status: updatedStudent.status,
    }).catch((err) => {
      console.warn('Notice while saving document signature:', err);
    });
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

    setTemplates((prev) => [newTpl, ...prev]);
    showToast(`New official template "${newTpl.title}" published to portal.`);

    saveTemplateToFirestore(newTpl).catch((err) => {
      console.warn('Notice while saving template to Firebase:', err);
    });
  };

  const deleteTemplate = async (templateId) => {
    const removed = templates.find((t) => t.id === templateId);
    if (!removed) return;
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    deleteTemplateBlobs(removed).catch(() => { });
    deleteTemplateFromFirestore(removed).catch((err) => {
      console.warn('Notice while deleting template from Firebase:', err);
    });
    showToast(`Official template "${removed.title}" deleted from the repository.`);
  };

  const getSupervisorForStudent = (student) => {
    if (!student || (!student.assignedSupervisorId && !student.assignedSupervisorUid)) return null;
    const availableSupervisors = (inchargeRoster.supervisors && inchargeRoster.supervisors.length > 0)
      ? inchargeRoster.supervisors
      : (campusSupervisors.length > 0 ? campusSupervisors : supervisors);
    return availableSupervisors.find((s) =>
      (student.assignedSupervisorId && (s.id === student.assignedSupervisorId || s.firebaseUid === student.assignedSupervisorId)) ||
      (student.assignedSupervisorUid && s.firebaseUid === student.assignedSupervisorUid)
    ) || null;
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
        supervisors: currentUser ? (campusSupervisors.length > 0 ? campusSupervisors : inchargeRoster.supervisors) : [],
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
