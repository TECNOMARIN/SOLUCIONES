export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ErpCacheDB', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('NetworkCache')) {
                db.createObjectStore('NetworkCache');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const setCache = async (key, value) => {
    try {
        const db = await initDB();
        const tx = db.transaction('NetworkCache', 'readwrite');
        tx.objectStore('NetworkCache').put(value, key);
        return tx.complete;
    } catch (e) {
        console.warn('IDB setCache error', e);
    }
};

export const getCache = async (key) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('NetworkCache', 'readonly');
            const request = tx.objectStore('NetworkCache').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn('IDB getCache error', e);
        return null;
    }
};
