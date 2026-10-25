const DB_NAME = 'cui_internship_portal';
const STORE = 'blobs';
const VERSION = 1;

const DOC_FIELDS = [
  ['fileDataUrl', 'fileBlobId'],
  ['studentSignature', 'studentSigId'],
  ['supervisorSignature', 'supervisorSigId'],
  ['inchargeSignature', 'inchargeSigId'],
  ['hodSignature', 'hodSigId'],
];

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function blobSet(key, value) {
  if (!key || value == null) return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function blobGet(key) {
  if (!key) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function blobDel(key) {
  if (!key) return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function isHeavy(value) {
  return typeof value === 'string' && (value.startsWith('data:') || value.startsWith('blob:'));
}

async function persistAvatar(entity) {
  if (!entity?.id || !isHeavy(entity.avatar)) return entity.avatarId || `avatar:${entity.id}`;
  const id = entity.avatarId || `avatar:${entity.id}`;
  await blobSet(id, entity.avatar);
  return id;
}

async function persistDoc(doc) {
  const next = { ...doc };
  for (const [field, idField] of DOC_FIELDS) {
    if (isHeavy(doc[field])) {
      const id = doc[idField] || `${idField}:${doc.id}`;
      await blobSet(id, doc[field]);
      next[idField] = id;
    }
    delete next[field];
  }
  return next;
}

export async function persistStudents(students) {
  return Promise.all((students || []).map(async (student) => {
    const avatarId = await persistAvatar(student);
    const documents = await Promise.all((student.documents || []).map(persistDoc));
    const { password: _password, ...safeStudent } = student;
    return {
      ...safeStudent,
      avatar: isHeavy(student.avatar) ? undefined : student.avatar,
      avatarId,
      documents,
    };
  }));
}

export async function persistUsers(users) {
  return Promise.all((users || []).map(async (user) => {
    const avatarId = await persistAvatar(user);
    const signatureId = isHeavy(user.signature)
      ? (user.signatureId || `signature:${user.id}`)
      : user.signatureId;
    if (isHeavy(user.signature)) await blobSet(signatureId, user.signature);
    const { password: _password, ...safeUser } = user;
    return {
      ...safeUser,
      avatar: isHeavy(user.avatar) ? undefined : user.avatar,
      signature: isHeavy(user.signature) ? undefined : user.signature,
      avatarId,
      signatureId,
    };
  }));
}

export async function hydrateStudents(students) {
  return Promise.all((students || []).map(async (student) => {
    const avatar = (await blobGet(student.avatarId)) || student.avatar || null;
    const documents = await Promise.all((student.documents || []).map(async (doc) => {
      const hydrated = { ...doc };
      for (const [field, idField] of DOC_FIELDS) {
        hydrated[field] = (await blobGet(doc[idField])) || doc[field] || null;
      }
      return hydrated;
    }));
    return { ...student, avatar, documents };
  }));
}

export async function hydrateUsers(users) {
  return Promise.all((users || []).map(async (user) => ({
    ...user,
    avatar: (await blobGet(user.avatarId)) || user.avatar || null,
    signature: (await blobGet(user.signatureId)) || user.signature || null,
  })));
}

export async function deleteDocumentBlobs(doc) {
  if (!doc) return;
  for (const [, idField] of DOC_FIELDS) {
    await blobDel(doc[idField]);
  }
}

export async function persistTemplates(templates) {
  return Promise.all((templates || []).map(async (tpl) => {
    let fileBlobId = tpl.fileBlobId;
    if (isHeavy(tpl.fileDataUrl)) {
      fileBlobId = fileBlobId || `template_file:${tpl.id}`;
      await blobSet(fileBlobId, tpl.fileDataUrl);
    }
    return {
      ...tpl,
      fileDataUrl: isHeavy(tpl.fileDataUrl) ? undefined : tpl.fileDataUrl,
      fileBlobId,
    };
  }));
}

export async function hydrateTemplates(templates) {
  return Promise.all((templates || []).map(async (tpl) => {
    const fileDataUrl = (tpl.fileBlobId ? await blobGet(tpl.fileBlobId) : null) || tpl.fileDataUrl || null;
    return { ...tpl, fileDataUrl };
  }));
}

export async function deleteTemplateBlobs(tpl) {
  if (tpl?.fileBlobId) {
    await blobDel(tpl.fileBlobId);
  }
}

export function optimizeImage(dataUrl, maxWidth = 400, maxHeight = 400, quality = 0.85) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    if (typeof window === 'undefined') return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

