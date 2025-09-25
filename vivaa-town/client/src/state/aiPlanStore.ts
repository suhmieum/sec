import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LessonPlan, TeacherProfile } from '../services/geminiService';

interface AIPlanStore {
  currentPlan: LessonPlan | null;
  savedPlans: LessonPlan[];
  teacherProfile: TeacherProfile;

  setCurrentPlan: (plan: LessonPlan) => void;
  savePlan: (plan: LessonPlan) => void;
  deletePlan: (planId: string) => void;
  updateTeacherProfile: (profile: Partial<TeacherProfile>) => void;
  clearCurrentPlan: () => void;
  getPlanById: (planId: string) => LessonPlan | undefined;
}

export const useAIPlanStore = create<AIPlanStore>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      savedPlans: [],
      teacherProfile: {
        academicCalendar: {}
      },

      setCurrentPlan: (plan) => set({ currentPlan: plan }),

      savePlan: (plan) => set((state) => ({
        savedPlans: [...state.savedPlans.filter(p => p.id !== plan.id), plan],
        currentPlan: plan
      })),

      deletePlan: (planId) => set((state) => ({
        savedPlans: state.savedPlans.filter(p => p.id !== planId),
        currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan
      })),

      updateTeacherProfile: (profile) => set((state) => ({
        teacherProfile: {
          ...state.teacherProfile,
          ...profile,
          academicCalendar: {
            ...state.teacherProfile.academicCalendar,
            ...profile.academicCalendar
          }
        }
      })),

      clearCurrentPlan: () => set({ currentPlan: null }),

      getPlanById: (planId) => {
        const state = get();
        return state.savedPlans.find(p => p.id === planId);
      }
    }),
    {
      name: 'ai-plan-store'
    }
  )
);