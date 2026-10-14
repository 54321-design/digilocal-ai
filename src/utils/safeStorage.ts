import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SafeStorage Utility
 * Prevents "database or disk is full" (SQLiteFullException code 13)
 * by managing storage size, pruning expired caches, and auto-recovering
 * if local SQLite limits are approached.
 */

const MAX_KEY_SIZE_BYTES = 500 * 1024; // 500 KB per key cap
const CACHE_PREFIX = '@gateway_cache_';

export const SafeStorage = {
  /**
   * Safely writes a key-value pair to AsyncStorage with auto-recovery
   * if SQLite runs out of space.
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      // 1. Guard against single massive payloads that breach SQLite cursor window (2MB)
      let sanitizedValue = value;
      if (value.length > MAX_KEY_SIZE_BYTES) {
        // If it's a huge JSON array (e.g. posts or logs), trim older entries
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 20) {
            sanitizedValue = JSON.stringify(parsed.slice(0, 20));
          }
        } catch {
          // not JSON, proceed
        }
      }

      await AsyncStorage.setItem(key, sanitizedValue);
      return true;
    } catch (err: any) {
      const errMsg = (err?.message || '').toLowerCase();
      const isDiskFull =
        errMsg.includes('full') ||
        errMsg.includes('disk') ||
        errMsg.includes('sqlite_full') ||
        errMsg.includes('cursorwindow') ||
        errMsg.includes('row too big');

      if (isDiskFull) {
        console.warn(`[SafeStorage] SQLite disk full detected while writing "${key}". Initiating emergency cleanup...`);
        // Emergency purge of temporary and cache keys
        await this.emergencyPurge();

        try {
          // Retry write after cleanup
          await AsyncStorage.setItem(key, value);
          console.log(`[SafeStorage] Successfully wrote "${key}" after emergency cleanup.`);
          return true;
        } catch (retryErr) {
          console.error(`[SafeStorage] Failed write even after emergency cleanup for "${key}":`, retryErr);
          return false;
        }
      }

      console.error(`[SafeStorage] Error writing "${key}":`, err);
      return false;
    }
  },

  /**
   * Safely reads a key-value pair from AsyncStorage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.warn(`[SafeStorage] Error reading "${key}":`, err);
      return null;
    }
  },

  /**
   * Safely removes a key
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  /**
   * Emergency Purge:
   * Cleans all expired gateway caches, telemetry records, and temporary data
   * to free up SQLite space immediately.
   */
  async emergencyPurge(): Promise<number> {
    let freedKeys = 0;
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove: string[] = [];

      for (const k of allKeys) {
        // 1. Remove all gateway API caches
        if (k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
          continue;
        }

        // 2. Remove old telemetry records if too large
        if (k.includes('telemetry') || k.includes('mutation_queue')) {
          keysToRemove.push(k);
          continue;
        }

        // 3. Remove old offline reviews meta or old audits
        if (k.includes('seo_audit') || k.includes('reviews_v3') || k.includes('copilot_')) {
          keysToRemove.push(k);
          continue;
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        freedKeys = keysToRemove.length;
        console.log(`[SafeStorage] Emergency purge removed ${freedKeys} cached keys.`);
      }
    } catch (e) {
      console.error('[SafeStorage] Emergency purge error:', e);
    }
    return freedKeys;
  },

  /**
   * Startup Garbage Collection:
   * Removes expired gateway caches and optimizes storage on app start.
   */
  async pruneExpiredCaches(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const gatewayKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
      const now = Date.now();
      const expired: string[] = [];

      for (const k of gatewayKeys) {
        try {
          const raw = await AsyncStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.expiry && parsed.expiry < now) {
              expired.push(k);
            }
          } else {
            expired.push(k);
          }
        } catch {
          expired.push(k);
        }
      }

      if (expired.length > 0) {
        await AsyncStorage.multiRemove(expired);
        console.log(`[SafeStorage] Pruned ${expired.length} expired cache keys.`);
      }
    } catch (err) {
      console.warn('[SafeStorage] Cache pruning error:', err);
    }
  },

  /**
   * Complete reset of local storage if user requests it or storage gets corrupted
   */
  async clearAllCachesAndPosts(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      // Keep auth and location preferences, remove all cached data and posts
      const toRemove = allKeys.filter(
        (k) =>
          !k.includes('auth') &&
          !k.includes('user') &&
          !k.includes('selected_location') &&
          !k.includes('business_id')
      );
      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
        console.log(`[SafeStorage] Cleared ${toRemove.length} non-essential storage keys.`);
      }
    } catch (e) {
      console.error('[SafeStorage] Clear error:', e);
    }
  },
};
