import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  TrendingUp,
  Users,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Wallet,
  PiggyBank,
  Trophy,
  Eye,
  EyeOff,
  Building,
  Target,
  X,
  DollarSign,
  Calendar,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Banknote,
  LineChart,
  Timer,
  Award,
  ShieldCheck,
  Home,
  FileText,
  Package,
  Activity,
  MoreVertical,
  Download,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  BarChart3,
  Percent
} from 'lucide-react';
import { useCurrentClassroom, useCurrentStudents } from '../state';
import { useSavingsStore } from '../state/savingsStore';
import { useStudentStore } from '../state/studentStore';
import { useBankAdminStore } from '../state/bankAdminStore';
import { useNotifications } from '../components/NotificationSystem';
import type { SavingsAccount } from '../schemas';

interface SavingsFormData {
  studentIds: string[];
  type: 'savings' | 'deposit';
  productTemplate: string;
  name: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyDeposit: number;
  applyToAll: boolean;
}

// 상품 템플릿 정의 함수 (은행장 설정 반영)
const getProductTemplates = (bankSettings: any) => {
  const baseRate = bankSettings?.baseInterestRate || 3.0;

  return [
    {
      id: 'goal-savings',
      icon: '🎯',
      name: '목표 달성 적금',
      type: 'savings' as const,
      baseRate: Math.max(baseRate, 1.0), // 기준금리와 동일하되 최소 1%
      termMonths: 6,
      description: '매월 꾸준히 저축하는 습관 형성',
      minAmount: 1000,
      maxAmount: 50000,
      color: 'bg-emerald-50 border-emerald-200'
    },
    {
      id: 'honor-deposit',
      icon: '🏆',
      name: '우등생 정기예금',
      type: 'deposit' as const,
      baseRate: Math.max(baseRate + 0.5, 1.5), // 기준금리 + 0.5%
      termMonths: 12,
      description: '신용등급 A 이상 전용 우대상품',
      minAmount: 10000,
      maxAmount: 100000,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'vip-special',
      icon: '💎',
      name: 'VIP 특별예금',
      type: 'deposit' as const,
      baseRate: Math.max(baseRate + 1.5, 2.5), // 기준금리 + 1.5%
      termMonths: 6,
      description: '고액 예치자를 위한 프리미엄 상품',
      minAmount: 50000,
      maxAmount: 500000,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'sprout-savings',
      icon: '🌱',
      name: '새싹 적금',
      type: 'savings' as const,
      baseRate: Math.max(baseRate - 0.5, 0.5), // 기준금리 - 0.5%
      termMonths: 3,
      description: '소액으로 시작하는 첫 저축',
      minAmount: 500,
      maxAmount: 10000,
      color: 'bg-green-50 border-green-200'
    }
  ];
};

