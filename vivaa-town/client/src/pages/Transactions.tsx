import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useCurrentClassroom, useCurrentStudents } from '../state';

function Transactions() {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const currentClass = useCurrentClassroom();
  const students = useCurrentStudents();

  // 현재는 mock 거래 데이터를 표시 (나중에 실제 거래 store 구현 예정)
  const mockTransactions = [
    {
      id: '1',
      fromStudentName: '김철수',
      toStudentName: '이영희',
      amount: 1500,
      type: 'transfer',
      description: '점심값 빌려줌',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
      status: 'pending', // pending, approved, rejected
    },
    {
      id: '2',
      fromStudentName: '박민수',
      toStudentName: '학급상점',
      amount: 800,
      type: 'purchase',
      description: '볼펜 구매',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
      status: 'approved',
    },
    {
      id: '3',
      fromStudentName: '학급',
      toStudentName: '최지우',
      amount: 3000,
      type: 'salary',
      description: '시장 급여',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
      status: 'approved',
    },
    {
      id: '4',
      fromStudentName: '정수진',
      toStudentName: '기부함',
      amount: 500,
      type: 'donation',
      description: '어려운 친구 도움',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3시간 전
      status: 'approved',
    },
    {
      id: '5',
      fromStudentName: '강태현',
      toStudentName: '윤서연',
      amount: 2000,
      type: 'transfer',
      description: '생일선물비',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4시간 전
      status: 'approved',
    },
    {
      id: '6',
      fromStudentName: '이준호',
      toStudentName: '박지우',
      amount: 1500,
      type: 'transfer',
      description: '교과서 빌려주기',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
      status: 'pending',
    },
    {
      id: '7',
      fromStudentName: '최민준',
      toStudentName: '김동우',
      amount: 2500,
      type: 'transfer',
      description: '간식 대금',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6시간 전
      status: 'pending',
    },
    {
      id: '8',
      fromStudentName: '정예린',
      toStudentName: '신재현',
      amount: 3000,
      type: 'transfer',
      description: '문구 공동 구매',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7), // 7시간 전
      status: 'pending',
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return '💸';
      case 'purchase':
        return '🛒';
      case 'salary':
        return '💵';
      case 'donation':
        return '❤️';
      default:
        return '💰';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'text-blue-600 bg-blue-100';
      case 'purchase':
        return 'text-orange-600 bg-orange-100';
      case 'salary':
        return 'text-green-600 bg-green-100';
      case 'donation':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer':
        return '개인 송금';
      case 'purchase':
        return '구매';
      case 'salary':
        return '급여';
      case 'donation':
        return '기부';
      default:
        return '기타';
    }
  };

  // 거래 승인/거부 처리
  const handleTransactionApproval = (transactionId: string, action: 'approve' | 'reject') => {
    // 실제 구현에서는 상태 업데이트 로직 추가 필요
    console.log(`Transaction ${transactionId} ${action === 'approve' ? 'approved' : 'rejected'}`);
    setSelectedTransaction(null);
    setShowReviewModal(false);
  };

  // 대기 중인 거래 필터링
  const pendingTransactions = mockTransactions.filter(t => t.status === 'pending');

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return `${diffDays}일 전`;
    }
  };

  if (!currentClass) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">학급이 선택되지 않았습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          먼저 학급을 생성하거나 선택하세요.
        </p>
      </div>
    );
  }

  const filteredTransactions = mockTransactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    } else {
      return b.amount - a.amount;
    }
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const todayTransactions = filteredTransactions.filter(t => {
    const today = new Date();
    return t.timestamp.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래 내역</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentClass.name} - 총 {filteredTransactions.length}건
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            거래 내역 검토
          </button>
        </div>
      </div>

      {/* 검토 모달 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border max-w-4xl shadow-xl rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">거래 내역 검토</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* 대기 중인 거래 목록 */}
              <div>
                <h4 className="text-lg font-semibold text-orange-600 mb-4">
                  ⏳ 승인 대기 중인 거래 ({pendingTransactions.length}건)
                </h4>
                {pendingTransactions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingTransactions.map(transaction => (
                      <div key={transaction.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{transaction.fromStudentName}</span>
                              <span className="text-gray-500">→</span>
                              <span className="font-medium">{transaction.toStudentName}</span>
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                {transaction.amount.toLocaleString()}{currentClass.currencyUnit}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(transaction.timestamp)}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleTransactionApproval(transaction.id, 'approve')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleTransactionApproval(transaction.id, 'reject')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              거부
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">대기 중인 거래가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">총 거래액</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={totalAmount} duration={2} separator="," />
            <span className="text-lg font-normal text-gray-600 ml-1">{currentClass.currencyUnit}</span>
          </div>
          <div className="text-xs text-green-600 mt-2">▲ 15.2% 이번 주</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">오늘 거래</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={todayTransactions.length} duration={2} />
            <span className="text-lg font-normal text-gray-600 ml-1">건</span>
          </div>
          <div className="text-xs text-blue-600 mt-2">▲ 8건 전일 대비</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">평균 거래액</span>
            <span className="text-2xl">💳</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp
              end={filteredTransactions.length > 0 ? Math.round(totalAmount / filteredTransactions.length) : 0}
              duration={2}
              separator=","
            />
            <span className="text-lg font-normal text-gray-600 ml-1">{currentClass.currencyUnit}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">거래당 평균</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">활성 학생</span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            <CountUp end={students.filter(s => s.active).length} duration={2} />
            <span className="text-lg font-normal text-gray-600 ml-1">명</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">전체 {students.length}명 중</div>
        </motion.div>
      </div>

      {/* 필터 및 정렬 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">거래 유형</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">전체</option>
                  <option value="transfer">개인 송금</option>
                  <option value="purchase">구매</option>
                  <option value="salary">급여</option>
                  <option value="donation">기부</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">정렬</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="date">최신순</option>
                  <option value="amount">금액순</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 거래 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {sortedTransactions.map((transaction) => (
            <li key={transaction.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.fromStudentName} → {transaction.toStudentName}
                        </p>
                        <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getTransactionColor(transaction.type)}`}>
                          {getTypeLabel(transaction.type)}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-500">{transaction.description}</p>
                        <span className="mx-2 text-gray-300">•</span>
                        <p className="text-sm text-gray-500">{formatTimeAgo(transaction.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-lg font-semibold text-gray-900">
                      {transaction.amount.toLocaleString()}{currentClass.currencyUnit}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">거래 내역이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              아직 거래가 발생하지 않았습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;