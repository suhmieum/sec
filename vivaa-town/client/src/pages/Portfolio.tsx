import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserIcon,
  ChartBarIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartPieIcon,
  CalendarIcon,
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentArrowDownIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { usePortfolioStore } from '../state/portfolioStore';
import { useStudentStore } from '../state/studentStore';
import { useClassroomStore } from '../state/classroomStore';
import { useStockStore } from '../state/stockStore';
import { useSavingsStore } from '../state/savingsStore';
import { useAchievementStore } from '../state/achievementStore';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Portfolio() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'activities' | 'goals' | 'comments'>('overview');
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: 0,
    deadline: '',
    category: 'savings' as const
  });

  const {
    portfolios,
    currentPortfolio,
    isGeneratingComment,
    createPortfolio,
    setCurrentPortfolio,
    getPortfolioByStudent,
    generateAIComment,
    addGoal,
    addComment,
    deleteComment,
    exportToPDF,
    calculateMetrics,
    analyzeActivity,
    generateMonthlyHistory
  } = usePortfolioStore();

  const { getStudent } = useStudentStore();
  const { getClassroom } = useClassroomStore();
  const { getPortfolioByStudent: getStockPortfolio } = useStockStore();
  const { getSavingsAccountsByStudent } = useSavingsStore();

  const student = studentId ? getStudent(studentId) : null;
  const classroom = student ? getClassroom(student.classroomId) : null;

  useEffect(() => {
    if (!student) {
      navigate('/students');
      return;
    }

    const initPortfolio = async () => {
      let portfolio = getPortfolioByStudent(studentId!);

      if (!portfolio) {
        setIsCreatingPortfolio(true);
        try {
          // Update portfolio with actual student data
          portfolio = await createPortfolio(studentId!);

          // Update with real data
          updatePortfolio(portfolio.id, {
            studentName: student!.name,
            classroomId: classroom!.id,
            classroomName: classroom!.name,
            achievements: student!.achievements || []
          });
        } catch (error) {
          console.error('Failed to create portfolio:', error);
        } finally {
          setIsCreatingPortfolio(false);
        }
      } else {
        setCurrentPortfolio(portfolio.id);
      }
    };

    initPortfolio();
  }, [studentId, student]);

  if (!student || !classroom) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">학생 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (isCreatingPortfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">포트폴리오 생성 중...</p>
        </div>
      </div>
    );
  }

  const portfolio = getPortfolioByStudent(studentId!);
  if (!portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">포트폴리오를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // Calculate real metrics
  const stockPortfolios = getStockPortfolio(studentId!) || [];
  const stockValue = stockPortfolios.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0);
  const savingsAccounts = getSavingsAccountsByStudent(studentId!) || [];
  const savingsValue = savingsAccounts.reduce((sum, acc) => sum + acc.totalBalance, 0);

  const realMetrics = {
    totalAssets: student.balance + stockValue + savingsValue,
    cashBalance: student.balance,
    investmentValue: stockValue,
    savingsValue: savingsValue,
    netWorth: student.balance + stockValue + savingsValue,
    monthlyIncome: 0, // Would need transaction history
    monthlyExpense: 0, // Would need transaction history
    savingsRate: savingsValue > 0 ? ((savingsValue / (student.balance + stockValue + savingsValue)) * 100) : 0,
    investmentReturn: 0, // Would need purchase price data
    assetGrowthRate: 0 // Would need historical data
  };

  const handleGenerateAIComment = async () => {
    try {
      await generateAIComment(studentId!);
    } catch (error) {
      console.error('Failed to generate AI comment:', error);
    }
  };

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.targetAmount > 0 && newGoal.deadline) {
      addGoal(studentId!, {
        ...newGoal,
        currentAmount: 0
      });
      setNewGoal({ title: '', targetAmount: 0, deadline: '', category: 'savings' });
      setShowGoalModal(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(portfolio.id);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  // Chart data
  const assetChartData = {
    labels: ['현금', '주식', '예적금'],
    datasets: [{
      data: [realMetrics.cashBalance, realMetrics.investmentValue, realMetrics.savingsValue],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      borderWidth: 0
    }]
  };

  const monthlyHistoryData = {
    labels: portfolio.monthlyHistory.map(h => h.month),
    datasets: [{
      label: '총 자산',
      data: portfolio.monthlyHistory.map(h => h.totalAssets),
      borderColor: '#6366F1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const incomeExpenseData = {
    labels: portfolio.monthlyHistory.map(h => h.month),
    datasets: [
      {
        label: '수입',
        data: portfolio.monthlyHistory.map(h => h.income),
        backgroundColor: '#10B981'
      },
      {
        label: '지출',
        data: portfolio.monthlyHistory.map(h => h.expense),
        backgroundColor: '#EF4444'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{student.name}의 경제 활동 포트폴리오</h1>
            <p className="text-indigo-100">
              {classroom.name} · {portfolio.period} · 신용등급 {student.creditGrade}
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            PDF 내보내기
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 자산</p>
              <p className="text-2xl font-bold text-gray-900">
                {realMetrics.totalAssets.toLocaleString()}
              </p>
            </div>
            <BanknotesIcon className="h-10 w-10 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">신용점수</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.creditScore}점
              </p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">저축률</p>
              <p className="text-2xl font-bold text-gray-900">
                {realMetrics.savingsRate.toFixed(1)}%
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">달성 업적</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.achievements?.length || 0}개
              </p>
            </div>
            <TrophyIcon className="h-10 w-10 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: '개요', icon: ChartBarIcon },
              { id: 'assets', name: '자산 구성', icon: ChartPieIcon },
              { id: 'activities', name: '활동 분석', icon: CalendarIcon },
              { id: 'goals', name: '목표 관리', icon: AcademicCapIcon },
              { id: 'comments', name: '교사 코멘트', icon: ChatBubbleBottomCenterTextIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">월별 자산 변화</h3>
                  <Line data={monthlyHistoryData} options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false }
                    }
                  }} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">수입/지출 분석</h3>
                  <Bar data={incomeExpenseData} options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' as const }
                    }
                  }} />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">주요 성과</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-500">최고 자산</p>
                    <p className="text-lg font-semibold">
                      {Math.max(...portfolio.monthlyHistory.map(h => h.totalAssets)).toLocaleString()}원
                    </p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-500">총 수입</p>
                    <p className="text-lg font-semibold">
                      {portfolio.monthlyHistory.reduce((sum, h) => sum + h.income, 0).toLocaleString()}원
                    </p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-500">평균 저축</p>
                    <p className="text-lg font-semibold">
                      {Math.round(portfolio.monthlyHistory.reduce((sum, h) => sum + h.netChange, 0) / portfolio.monthlyHistory.length).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">자산 구성</h3>
                  <div className="h-64">
                    <Doughnut data={assetChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' as const }
                      }
                    }} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">자산 내역</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">현금</p>
                          <p className="text-sm text-gray-500">즉시 사용 가능</p>
                        </div>
                        <p className="text-lg font-semibold">
                          {realMetrics.cashBalance.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">주식 투자</p>
                          <p className="text-sm text-gray-500">
                            {stockPortfolios.length}개 종목
                          </p>
                        </div>
                        <p className="text-lg font-semibold">
                          {realMetrics.investmentValue.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">예금/적금</p>
                          <p className="text-sm text-gray-500">
                            {savingsAccounts.length}개 계좌
                          </p>
                        </div>
                        <p className="text-lg font-semibold">
                          {realMetrics.savingsValue.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">활동 패턴</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">거래 빈도</span>
                      <span className="font-medium">
                        월 {portfolio.activityAnalysis.transactionFrequency}회
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">가장 활발한 요일</span>
                      <span className="font-medium">{portfolio.activityAnalysis.mostActiveDay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">가장 활발한 시간</span>
                      <span className="font-medium">{portfolio.activityAnalysis.mostActiveHour}시</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">금융 습관</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">저축형</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        portfolio.activityAnalysis.financialHabits.isSaver
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {portfolio.activityAnalysis.financialHabits.isSaver ? '예' : '아니오'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">투자형</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        portfolio.activityAnalysis.financialHabits.isInvestor
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {portfolio.activityAnalysis.financialHabits.isInvestor ? '예' : '아니오'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">지출 패턴</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        portfolio.activityAnalysis.financialHabits.spendingPattern === 'conservative'
                          ? 'bg-green-100 text-green-800'
                          : portfolio.activityAnalysis.financialHabits.spendingPattern === 'moderate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {portfolio.activityAnalysis.financialHabits.spendingPattern === 'conservative' ? '절약형'
                          : portfolio.activityAnalysis.financialHabits.spendingPattern === 'moderate' ? '보통'
                          : '적극형'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <h3 className="text-lg font-medium mb-3">달성 업적</h3>
                <div className="grid grid-cols-4 gap-4">
                  {student.achievements?.slice(0, 8).map((achievement, idx) => (
                    <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <TrophyIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">목표 관리</h3>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  목표 추가
                </button>
              </div>

              <div className="space-y-4">
                {portfolio.goals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{goal.title}</h4>
                          <p className="text-sm text-gray-500">
                            목표: {goal.targetAmount.toLocaleString()}원 ·
                            기한: {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm ${
                          goal.achieved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {goal.achieved ? '달성' : '진행중'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        진행률: {progress.toFixed(1)}% ({goal.currentAmount.toLocaleString()}원)
                      </p>
                    </div>
                  );
                })}

                {portfolio.goals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    아직 설정된 목표가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">교사 코멘트</h3>
                <button
                  onClick={handleGenerateAIComment}
                  disabled={isGeneratingComment}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <SparklesIcon className="h-5 w-5" />
                  {isGeneratingComment ? 'AI 코멘트 생성 중...' : 'AI 코멘트 생성'}
                </button>
              </div>

              <div className="space-y-4">
                {portfolio.teacherComments.map((comment) => (
                  <div key={comment.id} className={`rounded-lg p-4 ${
                    comment.isAIGenerated ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{comment.author}</span>
                        {comment.isAIGenerated && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            AI 생성
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-600 transition"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}

                {portfolio.teacherComments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    아직 작성된 코멘트가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">새 목표 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  목표 제목
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 10만원 저축하기"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  목표 금액
                </label>
                <input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  목표 기한
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="savings">저축</option>
                  <option value="investment">투자</option>
                  <option value="purchase">구매</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}