
export type LocalUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

const DB_NAME = "onebiz_local_db";
const DB_VERSION = 1;
const STORE_NAME = "users";
const SESSION_KEY = "onebiz_current_user";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        store.createIndex("email", "email", { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();

  return crypto.subtle
    .importKey("raw", encoder.encode(password), "PBKDF2", false, [
      "deriveBits",
    ])
    .then((key) =>
      crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: encoder.encode(salt),
          iterations: 100000,
          hash: "SHA-256",
        },
        key,
        256
      )
    )
    .then((bits) =>
      Array.from(new Uint8Array(bits))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
    );
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<LocalUser> {
  const db = await openDatabase();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await new Promise<LocalUser | undefined>(
      (resolve, reject) => {
        const request = db
          .transaction(STORE_NAME, "readonly")
          .objectStore(STORE_NAME)
          .index("email")
          .get(normalizedEmail);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);

    const user: LocalUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).add(user);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    return user;
  } finally {
    db.close();
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<LocalUser> {
  const db = await openDatabase();
  const normalizedEmail = email.trim().toLowerCase();

  let user: LocalUser | undefined;

  try {
    user = await new Promise<LocalUser | undefined>(
      (resolve, reject) => {
        const request = db
          .transaction(STORE_NAME, "readonly")
          .objectStore(STORE_NAME)
          .index("email")
          .get(normalizedEmail);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );
  } finally {
    db.close();
  }

  if (!user) {
    throw new Error("No account found with this email.");
  }

  const enteredHash = await hashPassword(password, user.salt);

  if (enteredHash !== user.passwordHash) {
    throw new Error("Incorrect password.");
  }

  setCurrentUser(user);

  // Activate this user's own business profile.
  const { getUserBusinessProfile, activateUserBusinessProfile } =
    await import("@/lib/business-profile");

  const profile = getUserBusinessProfile(user.id);

  if (profile) {
    activateUserBusinessProfile(profile);
  }

  return user;
}

export function setCurrentUser(user: LocalUser) {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  );
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function logoutUser() {
  if (typeof window === "undefined") return;

  // Only clear the login session.
  // Never delete the user's business profile or products.
  sessionStorage.removeItem(SESSION_KEY);
}
