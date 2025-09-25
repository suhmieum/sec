import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface PortfolioMetrics {
  totalAssets: number;
  cashBalance: number;
  investmentValue: number;
  savingsValue: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  investmentReturn: number;
  assetGrowthRate: number;
}

export interface ActivityAnalysis {
  transactionFrequency: number;
  mostActiveDay: string;
  mostActiveHour: number;
  topIncomeCategories: Array<{ category: string; amount: number; percentage: number }>;
  topExpenseCategories: Array<{ category: string; amount: number; percentage: number }>;
  financialHabits: {
    isSaver: boolean;
    isInvestor: boolean;
    isActiveTrader: boolean;
    spendingPattern: 'conservative' | 'moderate' | 'aggressive';
  };
}

export interface PortfolioGoal {
  id: string;
  studentId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'investment' | 'purchase' | 'other';
  achieved: boolean;
  createdAt: string;
}

export interface TeacherComment {
  id: string;
  studentId: string;
  content: string;
  isAIGenerated: boolean;
  createdAt: string;
  author: string;
}

export interface StudentPortfolio {
  id: string;
  studentId: string;
  studentName: string;
  classroomId: string;
  classroomName: string;
  period: string;
  profileImage?: string;
  motto?: string;

  metrics: PortfolioMetrics;
  activityAnalysis: ActivityAnalysis;

  monthlyHistory: Array<{
    month: string;
    totalAssets: number;
    income: number;
    expense: number;
    netChange: number;
  }>;

  achievements: string[];
  goals: PortfolioGoal[];
  teacherComments: TeacherComment[];

  lastUpdated: string;
  createdAt: string;
}

interface PortfolioStore {
  portfolios: StudentPortfolio[];
  currentPortfolio: StudentPortfolio | null;
  isGeneratingComment: boolean;

  // Actions
  loadPortfolios: () => void;
  createPortfolio: (studentId: string) => Promise<StudentPortfolio>;
  updatePortfolio: (portfolioId: string, updates: Partial<StudentPortfolio>) => void;
  deletePortfolio: (portfolioId: string) => void;

  // Portfolio Management
  setCurrentPortfolio: (portfolioId: string | null) => void;
  calculateMetrics: (studentId: string) => PortfolioMetrics;
  analyzeActivity: (studentId: string) => ActivityAnalysis;
  generateMonthlyHistory: (studentId: string) => Array<any>;

  // Goals Management
  addGoal: (studentId: string, goal: Omit<PortfolioGoal, 'id' | 'createdAt' | 'achieved'>) => void;
  updateGoal: (goalId: string, updates: Partial<PortfolioGoal>) => void;
  deleteGoal: (goalId: string) => void;
  checkGoalProgress: (studentId: string) => void;

  // Teacher Comments
  addComment: (studentId: string, content: string, isAIGenerated?: boolean) => void;
  generateAIComment: (studentId: string) => Promise<string>;
  deleteComment: (commentId: string) => void;

  // Export Functions
  exportToPDF: (portfolioId: string) => Promise<void>;
  getPortfolioByStudent: (studentId: string) => StudentPortfolio | undefined;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      portfolios: [],
      currentPortfolio: null,
      isGeneratingComment: false,

      loadPortfolios: () => {
        // Portfolio data is loaded from localStorage automatically by persist
      },

      createPortfolio: async (studentId: string) => {
        // Create a basic portfolio first, then update with calculated metrics
        const portfolio: StudentPortfolio = {
          id: uuidv4(),
          studentId,
          studentName: '',
          classroomId: '',
          classroomName: '',
          period: `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`,
          metrics: {
            totalAssets: 0,
            cashBalance: 0,
            investmentValue: 0,
            savingsValue: 0,
            netWorth: 0,
            monthlyIncome: 0,
            monthlyExpense: 0,
            savingsRate: 0,
            investmentReturn: 0,
            assetGrowthRate: 0
          },
          activityAnalysis: {
            transactionFrequency: 0,
            mostActiveDay: '월요일',
            mostActiveHour: 14,
            topIncomeCategories: [],
            topExpenseCategories: [],
            financialHabits: {
              isSaver: false,
              isInvestor: false,
              isActiveTrader: false,
              spendingPattern: 'moderate'
            }
          },
          monthlyHistory: get().generateMonthlyHistory(studentId),
          achievements: [],
          goals: [],
          teacherComments: [],
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };

        set(state => ({
          portfolios: [...state.portfolios, portfolio],
          currentPortfolio: portfolio
        }));

        return portfolio;
      },

      updatePortfolio: (portfolioId, updates) => {
        set(state => ({
          portfolios: state.portfolios.map(p =>
            p.id === portfolioId
              ? { ...p, ...updates, lastUpdated: new Date().toISOString() }
              : p
          ),
          currentPortfolio: state.currentPortfolio?.id === portfolioId
            ? { ...state.currentPortfolio, ...updates, lastUpdated: new Date().toISOString() }
            : state.currentPortfolio
        }));
      },

