// Storage keys and version management
export const STORAGE_VERSION = 1;
export const APP_PREFIX = 'vivaa';

export const STORAGE_KEYS = {
  VERSION: `${APP_PREFIX}:version`,
  CURRENT_CLASS_ID: `${APP_PREFIX}:currentClassId`,
  CLASSROOMS: `${APP_PREFIX}:classrooms`,
  STUDENTS: `${APP_PREFIX}:students`,
  JOBS: `${APP_PREFIX}:jobs`,
  ITEMS: `${APP_PREFIX}:items`,
  TRANSACTIONS: `${APP_PREFIX}:transactions`,
  APPROVALS: `${APP_PREFIX}:approvals`,
  SAVINGS_ACCOUNTS: `${APP_PREFIX}:savingsAccounts`,
  STOCKS: `${APP_PREFIX}:stocks`,
  STOCK_TRANSACTIONS: `${APP_PREFIX}:stockTransactions`,
  STOCK_PORTFOLIOS: `${APP_PREFIX}:stockPortfolios`,
  ACHIEVEMENTS: `${APP_PREFIX}:achievements`,
  STUDENT_ACHIEVEMENTS: `${APP_PREFIX}:studentAchievements`,
  MARKET_NEWS: `${APP_PREFIX}:marketNews`,
  MARKET_INDICATORS: `${APP_PREFIX}:marketIndicators`,
  STOCK_PRICE_HISTORY: `${APP_PREFIX}:stockPriceHistory`,
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Migration functions
export const checkStorageVersion = (currentVersion: number | null): boolean => {
  return currentVersion === STORAGE_VERSION;
};

export const migrateStorage = (fromVersion: number | null, toVersion: number): void => {
  console.log(`Migrating storage from version ${fromVersion} to ${toVersion}`);

  // Version 1 migration (initial setup)
  if (fromVersion === null) {
    console.log('Initializing storage for first time');
    // No migration needed for first time setup
    return;
  }

  // Future migrations will be added here
  // if (fromVersion === 1 && toVersion === 2) {
  //   // Add migration logic here
  // }
};