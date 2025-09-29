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

  // Debug: Log data whenever component renders
  useEffect(() => {
    console.log('[DEBUG] Students component render - students:', students?.length, 'jobs:', jobs?.length);
    console.log('[DEBUG] Students with jobId:', students?.filter(s => s.jobId)?.map(s => ({ name: s.name, jobId: s.jobId })));
    console.log('[DEBUG] Jobs available:', jobs?.map(j => ({ id: j.id, title: j.title })));

    // 직업이 있는 학생들의 직업 매칭 확인
    students?.forEach(student => {
      if (student.jobId) {
        const job = jobs.find(j => j.id === student.jobId);
        console.log(`[DEBUG] Student ${student.name} has jobId ${student.jobId}, matched job:`, job ? job.title : 'NOT FOUND');
      }
    });
  }, [students, jobs]);

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
    if (!jobId) {
      return '직업 없음';
    }
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      console.warn(`[DEBUG] Job not found for jobId: ${jobId}. Jobs array has ${jobs.length} jobs.`);
      return '직업 없음';
    }
    return job.title;
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
            <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
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
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              일괄 급여 지급
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
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
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
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
                  <div className="p-3 bg-green-50 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
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
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">평균 잔고</dt>
                    <dd className="text-2xl font-bold text-amber-600">
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
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
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

        {/* 검색 및 필터 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="학생 이름 검색..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent">
              <option value="">모든 직업</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            총 {students.length}명
          </div>
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
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">
                      PIN: {student.pin4 || '****'}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedStudentForActions(selectedStudentForActions === student.id ? null : student.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <span className="text-gray-600">⚙️</span>
                    </button>
                    {selectedStudentForActions === student.id && (
                      <div className="absolute right-0 top-12 bg-white shadow-lg border rounded-lg p-2 z-20 min-w-48">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              navigate(`/portfolio/${student.id}`);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 text-gray-700 hover:bg-gray-50 text-left transition-colors rounded-md flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            포트폴리오 보기
                          </button>
                          {student.jobId && (
                            <button
                              onClick={() => {
                                viewIndividualPayslip(student);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-xs px-3 py-2 text-gray-700 hover:bg-gray-50 text-left transition-colors rounded-md flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              급여명세서
                            </button>
                          )}
                          <div className="border-t my-1"></div>
                          <button
                            onClick={() => {
                              handleBalanceAdjustment(student, 1000);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 text-gray-700 hover:bg-gray-50 text-left transition-colors rounded-md flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            보너스 +1,000
                          </button>
                          <button
                            onClick={() => {
                              handleBalanceAdjustment(student, -1000);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 text-gray-700 hover:bg-gray-50 text-left transition-colors rounded-md flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            벌금 -1,000
                          </button>
                          <div className="border-t my-1"></div>
                          <button
                            onClick={() => {
                              handleDelete(student.id);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-xs px-3 py-2 text-red-600 hover:bg-red-50 text-left transition-colors rounded-md flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            학생 삭제
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
                      {student.balance.toLocaleString()}{currentClass.currencyUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">직업</span>
                    {student.jobId ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800">
                        {getJobTitle(student.jobId) === '직업 없음' ? `ID: ${student.jobId.substring(0, 8)}...` : getJobTitle(student.jobId)}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600">
                        무직
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
                      {student.creditGrade || 'B'}
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
                      {(getInterestRate(student.creditScore || 650) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>


                {/* 업적 */}
                {student.achievements && student.achievements.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex flex-wrap gap-1">
                      {student.achievements.slice(0, 2).map((achievement, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          {achievement}
                        </span>
                      ))}
                      {student.achievements.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{student.achievements.length - 2}
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
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      명세서
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(student)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    수정
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
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {student.name}
                          </div>
                          <div className="ml-3 flex items-center space-x-2">
                            <span className="px-3 py-1 text-sm font-bold rounded-lg bg-green-100 text-green-800">
                              {student.balance.toLocaleString()}{currentClass.currencyUnit}
                            </span>
                            {student.jobId ? (
                              <span className="px-3 py-1 text-sm font-semibold rounded-lg bg-blue-100 text-blue-800">
                                {getJobTitle(student.jobId) === '직업 없음' ? `ID: ${student.jobId.substring(0, 8)}...` : getJobTitle(student.jobId)}
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-sm font-medium rounded-lg bg-gray-100 text-gray-600">
                                무직
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 신용등급 */}
                        <div className="mt-3 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">신용등급:</span>
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
                            <span className="text-sm text-gray-600">예금이자:</span>
                            <span className="text-sm font-semibold text-green-600">
                              {(getInterestRate(student.creditScore || 650) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* 업적 표시 */}
                        {student.achievements && student.achievements.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {student.achievements.slice(0, 3).map((achievement, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                  {achievement}
                                </span>
                              ))}
                              {student.achievements.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{student.achievements.length - 3}
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
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          급여명세서
                        </button>
                      )}

                      {/* 수정 버튼 */}
                      <button
                        onClick={() => handleEdit(student)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        수정
                      </button>

                      {/* 관리 드롭다운 메뉴 */}
                      <div className="relative">
                        <button
                          onClick={() => setSelectedStudentForActions(selectedStudentForActions === student.id ? null : student.id)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                          더보기
                          <svg className={`ml-1 w-4 h-4 transition-transform ${selectedStudentForActions === student.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {selectedStudentForActions === student.id && (
                          <div className="absolute right-0 top-10 bg-white shadow-lg border border-gray-200 rounded-lg py-2 z-20 w-48">
                            <button
                              onClick={() => {
                                navigate(`/portfolio/${student.id}`);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              포트폴리오 보기
                            </button>
                            {student.jobId && (
                              <button
                                onClick={() => {
                                  viewIndividualPayslip(student);
                                  setSelectedStudentForActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                급여명세서
                              </button>
                            )}
                            <div className="border-t my-1"></div>
                            <button
                              onClick={() => {
                                handleBalanceAdjustment(student, 1000);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              보너스 +1,000
                            </button>
                            <button
                              onClick={() => {
                                handleBalanceAdjustment(student, -1000);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              벌금 -1,000
                            </button>
                            <div className="border-t my-1"></div>
                            <button
                              onClick={() => {
                                handleDelete(student.id);
                                setSelectedStudentForActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              학생 삭제
                            </button>
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