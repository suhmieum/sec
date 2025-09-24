import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Doughnut as DoughnutChart, Bar, Line } from 'react-chartjs-2';
import { useCurrentClassroom, useCurrentStudents, useCurrentJobs } from '../state';
import { useAnalyticsStore } from '../state/analyticsStore';
import { useNotifications } from './NotificationSystem';
import { generateActivityData, getRandomItem, MOCK_STUDENT_NAMES } from '../utils/mockData';
import Leaderboard from './Leaderboard';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

// 동적 거래 생성을 위한 타입과 템플릿
const TRANSACTION_TYPES = [
  { type: 'transfer', to: 'student', emoji: '💸', backgrounds: 'bg-accent-500' },
  { type: 'purchase', to: '학급상점', emoji: '🛒', backgrounds: 'bg-orange-500' },
  { type: 'salary', from: '학급', emoji: '💵', backgrounds: 'bg-green-500' },
  { type: 'donation', to: '기부함', emoji: '❤️', backgrounds: 'bg-pink-500' },
];

const generateNewTransaction = (): any => {
  const transactionType = getRandomItem(TRANSACTION_TYPES);
  const amount = Math.floor(Math.random() * 5000) + 500;
  const from = transactionType.from || getRandomItem(MOCK_STUDENT_NAMES);
  const to = transactionType.to === 'student' ? getRandomItem(MOCK_STUDENT_NAMES.filter(name => name !== from)) : transactionType.to;

  return {
    id: Date.now() + Math.random(),
    from,
    to,
    amount,
    time: '방금 전',
    type: transactionType.type,
    emoji: transactionType.emoji,
    backgrounds: transactionType.backgrounds
  };
};

// 차트 색상
const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];

