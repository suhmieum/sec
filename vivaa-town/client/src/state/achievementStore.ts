import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Achievement, StudentAchievement } from '../schemas';
import { storageAdapter } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface AchievementState {
  achievements: Achievement[];
  studentAchievements: StudentAchievement[];

  // Actions
  loadAchievements: () => void;
  loadStudentAchievements: () => void;

  createAchievement: (data: Omit<Achievement, 'id' | 'createdAt'>) => Achievement;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  deleteAchievement: (id: string) => void;

  // Student achievement management
  createStudentAchievement: (data: Omit<StudentAchievement, 'id'>) => StudentAchievement;
  initializeStudentAchievements: (classroomId: string, studentId: string) => void;
  updateAchievementProgress: (studentId: string, achievementId: string, progress: number) => void;
  checkAndCompleteAchievements: (studentId: string, data: AchievementCheckData) => string[]; // Returns completed achievement IDs

  // Queries
  getAchievement: (id: string) => Achievement | undefined;
  getStudentAchievements: (studentId: string) => StudentAchievement[];
  getCompletedAchievements: (studentId: string) => StudentAchievement[];
  getStudentPoints: (studentId: string) => number;
  getClassroomLeaderboard: (classroomId: string) => Array<{ studentId: string; points: number; completedCount: number }>;

  // Pre-defined achievements
  createDefaultAchievements: (classroomId: string) => void;
}

interface AchievementCheckData {
  transactionCount?: number;
  totalSaved?: number;
  totalProfit?: number;
  jobsCompleted?: number;
  donationsMade?: number;
  portfolioValue?: number;
  consecutiveDays?: number;
}

