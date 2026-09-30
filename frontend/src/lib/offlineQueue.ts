import { openDB } from 'idb';

const DB_NAME = 'jansetu-offline-db';
const STORE_NAME = 'request-queue';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function enqueueRequest(endpoint: string, options: RequestInit) {
  const db = await initDB();
  
  // Convert FormData to something we can store, or serialize if needed.
  // For simplicity, assuming options.body is mostly JSON or can be stringified.
  // Real implementation for FormData would require reading all entries.
  let body = options.body;
  let isFormData = false;
  
  if (body instanceof FormData) {
    isFormData = true;
    const entries: Record<string, string | File> = {};
    for (const [key, value] of body.entries()) {
      entries[key] = value;
    }
    body = JSON.stringify(entries); // Note: File objects need special handling (e.g. converting to Blob/ArrayBuffer).
    // In a real PWA you'd want to store files differently, but for this demo, we'll keep it simple or assume it's just JSON.
  }

  await db.add(STORE_NAME, {
    endpoint,
    options: {
      ...options,
      body,
    },
    isFormData,
    timestamp: Date.now(),
  });
}

export async function getQueue() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function removeFromQueue(id: number) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}
