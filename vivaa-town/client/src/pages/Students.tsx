import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCurrentClassroom, useCurrentStudents, useCurrentJobs, useStudentStore } from '../state';
import { useNotifications } from '../components/NotificationSystem';

interface StudentFormData {
  name: string;
  pin4: string;
  balance: number;
  jobId: string;
}

interface PayrollItem {
  name: string;
  amount: number;
  type: 'income' | 'deduction';
  description: string;
}

interface PayrollResult {
  studentId: string;
  studentName: string;
  baseSalary: number;
  totalIncome: number;
  totalDeductions: number;
  netPay: number;
  details: PayrollItem[];
}

function Students() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showPayrollResults, setShowPayrollResults] = useState(false);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedStudentForActions, setSelectedStudentForActions] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedStudentForActions) {
        setSelectedStudentForActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedStudentForActions]);

  const currentClass = useCurrentClassroom();
  const students = useCurrentStudents();
  const jobs = useCurrentJobs();
  const {
    createStudent,
    updateStudent,
    deleteStudent,
    addTransaction,
    getCreditGrade,
    getInterestRate,
    addLateRecord,
    addHomeworkMissed,
    addBookOverdue,
    resetBehaviorRecord
  } = useStudentStore();
  const { showSalaryNotification, showEventNotification } = useNotifications();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentFormData>();

  // 급여 계산 함수
  const calculatePayroll = (student: any) => {
    const job = jobs.find(j => j.id === student.jobId);
    const baseSalary = job ? job.salary : 0;

    // 수입 항목들
    const income: PayrollItem[] = [
      { name: '기본급', amount: baseSalary, type: 'income', description: '직업 기본급여' },
    ];

    // 추가 수당 (랜덤하게 일부 학생에게)
    if (Math.random() > 0.7) {
      income.push({ name: '성과급', amount: Math.floor(baseSalary * 0.1), type: 'income', description: '우수 활동 보상' });
    }
    if (Math.random() > 0.8) {
      income.push({ name: '저작권료', amount: Math.floor(Math.random() * 500 + 200), type: 'income', description: '창작물 수익' });
    }
    if (Math.random() > 0.6) {
      income.push({ name: '출석 수당', amount: 300, type: 'income', description: '개근 보상' });
    }

    // 공제 항목들
    const deductions: PayrollItem[] = [];

    // 세금 (기본급의 8%)
    const incomeTax = Math.floor(baseSalary * 0.08);
    if (incomeTax > 0) {
      deductions.push({ name: '소득세', amount: incomeTax, type: 'deduction', description: '8% 세율 적용' });
    }

    // 기타 공제 항목들 (랜덤)
    if (Math.random() > 0.5) {
      deductions.push({ name: '자리임대료', amount: 200, type: 'deduction', description: '책상 사용료' });
    }
    if (Math.random() > 0.6) {
      deductions.push({ name: '전기요금', amount: 150, type: 'deduction', description: '전력 사용료' });
    }
    if (Math.random() > 0.7) {
      deductions.push({ name: '건강보험료', amount: Math.floor(baseSalary * 0.03), type: 'deduction', description: '3% 요율 적용' });
    }
    if (Math.random() > 0.4) {
      deductions.push({ name: '급식비', amount: 500, type: 'deduction', description: '점심 급식비' });
    }
    if (Math.random() > 0.8) {
      deductions.push({ name: '용품비', amount: 100, type: 'deduction', description: '학용품 구입비' });
    }

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    const netPay = totalIncome - totalDeductions;

    return {
      studentId: student.id,
      studentName: student.name,
      baseSalary,
      totalIncome,
      totalDeductions,
      netPay,
      details: [...income, ...deductions]
    };
  };

  // 일괄 급여 지급
  const processBulkPayroll = () => {
    const results: PayrollResult[] = [];
    const studentsWithJobs = students.filter(student => student.jobId);

    studentsWithJobs.forEach(student => {
      const payrollResult = calculatePayroll(student);
      results.push(payrollResult);

      // 실제 잔고 업데이트
      updateStudent(student.id, {
        balance: student.balance + payrollResult.netPay
      });

      // 게이미피케이션: 급여 받을 때 경험치와 거래 기록 추가
      addTransaction(student.id, payrollResult.netPay);

      // 개별 알림
      showSalaryNotification(student.name, payrollResult.netPay, currentClass!.currencyUnit);
    });

    setPayrollResults(results);
    setShowPayrollResults(true);
    setShowPayrollModal(false);

    // 전체 알림
    showEventNotification(
      '💰 급여 일괄 지급 완료!',
      `${studentsWithJobs.length}명의 학생에게 급여가 지급되었습니다.`
    );
  };

  // 개별 급여명세서 보기
  const viewIndividualPayslip = (student: any) => {
    const payrollResult = calculatePayroll(student);
    setPayrollResults([payrollResult]);
    setSelectedStudent(student);
    setShowPayrollResults(true);
  };

  const onSubmit = (data: StudentFormData) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: data.name,
        pin4: data.pin4 || undefined,
        balance: data.balance,
        jobId: data.jobId || undefined,
      });
    } else {
      createStudent({
        classroomId: currentClass!.id,
        name: data.name,
        pin4: data.pin4 || undefined,
        balance: data.balance || 10000,
        jobId: data.jobId || undefined,
      });
    }

    setIsCreating(false);
    setEditingStudent(null);
    reset();
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsCreating(true);
    reset({
      name: student.name,
      pin4: student.pin4 || '',
      balance: student.balance,
      jobId: student.jobId || '',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 학생을 삭제하시겠습니까?')) {
      deleteStudent(id);
    }
  };

  const handleBalanceAdjustment = (student: any, amount: number) => {
    const reason = amount > 0 ? '보너스 지급' : '벌금 부과';
    if (window.confirm(`${student.name}에게 ${Math.abs(amount).toLocaleString()}${currentClass?.currencyUnit} ${reason}하시겠습니까?`)) {
      updateStudent(student.id, {
        balance: student.balance + amount,
      });
    }
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingStudent(null);
    reset();
  };

  const getJobTitle = (jobId: string | undefined) => {
    if (!jobId) return '직업 없음';
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : '직업 없음';
  };

  const getJobSalary = (jobId: string | undefined) => {
    if (!jobId) return 0;
    const job = jobs.find(j => j.id === jobId);
    return job ? job.salary : 0;
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

  const studentsWithJobs = students.filter(student => student.jobId);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* 헤더 및 통계 */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">학생 관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              {currentClass.name} 학급 대시보드
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPayrollModal(true)}
              disabled={studentsWithJobs.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              💰 일괄 급여 지급
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
            >
              새 학생 추가
            </button>
          </div>
        </div>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">총 학생 수</dt>
                    <dd className="text-2xl font-bold text-gray-900">{students.length}명</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💼</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">직업 보유</dt>
                    <dd className="text-2xl font-bold text-green-600">{studentsWithJobs.length}명</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">평균 잔고</dt>
                    <dd className="text-2xl font-bold text-blue-600">
                      {students.length > 0
                        ? Math.round(students.reduce((sum, s) => sum + s.balance, 0) / students.length).toLocaleString()
                        : 0
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
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">평균 신용점수</dt>
                    <dd className="text-2xl font-bold text-purple-600">
                      {students.length > 0
                        ? Math.round(students.reduce((sum, s) => sum + (s.creditScore || 650), 0) / students.length)
                        : 650
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 보기 모드 토글 */}
        <div className="flex justify-end items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">보기 모드:</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                📄 목록 보기
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  viewMode === 'grid'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 카드 보기
              </button>
            </div>
          </div>
          {/* 필터링 옵션 추가 예정 */}
        </div>
      </div>

      {/* 급여 지급 확인 모달 */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border max-w-4xl shadow-xl rounded-xl bg-white">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  💰 급여 일괄 지급
                </h3>
                <button
                  onClick={() => setShowPayrollModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium text-blue-900">급여 지급 요약</h4>
                    <p className="text-blue-700">
                      총 <span className="font-bold">{studentsWithJobs.length}명</span>의 직업 보유 학생에게 급여를 지급합니다.
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      총 지급 예정액: <span className="font-bold">
                        {studentsWithJobs.reduce((sum, student) => sum + getJobSalary(student.jobId), 0).toLocaleString()}{currentClass.currencyUnit}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  👥 지급 대상 목록
                </h4>
                <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">학생명</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">직책</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">기본급</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">세금</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">실수령액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsWithJobs.map((student, index) => {
                        const baseSalary = getJobSalary(student.jobId);
                        const tax = Math.floor(baseSalary * (currentClass.settings.taxRate / 100));
                        const netPay = baseSalary - tax;

                        return (
                          <tr key={student.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                            <td className="py-3 px-4 text-gray-700">{getJobTitle(student.jobId)}</td>
                            <td className="py-3 px-4 text-right text-blue-600 font-medium">
                              {baseSalary.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="py-3 px-4 text-right text-red-600">
                              -{tax.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="py-3 px-4 text-right text-green-600 font-bold">
                              {netPay.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={processBulkPayroll}
                  className="flex-1 px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <span className="mr-2">💳</span>
                  급여 지급 실행
                </button>
                <button
                  onClick={() => setShowPayrollModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 text-lg font-medium rounded-lg shadow-sm hover:bg-gray-300 transition-colors duration-200"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 급여명세서 모달 */}
      {showPayrollResults && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border max-w-6xl shadow-xl rounded-xl bg-white min-h-[90vh]">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedStudent ? `${selectedStudent.name} 급여명세서` : '급여 지급 결과'}
                </h3>
                <button
                  onClick={() => {
                    setShowPayrollResults(false);
                    setSelectedStudent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto">
                {payrollResults.map((result, index) => (
                  <div key={index} className="mb-6 bg-white border border-gray-300 shadow-sm">
                    {/* 헤더 */}
                    <div className="bg-gray-100 border-b border-gray-300 p-4">
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-gray-800">{currentClass.name} 급여명세서</h4>
                        <p className="text-sm text-gray-600 mt-1">지급일: {new Date().toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>

                    {/* 개인정보 */}
                    <div className="border-b border-gray-300 p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">성명:</span>
                          <span className="ml-2 font-semibold">{result.studentName}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">직책:</span>
                          <span className="ml-2">{result.details.find(d => d.type === 'income')?.name || '무직'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 급여내역 테이블 */}
                    <div className="p-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">항목</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">지급액</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">공제액</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">비고</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* 수입 항목들 */}
                          {result.details.filter(item => item.type === 'income').map((item, idx) => (
                            <tr key={`income-${idx}`} className="border-b border-gray-200">
                              <td className="py-2 px-3">{item.name}</td>
                              <td className="py-2 px-3 text-right text-blue-600 font-medium">
                                {item.amount.toLocaleString()}{currentClass.currencyUnit}
                              </td>
                              <td className="py-2 px-3 text-right">-</td>
                              <td className="py-2 px-3 text-right text-xs text-gray-500">기본급여</td>
                            </tr>
                          ))}

                          {/* 공제 항목들 */}
                          {result.details.filter(item => item.type === 'deduction').map((item, idx) => (
                            <tr key={`deduction-${idx}`} className="border-b border-gray-200">
                              <td className="py-2 px-3">{item.name}</td>
                              <td className="py-2 px-3 text-right">-</td>
                              <td className="py-2 px-3 text-right text-red-600 font-medium">
                                {item.amount.toLocaleString()}{currentClass.currencyUnit}
                              </td>
                              <td className="py-2 px-3 text-right text-xs text-gray-500">세금</td>
                            </tr>
                          ))}

                          {/* 합계 행 */}
                          <tr className="border-t-2 border-gray-400 bg-gray-50">
                            <td className="py-3 px-3 font-bold">합계</td>
                            <td className="py-3 px-3 text-right font-bold text-blue-600">
                              {result.totalIncome.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-red-600">
                              {result.totalDeductions.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="py-3 px-3 text-right"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 실수령액 */}
                    <div className="border-t-2 border-gray-400 bg-blue-50 p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">실지급액</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {result.netPay.toLocaleString()}{currentClass.currencyUnit}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        * 위 금액은 {currentClass.name} 계좌로 입금되었습니다.
                      </p>
                    </div>

                    {/* 서명란 */}
                    <div className="border-t border-gray-300 p-4 bg-gray-50">
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-gray-600">지급인: {currentClass.name} 담당교사</p>
                          <p className="text-gray-600 mt-1">서명: ________________</p>
                        </div>
                        <div>
                          <p className="text-gray-600">수령인: {result.studentName}</p>
                          <p className="text-gray-600 mt-1">서명: ________________</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 학생 생성/수정 폼 */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 border max-w-2xl shadow-xl rounded-xl bg-white">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  {editingStudent ? '✏️ 학생 정보 수정' : '👤 새 학생 추가'}
                </h3>
                <button
                  onClick={cancelForm}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    📝 기본 정보
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        학생 이름 *
                      </label>
                      <input
                        type="text"
                        {...register('name', { required: '학생 이름을 입력하세요' })}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base py-3 px-4"
                        placeholder="학생 이름을 입력하세요"
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PIN 번호 (4자리, 선택)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        {...register('pin4')}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base py-3 px-4"
                        placeholder="예: 1234"
                      />
                      <p className="mt-1 text-xs text-gray-500">비워두면 자동 생성됩니다</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    💰 경제 정보
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        초기 잔고
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          {...register('balance', { valueAsNumber: true })}
                          className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base py-3 px-4 pr-16"
                          placeholder="10000"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">{currentClass.currencyUnit}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        직업 배정
                      </label>
                      <select
                        {...register('jobId')}
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-base py-3 px-4"
                      >
                        <option value="">직업 없음</option>
                        {jobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} (급여: {job.salary.toLocaleString()}{currentClass.currencyUnit})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 text-lg font-medium rounded-lg shadow-sm hover:bg-gray-300 transition-colors duration-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-sky-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors duration-200"
                  >
                    {editingStudent ? '수정 완료' : '학생 추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 학생 목록 */}
      {viewMode === 'grid' ? (
        // 카드 그리드 보기
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {/* 카드 헤더 */}
              <div className="bg-gray-100 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-lg font-bold text-gray-700">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">
                        PIN: {student.pin4 || '****'}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedStudentForActions(selectedStudentForActions === student.id ? null : student.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <span className="text-gray-600">⚙️</span>
                    </button>
                    {selectedStudentForActions === student.id && (
                      <div className="absolute right-0 top-12 bg-white shadow-lg border rounded-lg p-2 z-20 min-w-52">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500 px-2 py-1 border-b">학생 관리</div>
                          <button
                            onClick={() => {
                              navigate(`/portfolio/${student.id}`);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-indigo-50 text-indigo-800 rounded-md hover:bg-indigo-100 text-left transition-colors"
                          >
                            📊 포트폴리오 보기
                          </button>
                          <button
                            onClick={() => {
                              viewIndividualPayslip(student);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-blue-50 text-blue-800 rounded-md hover:bg-blue-100 text-left transition-colors"
                          >
                            💳 급여명세서
                          </button>
                          <div className="text-xs text-gray-500 px-2 py-1 border-b border-t mt-2">신용 관리</div>
                          <button
                            onClick={() => {
                              addLateRecord(student.id);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-orange-50 text-orange-800 rounded-md hover:bg-orange-100 text-left transition-colors"
                          >
                            📝 지각 기록 (-10점)
                          </button>
                          <button
                            onClick={() => {
                              addHomeworkMissed(student.id);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-red-50 text-red-800 rounded-md hover:bg-red-100 text-left transition-colors"
                          >
                            📚 숙제 미제출 (-15점)
                          </button>
                          <button
                            onClick={() => {
                              addBookOverdue(student.id);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-purple-50 text-purple-800 rounded-md hover:bg-purple-100 text-left transition-colors"
                          >
                            📖 도서 연체 (-20점)
                          </button>
                          <div className="text-xs text-gray-500 px-2 py-1 border-b border-t mt-2">잔액 조정</div>
                          <button
                            onClick={() => {
                              handleBalanceAdjustment(student, 1000);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-green-50 text-green-800 rounded-md hover:bg-green-100 text-left transition-colors"
                          >
                            💰 +1,000{currentClass.currencyUnit}
                          </button>
                          <button
                            onClick={() => {
                              handleBalanceAdjustment(student, -1000);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-red-50 text-red-800 rounded-md hover:bg-red-100 text-left transition-colors"
                          >
                            💸 -1,000{currentClass.currencyUnit}
                          </button>
                          <div className="text-xs text-gray-500 px-2 py-1 border-b border-t mt-2">위험 작업</div>
                          <button
                            onClick={() => {
                              handleDelete(student.id);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 bg-red-50 text-red-800 rounded-md hover:bg-red-100 text-left transition-colors"
                          >
                            🗑️ 학생 삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 카드 내용 */}
              <div className="p-4 space-y-4">
                {/* 잔고 및 직업 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">잔고</span>
                    <span className="text-lg font-bold text-green-600">
                      💰 {student.balance.toLocaleString()}{currentClass.currencyUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">직업</span>
                    {student.jobId ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800">
                        💼 {getJobTitle(student.jobId)}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600">
                        💤 무직
                      </span>
                    )}
                  </div>
                </div>

                {/* 신용 정보 */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">신용등급</span>
                    <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                      student.creditGrade === 'A+' || student.creditGrade === 'A' ? 'bg-green-100 text-green-800' :
                      student.creditGrade === 'B+' || student.creditGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                      student.creditGrade === 'C+' || student.creditGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      🏆 {student.creditGrade || 'B'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">신용점수</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {student.creditScore || 650}점
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">예금이자</span>
                    <span className="text-sm font-semibold text-green-600">
                      💳 {(getInterestRate(student.creditScore || 650) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 행동 기록 */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <div className="text-orange-800 font-semibold">⏰ {student.lateCount || 0}</div>
                    <div className="text-orange-600">지각</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="text-red-800 font-semibold">📚 {student.homeworkMissed || 0}</div>
                    <div className="text-red-600">숙제미제출</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="text-purple-800 font-semibold">📖 {student.bookOverdue || 0}</div>
                    <div className="text-purple-600">도서연체</div>
                  </div>
                </div>

                {/* 업적 */}
                {student.achievements && student.achievements.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">업적</div>
                    <div className="flex flex-wrap gap-1">
                      {student.achievements.slice(0, 2).map((achievement, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800">
                          🏆 {achievement}
                        </span>
                      ))}
                      {student.achievements.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{student.achievements.length - 2}개
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex space-x-2 pt-3 mt-3 border-t border-gray-200">
                  {student.jobId && (
                    <button
                      onClick={() => viewIndividualPayslip(student)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      💰 명세서
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(student)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ✏️ 수정
                  </button>
                </div>
              </div>
            </div>
          ))}

          {students.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 학생이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                새 학생을 추가해보세요.
              </p>
            </div>
          )}
        </div>
      ) : (
        // 목록 보기
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {students.map((student) => (
              <li key={student.id}>
                <div className="px-6 py-5 sm:px-8 bg-white hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-lg font-bold text-gray-600">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {student.name}
                          </div>
                          <div className="ml-3 flex items-center space-x-2">
                            <span className="px-3 py-1 text-sm font-bold rounded-lg bg-green-100 text-green-800">
                              💰 {student.balance.toLocaleString()}{currentClass.currencyUnit}
                            </span>
                            {student.jobId ? (
                              <span className="px-3 py-1 text-sm font-semibold rounded-lg bg-blue-100 text-blue-800">
                                💼 {getJobTitle(student.jobId)}
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-sm font-medium rounded-lg bg-gray-100 text-gray-600">
                                💤 무직
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 신용등급 및 행동 기록 */}
                        <div className="mt-3 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">🏆 신용등급:</span>
                                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                                  student.creditGrade === 'A+' || student.creditGrade === 'A' ? 'bg-green-100 text-green-800' :
                                  student.creditGrade === 'B+' || student.creditGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                                  student.creditGrade === 'C+' || student.creditGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {student.creditGrade || 'B'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">점수:</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {student.creditScore || 650}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">💳 예금이자:</span>
                                <span className="text-sm font-semibold text-green-600">
                                  {(getInterestRate(student.creditScore || 650) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 행동 기록 */}
                          <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                            <span>⏰ 지각: <strong>{student.lateCount || 0}회</strong></span>
                            <span>📚 숙제미제출: <strong>{student.homeworkMissed || 0}회</strong></span>
                            <span>📖 도서연체: <strong>{student.bookOverdue || 0}회</strong></span>
                          </div>
                        </div>

                        {/* 업적 표시 */}
                        {student.achievements && student.achievements.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {student.achievements.slice(0, 3).map((achievement, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800">
                                  🏆 {achievement}
                                </span>
                              ))}
                              {student.achievements.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{student.achievements.length - 3}개 더
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 급여명세서 버튼 - 직업 있을 때만 */}
                      {student.jobId && (
                        <button
                          onClick={() => viewIndividualPayslip(student)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          💰 급여명세서
                        </button>
                      )}

                      {/* 수정 버튼 */}
                      <button
                        onClick={() => handleEdit(student)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        ✏️ 수정
                      </button>

                      {/* 관리 드롭다운 메뉴 */}
                      <div className="relative">
                        <button
                          onClick={() => setSelectedStudentForActions(selectedStudentForActions === student.id ? null : student.id)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ⚙️ 관리
                          <svg className={`ml-1 w-4 h-4 transition-transform ${selectedStudentForActions === student.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {selectedStudentForActions === student.id && (
                          <div className="absolute right-0 top-10 bg-white shadow-lg border border-gray-200 rounded-lg py-2 z-20 w-56">
                            {/* 학생 관리 섹션 */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">학생 관리</div>
                            <button
                              onClick={() => {
                                navigate(`/portfolio/${student.id}`);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <span>📊 포트폴리오 보기</span>
                            </button>
                            <button
                              onClick={() => {
                                viewIndividualPayslip(student);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <span>💳 급여명세서</span>
                            </button>

                            {/* 신용 관리 섹션 */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t mt-1">신용 관리</div>
                            <button
                              onClick={() => {
                                addLateRecord(student.id);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                            >
                              <span>⏰ 지각 기록</span>
                              <span className="text-xs text-orange-600">-10점</span>
                            </button>
                            <button
                              onClick={() => {
                                addHomeworkMissed(student.id);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                            >
                              <span>📚 숙제 미제출</span>
                              <span className="text-xs text-red-600">-15점</span>
                            </button>
                            <button
                              onClick={() => {
                                addBookOverdue(student.id);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                            >
                              <span>📖 도서 연체</span>
                              <span className="text-xs text-purple-600">-20점</span>
                            </button>


                            {/* 잔액 조정 섹션 */}
                            <div className="border-t mt-2 pt-2">
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">잔액 조정</div>
                              <button
                                onClick={() => {
                                  handleBalanceAdjustment(student, 1000);
                                  setSelectedStudentForActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              >
                                <span>💰 보너스 지급</span>
                                <span className="text-xs text-green-600">+1,000</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleBalanceAdjustment(student, -1000);
                                  setSelectedStudentForActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              >
                                <span>💸 벌금 부과</span>
                                <span className="text-xs text-red-600">-1,000</span>
                              </button>
                            </div>

                            {/* 삭제 섹션 */}
                            <div className="border-t mt-2 pt-2">
                              <button
                                onClick={() => {
                                  handleDelete(student.id);
                                  setSelectedStudentForActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                🗑️ 학생 삭제
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {students.length === 0 && (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 학생이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                새 학생을 추가해보세요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Students;