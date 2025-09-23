import { z } from 'zod';

// Base ID type
export const IdSchema = z.string().min(1);
export type ID = z.infer<typeof IdSchema>;

// Classroom schema
export const ClassroomSettingsSchema = z.object({
  taxRate: z.number().min(0).max(100).default(10), // %
  payCycle: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),
  approvalRequired: z.boolean().default(true),
  salaryBase: z.number().min(0).default(1000), // 기본 급여
});

export const ClassroomSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(50),
  currencyUnit: z.string().min(1).max(10).default('원'),
  treasury: z.number().default(500000), // 국고
  donation: z.number().default(50000), // 기부금
  createdAt: z.string().datetime(),
  settings: ClassroomSettingsSchema,
});

// Student schema
export const StudentSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  name: z.string().min(1).max(30),
  pin4: z.string().length(4).regex(/^\d{4}$/), // 4자리 숫자
  jobId: IdSchema.optional(), // 직업 ID
  balance: z.number().default(0),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  // 신용등급 시스템
  creditScore: z.number().min(300).max(850).default(650), // 300~850 (미국식 신용점수)
  creditGrade: z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D']).default('B'), // 신용등급
  totalEarnings: z.number().min(0).default(0),
  totalTransactions: z.number().min(0).default(0),
  achievements: z.array(z.string()).default([]),
  // 행동 기록 (교사가 관리)
  lateCount: z.number().min(0).default(0), // 지각 횟수
  homeworkMissed: z.number().min(0).default(0), // 숙제 미제출 횟수
  bookOverdue: z.number().min(0).default(0), // 도서 연체 횟수
});

// Job schema (기존 Job과 호환)
export const JobSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  title: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  salary: z.number().min(0),
  maxPositions: z.number().min(1),
  currentPositions: z.number().min(0).default(0),
});

// Tax Item schema
export const TaxItemSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  name: z.string().min(1).max(50),
  rate: z.number().min(0).max(100), // 세율 (%)
  isActive: z.boolean().default(true),
  description: z.string().max(200).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Savings Account schema (예금/적금)
export const SavingsAccountSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  studentId: IdSchema,
  type: z.enum(['savings', 'deposit']), // 적금, 예금
  name: z.string().min(1).max(50), // 상품명
  principal: z.number().min(0), // 원금
  interestRate: z.number().min(0).max(100), // 이자율 (%)
  termMonths: z.number().min(1).max(60), // 만기 (개월)
  monthlyDeposit: z.number().min(0).default(0), // 월 납입액 (적금의 경우)
  totalBalance: z.number().min(0).default(0), // 현재 잔액
  createdAt: z.string().datetime(),
  maturityDate: z.string().datetime(), // 만기일
  isMatured: z.boolean().default(false), // 만기 여부
  autoRenewal: z.boolean().default(false), // 자동갱신 여부
});

// Stock schema (주식)
export const StockSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  symbol: z.string().min(1).max(10), // 종목코드
  name: z.string().min(1).max(50), // 종목명
  currentPrice: z.number().min(0), // 현재 주가
  previousPrice: z.number().min(0), // 전일 주가
  sector: z.string().min(1).max(30), // 섹터 (환경, 교육, 기술 등)
  description: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Stock Transaction schema (주식 거래)
export const StockTransactionSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  studentId: IdSchema,
  stockId: IdSchema,
  type: z.enum(['buy', 'sell']), // 매수, 매도
  quantity: z.number().min(1), // 수량
  price: z.number().min(0), // 거래 가격
  totalAmount: z.number().min(0), // 총 거래금액
  fee: z.number().min(0).default(0), // 수수료
  createdAt: z.string().datetime(),
});

// Stock Portfolio schema (주식 포트폴리오)
export const StockPortfolioSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  studentId: IdSchema,
  stockId: IdSchema,
  quantity: z.number().min(0), // 보유 수량
  averagePrice: z.number().min(0), // 평균 매수가
  totalCost: z.number().min(0), // 총 매수금액
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Achievement schema (업적/뱃지)
export const AchievementSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(200),
  icon: z.string().min(1).max(10), // 이모지
  category: z.enum(['trading', 'savings', 'social', 'milestone', 'special']),
  condition: z.object({
    type: z.enum(['transaction_count', 'amount_saved', 'profit_earned', 'jobs_completed', 'donations_made', 'portfolio_value', 'consecutive_days']),
    target: z.number().min(1),
    timeframe: z.enum(['daily', 'weekly', 'monthly', 'total']).optional(),
  }),
  points: z.number().min(1).max(1000), // 업적 달성 시 획득 포인트
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

// Student Achievement schema (학생별 업적 진행도)
export const StudentAchievementSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  studentId: IdSchema,
  achievementId: IdSchema,
  progress: z.number().min(0).default(0), // 현재 진행도
  isCompleted: z.boolean().default(false),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Market News/Event schema (교육적 가상 뉴스)
export const MarketNewsSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(500),
  type: z.enum(['환경', '교육', '기술', '식품', '전체시장', '특별이벤트']),
  impact: z.enum(['positive', 'negative', 'neutral']), // 주가에 미치는 영향
  severity: z.number().min(1).max(5), // 영향도 (1: 약함, 5: 강함)
  affectedStocks: z.array(IdSchema), // 영향받는 종목 ID들
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(), // 뉴스 만료일
  createdAt: z.string().datetime(),
});

