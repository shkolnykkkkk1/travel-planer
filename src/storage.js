// ===== КОМПАКТНИЙ LOCALSTORAGE МОДУЛЬ =====
// Пункт 10: localStorage та кешування даних

const STORAGE = {
    ROUTES: 'travel_routes',
    NOTES: 'travel_notes',
    CACHE: 'travel_cache',
    PAGINATION: 'travel_pagination'
};

// ===== ОСНОВНІ ФУНКЦІЇ =====
export function saveRoutes(routes) {
    try {
        localStorage.setItem(STORAGE.ROUTES, JSON.stringify(routes));
        return true;
    } catch (error) {
        console.error('[Storage] Помилка збереження маршрутів:', error);
        return false;
    }
}

export function loadRoutes() {
    try {
        const data = localStorage.getItem(STORAGE.ROUTES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[Storage] Помилка завантаження маршрутів:', error);
        return [];
    }
}

export function saveNotes(notes) {
    try {
        localStorage.setItem(STORAGE.NOTES, JSON.stringify(notes));
        return true;
    } catch (error) {
        console.error('[Storage] Помилка збереження нотаток:', error);
        return false;
    }
}

export function loadNotes() {
    try {
        const data = localStorage.getItem(STORAGE.NOTES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[Storage] Помилка завантаження нотаток:', error);
        return [];
    }
}

// ===== КЕШУВАННЯ ДАНИХ (Пункт 10) =====
export function saveToCache(key, data, ttl = 3600000) { // 1 година за замовчуванням
    try {
        const cache = loadCache();
        cache[key] = {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };
        localStorage.setItem(STORAGE.CACHE, JSON.stringify(cache));
        return true;
    } catch (error) {
        console.error('[Storage] Помилка кешування:', error);
        return false;
    }
}

export function loadFromCache(key) {
    try {
        const cache = JSON.parse(localStorage.getItem(STORAGE.CACHE) || '{}');
        const item = cache[key];
        
        if (!item) return null;
        
        // Перевірка на застарілість
        if (Date.now() - item.timestamp > item.ttl) {
            delete cache[key];
            localStorage.setItem(STORAGE.CACHE, JSON.stringify(cache));
            return null;
        }
        
        return item.data;
    } catch (error) {
        console.error('[Storage] Помилка завантаження з кешу:', error);
        return null;
    }
}

// Допоміжна функція для завантаження всього кешу
function loadCache() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE.CACHE) || '{}');
    } catch {
        return {};
    }
}

// ===== ПАГІНАЦІЯ (Пункт 9) =====
export function saveSettings(state) {
    try {
        localStorage.setItem(STORAGE.PAGINATION, JSON.stringify(state));
        return true;
    } catch (error) {
        console.error('[Storage] Помилка пагінації:', error);
        return false;
    }
}

export function loadSettings() {
    try {
        const data = localStorage.getItem(STORAGE.PAGINATION);
        return data ? JSON.parse(data) : {
            currentPage: 1,
            pageSize: 5,
            totalItems: 0
        };
    } catch (error) {
        console.error('[Storage] Помилка завантаження пагінації:', error);
        return {
            currentPage: 1,
            pageSize: 5,
            totalItems: 0
        };
    }
}

// ===== УТІЛІТИ =====
export function clearStorage() {
    try {
        Object.values(STORAGE).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    } catch (error) {
        console.error('[Storage] Помилка очищення:', error);
        return false;
    }
}

export function isLocalStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.error('[Storage] localStorage недоступний:', error);
        return false;
    }
}

// Статистика сховища (для налагодження - Пункт 11)
export function getStorageStats() {
    try {
        let totalSize = 0;
        let itemsCount = 0;
        
        for (const key in STORAGE) {
            const value = localStorage.getItem(STORAGE[key]);
            if (value) {
                totalSize += value.length * 2; // Приблизний розмір в байтах
                itemsCount++;
            }
        }
        
        return {
            items: itemsCount,
            sizeKB: (totalSize / 1024).toFixed(2),
            routes: loadRoutes().length,
            notes: loadNotes().length,
            cacheKeys: Object.keys(loadCache()).length
        };
    } catch (error) {
        console.error('[Storage] Помилка статистики:', error);
        return { items: 0, sizeKB: '0.00' };
    }
}

// Експорт всіх функцій
export default {
    saveRoutes,
    loadRoutes,
    saveNotes,
    loadNotes,
    saveToCache,
    loadFromCache,
    saveSettings,
    loadSettings,
    clearStorage,
    isLocalStorageAvailable,
    getStorageStats
};