// Default achievements templates
const DEFAULT_ACHIEVEMENTS = [
  {
    name: '첫 거래',
    description: '첫 번째 거래를 완료했습니다!',
    icon: '🎉',
    category: 'milestone' as const,
    condition: { type: 'transaction_count' as const, target: 1 },
    points: 50,
  },
  {
    name: '거래 달인',
    description: '10번의 거래를 완료했습니다!',
    icon: '💰',
    category: 'trading' as const,
    condition: { type: 'transaction_count' as const, target: 10 },
    points: 100,
  },
  {
    name: '거래왕',
    description: '50번의 거래를 완료했습니다!',
    icon: '👑',
    category: 'trading' as const,
    condition: { type: 'transaction_count' as const, target: 50 },
    points: 300,
  },
  {
    name: '저축왕',
    description: '10,000원을 저축했습니다!',
    icon: '🏦',
    category: 'savings' as const,
    condition: { type: 'amount_saved' as const, target: 10000 },
    points: 200,
  },
  {
    name: '저축 마스터',
    description: '100,000원을 저축했습니다!',
    icon: '💎',
    category: 'savings' as const,
    condition: { type: 'amount_saved' as const, target: 100000 },
    points: 500,
  },
  {
    name: '기부천사',
    description: '첫 기부를 완료했습니다!',
    icon: '😇',
    category: 'social' as const,
    condition: { type: 'donations_made' as const, target: 1 },
    points: 150,
  },
  {
    name: '나눔의 왕',
    description: '10번의 기부를 완료했습니다!',
    icon: '🤝',
    category: 'social' as const,
    condition: { type: 'donations_made' as const, target: 10 },
    points: 400,
  },
  {
    name: '투자 신입',
    description: '주식 투자로 첫 수익을 얻었습니다!',
    icon: '📈',
    category: 'trading' as const,
    condition: { type: 'profit_earned' as const, target: 1 },
    points: 100,
  },
  {
    name: '투자 고수',
    description: '주식 투자로 10,000원 수익을 달성했습니다!',
    icon: '🚀',
    category: 'trading' as const,
    condition: { type: 'profit_earned' as const, target: 10000 },
    points: 300,
  },
  {
    name: '포트폴리오 킹',
    description: '100,000원 포트폴리오를 달성했습니다!',
    icon: '💼',
    category: 'trading' as const,
    condition: { type: 'portfolio_value' as const, target: 100000 },
    points: 600,
  },
  {
    name: '근무왕',
    description: '10개의 직업을 완료했습니다!',
    icon: '⚡',
    category: 'milestone' as const,
    condition: { type: 'jobs_completed' as const, target: 10 },
    points: 250,
  },
  {
    name: '성실한 학생',
    description: '7일 연속 활동했습니다!',
    icon: '🔥',
    category: 'special' as const,
    condition: { type: 'consecutive_days' as const, target: 7 },
    points: 200,
  },
];

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  studentAchievements: [],

  loadAchievements: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.ACHIEVEMENTS);
    if (stored) {
      set({ achievements: stored });
    }
  },

  loadStudentAchievements: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.STUDENT_ACHIEVEMENTS);
    if (stored) {
      set({ studentAchievements: stored });
    }
  },

  createAchievement: (data) => {
    const now = new Date().toISOString();
    const newAchievement: Achievement = {
      ...data,
      id: uuidv4(),
      createdAt: now,
    };

    set((state) => ({
      achievements: [...state.achievements, newAchievement]
    }));

    return newAchievement;
  },

  updateAchievement: (id, updates) => {
    set((state) => ({
      achievements: state.achievements.map(achievement =>
        achievement.id === id ? { ...achievement, ...updates } : achievement
      )
    }));
  },

  deleteAchievement: (id) => {
    set((state) => ({
      achievements: state.achievements.filter(achievement => achievement.id !== id),
      studentAchievements: state.studentAchievements.filter(sa => sa.achievementId !== id)
    }));
  },

  createStudentAchievement: (data) => {
    const newStudentAchievement: StudentAchievement = {
      ...data,
      id: uuidv4(),
    };

    set((state) => ({
      studentAchievements: [...state.studentAchievements, newStudentAchievement]
    }));

    return newStudentAchievement;
  },

  initializeStudentAchievements: (classroomId, studentId) => {
    const existingStudentAchievements = get().studentAchievements.filter(
      sa => sa.studentId === studentId
    );

    const achievements = get().achievements.filter(a => a.isActive);
    const now = new Date().toISOString();

    const newStudentAchievements: StudentAchievement[] = achievements
      .filter(achievement => !existingStudentAchievements.some(sa => sa.achievementId === achievement.id))
      .map(achievement => ({
        id: uuidv4(),
        classroomId,
        studentId,
        achievementId: achievement.id,
        progress: 0,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      }));

    if (newStudentAchievements.length > 0) {
      set((state) => ({
        studentAchievements: [...state.studentAchievements, ...newStudentAchievements]
      }));
    }
  },

  updateAchievementProgress: (studentId, achievementId, progress) => {
    const achievement = get().getAchievement(achievementId);
    if (!achievement) return;

    const now = new Date().toISOString();
    const isCompleted = progress >= achievement.condition.target;

    set((state) => ({
      studentAchievements: state.studentAchievements.map(sa =>
        sa.studentId === studentId && sa.achievementId === achievementId
          ? {
              ...sa,
              progress,
              isCompleted,
              completedAt: isCompleted && !sa.isCompleted ? now : sa.completedAt,
              updatedAt: now,
            }
          : sa
      )
    }));
  },

  checkAndCompleteAchievements: (studentId, data) => {
    const achievements = get().achievements.filter(a => a.isActive);
    const studentAchievements = get().getStudentAchievements(studentId);
    const completedIds: string[] = [];

    achievements.forEach(achievement => {
      const studentAchievement = studentAchievements.find(sa => sa.achievementId === achievement.id);
      if (!studentAchievement || studentAchievement.isCompleted) return;

      let currentProgress = 0;

      // Check progress based on achievement type
      switch (achievement.condition.type) {
        case 'transaction_count':
          currentProgress = data.transactionCount || 0;
          break;
        case 'amount_saved':
          currentProgress = data.totalSaved || 0;
          break;
        case 'profit_earned':
          currentProgress = data.totalProfit || 0;
          break;
        case 'jobs_completed':
          currentProgress = data.jobsCompleted || 0;
          break;
        case 'donations_made':
          currentProgress = data.donationsMade || 0;
          break;
        case 'portfolio_value':
          currentProgress = data.portfolioValue || 0;
          break;
        case 'consecutive_days':
          currentProgress = data.consecutiveDays || 0;
          break;
      }

      // Update progress if it has changed
      if (currentProgress !== studentAchievement.progress) {
        get().updateAchievementProgress(studentId, achievement.id, currentProgress);

        // Check if achievement was just completed
        if (currentProgress >= achievement.condition.target && !studentAchievement.isCompleted) {
          completedIds.push(achievement.id);
        }
      }
    });

    return completedIds;
  },

  getAchievement: (id) => {
    return get().achievements.find(achievement => achievement.id === id);
  },

  getStudentAchievements: (studentId) => {
    return get().studentAchievements.filter(sa => sa.studentId === studentId);
  },

  getCompletedAchievements: (studentId) => {
    return get().studentAchievements.filter(sa => sa.studentId === studentId && sa.isCompleted);
  },

  getStudentPoints: (studentId) => {
    const completedAchievements = get().getCompletedAchievements(studentId);
    const achievements = get().achievements;

    return completedAchievements.reduce((total, sa) => {
      const achievement = achievements.find(a => a.id === sa.achievementId);
      return total + (achievement?.points || 0);
    }, 0);
  },

  getClassroomLeaderboard: (classroomId) => {
    const studentAchievements = get().studentAchievements.filter(sa => sa.classroomId === classroomId);
    const achievements = get().achievements;
    const leaderboard = new Map<string, { points: number; completedCount: number }>();

    studentAchievements.forEach(sa => {
      if (!sa.isCompleted) return;

      const achievement = achievements.find(a => a.id === sa.achievementId);
      if (!achievement) return;

      const current = leaderboard.get(sa.studentId) || { points: 0, completedCount: 0 };
      leaderboard.set(sa.studentId, {
        points: current.points + achievement.points,
        completedCount: current.completedCount + 1,
      });
    });

    return Array.from(leaderboard.entries())
      .map(([studentId, data]) => ({ studentId, ...data }))
      .sort((a, b) => b.points - a.points);
  },

  createDefaultAchievements: (classroomId) => {
    const existingAchievements = get().achievements;

    // Only create default achievements if none exist
    if (existingAchievements.length === 0) {
      DEFAULT_ACHIEVEMENTS.forEach(achievementData => {
        get().createAchievement(achievementData);
      });
    }
  },
}));

// Auto-persist achievements on changes
useAchievementStore.subscribe(
  (state) => state.achievements,
  (achievements) => {
    storageAdapter.set(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }
);

useAchievementStore.subscribe(
  (state) => state.studentAchievements,
  (studentAchievements) => {
    storageAdapter.set(STORAGE_KEYS.STUDENT_ACHIEVEMENTS, studentAchievements);
  }
);