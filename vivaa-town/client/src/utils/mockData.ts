// 시연용 가짜 데이터 생성 유틸리티

export const MOCK_STUDENT_NAMES = [
  '김철수', '이영희', '박민수', '최지우', '정수진', '강태현', '윤서연', '장혜민',
  '조현우', '김나영', '이준호', '박소영', '최민석', '정하린', '강동현', '윤지민',
  '장성훈', '김예린', '이도윤', '박채원', '최준영', '정시우', '강유진', '윤서준'
];

export const MOCK_JOB_TEMPLATES = [
  { title: '시장', description: '학급을 대표하는 최고 지도자', salary: 5000, maxPositions: 1, icon: '👑' },
  { title: '은행원', description: '학급 은행 업무 담당', salary: 3500, maxPositions: 2, icon: '🏦' },
  { title: '경찰', description: '질서 유지와 규칙 관리', salary: 3000, maxPositions: 2, icon: '👮' },
  { title: '세무관', description: '세금 징수와 관리', salary: 2800, maxPositions: 1, icon: '📊' },
  { title: '상점 직원', description: '학급 상점 운영', salary: 2500, maxPositions: 3, icon: '🛒' },
  { title: '기자', description: '학급 소식 취재와 전달', salary: 2200, maxPositions: 2, icon: '📰' },
  { title: '청소부', description: '교실 청결 관리', salary: 2000, maxPositions: 2, icon: '🧹' },
  { title: '도서관 사서', description: '학급 도서 관리', salary: 1800, maxPositions: 1, icon: '📚' }
];

export const MOCK_TRANSACTIONS = [
  { from: '김철수', to: '학급상점', amount: 1500, type: 'purchase', reason: '교재 구입' },
  { from: '박민수', to: '학급상점', amount: 800, type: 'purchase', reason: '볼펜 구매' },
  { from: '학급', to: '최지우', amount: 3000, type: 'salary', reason: '시장 급여' },
  { from: '정수진', to: '기부함', amount: 500, type: 'donation', reason: '학급 발전 기금' },
  { from: '강태현', to: '학급상점', amount: 2000, type: 'purchase', reason: '학용품 구매' },
  { from: '장혜민', to: '학급상점', amount: 1200, type: 'purchase', reason: '필기구 세트' },
  { from: '학급', to: '조현우', amount: 2500, type: 'salary', reason: '경찰 급여' },
  { from: '김나영', to: '기부함', amount: 700, type: 'donation', reason: '환경보호 캠페인' }
];

export const MOCK_ACHIEVEMENTS = [
  { id: 'first_trade', name: '첫 거래 완료', description: '첫 번째 거래를 성공했습니다', icon: '🎉', rarity: 'common' },
  { id: 'saving_master', name: '저축왕', description: '10,000원 이상 저축했습니다', icon: '💰', rarity: 'rare' },
  { id: 'donation_angel', name: '기부천사', description: '5회 이상 기부했습니다', icon: '😇', rarity: 'epic' },
  { id: 'trade_expert', name: '거래 전문가', description: '50회 이상 거래했습니다', icon: '💼', rarity: 'legendary' },
  { id: 'job_holder', name: '직업인', description: '첫 직업을 가졌습니다', icon: '👔', rarity: 'common' },
  { id: 'tax_payer', name: '성실한 납세자', description: '세금을 빠짐없이 납부했습니다', icon: '📋', rarity: 'rare' }
];

export function generateRandomBalance(): number {
  return Math.floor(Math.random() * 15000) + 5000; // 5000 ~ 20000
}

export function generateRandomCreditScore(): number {
  // 다양한 신용점수 분포를 위한 가중치 적용
  const rand = Math.random();

  if (rand < 0.1) return Math.floor(Math.random() * 51) + 800; // 10% A+ (800-850)
  if (rand < 0.2) return Math.floor(Math.random() * 51) + 750; // 10% A (750-799)
  if (rand < 0.35) return Math.floor(Math.random() * 51) + 700; // 15% B+ (700-749)
  if (rand < 0.55) return Math.floor(Math.random() * 51) + 650; // 20% B (650-699)
  if (rand < 0.75) return Math.floor(Math.random() * 51) + 600; // 20% C+ (600-649)
  if (rand < 0.9) return Math.floor(Math.random() * 51) + 550; // 15% C (550-599)
  return Math.floor(Math.random() * 251) + 300; // 10% D (300-549)
}

