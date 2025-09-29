import { v4 as uuidv4 } from 'uuid';
import type {
  Student,
  Job,
  Stock,
  StockTransaction,
  StockPortfolio,
  SavingsAccount,
  Achievement,
  StudentAchievement,
  Transaction,
  MarketNews,
  StockPriceHistory
} from '../schemas';

// 학생 이름 목록
const studentNames = [
  '김민준', '이서연', '박지훈', '정수빈', '최예진',
  '강민서', '조유진', '윤서준', '임하은', '한지우',
  '오승민', '서은지', '신동현', '황소연', '안재현'
];

// 직업 목록
const jobTitles = [
  { title: '반장', salary: 15000, positions: 1 },
  { title: '부반장', salary: 12000, positions: 1 },
  { title: '환경부장', salary: 10000, positions: 2 },
  { title: '도서부원', salary: 8000, positions: 3 },
  { title: '급식도우미', salary: 8000, positions: 2 },
  { title: '칠판지우개', salary: 6000, positions: 3 },
  { title: '청소도우미', salary: 7000, positions: 3 }
];

// 주식 목록
const stockData = [
  { name: '미세먼지 농도', symbol: 'PM001', sector: '환경', price: 5000 },
  { name: '오늘 기온', symbol: 'TEMP1', sector: '환경', price: 3500 },
  { name: '선생님 몸무게', symbol: 'TEACH', sector: '건강', price: 7000 },
  { name: '비상교육', symbol: 'VISE1', sector: '교육', price: 6000 }
];

// 업적 목록
const achievementData: Omit<Achievement, 'id' | 'createdAt'>[] = [
  {
    name: '첫 거래',
    description: '처음으로 거래를 완료했어요!',
    icon: '🎯',
    category: 'milestone',
    condition: { type: 'transaction_count', target: 1 },
    points: 10,
    isActive: true
  },
  {
    name: '거래왕',
    description: '10번 이상 거래했어요!',
    icon: '👑',
    category: 'trading',
    condition: { type: 'transaction_count', target: 10 },
    points: 50,
    isActive: true
  },
  {
    name: '저축 시작',
    description: '첫 저축을 시작했어요!',
    icon: '🏦',
    category: 'savings',
    condition: { type: 'amount_saved', target: 1000 },
    points: 20,
    isActive: true
  },
  {
    name: '투자의 시작',
    description: '첫 주식을 구매했어요!',
    icon: '📈',
    category: 'trading',
    condition: { type: 'transaction_count', target: 1 },
    points: 30,
    isActive: true
  },
  {
    name: '부자',
    description: '총 자산이 100,000원을 넘었어요!',
    icon: '💰',
    category: 'milestone',
    condition: { type: 'portfolio_value', target: 100000 },
    points: 100,
    isActive: true
  },
  {
    name: '일벌레',
    description: '직업을 가지고 열심히 일했어요!',
    icon: '💼',
    category: 'milestone',
    condition: { type: 'jobs_completed', target: 1, timeframe: 'monthly' },
    points: 25,
    isActive: true
  },
  {
    name: '나눔의 미덕',
    description: '기부를 5번 이상 했어요!',
    icon: '🤝',
    category: 'social',
    condition: { type: 'donations_made', target: 5 },
    points: 40,
    isActive: true
  }
];

