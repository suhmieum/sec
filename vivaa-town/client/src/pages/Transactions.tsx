import { useState } from 'react';
import { useCurrentClassroom, useCurrentStudents } from '../state';

function Transactions() {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

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
    },
    {
      id: '2',
      fromStudentName: '박민수',
      toStudentName: '학급상점',
      amount: 800,
      type: 'purchase',
      description: '볼펜 구매',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
    },
    {
      id: '3',
      fromStudentName: '학급',
      toStudentName: '최지우',
      amount: 3000,
      type: 'salary',
      description: '시장 급여',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
    },
    {
      id: '4',
      fromStudentName: '정수진',
      toStudentName: '기부함',
      amount: 500,
      type: 'donation',
      description: '어려운 친구 도움',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3시간 전
    },
    {
      id: '5',
      fromStudentName: '강태현',
      toStudentName: '윤서연',
      amount: 2000,
      type: 'transfer',
      description: '생일선물비',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4시간 전
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
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 거래액</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalAmount.toLocaleString()}{currentClass.currencyUnit}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">오늘 거래</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {todayTransactions.length}건
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">활성 학생</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {students.length}명
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
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