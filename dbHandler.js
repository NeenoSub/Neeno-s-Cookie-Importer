const DB_CONFIG = {
  name: 'CookieImporterDB',
  version: 1,
  storeName: 'snapshots'
};

class CookieDB {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject("Could not open database");
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        if (!this.db.objectStoreNames.contains(DB_CONFIG.storeName)) {
          const store = this.db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this.migrateFromLocalStorage();
        resolve(this.db);
      };
    });
  }

  async migrateFromLocalStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['cookieSnapshots'], async (result) => {
        const oldSnapshots = result.cookieSnapshots;

        if (!oldSnapshots || !Array.isArray(oldSnapshots) || oldSnapshots.length === 0) {
          resolve(false);
          return;
        }

        try {
          const transaction = this.db.transaction([DB_CONFIG.storeName], 'readwrite');
          const store = transaction.objectStore(DB_CONFIG.storeName);

          for (const snapshot of oldSnapshots) {
            if (!snapshot.id) snapshot.id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
            store.put(snapshot);
          }

          transaction.oncomplete = () => {
            chrome.storage.local.remove(['cookieSnapshots']);
            resolve(true);
          };

          transaction.onerror = (e) => resolve(false);

        } catch (e) {
          resolve(false);
        }
      });
    });
  }

  async getDb() {
    await this.initPromise;
    return this.db;
  }

  // --- CRUD Operations ---

  async addSnapshot(snapshot) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      const request = store.add(snapshot);

      request.onsuccess = () => resolve(snapshot);
      request.onerror = () => reject(request.error);
    });
  }

  async getSnapshotList() {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      const snapshots = [];
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const val = cursor.value;
          snapshots.push({
            id: val.id,
            name: val.name,
            timestamp: val.timestamp,
            count: val.count || (val.cookies ? val.cookies.length : 0),
            size: val.size || 0
          });
          cursor.continue();
        } else {
          resolve(snapshots);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getSnapshotDetails(id) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) resolve(request.result);
        else reject(new Error("Snapshot not found"));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Stream directly to a JSON string via cursor to prevent RAM spike.
   * Uses incremental string concatenation instead of array + join.
   */
  async getAllSnapshotsFull() {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      const request = store.openCursor();

      let jsonString = '[';
      let first = true;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (!first) jsonString += ',';
          jsonString += JSON.stringify(cursor.value);
          first = false;
          cursor.continue();
        } else {
          jsonString += ']';
          resolve(jsonString);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSnapshot(id) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSnapshot(snapshot) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(DB_CONFIG.storeName);
      const request = store.put(snapshot);

      request.onsuccess = () => resolve(snapshot);
      request.onerror = () => reject(request.error);
    });
  }
}

const cookieDB = new CookieDB();