export function generateRandomBehaviorCounts(): { lateCount: number; homeworkMissed: number; bookOverdue: number } {
  return {
    lateCount: Math.floor(Math.random() * 5), // 0 ~ 4
    homeworkMissed: Math.floor(Math.random() * 3), // 0 ~ 2
    bookOverdue: Math.floor(Math.random() * 2), // 0 ~ 1
  };
}

export function generateRandomAchievements(): string[] {
  const achievements = ['first_transaction', 'frequent_trader', 'money_saver'];
  const numAchievements = Math.floor(Math.random() * 3);
  return achievements.slice(0, numAchievements);
}

export function generateRandomTransactionCount(): number {
  return Math.floor(Math.random() * 100) + 5; // 5 ~ 105
}

export function generateRandomTotalEarnings(): number {
  return Math.floor(Math.random() * 50000) + 10000; // 10000 ~ 60000
}

export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateMockStudents(classroomId: string, count: number = 24) {
  const shuffledNames = [...MOCK_STUDENT_NAMES].sort(() => Math.random() - 0.5);

  return shuffledNames.slice(0, count).map((name, index) => {
    const creditScore = generateRandomCreditScore();
    const behaviorCounts = generateRandomBehaviorCounts();

    // 신용등급 계산 함수 (getCreditGrade와 동일)
    const getCreditGrade = (score: number) => {
      if (score >= 800) return 'A+';
      if (score >= 750) return 'A';
      if (score >= 700) return 'B+';
      if (score >= 650) return 'B';
      if (score >= 600) return 'C+';
      if (score >= 550) return 'C';
      return 'D';
    };

    return {
      id: `mock-student-${index + 1}`,
      classroomId,
      name,
      pin4: String(1000 + index).slice(-4), // 1000~1023 등
      balance: generateRandomBalance(),
      creditScore,
      creditGrade: getCreditGrade(creditScore),
      totalEarnings: generateRandomTotalEarnings(),
      totalTransactions: generateRandomTransactionCount(),
      achievements: generateRandomAchievements(),
      ...behaviorCounts,
      jobId: undefined, // 나중에 직업 배정
      active: true,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // 최근 30일 내
    };
  });
}

export function generateMockJobs(classroomId: string) {
  return MOCK_JOB_TEMPLATES.map((template, index) => ({
    id: `mock-job-${index + 1}`,
    classroomId,
    title: template.title,
    description: template.description,
    salary: template.salary,
    maxPositions: template.maxPositions,
    currentPositions: Math.floor(Math.random() * template.maxPositions), // 랜덤 배정
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 최근 7일 내
    updatedAt: new Date()
  }));
}

export function generateMockTransactions(classroomId: string, count: number = 50) {
  const transactions = [];

  for (let i = 0; i < count; i++) {
    const mockTx = getRandomItem(MOCK_TRANSACTIONS);
    const timeAgo = Math.random() * 7 * 24 * 60 * 60 * 1000; // 최근 7일 내

    transactions.push({
      id: `mock-tx-${i + 1}`,
      classroomId,
      fromStudentId: mockTx.from === '학급' ? null : `mock-student-${Math.floor(Math.random() * 24) + 1}`,
      toStudentId: mockTx.to === '학급상점' || mockTx.to === '기부함' ? null : `mock-student-${Math.floor(Math.random() * 24) + 1}`,
      amount: mockTx.amount + Math.floor(Math.random() * 1000), // 약간의 랜덤 변화
      type: mockTx.type,
      description: mockTx.reason,
      createdAt: new Date(Date.now() - timeAgo),
      updatedAt: new Date(Date.now() - timeAgo)
    });
  }

  return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 차트용 시간대별 데이터 생성
export function generateActivityData() {
  const hours = ['9시', '10시', '11시', '12시', '1시', '2시', '3시', '4시'];

  return hours.map(time => ({
    time,
    transactions: Math.floor(Math.random() * 20) + 5,
    amount: Math.floor(Math.random() * 50000) + 10000
  }));
}

// 주간 경제 성장 데이터
export function generateWeeklyGrowthData() {
  const days = ['월', '화', '수', '목', '금'];
  let totalWealth = 500000;

  return days.map(day => {
    totalWealth += Math.floor(Math.random() * 50000) + 10000;
    return {
      day,
      totalWealth,
      avgWealth: Math.floor(totalWealth / 24),
      transactions: Math.floor(Math.random() * 100) + 50
    };
  });
}

// 신용등급별 학생 분포
export function generateCreditGradeDistribution() {
  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'];

  return grades.map(grade => ({
    grade: `${grade}등급`,
    students: Math.floor(Math.random() * 5) + 1
  }));
}