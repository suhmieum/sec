import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { storageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId, getCurrentISOString } from '../utils';
import {
  ClassroomSchema,
  type Classroom,
  type ClassroomSettings,
  type ID
} from '../schemas';

interface ClassroomState {
  // State
  classrooms: Classroom[];
  isLoading: boolean;

  // Actions
  loadClassrooms: () => void;
  createClassroom: (data: { name: string; currencyUnit?: string; treasury?: number; donation?: number; settings?: Partial<ClassroomSettings> }) => Classroom;
  updateClassroom: (id: ID, data: Partial<Omit<Classroom, 'id' | 'createdAt'>>) => void;
  deleteClassroom: (id: ID) => void;
  getClassroom: (id: ID) => Classroom | undefined;

  // Treasury operations
  updateTreasury: (classroomId: ID, amount: number) => void;
  updateDonation: (classroomId: ID, amount: number) => void;
}

export const useClassroomStore = create<ClassroomState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    classrooms: [],
    isLoading: false,

    // Load classrooms from storage
    loadClassrooms: () => {
      try {
        set({ isLoading: true });
        const stored = storageAdapter.get<Classroom[]>(STORAGE_KEYS.CLASSROOMS) ?? [];

        // Validate each classroom
        const validClassrooms = stored
          .map(classroom => {
            try {
              return ClassroomSchema.parse(classroom);
            } catch (error) {
              console.warn('Invalid classroom data:', classroom, error);
              return null;
            }
          })
          .filter((classroom): classroom is Classroom => classroom !== null);

        set({ classrooms: validClassrooms, isLoading: false });
      } catch (error) {
        console.error('Failed to load classrooms:', error);
        set({ classrooms: [], isLoading: false });
      }
    },

    // Create new classroom
    createClassroom: (data) => {
      const newClassroom: Classroom = {
        id: generateId(),
        name: data.name,
        currencyUnit: data.currencyUnit ?? '원',
        treasury: data.treasury ?? 500000,
        donation: data.donation ?? 50000,
        createdAt: getCurrentISOString(),
        settings: {
          taxRate: data.settings?.taxRate ?? 10,
          payCycle: data.settings?.payCycle ?? 'weekly',
          approvalRequired: data.settings?.approvalRequired ?? true,
          salaryBase: data.settings?.salaryBase ?? 1000,
        },
      };

      // Validate the new classroom
      const validatedClassroom = ClassroomSchema.parse(newClassroom);

      set(state => {
        const updated = [...state.classrooms, validatedClassroom];
        storageAdapter.set(STORAGE_KEYS.CLASSROOMS, updated);
        return { classrooms: updated };
      });

      return validatedClassroom;
    },

    // Update classroom
    updateClassroom: (id, data) => {
      set(state => {
        const updated = state.classrooms.map(classroom => {
          if (classroom.id === id) {
            const updatedClassroom = { ...classroom, ...data };

            // Validate the updated classroom
            try {
              return ClassroomSchema.parse(updatedClassroom);
            } catch (error) {
              console.error('Invalid classroom update:', error);
              return classroom; // Return original if validation fails
            }
          }
          return classroom;
        });

        storageAdapter.set(STORAGE_KEYS.CLASSROOMS, updated);
        return { classrooms: updated };
      });
    },

    // Delete classroom
    deleteClassroom: (id) => {
      set(state => {
        const updated = state.classrooms.filter(classroom => classroom.id !== id);
        storageAdapter.set(STORAGE_KEYS.CLASSROOMS, updated);
        return { classrooms: updated };
      });
    },

    // Get classroom by ID
    getClassroom: (id) => {
      return get().classrooms.find(classroom => classroom.id === id);
    },

    // Update treasury
    updateTreasury: (classroomId, amount) => {
      get().updateClassroom(classroomId, { treasury: amount });
    },

    // Update donation
    updateDonation: (classroomId, amount) => {
      get().updateClassroom(classroomId, { donation: amount });
    },
  }))
);

// Auto-persist classrooms on changes
useClassroomStore.subscribe(
  (state) => state.classrooms,
  (classrooms) => {
    storageAdapter.set(STORAGE_KEYS.CLASSROOMS, classrooms);
  }
);