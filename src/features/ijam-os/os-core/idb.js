import { STORAGE_DB_NAME, STORAGE_DB_VERSION, STORAGE_STORES } from './constants.js';

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

export async function openWorkspaceDatabase() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this runtime.');
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_DB_NAME, STORAGE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORAGE_STORES.entries)) {
        const entryStore = db.createObjectStore(STORAGE_STORES.entries, { keyPath: 'path' });
        entryStore.createIndex('parentPath', 'parentPath', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORAGE_STORES.meta)) {
        db.createObjectStore(STORAGE_STORES.meta, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open workspace database.'));
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openWorkspaceDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    Promise.resolve(callback(store, transaction))
      .then((result) => {
        transaction.oncomplete = () => {
          db.close();
          resolve(result);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error || new Error('IndexedDB transaction failed.'));
        };
      })
      .catch((error) => {
        db.close();
        reject(error);
      });
  });
}

export function getEntry(path) {
  return withStore(STORAGE_STORES.entries, 'readonly', (store) => requestToPromise(store.get(path)));
}

export function putEntry(entry) {
  return withStore(STORAGE_STORES.entries, 'readwrite', (store) => requestToPromise(store.put(entry)));
}

export function putEntries(entries) {
  return withStore(STORAGE_STORES.entries, 'readwrite', async (store) => {
    for (const entry of entries) {
      await requestToPromise(store.put(entry));
    }
  });
}

export function deleteEntry(path) {
  return withStore(STORAGE_STORES.entries, 'readwrite', (store) => requestToPromise(store.delete(path)));
}

export function getAllEntries() {
  return withStore(STORAGE_STORES.entries, 'readonly', (store) => requestToPromise(store.getAll()));
}

export function getMeta(key) {
  return withStore(STORAGE_STORES.meta, 'readonly', (store) => requestToPromise(store.get(key)));
}

export function setMeta(key, value) {
  return withStore(STORAGE_STORES.meta, 'readwrite', (store) => requestToPromise(store.put({ key, value })));
}