function Dashboard() {
  const currentClass = useCurrentClassroom();
  const students = useCurrentStudents();
  const jobs = useCurrentJobs();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [activityData, setActivityData] = useState(generateActivityData());
  const [selectedAnalyticsView, setSelectedAnalyticsView] = useState<'overview' | 'heatmap' | 'patterns'>('overview');
  const {
    showTransactionNotification,
    showCreditScoreNotification,
    showAchievementNotification,
  } = useNotifications();

  // Analytics Store
  const {
    calculateEconomicMetrics,
    getStudentActivityHeatmap,
    analyzeTransactionPatterns,
    predictEconomicTrend,
    identifyRiskStudents
  } = useAnalyticsStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 실시간 거래 생성 (시연용)
  useEffect(() => {
    const transactionTimer = setInterval(() => {
      // 15~45초마다 새로운 거래 생성
      const shouldGenerate = Math.random() < 0.3; // 30% 확률
      if (shouldGenerate && students.length > 0) {
        const newTransaction = generateNewTransaction();

        setLiveTransactions(prev => {
          const updated = [newTransaction, ...prev].slice(0, 12); // 최대 12개 유지
          return updated;
        });

        // 거래 알림 표시 (50% 확률)
        if (Math.random() < 0.5) {
          showTransactionNotification(
            newTransaction.from,
            newTransaction.to,
            newTransaction.amount,
            currentClass?.currencyUnit || '원'
          );
        }
      }
    }, 5000); // 5초마다 체크

    // 활동 데이터 업데이트 (1분마다)
    const activityTimer = setInterval(() => {
      setActivityData(generateActivityData());
    }, 60000);

    return () => {
      clearInterval(transactionTimer);
      clearInterval(activityTimer);
    };
  }, [students.length, currentClass, showTransactionNotification]);

  if (!currentClass) {
    return null;
  }

  // 학생 자산 분포 데이터
  const wealthDistribution = [
    { name: '상위 20%', value: 45, students: Math.floor(students.length * 0.2) },
    { name: '중위 40%', value: 35, students: Math.floor(students.length * 0.4) },
    { name: '하위 40%', value: 20, students: Math.floor(students.length * 0.4) },
  ];

  // 실시간 거래 피드에서 표시할 거래들 (liveTransactions가 비어있으면 기본 데이터 사용)
  const displayTransactions = liveTransactions.length > 0 ? liveTransactions : [
    { id: 1, from: '김철수', to: '이영희', amount: 1000, time: '5분 전', type: 'transfer', emoji: '💸', backgrounds: 'bg-accent-500' },
    { id: 2, from: '박민수', to: '학급상점', amount: 500, time: '8분 전', type: 'purchase', emoji: '🛒', backgrounds: 'bg-orange-500' },
    { id: 3, from: '학급', to: '최지우', amount: 3000, time: '12분 전', type: 'salary', emoji: '💵', backgrounds: 'bg-green-500' },
    { id: 4, from: '김서연', to: '기부함', amount: 200, time: '15분 전', type: 'donation', emoji: '❤️', backgrounds: 'bg-pink-500' },
  ];


  // 경제 지표
  const totalWealth = students.reduce((sum, s) => sum + s.balance, 0);
  const avgWealth = students.length > 0 ? Math.round(totalWealth / students.length) : 0;
  const employedStudents = students.filter(s => s.jobId).length;

  // Analytics 데이터 계산
  const metrics = currentClass ? calculateEconomicMetrics(currentClass.id) : null;
  const activityHeatmap = currentClass ? getStudentActivityHeatmap(currentClass.id) : [];
  const transactionPattern = currentClass ? analyzeTransactionPatterns(currentClass.id) : null;
  const economicTrend = currentClass ? predictEconomicTrend(currentClass.id) : 'stable';
  const riskStudents = currentClass ? identifyRiskStudents(currentClass.id) : [];

  // 활동 히트맵 차트 데이터 준비
  const prepareHeatmapData = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}시`);

    // 모든 학생의 시간대별 활동 합계
    const aggregatedHourly = new Array(24).fill(0);
    const aggregatedWeekly = new Array(7).fill(0);

    activityHeatmap.forEach(student => {
      student.hourlyActivity.forEach((count, hour) => {
        aggregatedHourly[hour] += count;
      });
      student.weeklyActivity.forEach((count, day) => {
        aggregatedWeekly[day] += count;
      });
    });

    return {
      hourlyData: {
        labels: hours,
        datasets: [{
          label: '시간대별 활동',
          data: aggregatedHourly,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          fill: false,
          tension: 0.4
        }]
      },
      weeklyData: {
        labels: days,
        datasets: [{
          label: '요일별 활동',
          data: aggregatedWeekly,
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        }]
      }
    };
  };

  // 차트 데이터 준비
  const participationChart = {
    labels: ['참여', '미참여'],
    datasets: [{
      data: [
        metrics?.marketParticipation || 0,
        100 - (metrics?.marketParticipation || 0)
      ],
      backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(229, 231, 235, 0.5)'],
      borderColor: ['rgba(59, 130, 246, 1)', 'rgba(229, 231, 235, 1)'],
      borderWidth: 2,
    }]
  };

  const employmentChart = {
    labels: ['고용', '실업'],
    datasets: [{
      data: [
        metrics?.employmentRate || 0,
        100 - (metrics?.employmentRate || 0)
      ],
      backgroundColor: ['rgba(34, 197, 94, 0.5)', 'rgba(239, 68, 68, 0.5)'],
      borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 2,
    }]
  };

  const savingsChart = {
    labels: ['저축', '유통'],
    datasets: [{
      data: [
        metrics?.savingsRate || 0,
        100 - (metrics?.savingsRate || 0)
      ],
      backgroundColor: ['rgba(168, 85, 247, 0.5)', 'rgba(156, 163, 175, 0.5)'],
      borderColor: ['rgba(168, 85, 247, 1)', 'rgba(156, 163, 175, 1)'],
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 - 실시간 시계 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">실시간 경제 현황</h2>
          <p className="text-sm text-gray-500 mt-1">{currentClass.name}</p>
        </div>
        <div className="text-right flex items-center space-x-4">
          {/* 알림 테스트 버튼들 */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                console.log('거래 알림 버튼 클릭됨');
                showTransactionNotification('김철수', '이영희', 5000, currentClass?.currencyUnit || '원');
              }}
              className="px-3 py-1 text-xs bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              거래 알림
            </button>
            <button
              onClick={() => {
                console.log('신용점수 버튼 클릭됨');
                showCreditScoreNotification('박민수', 25, 675, '성실한 납세');
              }}
              className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              신용점수
            </button>
            <button
              onClick={() => {
                console.log('업적 버튼 클릭됨');
                showAchievementNotification('최지우', '첫 거래 완료');
              }}
              className="px-3 py-1 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              업적
            </button>
          </div>

          <div>
            <div className="text-2xl font-mono font-semibold text-gray-900">
              {currentTime.toLocaleTimeString('ko-KR')}
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">총 경제 규모</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={totalWealth} duration={2} separator="," />
            <span className="text-lg font-normal text-gray-600 ml-1">{currentClass.currencyUnit}</span>
          </div>
          <div className="text-xs text-green-600 mt-2">▲ 12.5% 이번 주</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">평균 자산</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={avgWealth} duration={2} separator="," />
            <span className="text-lg font-normal text-gray-600 ml-1">{currentClass.currencyUnit}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">학생 {students.length}명</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">고용률</span>
            <span className="text-2xl">💼</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp
              end={students.length > 0 ? Math.round((employedStudents / students.length) * 100) : 0}
              duration={2}
              suffix="%"
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">{employedStudents}/{students.length} 고용</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">국고</span>
            <span className="text-2xl">🏛️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={currentClass.treasury} duration={2} separator="," />
            <span className="text-lg font-normal text-gray-600 ml-1">{currentClass.currencyUnit}</span>
          </div>
          <div className="text-xs text-accent-600 mt-2">▲ 8.3% 이번 달</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 자산 분포 차트 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">학급 자산 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={wealthDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {wealthDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {wealthDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.students}명</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 실시간 거래 피드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 거래</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {displayTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white
                    ${tx.backgrounds || (tx.type === 'salary' ? 'bg-green-500' :
                      tx.type === 'donation' ? 'bg-pink-500' :
                      tx.type === 'purchase' ? 'bg-orange-500' : 'bg-accent-500')}`}>
                    {tx.emoji || (tx.type === 'salary' ? '💵' :
                     tx.type === 'donation' ? '❤️' :
                     tx.type === 'purchase' ? '🛒' : '💸')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {tx.from} → {tx.to}
                    </div>
                    <div className="text-xs text-gray-500">{tx.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {tx.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{currentClass.currencyUnit}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 게이미피케이션 리더보드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Leaderboard />
        </motion.div>
      </div>

      {/* 시간대별 거래 활동 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 경제 활동</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={activityData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAmount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* 분석 대시보드 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="space-y-6"
      >
        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 심화 분석 및 통계</h2>
              <p className="text-gray-600">{currentClass?.name || '학급'} 경제 활동 상세 분석</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedAnalyticsView('overview')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedAnalyticsView === 'overview'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 개요
              </button>
              <button
                onClick={() => setSelectedAnalyticsView('heatmap')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedAnalyticsView === 'heatmap'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                활동 히트맵
              </button>
              <button
                onClick={() => setSelectedAnalyticsView('patterns')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedAnalyticsView === 'patterns'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                거래 패턴
              </button>
            </div>
          </div>

          {/* 탭별 콘텐츠 */}
          {selectedAnalyticsView === 'overview' && (
            <>
              {/* 경제 지표 요약 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">지니계수</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.giniCoefficient ? metrics.giniCoefficient.toFixed(3) : '0.000'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">빈부격차 지표</div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">인플레이션율</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.inflationRate ? `${metrics.inflationRate.toFixed(1)}%` : '0.0%'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">물가 상승률</div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">거래량</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.tradingVolume ? `${(metrics.tradingVolume / 1000).toFixed(1)}K` : '0K'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">주간 거래액</div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">경제 전망</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {economicTrend === 'growing' ? '📈 성장' :
                     economicTrend === 'declining' ? '📉 위험' : '📊 안정'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">AI 예측</div>
                </div>
              </div>

              {/* 경제 참여 지표 차트 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">시장 참여율</h3>
                  <div style={{ height: '200px' }}>
                    <DoughnutChart data={participationChart} options={chartOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {metrics?.marketParticipation?.toFixed(1) || '0.0'}%
                    </span>
                    <p className="text-sm text-gray-600">학생들의 금융 시장 참여도</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">고용 현황</h3>
                  <div style={{ height: '200px' }}>
                    <DoughnutChart data={employmentChart} options={chartOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-2xl font-bold text-green-600">
                      {metrics?.employmentRate?.toFixed(1) || '0.0'}%
                    </span>
                    <p className="text-sm text-gray-600">전체 학생 중 취업률</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">저축률</h3>
                  <div style={{ height: '200px' }}>
                    <DoughnutChart data={savingsChart} options={chartOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-2xl font-bold text-purple-600">
                      {metrics?.savingsRate?.toFixed(1) || '0.0'}%
                    </span>
                    <p className="text-sm text-gray-600">총 통화량 대비 저축 비율</p>
                  </div>
                </div>
              </div>

              {/* 상세 분석 섹션 - 전체 개요 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 학생 활동 히트맵 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">학생 활동 히트맵</h3>
                    <button
                      onClick={() => setSelectedAnalyticsView('heatmap')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      전체 보기 →
                    </button>
                  </div>
                  {activityHeatmap.length > 0 ? (
                    <div className="space-y-3">
                      {activityHeatmap.slice(0, 5).map((student, index) => (
                        <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{student.studentName}</div>
                            <div className="text-xs text-gray-500">
                              {student.totalTransactions}회 거래
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${student.activityScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-8">{student.activityScore}%</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 text-center">
                        <span className="text-xs text-gray-500">
                          총 {activityHeatmap.length}명 중 상위 5명 표시
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-3xl mb-2">📊</div>
                      <p className="text-sm">활동 데이터가 없습니다</p>
                      <p className="text-xs text-gray-400">거래가 시작되면 표시됩니다</p>
                    </div>
                  )}
                </div>

                {/* 거래 패턴 분석 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">거래 패턴 분석</h3>
                    <button
                      onClick={() => setSelectedAnalyticsView('patterns')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      전체 보기 →
                    </button>
                  </div>
                  {transactionPattern && transactionPattern.totalTransactions > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                          <div className="text-xl font-bold text-green-600">{transactionPattern.buyCount}</div>
                          <div className="text-xs text-green-700">매수</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                          <div className="text-xl font-bold text-red-600">{transactionPattern.sellCount}</div>
                          <div className="text-xs text-red-700">매도</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">거래 스타일</span>
                          <span className="text-xs font-medium text-gray-900">
                            {transactionPattern.tradingStyle === 'aggressive' ? '공격적' :
                             transactionPattern.tradingStyle === 'conservative' ? '보수적' : '균형적'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">평균 거래액</span>
                          <span className="text-xs font-medium text-gray-900">
                            {transactionPattern.averageTransactionSize?.toLocaleString() || 0}{currentClass?.currencyUnit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">활발한 시간</span>
                          <span className="text-xs font-medium text-gray-900">{transactionPattern.peakHour}시</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-3xl mb-2">📈</div>
                      <p className="text-sm">거래 데이터가 없습니다</p>
                      <p className="text-xs text-gray-400">주식 거래가 시작되면 표시됩니다</p>
                    </div>
                  )}
                </div>

                {/* 위험 학생 모니터링 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">위험 학생 모니터링</h3>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      전체 보기 →
                    </button>
                  </div>
                  {riskStudents.length > 0 ? (
                    <div className="space-y-3">
                      {riskStudents.slice(0, 5).map((studentId, index) => {
                        const student = students.find(s => s.id === studentId);
                        return student ? (
                          <div key={studentId} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-red-900 text-sm">{student.name}</div>
                                <div className="text-xs text-red-700">
                                  잔고: {student.balance.toLocaleString()}{currentClass?.currencyUnit}
                                </div>
                              </div>
                            </div>
                            <div className="text-red-600 text-lg">⚠️</div>
                          </div>
                        ) : null;
                      })}
                      <div className="pt-2 text-center">
                        <span className="text-xs text-gray-500">
                          총 {riskStudents.length}명의 위험 학생
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-sm">위험 학생이 없습니다</p>
                      <p className="text-xs text-gray-400">모든 학생이 안정적인 상태입니다</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {selectedAnalyticsView === 'heatmap' && (
            <div className="space-y-6">
              {/* 활동 분포 차트 */}
              {(() => {
                const { hourlyData, weeklyData } = prepareHeatmapData();
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 요일별 활동 분포</h3>
                      <div className="h-64">
                        <Bar
                          data={weeklyData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: '거래 횟수'
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🕐 시간대별 활동 분포</h3>
                      <div className="h-64">
                        <Line
                          data={hourlyData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: '거래 횟수'
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 학생별 활동 점수 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">👥 학생별 활동 점수</h3>
                {activityHeatmap.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">학생</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">활동 점수</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">총 거래</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">최근 활동</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">활동 히트맵</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {activityHeatmap
                          .sort((a, b) => b.activityScore - a.activityScore)
                          .map(student => (
                            <tr key={student.studentId}>
                              <td className="px-4 py-3">
                                <p className="font-medium">{student.studentName}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${student.activityScore}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{student.activityScore}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-medium">{student.totalTransactions}회</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">
                                  {student.lastActivityDate ?
                                    new Date(student.lastActivityDate).toLocaleDateString() :
                                    '없음'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {student.weeklyActivity.map((count, day) => (
                                    <div
                                      key={day}
                                      className={`w-4 h-4 rounded ${
                                        count === 0 ? 'bg-gray-200' :
                                        count < 3 ? 'bg-blue-300' :
                                        count < 5 ? 'bg-blue-500' :
                                        'bg-blue-700'
                                      }`}
                                      title={`${['일', '월', '화', '수', '목', '금', '토'][day]}: ${count}회`}
                                    />
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-lg">활동 데이터가 없습니다</p>
                    <p className="text-sm text-gray-400">학생들의 거래가 시작되면 활동 히트맵이 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedAnalyticsView === 'patterns' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">거래 패턴 분석</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    실시간 업데이트
                  </span>
                </div>
                {transactionPattern && transactionPattern.totalTransactions > 0 ? (
                  <div className="space-y-8">
                    {/* 거래 통계 카드 - 깔끔한 흰색 디자인 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">총 매수</span>
                          <span className="text-2xl">📈</span>
                        </div>
                        <div className="text-3xl font-bold text-green-600">{transactionPattern.buyCount}</div>
                        <div className="mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            전체의 {(transactionPattern.buyRatio * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">총 매도</span>
                          <span className="text-2xl">📉</span>
                        </div>
                        <div className="text-3xl font-bold text-red-600">{transactionPattern.sellCount}</div>
                        <div className="mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                            전체의 {((1 - transactionPattern.buyRatio) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">거래 균형도</span>
                          <span className="text-2xl">⚖️</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                          {(transactionPattern.buyRatio * 100).toFixed(0)}:{((1 - transactionPattern.buyRatio) * 100).toFixed(0)}
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${transactionPattern.buyRatio * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">평균 거래액</span>
                          <span className="text-2xl">💰</span>
                        </div>
                        <div className="text-3xl font-bold text-purple-600">
                          {transactionPattern.averageTransactionSize?.toLocaleString() || 0}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">
                            {currentClass?.currencyUnit} 단위
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 학급 거래 문화 분석 - 깔끔한 카드 디자인 */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">우리 학급 거래 문화</h4>
                        <div className="text-3xl">
                          {transactionPattern.tradingStyle === 'aggressive' ? '🚀' :
                           transactionPattern.tradingStyle === 'conservative' ? '🏰' : '⚖️'}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="text-2xl font-bold text-gray-900">
                          {transactionPattern.tradingStyle === 'aggressive' ? '활발한 거래 문화' :
                           transactionPattern.tradingStyle === 'conservative' ? '신중한 거래 문화' : '균형잡힌 거래 문화'}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {transactionPattern.tradingStyle === 'aggressive'
                            ? '우리 학급은 적극적인 거래 활동을 보이고 있습니다. 학생들이 경제 활동에 높은 관심을 가지고 활발하게 참여하고 있어요. 다양한 투자 기회를 탐색하는 도전 정신이 돋보입니다.'
                            : transactionPattern.tradingStyle === 'conservative'
                            ? '우리 학급은 신중하고 계획적인 거래를 선호합니다. 학생들이 충분히 고민하고 안정적인 투자를 추구하고 있어요. 위험 관리를 잘하고 있는 성숙한 경제 문화입니다.'
                            : '우리 학급은 매수와 매도가 균형을 이루는 건전한 거래 문화를 가지고 있습니다. 적절한 위험 감수와 안정성을 동시에 추구하는 이상적인 경제 활동을 보여주고 있어요.'}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm text-gray-500">
                              <span className="font-semibold text-gray-700">{transactionPattern.totalTransactions}</span> 건의 거래 분석
                            </div>
                            <div className="text-sm text-gray-500">
                              참여 학생 <span className="font-semibold text-gray-700">{students.filter(s => s.totalTransactions > 0).length}</span>명
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-500">실시간</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 시간대별 거래 패턴 - 향상된 시각화 */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-gray-900">24시간 거래 히트맵</h4>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-500">실시간 업데이트</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* 오전/오후 구분 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-2">오전 (AM)</div>
                            <div className="grid grid-cols-12 gap-1">
                              {transactionPattern.hourlyPattern.slice(0, 12).map((activity, hour) => {
                                const maxActivity = Math.max(...transactionPattern.hourlyPattern);
                                const intensity = maxActivity > 0 ? (activity / maxActivity) : 0;
                                return (
                                  <div key={hour} className="relative group">
                                    <div
                                      className={`h-8 rounded-lg transition-all duration-300 transform hover:scale-110 cursor-pointer ${
                                        hour === transactionPattern.peakHour
                                          ? 'bg-gradient-to-t from-blue-600 to-blue-400 ring-2 ring-blue-300 ring-offset-2'
                                          : activity > 0
                                          ? 'bg-gradient-to-t from-blue-500 to-blue-300'
                                          : 'bg-gray-100'
                                      }`}
                                      style={{
                                        opacity: activity > 0 ? 0.3 + (intensity * 0.7) : 1,
                                        height: `${Math.max(32, 8 + (intensity * 40))}px`
                                      }}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                        {activity > 0 && activity}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 text-center">{hour}</div>
                                    {/* 툴팁 */}
                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                                      {hour}시: {activity}건
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-2">오후 (PM)</div>
                            <div className="grid grid-cols-12 gap-1">
                              {transactionPattern.hourlyPattern.slice(12).map((activity, index) => {
                                const hour = index + 12;
                                const maxActivity = Math.max(...transactionPattern.hourlyPattern);
                                const intensity = maxActivity > 0 ? (activity / maxActivity) : 0;
                                return (
                                  <div key={hour} className="relative group">
                                    <div
                                      className={`h-8 rounded-lg transition-all duration-300 transform hover:scale-110 cursor-pointer ${
                                        hour === transactionPattern.peakHour
                                          ? 'bg-gradient-to-t from-purple-600 to-purple-400 ring-2 ring-purple-300 ring-offset-2'
                                          : activity > 0
                                          ? 'bg-gradient-to-t from-purple-500 to-purple-300'
                                          : 'bg-gray-100'
                                      }`}
                                      style={{
                                        opacity: activity > 0 ? 0.3 + (intensity * 0.7) : 1,
                                        height: `${Math.max(32, 8 + (intensity * 40))}px`
                                      }}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                        {activity > 0 && activity}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 text-center">{hour}</div>
                                    {/* 툴팁 */}
                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                                      {hour}시: {activity}건
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 피크 시간 표시 */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                                {transactionPattern.peakHour}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">피크 타임</div>
                                <div className="text-xs text-gray-500">가장 활발한 거래 시간대</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {transactionPattern.hourlyPattern[transactionPattern.peakHour]}건
                              </div>
                              <div className="text-xs text-gray-500">최대 거래량</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">📈</div>
                    <p className="text-lg">거래 데이터가 없습니다</p>
                    <p className="text-sm text-gray-400">주식 거래가 시작되면 패턴 분석이 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
