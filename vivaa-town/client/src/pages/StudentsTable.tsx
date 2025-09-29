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

function StudentsTable() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showPayrollResults, setShowPayrollResults] = useState(false);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedStudentForActions, setSelectedStudentForActions] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [sortField, setSortField] = useState<'name' | 'balance' | 'creditGrade' | 'creditScore'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // 드롭다운 메뉴 내부 클릭인지 확인
      const isDropdownClick = target.closest('.dropdown-menu') || target.closest('.kebab-button');

      if (selectedStudentForActions && !isDropdownClick) {
        setSelectedStudentForActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedStudentForActions]);

  const currentClass = useCurrentClassroom();
  const allStudents = useCurrentStudents();
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

  // 정렬 함수
  const handleSort = (field: 'name' | 'balance' | 'creditGrade' | 'creditScore') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 필터링 및 정렬된 학생 목록
  const students = allStudents
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesJob = !jobFilter || student.jobId === jobFilter;
      return matchesSearch && matchesJob;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'creditGrade':
          // 신용등급을 숫자로 변환해서 정렬
          const gradeOrder = { 'A+': 8, 'A': 7, 'B+': 6, 'B': 5, 'C+': 4, 'C': 3, 'D+': 2, 'D': 1 };
          aValue = gradeOrder[a.creditGrade as keyof typeof gradeOrder] || 5;
          bValue = gradeOrder[b.creditGrade as keyof typeof gradeOrder] || 5;
          break;
        case 'creditScore':
          aValue = a.creditScore || 650;
          bValue = b.creditScore || 650;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // 급여 계산 함수
  const calculatePayroll = (student: any) => {
    const job = jobs.find(j => j.id === student.jobId);
    const baseSalary = job ? job.salary : 0;

    const income: PayrollItem[] = [
      { name: '기본급', amount: baseSalary, type: 'income', description: '직업 기본급여' },
    ];

    // 추가 수당
    if (Math.random() > 0.7) {
      income.push({ name: '성과급', amount: Math.floor(baseSalary * 0.1), type: 'income', description: '우수 활동 보상' });
    }

    const deductions: PayrollItem[] = [];

    // 세금 계산 (기본급의 10%)
    const tax = Math.floor(baseSalary * (currentClass?.taxRate || 0.1));
    if (tax > 0) {
      deductions.push({
        name: '소득세',
        amount: tax,
        type: 'deduction',
        description: '국세청 납부'
      });
    }

    // 건강보험료 (기본급의 3%)
    const healthInsurance = Math.floor(baseSalary * 0.03);
    if (healthInsurance > 0) {
      deductions.push({
        name: '건강보험료',
        amount: healthInsurance,
        type: 'deduction',
        description: '의료보험 납부'
      });
    }

    // 국민연금 (기본급의 4.5%)
    const pension = Math.floor(baseSalary * 0.045);
    if (pension > 0) {
      deductions.push({
        name: '국민연금',
        amount: pension,
        type: 'deduction',
        description: '연금 적립'
      });
    }

    // 고용보험 (기본급의 0.9%)
    const employment = Math.floor(baseSalary * 0.009);
    if (employment > 0) {
      deductions.push({
        name: '고용보험',
        amount: employment,
        type: 'deduction',
        description: '실업급여 적립'
      });
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

      updateStudent(student.id, {
        balance: student.balance + payrollResult.netPay
      });

      addTransaction(student.id, payrollResult.netPay);
      showSalaryNotification(student.name, payrollResult.netPay, currentClass!.currencyUnit);
    });

    setPayrollResults(results);
    setShowPayrollResults(true);
    setShowPayrollModal(false);

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

  // 급여명세서 인쇄
  const handlePrintPayslip = () => {
    // 인쇄용 스타일 생성
    const printStyle = `
      <style>
        @media print {
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
          .payslip-container { width: 100%; max-width: 800px; margin: 0 auto; }
          .payslip-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .payslip-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .payslip-date { font-size: 12px; color: #666; }
          .employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; }
          .payslip-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .payslip-table th, .payslip-table td { border: 1px solid #333; padding: 8px; text-align: left; }
          .payslip-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .amount-right { text-align: right !important; }
          .amount-income { color: #0066cc; font-weight: bold; }
          .amount-deduction { color: #cc0000; font-weight: bold; }
          .total-row { background-color: #f0f0f0; font-weight: bold; }
          .net-pay { background-color: #e6f3ff; font-size: 14px; font-weight: bold; text-align: center; padding: 15px; border: 2px solid #0066cc; margin-top: 10px; }
          .no-print { display: none !important; }
        }
      </style>
    `;

    // 인쇄용 HTML 생성
    const printContent = payrollResults.map(result => `
      <div class="payslip-container">
        <div class="payslip-header">
          <div class="payslip-title">${currentClass?.name} 급여명세서</div>
          <div class="payslip-date">지급일: ${new Date().toLocaleDateString('ko-KR')}</div>
        </div>

        <div class="employee-info">
          <div><strong>성명:</strong> ${result.studentName}</div>
          <div><strong>직업:</strong> ${getStudentJobTitle(result.studentId)}</div>
        </div>

        <table class="payslip-table">
          <thead>
            <tr>
              <th>항목</th>
              <th>지급액</th>
              <th>공제액</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            ${result.details.filter(item => item.type === 'income').map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="amount-right amount-income">${item.amount.toLocaleString()}${currentClass?.currencyUnit || ''}</td>
                <td class="amount-right">-</td>
                <td>${item.description}</td>
              </tr>
            `).join('')}
            ${result.details.filter(item => item.type === 'deduction').map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="amount-right">-</td>
                <td class="amount-right amount-deduction">${item.amount.toLocaleString()}${currentClass?.currencyUnit || ''}</td>
                <td>${item.description}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>총 지급액</td>
              <td class="amount-right amount-income">${result.totalIncome.toLocaleString()}${currentClass?.currencyUnit || ''}</td>
              <td class="amount-right">-</td>
              <td>-</td>
            </tr>
            <tr class="total-row">
              <td>총 공제액</td>
              <td class="amount-right">-</td>
              <td class="amount-right amount-deduction">${result.totalDeductions.toLocaleString()}${currentClass?.currencyUnit || ''}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>

        <div class="net-pay">
          실지급액: ${result.netPay.toLocaleString()}${currentClass?.currencyUnit || ''}
          <br><small>* 위 금액은 ${currentClass?.name} 계좌로 입금되었습니다.</small>
        </div>
      </div>
      ${payrollResults.length > 1 ? '<div style="page-break-after: always;"></div>' : ''}
    `).join('');

    // 새 창에서 인쇄
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>급여명세서</title>
          <meta charset="utf-8">
          ${printStyle}
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();

      // 인쇄 대화상자 열기
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
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
      return '직업 없음';
    }
    return job.title;
  };

  // 학생의 직업명 가져오기
  const getStudentJobTitle = (studentId: string) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student || !student.jobId) return '무직';
    return getJobTitle(student.jobId);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">총 학생 수</span>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {allStudents.length}<span className="text-lg font-normal text-gray-600 ml-1">명</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">활성 학생 기준</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">고용률</span>
              <span className="text-2xl">💼</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {allStudents.length > 0 ? Math.round((studentsWithJobs.length / allStudents.length) * 100) : 0}<span className="text-lg font-normal text-gray-600 ml-1">%</span>
            </div>
            <div className="text-xs text-green-600 mt-2">{studentsWithJobs.length}/{allStudents.length} 고용</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">평균 자산</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {allStudents.length > 0
                ? Math.round(allStudents.reduce((sum, s) => sum + s.balance, 0) / allStudents.length).toLocaleString()
                : 0
              }<span className="text-lg font-normal text-gray-600 ml-1">{currentClass.currencyUnit}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">학생 {allStudents.length}명 기준</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">평균 신용등급</span>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(() => {
                const avgScore = allStudents.length > 0
                  ? Math.round(allStudents.reduce((sum, s) => sum + (s.creditScore || 650), 0) / allStudents.length)
                  : 650;
                const avgGrade = avgScore > 750 ? 'A+' : avgScore > 700 ? 'A' : avgScore > 650 ? 'B+' : avgScore > 600 ? 'B' : 'C';
                return avgGrade;
              })()}<span className="text-lg font-normal text-gray-600 ml-1">등급</span>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              {allStudents.length > 0
                ? Math.round(allStudents.reduce((sum, s) => sum + (s.creditScore || 650), 0) / allStudents.length)
                : 650
              }점 평균
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
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

      {/* 학생 테이블 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>학생명</span>
                    <svg className={`w-4 h-4 transition-transform ${
                      sortField === 'name' ? (sortDirection === 'asc' ? 'rotate-0' : 'rotate-180') : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('balance')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>잔고</span>
                    <svg className={`w-4 h-4 transition-transform ${
                      sortField === 'balance' ? (sortDirection === 'asc' ? 'rotate-0' : 'rotate-180') : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직업
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('creditGrade')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>신용등급</span>
                    <svg className={`w-4 h-4 transition-transform ${
                      sortField === 'creditGrade' ? (sortDirection === 'asc' ? 'rotate-0' : 'rotate-180') : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('creditScore')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>신용점수</span>
                    <svg className={`w-4 h-4 transition-transform ${
                      sortField === 'creditScore' ? (sortDirection === 'asc' ? 'rotate-0' : 'rotate-180') : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}>
                  {/* 체크박스 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                  </td>

                  {/* 학생명 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">PIN: {student.pin4 || '****'}</div>
                      </div>
                    </div>
                  </td>

                  {/* 잔고 */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-green-600">
                      {student.balance.toLocaleString()}{currentClass.currencyUnit}
                    </div>
                  </td>

                  {/* 직업 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.jobId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getJobTitle(student.jobId)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        무직
                      </span>
                    )}
                  </td>

                  {/* 신용등급 */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      student.creditGrade === 'A+' || student.creditGrade === 'A' ? 'bg-green-100 text-green-800' :
                      student.creditGrade === 'B+' || student.creditGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                      student.creditGrade === 'C+' || student.creditGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.creditGrade || 'B'}
                    </span>
                  </td>

                  {/* 신용점수 */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {student.creditScore || 650}
                    </div>
                  </td>

                  {/* 액션 */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setSelectedStudentForActions(
                          selectedStudentForActions === student.id ? null : student.id
                        )}
                        className="kebab-button inline-flex items-center p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {/* 드롭다운 메뉴 */}
                      {selectedStudentForActions === student.id && (
                        <div className="dropdown-menu absolute right-0 top-8 bg-white shadow-lg border border-gray-200 rounded-lg py-1 z-20 w-48">
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
                          <button
                            onClick={() => {
                              handleEdit(student);
                              setSelectedStudentForActions(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            수정
                          </button>
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
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 비어있음 상태 */}
          {students.length === 0 && (
            <div className="text-center py-12 bg-white">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 학생이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">새 학생을 추가해보세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 급여 지급 확인 모달 */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border max-w-4xl shadow-xl rounded-xl bg-white">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  급여 일괄 지급
                </h3>
                <button
                  onClick={() => setShowPayrollModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium text-blue-900">급여 지급 미리보기</h4>
                    <p className="text-blue-700">
                      총 <span className="font-bold">{studentsWithJobs.length}명</span>의 직업 보유 학생에게 급여를 지급합니다.
                    </p>
                  </div>
                </div>

                {/* 급여 지급 미리보기 테이블 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">학생명</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">기본급</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">세금</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">실수령액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsWithJobs.map((student, index) => {
                        const payroll = calculatePayroll(student);
                        return (
                          <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {payroll.totalIncome.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600">
                              -{payroll.totalDeductions.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                              {payroll.netPay.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-900">합계</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-700">
                          {studentsWithJobs.reduce((sum, student) => sum + calculatePayroll(student).totalIncome, 0).toLocaleString()}{currentClass.currencyUnit}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">
                          -{studentsWithJobs.reduce((sum, student) => sum + calculatePayroll(student).totalDeductions, 0).toLocaleString()}{currentClass.currencyUnit}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          {studentsWithJobs.reduce((sum, student) => sum + calculatePayroll(student).netPay, 0).toLocaleString()}{currentClass.currencyUnit}
                        </td>
                      </tr>
                    </tfoot>
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
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrintPayslip}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    인쇄
                  </button>
                  <button
                    onClick={() => {
                      setShowPayrollResults(false);
                      setSelectedStudent(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
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
                          <span className="text-sm font-medium text-gray-600">직업:</span>
                          <span className="ml-2">{getStudentJobTitle(result.studentId)}</span>
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
                              <td className="py-2 px-3 text-right text-xs text-gray-500">{item.description}</td>
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
                              <td className="py-2 px-3 text-right text-xs text-gray-500">{item.description}</td>
                            </tr>
                          ))}

                          {/* 소계 */}
                          <tr className="border-t-2 border-gray-400 bg-gray-50">
                            <td className="py-3 px-3 font-semibold">총 지급액</td>
                            <td className="py-3 px-3 text-right font-semibold text-blue-600">
                              {result.totalIncome.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="py-3 px-3 text-right">-</td>
                            <td className="py-3 px-3 text-right">-</td>
                          </tr>
                          <tr className="border-b border-gray-300 bg-gray-50">
                            <td className="py-3 px-3 font-semibold">총 공제액</td>
                            <td className="py-3 px-3 text-right">-</td>
                            <td className="py-3 px-3 text-right font-semibold text-red-600">
                              {result.totalDeductions.toLocaleString()}{currentClass.currencyUnit}
                            </td>
                            <td className="py-3 px-3 text-right">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 실지급액 */}
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
                  {editingStudent ? '학생 정보 수정' : '새 학생 추가'}
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
                    기본 정보
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
                    경제 정보
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
    </div>
  );
}

export default StudentsTable;