      deletePortfolio: (portfolioId) => {
        set(state => ({
          portfolios: state.portfolios.filter(p => p.id !== portfolioId),
          currentPortfolio: state.currentPortfolio?.id === portfolioId ? null : state.currentPortfolio
        }));
      },

      setCurrentPortfolio: (portfolioId) => {
        if (!portfolioId) {
          set({ currentPortfolio: null });
          return;
        }

        const portfolio = get().portfolios.find(p => p.id === portfolioId);
        set({ currentPortfolio: portfolio || null });
      },

      calculateMetrics: (studentId) => {
        // Return mock metrics for now - will be calculated in Portfolio component
        const mockMetrics: PortfolioMetrics = {
          totalAssets: 50000,
          cashBalance: 25000,
          investmentValue: 15000,
          savingsValue: 10000,
          netWorth: 50000,
          monthlyIncome: 8000,
          monthlyExpense: 5000,
          savingsRate: 20,
          investmentReturn: 5.5,
          assetGrowthRate: 8.2
        };

        return mockMetrics;
      },

      analyzeActivity: (studentId) => {
        // This will be implemented with actual transaction analysis
        const mockAnalysis: ActivityAnalysis = {
          transactionFrequency: 0,
          mostActiveDay: '월요일',
          mostActiveHour: 14,
          topIncomeCategories: [],
          topExpenseCategories: [],
          financialHabits: {
            isSaver: false,
            isInvestor: false,
            isActiveTrader: false,
            spendingPattern: 'moderate'
          }
        };

        // TODO: Analyze actual transaction patterns

        return mockAnalysis;
      },

      generateMonthlyHistory: (studentId) => {
        // Generate mock monthly history for now
        const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
        return months.map((month, index) => ({
          month,
          totalAssets: 10000 + (index * 2000),
          income: 5000 + (index * 500),
          expense: 3000 + (index * 300),
          netChange: 2000 + (index * 200)
        }));
      },

      addGoal: (studentId, goal) => {
        const newGoal: PortfolioGoal = {
          ...goal,
          id: uuidv4(),
          studentId,
          achieved: false,
          createdAt: new Date().toISOString()
        };

        set(state => {
          const portfolio = state.portfolios.find(p => p.studentId === studentId);
          if (!portfolio) return state;

          return {
            portfolios: state.portfolios.map(p =>
              p.studentId === studentId
                ? { ...p, goals: [...p.goals, newGoal] }
                : p
            )
          };
        });
      },

      updateGoal: (goalId, updates) => {
        set(state => ({
          portfolios: state.portfolios.map(portfolio => ({
            ...portfolio,
            goals: portfolio.goals.map(goal =>
              goal.id === goalId ? { ...goal, ...updates } : goal
            )
          }))
        }));
      },

      deleteGoal: (goalId) => {
        set(state => ({
          portfolios: state.portfolios.map(portfolio => ({
            ...portfolio,
            goals: portfolio.goals.filter(goal => goal.id !== goalId)
          }))
        }));
      },

      checkGoalProgress: (studentId) => {
        // Check and update goal progress
        set(state => {
          const portfolio = state.portfolios.find(p => p.studentId === studentId);
          if (!portfolio) return state;

          const updatedGoals = portfolio.goals.map(goal => {
            const achieved = goal.currentAmount >= goal.targetAmount;
            return { ...goal, achieved };
          });

          return {
            portfolios: state.portfolios.map(p =>
              p.studentId === studentId
                ? { ...p, goals: updatedGoals }
                : p
            )
          };
        });
      },

      addComment: (studentId, content, isAIGenerated = false) => {
        const newComment: TeacherComment = {
          id: uuidv4(),
          studentId,
          content,
          isAIGenerated,
          createdAt: new Date().toISOString(),
          author: isAIGenerated ? 'AI 교사 도우미' : '담임 선생님'
        };

        set(state => ({
          portfolios: state.portfolios.map(p =>
            p.studentId === studentId
              ? { ...p, teacherComments: [...p.teacherComments, newComment] }
              : p
          )
        }));
      },

