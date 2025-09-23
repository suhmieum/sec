import { storageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';
import { getCurrentISOString } from '../utils';
import type { Classroom, Student, Job } from '../schemas';

// Legacy type definitions (based on existing localStorage utils)
interface LegacyClass {
  id: string;
  name: string;
  currencyUnit: string;
  treasury: number;
  donation: number;
}

interface LegacyStudent {
  id: string;
  classId: string;
  name: string;
  balance: number;
  totalIncome?: number;
  totalSpending?: number;
}

interface LegacyJob {
  id: string;
  classId: string;
  title: string;
  description?: string;
  salary: number;
  maxPositions: number;
  currentPositions: number;
}

// Migration functions
export const migrateLegacyData = () => {
  console.log('Starting legacy data migration...');

  try {
    // Migrate classes
    const legacyClasses = getLegacyData<LegacyClass[]>('vivaatown_classes') || [];
    const newClassrooms: Classroom[] = legacyClasses.map(legacyClass => ({
      id: legacyClass.id,
      name: legacyClass.name,
      currencyUnit: legacyClass.currencyUnit || '원',
      treasury: legacyClass.treasury || 0,
      donation: legacyClass.donation || 0,
      createdAt: getCurrentISOString(),
      settings: {
        taxRate: 10,
        payCycle: 'weekly' as const,
        approvalRequired: true,
        salaryBase: 1000,
      },
    }));

    if (newClassrooms.length > 0) {
      storageAdapter.set(STORAGE_KEYS.CLASSROOMS, newClassrooms);
      console.log(`Migrated ${newClassrooms.length} classrooms`);
    }

    // Migrate students
    const legacyStudents = getLegacyData<LegacyStudent[]>('vivaatown_students') || [];
    const newStudents: Student[] = legacyStudents.map(legacyStudent => ({
      id: legacyStudent.id,
      classroomId: legacyStudent.classId,
      name: legacyStudent.name,
      pin4: generatePin(),
      balance: legacyStudent.balance || 0,
      active: true,
      createdAt: getCurrentISOString(),
    }));

    if (newStudents.length > 0) {
      storageAdapter.set(STORAGE_KEYS.STUDENTS, newStudents);
      console.log(`Migrated ${newStudents.length} students`);
    }

    // Migrate jobs
    const legacyJobs = getLegacyData<LegacyJob[]>('vivaatown_jobs') || [];
    const newJobs: Job[] = legacyJobs.map(legacyJob => ({
      id: legacyJob.id,
      classroomId: legacyJob.classId,
      title: legacyJob.title,
      description: legacyJob.description,
      salary: legacyJob.salary,
      maxPositions: legacyJob.maxPositions,
      currentPositions: legacyJob.currentPositions || 0,
    }));

    if (newJobs.length > 0) {
      storageAdapter.set(STORAGE_KEYS.JOBS, newJobs);
      console.log(`Migrated ${newJobs.length} jobs`);
    }

    // Migrate current class ID
    const currentClassId = getLegacyData<string>('vivaatown_current_class');
    if (currentClassId) {
      storageAdapter.set(STORAGE_KEYS.CURRENT_CLASS_ID, currentClassId);
      console.log('Migrated current class ID');
    }

    console.log('Legacy data migration completed successfully');
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }
};

// Helper function to get legacy data
const getLegacyData = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// Helper function to generate 4-digit PIN
const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Check if legacy data exists
export const hasLegacyData = (): boolean => {
  const legacyKeys = [
    'vivaatown_classes',
    'vivaatown_students',
    'vivaatown_jobs',
    'vivaatown_current_class'
  ];

  return legacyKeys.some(key => localStorage.getItem(key) !== null);
};

// Clean up legacy data after successful migration
export const cleanupLegacyData = () => {
  const legacyKeys = [
    'vivaatown_classes',
    'vivaatown_students',
    'vivaatown_jobs',
    'vivaatown_transactions',
    'vivaatown_items',
    'vivaatown_current_class'
  ];

  legacyKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('Legacy data cleanup completed');
};