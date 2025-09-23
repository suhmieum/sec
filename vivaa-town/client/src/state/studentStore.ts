import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { storageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId, getCurrentISOString, generatePin } from '../utils';
import {
  StudentSchema,
  type Student,
  type ID
} from '../schemas';

interface StudentState {
  // State
  students: Student[];
  isLoading: boolean;

  // Actions
  loadStudents: () => void;
  createStudent: (data: {
    classroomId: ID;
    name: string;
    pin4?: string;
    jobId?: ID;
    balance?: number;
  }) => Student;
  updateStudent: (id: ID, data: Partial<Omit<Student, 'id' | 'createdAt'>>) => void;
  deleteStudent: (id: ID) => void;
  getStudent: (id: ID) => Student | undefined;
  getStudentsByClassroom: (classroomId: ID) => Student[];

  // Balance operations
  updateBalance: (studentId: ID, newBalance: number) => void;
  addToBalance: (studentId: ID, amount: number) => void;
  subtractFromBalance: (studentId: ID, amount: number) => boolean; // returns false if insufficient funds

  // Job assignment
  assignJob: (studentId: ID, jobId: ID | undefined) => void;

  // PIN operations
  validateStudentPin: (studentId: ID, pin: string) => boolean;
  resetStudentPin: (studentId: ID) => string; // returns new PIN

  // Credit Score System operations
  updateCreditScore: (studentId: ID, change: number, reason: string) => void;
  addTransaction: (studentId: ID, amount?: number) => void;
  addAchievement: (studentId: ID, achievement: string) => boolean; // returns true if new achievement
  getStudentRanking: (classroomId: ID) => Student[];
  getCreditGrade: (creditScore: number) => string;
  getInterestRate: (creditScore: number) => number; // 예금 이자율

  // Teacher behavior management
  addLateRecord: (studentId: ID) => void;
  addHomeworkMissed: (studentId: ID) => void;
  addBookOverdue: (studentId: ID) => void;
  resetBehaviorRecord: (studentId: ID, type: 'late' | 'homework' | 'book') => void;
}