// Daily Market Indicators (일일 시장 지표)
export const MarketIndicatorsSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  date: z.string(), // YYYY-MM-DD 형식
  indicators: z.object({
    fineDust: z.number().min(0).max(500), // 미세먼지 농도 (㎍/㎥)
    temperature: z.number().min(-30).max(50), // 기온 (°C)
    teacherMood: z.number().min(1).max(10), // 선생님 기분 지수
    teacherWeight: z.number().min(40).max(150).optional(), // 선생님 몸무게 (kg)
    rainfall: z.number().min(0).max(500), // 강수량 (mm)
    studentAttendance: z.number().min(0).max(100), // 출석률 (%)
    lunchMenuRating: z.number().min(1).max(5), // 급식 만족도
    examStress: z.number().min(1).max(10), // 시험 스트레스 지수
  }),
  createdAt: z.string().datetime(),
});

// Stock Price History (주가 히스토리)
export const StockPriceHistorySchema = z.object({
  id: IdSchema,
  stockId: IdSchema,
  date: z.string(), // YYYY-MM-DD 형식
  openPrice: z.number().min(0),
  closePrice: z.number().min(0),
  highPrice: z.number().min(0),
  lowPrice: z.number().min(0),
  volume: z.number().min(0).default(0), // 거래량
  createdAt: z.string().datetime(),
});

// Item schema
export const ItemSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  name: z.string().min(1).max(50),
  price: z.number().min(0),
  stock: z.number().min(0).optional(),
  active: z.boolean().default(true),
});

// Transaction schema
export const TransactionTypeSchema = z.enum([
  'payroll',    // 급여
  'purchase',   // 구매
  'tax',        // 세금
  'transfer',   // 이체
  'fine',       // 벌금
  'bonus',      // 보너스
  'donation',   // 기부
]);

export const TransactionSchema = z.object({
  id: IdSchema,
  classroomId: IdSchema,
  studentId: IdSchema,
  type: TransactionTypeSchema,
  amount: z.number(), // +수입 / -지출
  memo: z.string().max(100).optional(),
  createdAt: z.string().datetime(),
  approved: z.boolean().default(false),
  requestedBy: z.enum(['teacher', 'student']).default('teacher'),
  itemId: IdSchema.optional(), // 구매 시 아이템 ID
});

// Approval Request schema
export const ApprovalRequestSchema = z.object({
  id: IdSchema,
  transactionId: IdSchema,
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  decidedAt: z.string().datetime().optional(),
  reason: z.string().max(100).optional(), // 거절 시 이유
});

// Export/Import schema
export const SnapshotMetaSchema = z.object({
  version: z.number().default(1),
  exportedAt: z.string().datetime(),
  appName: z.string().default('VivaaTown'),
});

export const SnapshotDataSchema = z.object({
  classrooms: z.array(ClassroomSchema),
  students: z.array(StudentSchema),
  jobs: z.array(JobSchema),
  items: z.array(ItemSchema),
  transactions: z.array(TransactionSchema),
  approvals: z.array(ApprovalRequestSchema),
  savingsAccounts: z.array(SavingsAccountSchema).optional(),
  stocks: z.array(StockSchema).optional(),
  stockTransactions: z.array(StockTransactionSchema).optional(),
  stockPortfolios: z.array(StockPortfolioSchema).optional(),
  achievements: z.array(AchievementSchema).optional(),
  studentAchievements: z.array(StudentAchievementSchema).optional(),
  marketNews: z.array(MarketNewsSchema).optional(),
  marketIndicators: z.array(MarketIndicatorsSchema).optional(),
  stockPriceHistory: z.array(StockPriceHistorySchema).optional(),
});

export const SnapshotSchema = z.object({
  meta: SnapshotMetaSchema,
  data: SnapshotDataSchema,
});

// Type exports
export type Classroom = z.infer<typeof ClassroomSchema>;
export type ClassroomSettings = z.infer<typeof ClassroomSettingsSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type Job = z.infer<typeof JobSchema>;
export type TaxItem = z.infer<typeof TaxItemSchema>;
export type SavingsAccount = z.infer<typeof SavingsAccountSchema>;
export type Stock = z.infer<typeof StockSchema>;
export type StockTransaction = z.infer<typeof StockTransactionSchema>;
export type StockPortfolio = z.infer<typeof StockPortfolioSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type StudentAchievement = z.infer<typeof StudentAchievementSchema>;
export type MarketNews = z.infer<typeof MarketNewsSchema>;
export type MarketIndicators = z.infer<typeof MarketIndicatorsSchema>;
export type StockPriceHistory = z.infer<typeof StockPriceHistorySchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
export type SnapshotMeta = z.infer<typeof SnapshotMetaSchema>;
export type SnapshotData = z.infer<typeof SnapshotDataSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;

// Validation helpers
export const validateClassroom = (data: unknown) => ClassroomSchema.parse(data);
export const validateStudent = (data: unknown) => StudentSchema.parse(data);
export const validateJob = (data: unknown) => JobSchema.parse(data);
export const validateTaxItem = (data: unknown) => TaxItemSchema.parse(data);
export const validateSavingsAccount = (data: unknown) => SavingsAccountSchema.parse(data);
export const validateStock = (data: unknown) => StockSchema.parse(data);
export const validateStockTransaction = (data: unknown) => StockTransactionSchema.parse(data);
export const validateStockPortfolio = (data: unknown) => StockPortfolioSchema.parse(data);
export const validateAchievement = (data: unknown) => AchievementSchema.parse(data);
export const validateStudentAchievement = (data: unknown) => StudentAchievementSchema.parse(data);
export const validateItem = (data: unknown) => ItemSchema.parse(data);
export const validateTransaction = (data: unknown) => TransactionSchema.parse(data);
export const validateSnapshot = (data: unknown) => SnapshotSchema.parse(data);