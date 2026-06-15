/**
 * Minimal promise wrapper around IndexedDB (system-design §3.4, §4.3). No
 * dependency — keeps the bundle lean. Async by design so writes never jank the
 * RSVP/pointer render loop.
 *
 * db: speed-reading-trainer
 *  ├─ profiles        keyPath username
 *  ├─ sessions        keyPath sessionId, index by-username
 *  ├─ examRuns        keyPath examRunId, index by-username
 *  └─ progressIndex   keyPath username   { sessionIds[], examRunIds[] }
 */
export const DB_NAME = "speed-reading-trainer";
export const DB_VERSION = 1;

export const STORE = {
  profiles: "profiles",
  sessions: "sessions",
  examRuns: "examRuns",
  progressIndex: "progressIndex",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE.profiles)) {
        db.createObjectStore(STORE.profiles, { keyPath: "username" });
      }
      if (!db.objectStoreNames.contains(STORE.sessions)) {
        const s = db.createObjectStore(STORE.sessions, { keyPath: "sessionId" });
        s.createIndex("by-username", "username", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE.examRuns)) {
        const s = db.createObjectStore(STORE.examRuns, { keyPath: "examRunId" });
        s.createIndex("by-username", "username", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE.progressIndex)) {
        db.createObjectStore(STORE.progressIndex, { keyPath: "username" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** For tests: drop the cached connection so a fresh DB can be opened. */
export function _resetConnectionForTests(): void {
  dbPromise = null;
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put<T>(store: string, value: T): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDb();
  return promisify<T>(db.transaction(store, "readonly").objectStore(store).get(key));
}

export async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDb();
  return promisify<T[]>(
    db.transaction(store, "readonly").objectStore(store).getAll(),
  );
}

export async function getAllByIndex<T>(
  store: string,
  index: string,
  key: IDBValidKey,
): Promise<T[]> {
  const db = await openDb();
  return promisify<T[]>(
    db.transaction(store, "readonly").objectStore(store).index(index).getAll(key),
  );
}

/** Write across multiple stores atomically (one transaction). */
export async function writeMany(
  stores: string[],
  fn: (tx: IDBTransaction) => void,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(stores, "readwrite");
    fn(tx);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