export const useStudentStore = create<StudentState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    students: [],
    isLoading: false,

    // Load students from storage
    loadStudents: () => {
      try {
        set({ isLoading: true });
        const stored = storageAdapter.get<Student[]>(STORAGE_KEYS.STUDENTS) ?? [];

        // Validate each student
        const validStudents = stored
          .map(student => {
            try {
              // 신용등급 필드가 없는 기존 학생들을 위한 기본값 설정
              const studentWithDefaults = {
                ...student,
                creditScore: student.creditScore || 650,
                creditGrade: student.creditGrade || 'B',
                totalEarnings: student.totalEarnings || 0,
                totalTransactions: student.totalTransactions || 0,
                achievements: student.achievements || [],
                lateCount: student.lateCount || 0,
                homeworkMissed: student.homeworkMissed || 0,
                bookOverdue: student.bookOverdue || 0
              };
              return StudentSchema.parse(studentWithDefaults);
            } catch (error) {
              console.warn('Invalid student data:', student, error);
              return null;
            }
          })
          .filter((student): student is Student => student !== null);

        set({ students: validStudents, isLoading: false });
      } catch (error) {
        console.error('Failed to load students:', error);
        set({ students: [], isLoading: false });
      }
    },

    // Create new student
    createStudent: (data) => {
      const newStudent: Student = {
        id: generateId(),
        classroomId: data.classroomId,
        name: data.name,
        pin4: data.pin4 ?? generatePin(),
        jobId: data.jobId,
        balance: data.balance ?? 0,
        active: true,
        createdAt: getCurrentISOString(),
        // 신용등급 기본값
        creditScore: 650,
        creditGrade: 'B',
        totalEarnings: 0,
        totalTransactions: 0,
        achievements: [],
        lateCount: 0,
        homeworkMissed: 0,
        bookOverdue: 0,
      };

      // Validate the new student
      const validatedStudent = StudentSchema.parse(newStudent);

      set(state => {
        const updated = [...state.students, validatedStudent];
        storageAdapter.set(STORAGE_KEYS.STUDENTS, updated);
        return { students: updated };
      });

      return validatedStudent;
    },

    // Update student
    updateStudent: (id, data) => {
      set(state => {
        const updated = state.students.map(student => {
          if (student.id === id) {
            const updatedStudent = { ...student, ...data };

            // Validate the updated student
            try {
              return StudentSchema.parse(updatedStudent);
            } catch (error) {
              console.error('Invalid student update:', error);
              return student; // Return original if validation fails
            }
          }
          return student;
        });

        storageAdapter.set(STORAGE_KEYS.STUDENTS, updated);
        return { students: updated };
      });
    },

    // Delete student
    deleteStudent: (id) => {
      set(state => {
        const updated = state.students.filter(student => student.id !== id);
        storageAdapter.set(STORAGE_KEYS.STUDENTS, updated);
        return { students: updated };
      });
    },

    // Get student by ID
    getStudent: (id) => {
      return get().students.find(student => student.id === id);
    },

    // Get students by classroom
    getStudentsByClassroom: (classroomId) => {
      return get().students.filter(student =>
        student.classroomId === classroomId && student.active
      );
    },

    // Update balance
    updateBalance: (studentId, newBalance) => {
      get().updateStudent(studentId, { balance: Math.max(0, newBalance) });
    },

    // Add to balance
    addToBalance: (studentId, amount) => {
      const student = get().getStudent(studentId);
      if (student) {
        get().updateBalance(studentId, student.balance + amount);
      }
    },

    // Subtract from balance
    subtractFromBalance: (studentId, amount) => {
      const student = get().getStudent(studentId);
      if (!student || student.balance < amount) {
        return false; // Insufficient funds
      }

      get().updateBalance(studentId, student.balance - amount);
      return true;
    },

    // Assign job
    assignJob: (studentId, jobId) => {
      get().updateStudent(studentId, { jobId });
    },

    // Validate PIN
    validateStudentPin: (studentId, pin) => {
      const student = get().getStudent(studentId);
      return student ? student.pin4 === pin : false;
    },

    // Reset PIN
    resetStudentPin: (studentId) => {
      const newPin = generatePin();
      get().updateStudent(studentId, { pin4: newPin });
      return newPin;
    },

    // Update credit score and recalculate grade
    updateCreditScore: (studentId, change, reason) => {
      const student = get().getStudent(studentId);
      if (!student) return;

      const newScore = Math.max(300, Math.min(850, student.creditScore + change));
      const newGrade = get().getCreditGrade(newScore);

      get().updateStudent(studentId, {
        creditScore: newScore,
        creditGrade: newGrade as any,
      });

      console.log(`${student.name}의 신용점수 변경: ${student.creditScore} → ${newScore} (${reason})`);
    },

    // Add transaction count and optional earnings
    addTransaction: (studentId, amount = 0) => {
      const student = get().getStudent(studentId);
      if (!student) return;

      const newTotalTransactions = student.totalTransactions + 1;
      const newTotalEarnings = amount > 0 ? student.totalEarnings + amount : student.totalEarnings;

      get().updateStudent(studentId, {
        totalTransactions: newTotalTransactions,
        totalEarnings: newTotalEarnings,
      });

      // 거래 시 신용점수 소폭 상승
      get().updateCreditScore(studentId, 2, '정상 거래 활동');

      // Check for achievements
      if (newTotalTransactions === 1) {
        get().addAchievement(studentId, 'first_transaction');
      }
      if (newTotalTransactions === 10) {
        get().addAchievement(studentId, 'frequent_trader');
      }
      if (newTotalTransactions === 50) {
        get().addAchievement(studentId, 'transaction_master');
      }
      if (newTotalEarnings >= 10000) {
        get().addAchievement(studentId, 'money_saver');
      }
      if (newTotalEarnings >= 50000) {
        get().addAchievement(studentId, 'wealth_builder');
      }
    },

    // Add achievement
    addAchievement: (studentId, achievement) => {
      const student = get().getStudent(studentId);
      if (!student || student.achievements.includes(achievement)) {
        return false; // Already has this achievement
      }

      const newAchievements = [...student.achievements, achievement];
      get().updateStudent(studentId, { achievements: newAchievements });

      // 업적 달성 시 신용점수 상승
      get().updateCreditScore(studentId, 25, `업적 달성: ${achievement}`);

      return true; // New achievement unlocked
    },

    // Get student ranking by credit score
    getStudentRanking: (classroomId) => {
      const students = get().getStudentsByClassroom(classroomId);

      return students
        .filter(student => student.active)
        .sort((a, b) => {
          // Sort by credit score first, then by total earnings
          if (a.creditScore !== b.creditScore) {
            return b.creditScore - a.creditScore;
          }
          return b.totalEarnings - a.totalEarnings;
        });
    },

    // Get credit grade from score
    getCreditGrade: (creditScore) => {
      if (creditScore >= 800) return 'A+';
      if (creditScore >= 750) return 'A';
      if (creditScore >= 700) return 'B+';
      if (creditScore >= 650) return 'B';
      if (creditScore >= 600) return 'C+';
      if (creditScore >= 550) return 'C';
      return 'D';
    },

    // Get interest rate based on credit score (예금 이자율)
    getInterestRate: (creditScore) => {
      if (creditScore >= 800) return 0.05; // 5%
      if (creditScore >= 750) return 0.04; // 4%
      if (creditScore >= 700) return 0.035; // 3.5%
      if (creditScore >= 650) return 0.03; // 3%
      if (creditScore >= 600) return 0.025; // 2.5%
      if (creditScore >= 550) return 0.02; // 2%
      return 0.015; // 1.5%
    },

    // Teacher behavior management functions
    addLateRecord: (studentId) => {
      const student = get().getStudent(studentId);
      if (!student) return;

      get().updateStudent(studentId, { lateCount: student.lateCount + 1 });
      get().updateCreditScore(studentId, -10, '지각');
    },

    addHomeworkMissed: (studentId) => {
      const student = get().getStudent(studentId);
      if (!student) return;

      get().updateStudent(studentId, { homeworkMissed: student.homeworkMissed + 1 });
      get().updateCreditScore(studentId, -15, '숙제 미제출');
    },

    addBookOverdue: (studentId) => {
      const student = get().getStudent(studentId);
      if (!student) return;

      get().updateStudent(studentId, { bookOverdue: student.bookOverdue + 1 });
      get().updateCreditScore(studentId, -20, '도서 연체');
    },

    resetBehaviorRecord: (studentId, type) => {
      const student = get().getStudent(studentId);
      if (!student) return;

      const updates: any = {};
      let bonus = 0;

      switch (type) {
        case 'late':
          if (student.lateCount > 0) {
            updates.lateCount = 0;
            bonus = student.lateCount * 5; // 기록 초기화 시 보너스
          }
          break;
        case 'homework':
          if (student.homeworkMissed > 0) {
            updates.homeworkMissed = 0;
            bonus = student.homeworkMissed * 7;
          }
          break;
        case 'book':
          if (student.bookOverdue > 0) {
            updates.bookOverdue = 0;
            bonus = student.bookOverdue * 10;
          }
          break;
      }

      if (Object.keys(updates).length > 0) {
        get().updateStudent(studentId, updates);
        if (bonus > 0) {
          get().updateCreditScore(studentId, bonus, `${type} 기록 초기화 보너스`);
        }
      }
    },

    // 기존 학생들의 신용등급을 다양하게 초기화하는 함수
    diversifyCreditScores: (classroomId) => {
      const students = get().getStudentsByClassroom(classroomId);

      students.forEach((student, index) => {
        // 다양한 신용점수 분포를 위한 가중치 적용
        const rand = Math.random();
        let newScore: number;

        if (rand < 0.1) newScore = Math.floor(Math.random() * 51) + 800; // 10% A+ (800-850)
        else if (rand < 0.2) newScore = Math.floor(Math.random() * 51) + 750; // 10% A (750-799)
        else if (rand < 0.35) newScore = Math.floor(Math.random() * 51) + 700; // 15% B+ (700-749)
        else if (rand < 0.55) newScore = Math.floor(Math.random() * 51) + 650; // 20% B (650-699)
        else if (rand < 0.75) newScore = Math.floor(Math.random() * 51) + 600; // 20% C+ (600-649)
        else if (rand < 0.9) newScore = Math.floor(Math.random() * 51) + 550; // 15% C (550-599)
        else newScore = Math.floor(Math.random() * 251) + 300; // 10% D (300-549)

        const newGrade = get().getCreditGrade(newScore);

        get().updateStudent(student.id, {
          creditScore: newScore,
          creditGrade: newGrade,
        });
      });
    },
  }))
);

// Auto-persist students on changes
useStudentStore.subscribe(
  (state) => state.students,
  (students) => {
    storageAdapter.set(STORAGE_KEYS.STUDENTS, students);
  }
);