function Banking() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'products' | 'transactions' | 'admin'>('dashboard');
  const [showBalance, setShowBalance] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const currentClass = useCurrentClassroom();
  const students = useCurrentStudents();
  const {
    savingsAccounts,
    createSavingsAccount,
    getSavingsAccountsByClassroom,
    getSavingsAccountsByStudent,
    calculateCurrentBalance,
    getRemainingMonths,
    getMonthlyInterest,
    calculateMaturityAmount,
    processMaturity,
    withdrawFromSavings,
    getUpcomingMaturityAccounts
  } = useSavingsStore();

  const {
    getStudent,
    updateStudent,
    getCreditGrade,
    getInterestRate
  } = useStudentStore();

  const {
    getBankSettings,
    updateBaseRate,
    updateCreditGradeBonus,
    calculateBankStatistics
  } = useBankAdminStore();

  const { showEventNotification } = useNotifications();
  const { register, handleSubmit, reset, watch, setValue } = useForm<SavingsFormData>();
  const [newBaseRate, setNewBaseRate] = useState('');
  const [rateChangeReason, setRateChangeReason] = useState('');

  // 은행장 설정 (먼저 정의)
  const bankSettings = useMemo(() => {
    if (!currentClass) return null;
    return getBankSettings(currentClass.id);
  }, [currentClass, getBankSettings]);

  // 상품 템플릿 (은행장 설정 반영)
  const productTemplates = useMemo(() => {
    return getProductTemplates(bankSettings);
  }, [bankSettings]);

  const selectedTemplateData = productTemplates.find(t => t.id === selectedTemplate);
  const watchType = watch('type');

  // 학급의 모든 저축 계좌
  const classroomAccounts = useMemo(() => {
    if (!currentClass) return [];
    return getSavingsAccountsByClassroom(currentClass.id);
  }, [currentClass, getSavingsAccountsByClassroom, savingsAccounts]);

  // 총 예치금 계산
  const totalDeposits = useMemo(() => {
    return classroomAccounts.reduce((sum, acc) => sum + calculateCurrentBalance(acc), 0);
  }, [classroomAccounts, calculateCurrentBalance]);

  // 이번 달 예상 이자
  const monthlyInterestTotal = useMemo(() => {
    return classroomAccounts.reduce((sum, acc) => sum + getMonthlyInterest(acc), 0);
  }, [classroomAccounts, getMonthlyInterest]);

  // 만기 임박 계좌
  const upcomingMaturityAccounts = useMemo(() => {
    return getUpcomingMaturityAccounts(30);
  }, [getUpcomingMaturityAccounts, savingsAccounts]);

  // 은행 통계
  const bankStatistics = useMemo(() => {
    if (!currentClass) return null;
    return calculateBankStatistics(currentClass.id, students, classroomAccounts);
  }, [currentClass, students, classroomAccounts, calculateBankStatistics]);

  // 학생별 계좌 맵
  const studentAccountsMap = useMemo(() => {
    const map = new Map<string, SavingsAccount[]>();
    students.forEach(student => {
      map.set(student.id, getSavingsAccountsByStudent(student.id));
    });
    return map;
  }, [students, getSavingsAccountsByStudent, savingsAccounts]);

  // 신용등급에 따른 금리 계산 (은행장 설정 반영)
  const getInterestRateForStudent = (studentId: string, baseRate?: number) => {
    const student = getStudent(studentId);
    if (!student || !currentClass) return baseRate || 3.0;

    // 은행장이 설정한 기준금리와 우대금리 사용
    const settings = getBankSettings(currentClass.id);
    const actualBaseRate = baseRate || settings.baseInterestRate;
    const creditBonus = settings.creditGradeBonuses[student.creditGrade as keyof typeof settings.creditGradeBonuses] || 0;

    return Math.max(actualBaseRate + creditBonus, 0.1); // 최소 0.1%
  };

  // 상품 생성 처리
  const onSubmitCreate = (data: SavingsFormData) => {
    if (!currentClass) return;

    const selectedStudents = data.applyToAll ? students : students.filter(s => data.studentIds?.includes(s.id));

    selectedStudents.forEach(student => {
      const adjustedRate = getInterestRateForStudent(student.id, data.interestRate);

      createSavingsAccount({
        classroomId: currentClass.id,
        studentId: student.id,
        type: data.type,
        name: data.name,
        principal: data.type === 'deposit' ? data.principal : 0,
        monthlyDeposit: data.type === 'savings' ? data.monthlyDeposit : 0,
        interestRate: adjustedRate,
        termMonths: data.termMonths,
      });

      if (data.type === 'deposit') {
        const newBalance = Math.max(0, student.balance - data.principal);
        updateStudent(student.id, { balance: newBalance });
      }
    });

    showEventNotification(
      '✅ 상품 가입 완료',
      `${selectedStudents.length}명의 학생이 ${data.name}에 가입했습니다.`
    );

    setShowCreateModal(false);
    reset();
    setSelectedTemplate('');
  };

  // 출금 처리
  const handleWithdraw = (account: SavingsAccount) => {
    const student = getStudent(account.studentId);
    if (!student) return;

    const currentBalance = calculateCurrentBalance(account);
    const isMatured = new Date(account.maturityDate) <= new Date();

    let withdrawAmount = currentBalance;
    if (!isMatured) {
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
        '💰 출금 완료',
        `${withdrawAmount.toLocaleString()}${currentClass?.currencyUnit}가 출금되었습니다.`
      );
    }
  };

  // 만기 처리
  const handleMaturity = (account: SavingsAccount) => {
    const student = getStudent(account.studentId);
    if (!student) return;

    const maturityAmount = calculateMaturityAmount(account.id);

    if (processMaturity(account.id)) {
      updateStudent(account.studentId, {
        balance: student.balance + maturityAmount
      });

      showEventNotification(
        '🎉 만기 처리 완료',
        `${maturityAmount.toLocaleString()}${currentClass?.currencyUnit}가 지급되었습니다.`
      );
    }
  };

  if (!currentClass) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">학급이 선택되지 않았습니다</h3>
          <p className="text-sm text-gray-500">먼저 학급을 생성하거나 선택하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">비바 뱅크</h1>
              <p className="text-xs sm:text-sm opacity-80">{currentClass.name} 지점</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>상품 가입</span>
          </button>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div>
            <p className="text-xs opacity-60 mb-1">총 예치금</p>
            <div className="flex items-center gap-2">
              <p className="text-lg sm:text-xl font-bold">
                {showBalance ? (
                  <CountUp
                    end={totalDeposits}
                    duration={2}
                    separator=","
                    preserveValue={true}
                  />
                ) : (
                  '••••••'
                )}
              </p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/60 hover:text-white/80"
              >
                {showBalance ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs opacity-60 mb-1">월 예상이자</p>
            <p className="text-lg sm:text-xl font-bold">
              <CountUp end={monthlyInterestTotal} duration={1} separator="," />
            </p>
          </div>

          <div>
            <p className="text-xs opacity-60 mb-1">총 계좌수</p>
            <p className="text-lg sm:text-xl font-bold">{classroomAccounts.length}개</p>
          </div>

          <div>
            <p className="text-xs opacity-60 mb-1">만기 임박</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-300">{upcomingMaturityAccounts.length}개</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-slate-800 border-b-2 border-slate-600 bg-slate-50'
                : 'text-gray-600 hover:text-slate-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>대시보드</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'accounts'
                ? 'text-slate-800 border-b-2 border-slate-600 bg-slate-50'
                : 'text-gray-600 hover:text-slate-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>계좌 관리</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'text-slate-800 border-b-2 border-slate-600 bg-slate-50'
                : 'text-gray-600 hover:text-slate-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>상품 안내</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-slate-800 border-b-2 border-slate-600 bg-slate-50'
                : 'text-gray-600 hover:text-slate-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>거래 내역</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'admin'
                ? 'text-slate-800 border-b-2 border-slate-600 bg-slate-50'
                : 'text-gray-600 hover:text-slate-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>은행장</span>
            </div>
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {/* 대시보드 탭 */}
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* 빠른 통계 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                      <span className="text-xs text-emerald-600 font-medium">+15.2%</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {students.filter(s => studentAccountsMap.get(s.id)?.length).length}명
                    </p>
                    <p className="text-sm text-gray-600">가입 학생</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <Trophy className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">우수</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {students.filter(s => s.creditGrade === 'A+' || s.creditGrade === 'A').length}명
                    </p>
                    <p className="text-sm text-gray-600">A등급 이상</p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-5 h-5 text-slate-600" />
                      <span className="text-xs text-slate-600 font-medium">평균</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.creditScore, 0) / students.length) : 0}
                    </p>
                    <p className="text-sm text-gray-600">신용점수</p>
                  </div>
                </div>

                {/* 최근 만기 예정 */}
                {upcomingMaturityAccounts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">만기 임박 계좌</h3>
                    <div className="space-y-2">
                      {upcomingMaturityAccounts.slice(0, 3).map(account => {
                        const student = getStudent(account.studentId);
                        const daysLeft = getRemainingMonths(account) * 30;
                        return (
                          <div key={account.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-amber-600" />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{student?.name}</p>
                                <p className="text-xs text-gray-600">{account.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-amber-600">D-{daysLeft}</p>
                              <p className="text-xs text-gray-600">
                                {calculateMaturityAmount(account.id).toLocaleString()}원 예상
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 계좌 관리 탭 */}
            {activeTab === 'accounts' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {students.map(student => {
                  const accounts = studentAccountsMap.get(student.id) || [];
                  const totalBalance = accounts.reduce((sum, acc) => sum + calculateCurrentBalance(acc), 0);

                  if (accounts.length === 0) return null;

                  return (
                    <div key={student.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCard(expandedCard === student.id ? null : student.id)}
                        className="w-full px-3 sm:px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                            {student.name[0]}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{student.name}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600">신용등급</span>
                              <span className={`px-1.5 py-0.5 rounded font-medium ${
                                student.creditGrade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                student.creditGrade.startsWith('B') ? 'bg-slate-100 text-slate-700' :
                                student.creditGrade.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {student.creditGrade}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-600">총 예치금</p>
                            <p className="font-bold text-gray-900 text-sm sm:text-base">
                              {totalBalance.toLocaleString()} {currentClass.currencyUnit}
                            </p>
                          </div>
                          {expandedCard === student.id ? (
                            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {expandedCard === student.id && (
                        <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
                          <div className="space-y-2 sm:space-y-3">
                            {accounts.map(account => {
                              const currentBalance = calculateCurrentBalance(account);
                              const remainingMonths = getRemainingMonths(account);
                              const isMatured = remainingMonths === 0;

                              return (
                                <div key={account.id} className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    {account.type === 'deposit' ? (
                                      <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                                    ) : (
                                      <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                    )}
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm">{account.name}</p>
                                      <p className="text-xs text-gray-600">
                                        {account.interestRate.toFixed(1)}% · {remainingMonths}개월 남음
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <p className="font-bold text-gray-900 text-sm">
                                        {currentBalance.toLocaleString()}
                                      </p>
                                      {isMatured && (
                                        <span className="text-xs text-emerald-600 font-medium">만기</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isMatured) {
                                          handleMaturity(account);
                                        } else {
                                          handleWithdraw(account);
                                        }
                                      }}
                                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                        isMatured
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                      }`}
                                    >
                                      {isMatured ? '만기출금' : '중도해지'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {students.every(s => !(studentAccountsMap.get(s.id)?.length)) && (
                  <div className="text-center py-8 sm:py-12">
                    <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm sm:text-base">아직 가입한 계좌가 없습니다</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm sm:text-base"
                    >
                      첫 계좌 만들기
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 상품 안내 탭 */}
            {activeTab === 'products' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              >
                {productTemplates.map(product => (
                  <div
                    key={product.id}
                    className={`bg-white border-2 border-slate-200 hover:border-slate-300 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer`}
                    onClick={() => {
                      setSelectedTemplate(product.id);
                      setShowCreateModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl sm:text-2xl">{product.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{product.name}</h3>
                          <p className="text-xs text-gray-600">{product.type === 'deposit' ? '예금' : '적금'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-bold text-slate-700">{product.baseRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">기본금리</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{product.termMonths}개월</span>
                      <span>{product.minAmount.toLocaleString()} ~ {product.maxAmount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* 거래 내역 탭 */}
            {activeTab === 'transactions' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">최근 거래</h3>
                  <button className="text-xs sm:text-sm text-slate-600 hover:text-slate-700 font-medium">
                    전체보기
                  </button>
                </div>

                {/* 거래 내역 목록 (시뮬레이션) */}
                <div className="space-y-2">
                  {classroomAccounts.slice(0, 10).map((account, idx) => {
                    const student = getStudent(account.studentId);
                    const isDeposit = idx % 3 === 0;

                    return (
                      <div key={account.id + idx} className="flex items-center justify-between p-2 sm:p-3 hover:bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                            isDeposit ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}>
                            {isDeposit ? (
                              <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{student?.name}</p>
                            <p className="text-xs text-gray-600">{account.name} · {isDeposit ? '입금' : '이자'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${
                            isDeposit ? 'text-emerald-600' : 'text-gray-900'
                          }`}>
                            {isDeposit ? '+' : ''}{getMonthlyInterest(account).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date().toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 은행장 관리 탭 */}
            {activeTab === 'admin' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* 은행 현황 개요 */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 sm:p-6 text-white">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    은행 운영 현황
                  </h3>

                  {bankStatistics && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs opacity-60 mb-1">총 예치금</p>
                        <p className="text-xl font-bold">
                          <CountUp
                            end={bankStatistics.totalDeposits}
                            duration={2}
                            separator=","
                            preserveValue={true}
                          />
                          <span className="text-sm ml-1">{currentClass.currencyUnit}</span>
                        </p>
                        <p className={`text-xs mt-1 ${
                          bankStatistics.monthlyGrowth >= 0 ? 'text-green-300' : 'text-red-300'
                        }`}>
                          전월 대비 {bankStatistics.monthlyGrowth >= 0 ? '+' : ''}{bankStatistics.monthlyGrowth}%
                        </p>
                      </div>

                      <div>
                        <p className="text-xs opacity-60 mb-1">총 계좌수</p>
                        <p className="text-xl font-bold">{bankStatistics.totalAccounts}개</p>
                        <p className="text-xs mt-1 opacity-80">활성 계좌</p>
                      </div>

                      <div>
                        <p className="text-xs opacity-60 mb-1">평균 신용점수</p>
                        <p className="text-xl font-bold">{bankStatistics.averageCreditScore}점</p>
                        <p className="text-xs mt-1 opacity-80">전체 평균</p>
                      </div>

                      <div>
                        <p className="text-xs opacity-60 mb-1">현재 기준금리</p>
                        <p className="text-xl font-bold">{bankSettings?.baseInterestRate.toFixed(1)}%</p>
                        <p className="text-xs mt-1 opacity-80">연리 기준</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 신용점수 분포 차트 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-slate-600" />
                    신용등급 분포 현황
                  </h3>

                  {bankStatistics && (
                    <div className="space-y-3">
                      {Object.entries(bankStatistics.creditScoreDistribution).map(([grade, count]) => (
                        <div key={grade} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                              grade.startsWith('B') ? 'bg-slate-100 text-slate-700' :
                              grade.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {grade}
                            </span>
                            <span className="font-medium text-gray-900">{grade}등급</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  grade.startsWith('A') ? 'bg-emerald-500' :
                                  grade.startsWith('B') ? 'bg-slate-500' :
                                  grade.startsWith('C') ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{
                                  width: `${students.length > 0 ? (count / students.length) * 100 : 0}%`
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}명</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 기준금리 조정 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Percent className="w-5 h-5 text-slate-600" />
                      기준금리 조정
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">현재 기준금리</p>
                        <p className="text-2xl font-bold text-slate-700">
                          {bankSettings?.baseInterestRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          마지막 변경: {bankSettings?.lastUpdated ?
                            new Date(bankSettings.lastUpdated).toLocaleDateString('ko-KR') : 'N/A'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          새 기준금리 (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="20"
                          value={newBaseRate}
                          onChange={(e) => setNewBaseRate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                          placeholder="예: 3.5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          변경 사유
                        </label>
                        <input
                          type="text"
                          value={rateChangeReason}
                          onChange={(e) => setRateChangeReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                          placeholder="예: 경기 부양을 위한 금리 인하"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (!currentClass || !newBaseRate) return;

                          const rate = parseFloat(newBaseRate);
                          if (rate < 0 || rate > 20) {
                            showEventNotification('❌ 오류', '금리는 0%에서 20% 사이여야 합니다.');
                            return;
                          }

                          updateBaseRate(
                            currentClass.id,
                            rate,
                            rateChangeReason || '은행장 조정',
                            '은행장'
                          );

                          showEventNotification(
                            '✅ 기준금리 변경 완료',
                            `기준금리가 ${rate}%로 조정되었습니다.`
                          );

                          setNewBaseRate('');
                          setRateChangeReason('');
                        }}
                        disabled={!newBaseRate || !currentClass}
                        className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                      >
                        기준금리 변경
                      </button>
                    </div>
                  </div>

                  {/* 신용등급별 우대금리 설정 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-slate-600" />
                      우대금리 설정
                    </h3>

                    <div className="space-y-3">
                      {bankSettings && Object.entries(bankSettings.creditGradeBonuses).map(([grade, bonus]) => (
                        <div key={grade} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                              grade.startsWith('B') ? 'bg-slate-100 text-slate-700' :
                              grade.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {grade}
                            </span>
                            <span className="text-sm font-medium">{grade}등급</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              min="-5"
                              max="5"
                              value={bonus}
                              onChange={(e) => {
                                if (!currentClass) return;
                                const newBonus = parseFloat(e.target.value) || 0;
                                updateCreditGradeBonus(currentClass.id, grade as any, newBonus);
                              }}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-slate-500"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                          💡 팁: 양수는 우대금리, 음수는 불이익 금리를 의미합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 상품 가입 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">상품 가입</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  reset();
                  setSelectedTemplate('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitCreate)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* 상품 선택 */}
              {!selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    상품 선택
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {productTemplates.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setValue('type', template.type);
                          setValue('name', template.name);
                          setValue('interestRate', template.baseRate);
                          setValue('termMonths', template.termMonths);
                        }}
                        className={`p-3 text-left border rounded-lg hover:shadow-md transition-all ${
                          selectedTemplate === template.id
                            ? 'border-slate-500 bg-slate-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{template.icon}</span>
                          <span className="font-medium text-sm">{template.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {template.baseRate.toFixed(1)}% · {template.termMonths}개월
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate && (
                <>
                  {/* 선택된 상품 정보 */}
                  <div className={`${selectedTemplateData?.color} border rounded-lg p-4`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{selectedTemplateData?.icon}</span>
                      <div>
                        <h3 className="font-semibold">{selectedTemplateData?.name}</h3>
                        <p className="text-xs text-gray-600">{selectedTemplateData?.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* 학생 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      가입 대상
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('applyToAll')}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">전체 학생</span>
                      </label>

                      {!watch('applyToAll') && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {students.map(student => (
                            <label key={student.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                value={student.id}
                                {...register('studentIds')}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{student.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 금액 설정 */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTemplateData?.type === 'deposit' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          예치금액
                        </label>
                        <input
                          type="number"
                          {...register('principal', { required: true, min: selectedTemplateData.minAmount })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder={selectedTemplateData.minAmount.toLocaleString()}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          월 납입액
                        </label>
                        <input
                          type="number"
                          {...register('monthlyDeposit', { required: true, min: selectedTemplateData?.minAmount })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder={selectedTemplateData?.minAmount.toLocaleString()}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        가입 기간
                      </label>
                      <select
                        {...register('termMonths', { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="3">3개월</option>
                        <option value="6">6개월</option>
                        <option value="12">12개월</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                    setSelectedTemplate('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!selectedTemplate}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  가입하기
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Banking;