      generateAIComment: async (studentId) => {
        set({ isGeneratingComment: true });

        try {
          // Import geminiService dynamically
          const { geminiService } = await import('../services/geminiService');
          const { GoogleGenerativeAI } = await import('@google/generative-ai');

          const portfolio = get().portfolios.find(p => p.studentId === studentId);
          if (!portfolio) throw new Error('Portfolio not found');

          // Get student data
          const { useStudentStore } = await import('./studentStore');
          const student = useStudentStore.getState().getStudent(studentId);
          if (!student) throw new Error('Student not found');

          // Create Gemini instance with the same API key
          const genAI = new GoogleGenerativeAI('AIzaSyCFIM0txm2ZvHfjeQkFl6Vt_y8gPbDT_ok');
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-001',
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 300
            }
          });

          const prompt = `학생 경제 활동 포트폴리오를 보고 교사 코멘트를 작성해주세요.

학생 정보:
- 이름: ${portfolio.studentName}
- 학급: ${portfolio.classroomName}
- 신용점수: ${student.creditScore}점 (${student.creditGrade}등급)
- 총 자산: ${portfolio.metrics.totalAssets.toLocaleString()}원
- 저축률: ${portfolio.metrics.savingsRate}%
- 투자 수익률: ${portfolio.metrics.investmentReturn}%
- 달성 업적: ${portfolio.achievements.length}개

활동 분석:
- 거래 빈도: ${portfolio.activityAnalysis.transactionFrequency}회/월
- 지출 패턴: ${portfolio.activityAnalysis.financialHabits.spendingPattern}
- 저축형: ${portfolio.activityAnalysis.financialHabits.isSaver ? '예' : '아니오'}
- 투자형: ${portfolio.activityAnalysis.financialHabits.isInvestor ? '예' : '아니오'}

3-4문장으로 긍정적이고 격려하는 톤으로 작성하되, 구체적인 개선 방안도 1가지 제시해주세요.`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const comment = response.text();

          // Add the generated comment
          get().addComment(studentId, comment, true);

          set({ isGeneratingComment: false });
          return comment;
        } catch (error) {
          console.error('AI comment generation error:', error);
          set({ isGeneratingComment: false });
          throw new Error('AI 코멘트 생성 중 오류가 발생했습니다.');
        }
      },

      deleteComment: (commentId) => {
        set(state => ({
          portfolios: state.portfolios.map(portfolio => ({
            ...portfolio,
            teacherComments: portfolio.teacherComments.filter(c => c.id !== commentId)
          }))
        }));
      },

      exportToPDF: async (portfolioId) => {
        const portfolio = get().portfolios.find(p => p.id === portfolioId);
        if (!portfolio) throw new Error('Portfolio not found');

        const jsPDF = await import('jspdf');
        const html2canvas = await import('html2canvas');
        const autoTable = await import('jspdf-autotable');

        const pdf = new jsPDF.jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // 한글 폰트 지원을 위한 설정
        pdf.setFont('helvetica');

        // 제목
        pdf.setFontSize(20);
        pdf.text('Economic Activity Portfolio', 20, 30);

        // 학생 정보
        pdf.setFontSize(16);
        pdf.text(`Student: ${portfolio.studentName}`, 20, 45);
        pdf.setFontSize(12);
        pdf.text(`Class: ${portfolio.classroomName}`, 20, 55);
        pdf.text(`Period: ${portfolio.period}`, 20, 65);

        // 주요 지표
        pdf.setFontSize(14);
        pdf.text('Key Metrics', 20, 85);

        const metricsData = [
          ['Total Assets', `${portfolio.metrics.totalAssets.toLocaleString()}`],
          ['Cash Balance', `${portfolio.metrics.cashBalance.toLocaleString()}`],
          ['Investment Value', `${portfolio.metrics.investmentValue.toLocaleString()}`],
          ['Savings Value', `${portfolio.metrics.savingsValue.toLocaleString()}`],
          ['Savings Rate', `${portfolio.metrics.savingsRate.toFixed(1)}%`]
        ];

        autoTable.default(pdf, {
          startY: 95,
          head: [['Metric', 'Value']],
          body: metricsData,
          theme: 'grid',
          headStyles: { fillColor: [99, 102, 241] },
          margin: { left: 20, right: 20 }
        });

        // 목표
        let currentY = (pdf as any).lastAutoTable.finalY + 20;
        pdf.setFontSize(14);
        pdf.text('Goals', 20, currentY);

        if (portfolio.goals.length > 0) {
          const goalsData = portfolio.goals.map(goal => [
            goal.title,
            `${goal.targetAmount.toLocaleString()}`,
            `${((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%`,
            goal.achieved ? 'Achieved' : 'In Progress'
          ]);

          autoTable.default(pdf, {
            startY: currentY + 10,
            head: [['Goal', 'Target Amount', 'Progress', 'Status']],
            body: goalsData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
            margin: { left: 20, right: 20 }
          });

          currentY = (pdf as any).lastAutoTable.finalY + 20;
        }

        // 교사 코멘트
        if (portfolio.teacherComments.length > 0) {
          pdf.setFontSize(14);
          pdf.text('Teacher Comments', 20, currentY);

          currentY += 15;
          portfolio.teacherComments.forEach((comment, idx) => {
            if (currentY > 250) { // 페이지 넘김
              pdf.addPage();
              currentY = 30;
            }

            pdf.setFontSize(10);
            pdf.text(`${idx + 1}. ${comment.author} (${new Date(comment.createdAt).toLocaleDateString()})`, 20, currentY);
            currentY += 8;

            // 코멘트 내용을 여러 줄로 분할
            const lines = pdf.splitTextToSize(comment.content, 170);
            pdf.text(lines, 25, currentY);
            currentY += lines.length * 5 + 10;
          });
        }

        // 생성 일시
        pdf.setFontSize(8);
        pdf.setTextColor(128);
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);
        pdf.text('Generated by Viva Village SEC Platform', 20, 285);

        // PDF 다운로드
        const filename = `${portfolio.studentName}_Portfolio_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);
      },

      getPortfolioByStudent: (studentId) => {
        return get().portfolios.find(p => p.studentId === studentId);
      }
    }),
    {
      name: 'portfolio-store'
    }
  )
);