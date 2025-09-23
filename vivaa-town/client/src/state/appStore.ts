import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { storageAdapter } from '../storage/adapter';
import { STORAGE_KEYS, STORAGE_VERSION, checkStorageVersion, migrateStorage } from '../storage/keys';
import { hasLegacyData, migrateLegacyData, cleanupLegacyData } from '../utils/migration';
import type { ID } from '../schemas';

interface AppState {
  // App state
  isInitialized: boolean;
  currentClassId: ID | null;

  // Actions
  initialize: () => void;
  setCurrentClassId: (classId: ID | null) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isInitialized: false,
    currentClassId: null,

    // Initialize app (check version, migrate if needed)
    initialize: () => {
      try {
        console.log('Initializing app...');

        // Check for legacy data first
        if (hasLegacyData()) {
          console.log('Legacy data detected, migrating...');
          migrateLegacyData();
          cleanupLegacyData();
        }

        // Check storage version
        const currentVersion = storageAdapter.get<number>(STORAGE_KEYS.VERSION);

        if (!checkStorageVersion(currentVersion)) {
          console.log('Storage version mismatch, migrating...');
          migrateStorage(currentVersion, STORAGE_VERSION);
          storageAdapter.set(STORAGE_KEYS.VERSION, STORAGE_VERSION);
        }

        // Load current class ID
        const currentClassId = storageAdapter.get<ID>(STORAGE_KEYS.CURRENT_CLASS_ID);

        set({
          isInitialized: true,
          currentClassId,
        });

        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        set({ isInitialized: true }); // Set to true anyway to prevent blocking
      }
    },

    // Set current class ID
    setCurrentClassId: (classId) => {
      set({ currentClassId: classId });

      if (classId) {
        storageAdapter.set(STORAGE_KEYS.CURRENT_CLASS_ID, classId);
      } else {
        storageAdapter.remove(STORAGE_KEYS.CURRENT_CLASS_ID);
      }
    },

    // Reset entire app (clear all data)
    resetApp: () => {
      try {
        const keys = storageAdapter.getAllKeys();
        keys.forEach(key => {
          if (key.startsWith('vivaa:')) {
            storageAdapter.remove(key);
          }
        });

        set({
          isInitialized: false,
          currentClassId: null,
        });

        // Re-initialize
        get().initialize();
      } catch (error) {
        console.error('Failed to reset app:', error);
      }
    },
  }))
);

// Auto-persist current class ID changes
useAppStore.subscribe(
  (state) => state.currentClassId,
  (currentClassId) => {
    if (currentClassId) {
      storageAdapter.set(STORAGE_KEYS.CURRENT_CLASS_ID, currentClassId);
    } else {
      storageAdapter.remove(STORAGE_KEYS.CURRENT_CLASS_ID);
    }
  }
);