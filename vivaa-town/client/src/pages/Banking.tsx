import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCurrentClassroom, useCurrentStudents } from '../state';
import { useSavingsStore } from '../state/savingsStore';
import { useStudentStore } from '../state/studentStore';
import { useNotifications } from '../components/NotificationSystem';
import type { SavingsAccount } from '../schemas';

interface SavingsFormData {
  studentId: string;
  type: 'savings' | 'deposit';
  name: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyDeposit: number;
}

function Banking() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const currentClass = useCurrentClassroom();
  const students = useCurrentStudents();

  const {
    savingsAccounts,
    createSavingsAccount,
    getSavingsAccountsByClassroom,
    makeMonthlyDeposit,
    withdrawFromSavings,
    calculateMaturityAmount,
    processMaturity,
    calculateCurrentBalance,
    getRemainingMonths,
    getMonthlyInterest,
    loadSavingsAccounts
  } = useSavingsStore();

  const { updateStudent, getStudent } = useStudentStore();
  const { showEventNotification } = useNotifications();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SavingsFormData>();

  const watchType = watch('type');

  // 컴포넌트 마운트 시 데이터 로드
  React.useEffect(() => {
    loadSavingsAccounts();
  }, [loadSavingsAccounts]);

  const onSubmit = (data: SavingsFormData) => {
    if (!currentClass) return;

    const student = getStudent(data.studentId);
    if (!student) return;

    // 예금의 경우 초기 원금이 필요
    if (data.type === 'deposit' && student.balance < data.principal) {
      showEventNotification('❌ 잔액 부족', '예금 개설을 위한 잔액이 부족합니다.');
      return;
    }

    const account = createSavingsAccount({
      classroomId: currentClass.id,
      studentId: data.studentId,
      type: data.type,
      name: data.name,
      principal: data.principal,
      interestRate: data.interestRate,
      termMonths: data.termMonths,
      monthlyDeposit: data.monthlyDeposit || 0,
    });

    // 예금의 경우 학생 잔고에서 차감
    if (data.type === 'deposit') {
      updateStudent(data.studentId, {
        balance: student.balance - data.principal
      });
    }

    showEventNotification(
      '🏦 계좌 개설 완료!',
      `${student.name}님의 ${data.type === 'deposit' ? '예금' : '적금'} 계좌가 개설되었습니다.`
    );

    setIsCreating(false);
    reset();
  };

  const handleDeposit = () => {
    if (!selectedAccount || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    const student = getStudent(selectedAccount.studentId);

    if (!student) return;

    if (selectedAccount.type === 'savings') {
      // 적금 납입
      if (student.balance < amount) {
        showEventNotification('❌ 잔액 부족', '납입할 금액이 부족합니다.');
        return;
      }

      makeMonthlyDeposit(selectedAccount.id, amount);
      updateStudent(selectedAccount.studentId, {
        balance: student.balance - amount
      });

      showEventNotification(
        '💰 적금 납입 완료!',
        `${amount.toLocaleString()}${currentClass?.currencyUnit}가 납입되었습니다.`
      );
    } else {
      // 예금 추가 입금
      if (student.balance < amount) {
        showEventNotification('❌ 잔액 부족', '입금할 금액이 부족합니다.');
        return;
      }

      makeMonthlyDeposit(selectedAccount.id, amount);
      updateStudent(selectedAccount.studentId, {
        balance: student.balance - amount
      });

      showEventNotification(
        '💰 예금 입금 완료!',
        `${amount.toLocaleString()}${currentClass?.currencyUnit}가 입금되었습니다.`
      );
    }

    setDepositAmount('');
    setSelectedAccount(null);
  };

  const handleWithdraw = (account: SavingsAccount) => {
    const student = getStudent(account.studentId);
    if (!student) return;

    const currentBalance = calculateCurrentBalance(account);
    const isMatured = new Date(account.maturityDate) <= new Date();

    let withdrawAmount = currentBalance;
    if (!isMatured) {
      // 중도해지 시 패널티 적용
      const penalty = getMonthlyInterest(account) * getRemainingMonths(account) * 0.5;
      withdrawAmount = Math.max(account.principal, currentBalance - penalty);

      if (!window.confirm(
        `중도해지 시 ${penalty.toLocaleString()}${currentClass?.currencyUnit}의 이자 손실이 있습니다. 계속하시겠습니까?`
      )) {
        return;
      }
    }

    if (withdrawFromSavings(account.id, withdrawAmount)) {
      updateStudent(account.studentId, {
        balance: student.balance + withdrawAmount
      });

      showEventNotification(
        '💳 출금 완료!',
        `${withdrawAmount.toLocaleString()}${currentClass?.currencyUnit}가 출금되었습니다.`
      );
    }
  };

  const handleMaturity = (account: SavingsAccount) => {
    const student = getStudent(account.studentId);
    if (!student) return;

    const maturityAmount = calculateMaturityAmount(account.id);

    if (processMaturity(account.id)) {
      updateStudent(account.studentId, {
        balance: student.balance + maturityAmount
      });

      showEventNotification(
        '🎉 만기 처리 완료!',
        `${maturityAmount.toLocaleString()}${currentClass?.currencyUnit}가 지급되었습니다.`
      );
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : '알 수 없음';
  };

  const classroomAccounts = currentClass ? getSavingsAccountsByClassroom(currentClass.id) : [];

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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏦 은행</h1>
          <p className="mt-1 text-sm text-gray-500">
            예금과 적금으로 저축하는 습관을 길러보세요
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          새 계좌 개설
        </button>
      </div>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🏦</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 계좌 수</dt>
                  <dd className="text-2xl font-bold text-gray-900">{classroomAccounts.length}개</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 저축액</dt>
                  <dd className="text-2xl font-bold text-green-600">
                    {classroomAccounts
                      .reduce((sum, acc) => sum + calculateCurrentBalance(acc), 0)
                      .toLocaleString()
                    }{currentClass.currencyUnit}
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
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">만기 예정</dt>
                  <dd className="text-2xl font-bold text-blue-600">
                    {classroomAccounts.filter(acc =>
                      new Date(acc.maturityDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    ).length}개
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 계좌 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">계좌 목록</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            학급 내 모든 예금/적금 계좌를 관리합니다.
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {classroomAccounts.map((account) => {
            const currentBalance = calculateCurrentBalance(account);
            const remainingMonths = getRemainingMonths(account);
            const monthlyInterest = getMonthlyInterest(account);
            const isMatured = new Date(account.maturityDate) <= new Date();

            return (
              <li key={account.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-lg">
                          {account.type === 'deposit' ? '🏦' : '🐷'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {account.name}
                        </p>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          account.type === 'deposit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {account.type === 'deposit' ? '예금' : '적금'}
                        </span>
                        {isMatured && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            만기
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {getStudentName(account.studentId)} |
                        이자율: {account.interestRate}% |
                        잔여기간: {remainingMonths}개월
                      </p>
                      <p className="text-lg font-semibold text-green-600 mt-1">
                        현재잔액: {currentBalance.toLocaleString()}{currentClass.currencyUnit}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!isMatured && !account.isMatured && (
                      <button
                        onClick={() => setSelectedAccount(account)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200"
                      >
                        {account.type === 'deposit' ? '입금' : '납입'}
                      </button>
                    )}
                    {isMatured && !account.isMatured && (
                      <button
                        onClick={() => handleMaturity(account)}
                        className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full hover:bg-green-200"
                      >
                        만기처리
                      </button>
                    )}
                    <button
                      onClick={() => handleWithdraw(account)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200"
                    >
                      {isMatured ? '출금' : '중도해지'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {classroomAccounts.length === 0 && (
            <li className="px-4 py-12 text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">개설된 계좌가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                새 계좌를 개설해보세요.
              </p>
            </li>
          )}
        </ul>
      </div>

      {/* 계좌 개설 모달 */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 border max-w-2xl shadow-xl rounded-xl bg-white">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">🏦 새 계좌 개설</h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학생 선택 *
                    </label>
                    <select
                      {...register('studentId', { required: '학생을 선택하세요' })}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">학생을 선택하세요</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} (잔고: {student.balance.toLocaleString()}{currentClass.currencyUnit})
                        </option>
                      ))}
                    </select>
                    {errors.studentId && (
                      <p className="mt-2 text-sm text-red-600">{errors.studentId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상품 종류 *
                    </label>
                    <select
                      {...register('type', { required: '상품 종류를 선택하세요' })}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="deposit">예금 (한번에 맡기기)</option>
                      <option value="savings">적금 (매월 저축하기)</option>
                    </select>
                    {errors.type && (
                      <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: '상품명을 입력하세요' })}
                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="예: 미래를 위한 적금"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {watchType === 'deposit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        원금 *
                      </label>
                      <input
                        type="number"
                        {...register('principal', { required: '원금을 입력하세요', min: 1000 })}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                        placeholder="10000"
                      />
                      {errors.principal && (
                        <p className="mt-2 text-sm text-red-600">{errors.principal.message}</p>
                      )}
                    </div>
                  )}

                  {watchType === 'savings' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        월 납입액 *
                      </label>
                      <input
                        type="number"
                        {...register('monthlyDeposit', { required: '월 납입액을 입력하세요', min: 1000 })}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                        placeholder="5000"
                      />
                      {errors.monthlyDeposit && (
                        <p className="mt-2 text-sm text-red-600">{errors.monthlyDeposit.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연이자율 (%) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('interestRate', { required: '이자율을 입력하세요', min: 0.1, max: 20 })}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="3.5"
                    />
                    {errors.interestRate && (
                      <p className="mt-2 text-sm text-red-600">{errors.interestRate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      기간 (개월) *
                    </label>
                    <select
                      {...register('termMonths', { required: '기간을 선택하세요' })}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="3">3개월</option>
                      <option value="6">6개월</option>
                      <option value="12">1년</option>
                      <option value="24">2년</option>
                      <option value="36">3년</option>
                    </select>
                    {errors.termMonths && (
                      <p className="mt-2 text-sm text-red-600">{errors.termMonths.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 text-lg font-medium rounded-lg shadow-sm hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-green-700"
                  >
                    계좌 개설
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 입금/납입 모달 */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border max-w-md shadow-xl rounded-xl bg-white">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedAccount.type === 'deposit' ? '💰 예금 입금' : '🐷 적금 납입'}
                </h3>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">계좌: {selectedAccount.name}</p>
                <p className="text-sm text-gray-600">
                  소유자: {getStudentName(selectedAccount.studentId)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedAccount.type === 'deposit' ? '입금액' : '납입액'}
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="금액을 입력하세요"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {selectedAccount.type === 'deposit' ? '입금' : '납입'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Banking;