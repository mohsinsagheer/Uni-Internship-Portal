const ITERATIONS = 100000;

const bufToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64ToBuf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export const isHashedPassword = (value) =>
  Boolean(value && typeof value === 'object' && value.algo === 'PBKDF2' && value.hash && value.salt);

async function derive(plain, salt, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256
  );
}

export async function hashPassword(plain) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(plain, salt, ITERATIONS);
  return { algo: 'PBKDF2', iterations: ITERATIONS, salt: bufToB64(salt), hash: bufToB64(hash) };
}

export async function verifyPasswordHash(plain, stored) {
  if (!plain || !stored) return false;
  if (!isHashedPassword(stored)) return false;
  const hash = await derive(plain, b64ToBuf(stored.salt), stored.iterations || ITERATIONS);
  return bufToB64(hash) === stored.hash;
}

export async function ensureHashedPassword(user) {
  if (!user?.password) return user;
  if (isHashedPassword(user.password)) return user;
  if (typeof user.password === 'string') {
    return { ...user, password: await hashPassword(user.password) };
  }
  return user;
}
