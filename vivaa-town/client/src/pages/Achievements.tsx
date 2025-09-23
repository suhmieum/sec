import { useState, useEffect } from 'react';
import { useAchievementStore, useCurrentClassroom, useCurrentStudents, useStockStore, useSavingsStore } from '../state';
import type { Student, Achievement } from '../schemas';

export default function Achievements() {
  const currentClassroom = useCurrentClassroom();
  const students = useCurrentStudents();

  const {
    achievements,
    studentAchievements,
    createAchievement,
    getStudentAchievements,
    getCompletedAchievements,
    getStudentPoints,
    getClassroomLeaderboard,
    checkAndCompleteAchievements,
    initializeStudentAchievements,
    createDefaultAchievements
  } = useAchievementStore();

  const { stockTransactions, stockPortfolios, calculatePortfolioValue } = useStockStore();
  const { savingsAccounts } = useSavingsStore();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'manage'>('overview');

  const leaderboard = currentClassroom ? getClassroomLeaderboard(currentClassroom.id) : [];

  // Initialize achievements for all students when classroom is selected
  useEffect(() => {
    if (currentClassroom && students.length > 0) {
      createDefaultAchievements(currentClassroom.id);
      students.forEach(student => {
        initializeStudentAchievements(currentClassroom.id, student.id);
      });
    }
  }, [currentClassroom, students, createDefaultAchievements, initializeStudentAchievements]);

  // Auto-check achievements for all students
  useEffect(() => {
    if (!currentClassroom) return;

    students.forEach(student => {
      // Calculate student's achievement data
      const studentTransactions = stockTransactions.filter(t => t.studentId === student.id);
      const studentSavings = savingsAccounts.filter(s => s.studentId === student.id);
      const portfolioValue = calculatePortfolioValue(student.id);

      const totalSaved = studentSavings.reduce((sum, acc) => sum + acc.totalBalance, 0);
      const totalProfit = stockPortfolios
        .filter(p => p.studentId === student.id)
        .reduce((sum, portfolio) => {
          const currentValue = portfolio.quantity * (portfolio.averagePrice); // Simplified
          return sum + Math.max(0, currentValue - portfolio.totalCost);
        }, 0);

      const achievementData = {
        transactionCount: studentTransactions.length,
        totalSaved,
        totalProfit,
        jobsCompleted: student.totalTransactions,
        donationsMade: studentTransactions.filter(t => t.type === 'sell').length, // Simplified
        portfolioValue,
        consecutiveDays: 1, // Simplified - would need actual tracking
      };

      checkAndCompleteAchievements(student.id, achievementData);
    });
  }, [students, stockTransactions, savingsAccounts, stockPortfolios, currentClassroom, checkAndCompleteAchievements, calculatePortfolioValue]);

  const handleCreateAchievement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentClassroom) return;

    const formData = new FormData(e.currentTarget);
    const achievementData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      icon: formData.get('icon') as string,
      category: formData.get('category') as any,
      condition: {
        type: formData.get('conditionType') as any,
        target: parseInt(formData.get('target') as string),
        timeframe: formData.get('timeframe') as any || undefined,
      },
      points: parseInt(formData.get('points') as string),
      isActive: true,
    };

    createAchievement(achievementData);
    setShowCreateModal(false);
    e.currentTarget.reset();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trading': return '💰';
      case 'savings': return '🏦';
      case 'social': return '🤝';
      case 'milestone': return '🏆';
      case 'special': return '⭐';
      default: return '🎯';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trading': return 'bg-green-100 text-green-800';
      case 'savings': return 'bg-blue-100 text-blue-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'milestone': return 'bg-yellow-100 text-yellow-800';
      case 'special': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStudentByLeaderboard = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  if (!currentClassroom) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">먼저 교실을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업적 시스템</h1>
          <p className="text-gray-600">{currentClassroom.name}의 학생 업적 관리</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          새 업적 만들기
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            전체 현황
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'leaderboard'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            리더보드
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'manage'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            업적 관리
          </button>
        </nav>
      </div>

      {/* 전체 현황 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 학생 선택 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-3">학생 선택</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {students.map(student => {
                const studentPoints = getStudentPoints(student.id);
                const completedCount = getCompletedAchievements(student.id).length;

                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedStudent?.id === student.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">{student.name}</div>
                    <div className="text-xs text-gray-500">
                      🏆 {completedCount}개 | ⭐ {studentPoints}점
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택된 학생의 업적 */}
          {selectedStudent && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">{selectedStudent.name}의 업적</h3>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  <span>총 업적: {achievements.length}개</span>
                  <span>완료: {getCompletedAchievements(selectedStudent.id).length}개</span>
                  <span>포인트: {getStudentPoints(selectedStudent.id)}점</span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map(achievement => {
                    const studentAchievement = getStudentAchievements(selectedStudent.id)
                      .find(sa => sa.achievementId === achievement.id);

                    const progress = studentAchievement?.progress || 0;
                    const isCompleted = studentAchievement?.isCompleted || false;
                    const progressPercent = Math.min((progress / achievement.condition.target) * 100, 100);

                    return (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isCompleted
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{achievement.icon}</span>
                            <div>
                              <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getCategoryColor(achievement.category)}`}>
                                {getCategoryIcon(achievement.category)} {achievement.category}
                              </span>
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="text-green-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">진행도</span>
                            <span className="font-medium">
                              {progress.toLocaleString()} / {achievement.condition.target.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isCompleted ? 'bg-green-500' : 'bg-primary-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{achievement.condition.type}</span>
                            <span>+{achievement.points}점</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 리더보드 탭 */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">업적 리더보드</h3>
            <p className="text-sm text-gray-600">포인트 순으로 정렬된 순위</p>
          </div>
          <div className="p-4">
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-500 py-8">아직 완료된 업적이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                  const student = getStudentByLeaderboard(entry.studentId);
                  if (!student) return null;

                  const rankIcons = ['🥇', '🥈', '🥉'];
                  const rankIcon = index < 3 ? rankIcons[index] : `${index + 1}위`;

                  return (
                    <div
                      key={entry.studentId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{rankIcon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">
                            {entry.completedCount}개 업적 완료
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary-600">
                          {entry.points.toLocaleString()}점
                        </div>
                        <div className="text-sm text-gray-500">
                          평균 {Math.round(entry.points / Math.max(entry.completedCount, 1))}점
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 업적 관리 탭 */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">업적 목록</h3>
            <p className="text-sm text-gray-600">현재 등록된 모든 업적</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(achievement => (
                <div key={achievement.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h4 className="font-medium">{achievement.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getCategoryColor(achievement.category)}`}>
                          {achievement.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>목표: {achievement.condition.target.toLocaleString()} ({achievement.condition.type})</div>
                    <div>포인트: {achievement.points}점</div>
                    <div>상태: {achievement.isActive ? '활성' : '비활성'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 업적 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">새 업적 만들기</h3>
            </div>
            <form onSubmit={handleCreateAchievement} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업적명 *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="예: 첫 거래"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 *</label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="업적에 대한 설명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이콘 *</label>
                <input
                  type="text"
                  name="icon"
                  required
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="🏆"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                <select
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">카테고리 선택</option>
                  <option value="trading">거래</option>
                  <option value="savings">저축</option>
                  <option value="social">사회</option>
                  <option value="milestone">마일스톤</option>
                  <option value="special">특별</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조건 유형 *</label>
                <select
                  name="conditionType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">조건 선택</option>
                  <option value="transaction_count">거래 횟수</option>
                  <option value="amount_saved">저축 금액</option>
                  <option value="profit_earned">수익 금액</option>
                  <option value="jobs_completed">직업 완료</option>
                  <option value="donations_made">기부 횟수</option>
                  <option value="portfolio_value">포트폴리오 가치</option>
                  <option value="consecutive_days">연속 일수</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">목표 값 *</label>
                <input
                  type="number"
                  name="target"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">포인트 *</label>
                <input
                  type="number"
                  name="points"
                  required
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}