export function generateDemoData(classroomId: string) {
  const now = new Date();
  const data: any = {
    students: [],
    jobs: [],
    stocks: [],
    stockTransactions: [],
    stockPortfolios: [],
    savingsAccounts: [],
    achievements: [],
    studentAchievements: [],
    transactions: [],
    marketNews: [],
    stockPriceHistory: [],
    marketParticipation: [],
    savingsRates: [],
    activityHeatmap: []
  };

  // 1. 직업 생성
  jobTitles.forEach(job => {
    data.jobs.push({
      id: uuidv4(),
      classroomId,
      title: job.title,
      salary: job.salary,
      maxPositions: job.positions,
      currentPositions: 0,
      description: `${job.title} 직업입니다.`
    });
  });

  // 2. 학생 생성 및 직업 배정
  let jobIndex = 0;
  studentNames.forEach((name, index) => {
    const studentId = uuidv4();
    const hasJob = Math.random() > 0.3; // 70% 확률로 직업 보유
    let assignedJob = null;

    if (hasJob && jobIndex < data.jobs.length) {
      const job = data.jobs[jobIndex % data.jobs.length];
      if (job.currentPositions < job.maxPositions) {
        assignedJob = job.id;
        job.currentPositions++;
        jobIndex++;
      }
    }

    const balance = Math.floor(Math.random() * 50000) + 10000;
    const creditScore = Math.floor(Math.random() * 300) + 550;

    const studentData: any = {
      id: studentId,
      classroomId,
      name,
      pin4: String(1000 + index).padStart(4, '0'),
      balance,
      active: true,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      creditScore,
      creditGrade: creditScore > 750 ? 'A+' : creditScore > 700 ? 'A' : creditScore > 650 ? 'B+' : creditScore > 600 ? 'B' : 'C',
      totalEarnings: assignedJob ? Math.floor(Math.random() * 100000) + 50000 : Math.floor(Math.random() * 30000),
      totalTransactions: Math.floor(Math.random() * 50) + 10,
      achievements: [],
      lateCount: Math.floor(Math.random() * 5),
      homeworkMissed: Math.floor(Math.random() * 3),
      bookOverdue: Math.floor(Math.random() * 2)
    };

    // jobId를 명시적으로 설정 (undefined가 아닌 경우만)
    if (assignedJob) {
      studentData.jobId = assignedJob;
      console.log(`[DEBUG] Assigned job ${assignedJob} to student ${name}`);
    }

    data.students.push(studentData);
  });

  // 3. 주식 생성
  stockData.forEach(stock => {
    const stockId = uuidv4();
    const basePrice = stock.price;

    data.stocks.push({
      id: stockId,
      classroomId,
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: basePrice + Math.floor(Math.random() * 1000 - 500),
      previousPrice: basePrice,
      sector: stock.sector,
      description: `${stock.name} 주식입니다.`,
      isActive: true,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString()
    });

    // 주가 히스토리 생성 (30일)
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayPrice = basePrice + Math.floor((Math.random() - 0.5) * 2000);

      data.stockPriceHistory.push({
        id: uuidv4(),
        stockId,
        date: date.toISOString().split('T')[0],
        openPrice: dayPrice - Math.floor(Math.random() * 200),
        closePrice: dayPrice,
        highPrice: dayPrice + Math.floor(Math.random() * 300),
        lowPrice: dayPrice - Math.floor(Math.random() * 300),
        volume: Math.floor(Math.random() * 10000) + 1000,
        createdAt: date.toISOString()
      });
    }
  });

  // 4. 학생별 주식 거래 및 포트폴리오 생성
  data.students.forEach((student: Student) => {
    const hasStocks = Math.random() > 0.4; // 60% 확률로 주식 보유

    if (hasStocks) {
      // 2-4개 종목 랜덤 선택
      const numStocks = Math.floor(Math.random() * 3) + 2;
      const selectedStocks = [...data.stocks].sort(() => Math.random() - 0.5).slice(0, numStocks);

      selectedStocks.forEach((stock: Stock) => {
        const quantity = Math.floor(Math.random() * 10) + 1;
        const avgPrice = stock.currentPrice + Math.floor(Math.random() * 1000 - 500);

        // 포트폴리오 추가
        data.stockPortfolios.push({
          id: uuidv4(),
          classroomId,
          studentId: student.id,
          stockId: stock.id,
          quantity,
          averagePrice: avgPrice,
          totalCost: avgPrice * quantity,
          createdAt: new Date(now.getTime() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: now.toISOString()
        });

        // 거래 내역 생성 (매수)
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
          const tradeDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
          const tradeQuantity = Math.floor(Math.random() * 3) + 1;
          const tradePrice = avgPrice + Math.floor(Math.random() * 500 - 250);

          data.stockTransactions.push({
            id: uuidv4(),
            classroomId,
            studentId: student.id,
            stockId: stock.id,
            type: 'buy',
            quantity: tradeQuantity,
            price: tradePrice,
            totalAmount: tradePrice * tradeQuantity,
            fee: Math.floor(tradePrice * tradeQuantity * 0.01),
            createdAt: tradeDate.toISOString()
          });
        }

        // 일부 매도 거래도 생성
        if (Math.random() > 0.6) {
          const sellDate = new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000);
          const sellQuantity = Math.floor(Math.random() * 2) + 1;
          const sellPrice = stock.currentPrice + Math.floor(Math.random() * 500);

          data.stockTransactions.push({
            id: uuidv4(),
            classroomId,
            studentId: student.id,
            stockId: stock.id,
            type: 'sell',
            quantity: sellQuantity,
            price: sellPrice,
            totalAmount: sellPrice * sellQuantity,
            fee: Math.floor(sellPrice * sellQuantity * 0.01),
            createdAt: sellDate.toISOString()
          });
        }
      });
    }

    // 5. 저축 계좌 생성
    const hasSavings = Math.random() > 0.5; // 50% 확률로 저축 보유

    if (hasSavings) {
      const accountType = Math.random() > 0.5 ? 'savings' : 'deposit';
      const principal = Math.floor(Math.random() * 30000) + 10000;
      const termMonths = Math.random() > 0.5 ? 6 : 12;

      data.savingsAccounts.push({
        id: uuidv4(),
        classroomId,
        studentId: student.id,
        type: accountType,
        name: accountType === 'savings' ? '우리반 적금' : '우리반 예금',
        principal,
        interestRate: accountType === 'savings' ? 5 : 3,
        termMonths,
        monthlyDeposit: accountType === 'savings' ? Math.floor(principal / termMonths) : 0,
        totalBalance: principal + Math.floor(Math.random() * 5000),
        createdAt: new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        maturityDate: new Date(now.getTime() + termMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
        isMatured: false,
        autoRenewal: Math.random() > 0.5
      });
    }

    // 6. 일반 거래 내역 생성
    for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
      const transactionDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const types = ['payroll', 'purchase', 'transfer', 'bonus'] as const;
      const type = types[Math.floor(Math.random() * types.length)];

      data.transactions.push({
        id: uuidv4(),
        classroomId,
        studentId: student.id,
        type,
        amount: type === 'payroll' || type === 'bonus'
          ? Math.floor(Math.random() * 10000) + 5000
          : -Math.floor(Math.random() * 5000) - 1000,
        memo: type === 'payroll' ? '월급' :
               type === 'bonus' ? '보너스' :
               type === 'purchase' ? '구매' : '이체',
        createdAt: transactionDate.toISOString(),
        approved: true,
        requestedBy: 'teacher'
      });
    }
  });

  // 7. 업적 생성
  achievementData.forEach(achievement => {
    const achievementId = uuidv4();

    data.achievements.push({
      ...achievement,
      id: achievementId,
      createdAt: now.toISOString()
    });

    // 학생별 업적 진행도 생성
    data.students.forEach((student: Student) => {
      const hasProgress = Math.random() > 0.3; // 70% 확률로 진행도 있음

      if (hasProgress) {
        const progress = Math.floor(Math.random() * 100);
        const isCompleted = progress >= 100 || Math.random() > 0.7;

        data.studentAchievements.push({
          id: uuidv4(),
          classroomId,
          studentId: student.id,
          achievementId,
          progress: isCompleted ? 100 : progress,
          isCompleted,
          completedAt: isCompleted ? new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          createdAt: new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: now.toISOString()
        });
      }
    });
  });

  // 8. 시장 뉴스 생성
  const newsTypes = ['환경', '교육', '기술', '식품'] as const;
  const newsImpacts = ['positive', 'negative', 'neutral'] as const;

  for (let i = 0; i < 5; i++) {
    const newsDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const type = newsTypes[Math.floor(Math.random() * newsTypes.length)];
    const impact = newsImpacts[Math.floor(Math.random() * newsImpacts.length)];

    const newsTemplates = {
      환경: ['미세먼지 농도 개선!', '교실 환경 개선 프로젝트 시작'],
      교육: ['새로운 학습 프로그램 도입', '시험 기간 임박'],
      기술: ['디지털 기기 보급 확대', '온라인 학습 플랫폼 개선'],
      식품: ['급식 메뉴 개선', '건강한 간식 도입']
    };

    const title = newsTemplates[type][Math.floor(Math.random() * newsTemplates[type].length)];

    data.marketNews.push({
      id: uuidv4(),
      classroomId,
      title,
      content: `${title}과 관련된 뉴스입니다. ${type} 관련 주식에 영향을 줄 것으로 예상됩니다.`,
      type,
      impact,
      severity: Math.floor(Math.random() * 5) + 1,
      affectedStocks: data.stocks
        .filter((s: Stock) => s.sector === type)
        .map((s: Stock) => s.id)
        .slice(0, 2),
      isActive: i < 3, // 최근 3개만 활성화
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: newsDate.toISOString()
    });
  }

  // 9. 시장 참여율 더미 데이터 생성 (30일간)
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // 주말에는 참여율이 낮고, 주중에는 높음
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseRate = isWeekend ? 0.3 : 0.7;
    const participationRate = Math.min(1, baseRate + (Math.random() * 0.3 - 0.15));

    data.marketParticipation.push({
      id: uuidv4(),
      classroomId,
      date: date.toISOString().split('T')[0],
      participationRate: Math.round(participationRate * 100) / 100,
      activeStudents: Math.floor(data.students.length * participationRate),
      totalTransactions: Math.floor(participationRate * 50 + Math.random() * 20),
      tradingVolume: Math.floor(participationRate * 100000 + Math.random() * 50000),
      createdAt: date.toISOString()
    });
  }

  // 10. 저축률 더미 데이터 생성 (12개월간)
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    // 계절별 저축률 변동 (겨울/여름방학 높음, 학기 중 낮음)
    const month = date.getMonth();
    const isHoliday = month === 0 || month === 1 || month === 7 || month === 8; // 겨울/여름방학
    const baseSavingsRate = isHoliday ? 0.6 : 0.4;
    const savingsRate = Math.min(0.9, baseSavingsRate + (Math.random() * 0.2 - 0.1));

    // 총 자산 대비 저축 비율
    const totalAssets = data.students.reduce((sum: number, student: any) => sum + student.balance, 0);
    const totalSavings = data.savingsAccounts.reduce((sum: any, account: any) => sum + account.totalBalance, 0);

    data.savingsRates.push({
      id: uuidv4(),
      classroomId,
      month: date.toISOString().split('T')[0].substring(0, 7), // YYYY-MM 형식
      savingsRate: Math.round(savingsRate * 100) / 100,
      totalSavings: totalSavings + Math.floor(Math.random() * 50000),
      totalAssets: totalAssets + Math.floor(Math.random() * 100000),
      newSavingsAccounts: Math.floor(savingsRate * 8) + Math.floor(Math.random() * 3),
      averageSavingsAmount: Math.floor(20000 + savingsRate * 30000),
      createdAt: date.toISOString()
    });
  }

  // 11. 활동 히트맵 더미 데이터 생성 (주요 시간대만)
  data.students.forEach((student: any) => {
    const studentIndex = data.students.findIndex((s: any) => s.id === student.id);

    // 주중 수업시간 (9-16시)만 생성하여 데이터량 대폭 감소
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      for (let hour = 9; hour <= 16; hour++) {
        const baseActivity = 0.7 + (Math.random() * 0.3); // 수업시간 높은 활동도
        const activityLevel = Math.min(1, baseActivity);
        const transactionCount = Math.floor(activityLevel * 8);

        data.activityHeatmap.push({
          id: uuidv4(),
          classroomId,
          studentId: student.id,
          dayOfWeek,
          hour,
          activityLevel: Math.round(activityLevel * 100) / 100,
          transactionCount,
          totalAmount: transactionCount * (Math.floor(Math.random() * 3000) + 1000),
          createdAt: now.toISOString()
        });
      }
    }

    // 주말 대표시간 몇개만 추가 (10, 14, 18시)
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 6) {
      [10, 14, 18].forEach(hour => {
        const baseActivity = 0.2 + (Math.random() * 0.3);
        const activityLevel = Math.min(1, baseActivity);
        const transactionCount = Math.floor(activityLevel * 5);

        data.activityHeatmap.push({
          id: uuidv4(),
          classroomId,
          studentId: student.id,
          dayOfWeek,
          hour,
          activityLevel: Math.round(activityLevel * 100) / 100,
          transactionCount,
          totalAmount: transactionCount * (Math.floor(Math.random() * 2000) + 500),
          createdAt: now.toISOString()
        });
      });
    }
  });

  return data;
}