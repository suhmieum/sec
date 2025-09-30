import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useClassroomStore, useStudentStore, useJobStore, useAppStore, useStockStore, useSavingsStore, useAchievementStore, useMarketStore, useAnalyticsStore } from '../state';
import { generateMockStudents, generateMockJobs } from '../utils/mockData';
import { generateDemoData } from '../utils/generateDemoData';
import { useNotifications } from '../components/NotificationSystem';
import type { Classroom } from '../schemas';

interface ClassFormData {
  name: string;
  description: string;
  currencyUnit: string;
  currencyDesign: string;
  classRules: string;
}

const CURRENCY_DESIGNS = [
  { value: 'coin', label: '🪙 동전 디자인', preview: '🪙' },
  { value: 'bill', label: '💵 지폐 디자인', preview: '💵' },
  { value: 'gem', label: '💎 보석 디자인', preview: '💎' },
  { value: 'star', label: '⭐ 별 디자인', preview: '⭐' },
  { value: 'heart', label: '❤️ 하트 디자인', preview: '❤️' },
  { value: 'flower', label: '🌸 꽃 디자인', preview: '🌸' },
];

function Classes() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [editingTaxClass, setEditingTaxClass] = useState<Classroom | null>(null);
  const [isDemoCreating, setIsDemoCreating] = useState(false);

  const { classrooms, loadClassrooms, createClassroom, updateClassroom, deleteClassroom } = useClassroomStore();
  const { currentClassId, setCurrentClassId } = useAppStore();
  const { createStudent, getStudentsByClassroom, assignJob, diversifyCreditScores, setStudents } = useStudentStore();
  const { createJob, setJobs } = useJobStore();
  const { createStock, bulkCreateStocks, addStockTransaction, createStockPortfolio } = useStockStore();
  const { createSavingsAccount } = useSavingsStore();
  const { createAchievement, createStudentAchievement } = useAchievementStore();
  const { createMarketNews, addStockPriceHistory } = useMarketStore();
  const { addMarketParticipation, addSavingsRate, addActivityHeatmap } = useAnalyticsStore();
  const { showEventNotification } = useNotifications();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassFormData>();

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  const onSubmit = (data: ClassFormData) => {
    if (editingClass) {
      // Update existing classroom
      updateClassroom(editingClass.id, {
        name: data.name,
        currencyUnit: data.currencyUnit,
      });
    } else {
      // Create new classroom
      const newClassroom = createClassroom({
        name: data.name,
        currencyUnit: data.currencyUnit,
        settings: {
          taxRate: 10,
          payCycle: 'weekly',
          approvalRequired: true,
          salaryBase: 1000,
        }
      });

      // If this is the first class, set it as current
      if (classrooms.length === 0) {
        setCurrentClassId(newClassroom.id);
      }
    }

    setIsCreating(false);
    setEditingClass(null);
    reset();
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingClass(classroom);
    setIsCreating(true);
    reset({
      name: classroom.name,
      description: '',
      currencyUnit: classroom.currencyUnit,
      currencyDesign: 'coin',
      classRules: '',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 학급을 삭제하시겠습니까?\n관련된 모든 데이터가 삭제됩니다.')) {
      deleteClassroom(id);

      // If deleting current class, switch to another or clear
      if (currentClassId === id) {
        const remainingClasses = classrooms.filter(c => c.id !== id);
        if (remainingClasses.length > 0) {
          setCurrentClassId(remainingClasses[0].id);
        } else {
          setCurrentClassId(null);
        }
      }
    }
  };

  const handleDiversifyCreditScores = (classroomId: string) => {
    if (window.confirm('학생들의 신용등급을 다양하게 재설정하시겠습니까?\n기존 신용점수가 변경됩니다.')) {
      diversifyCreditScores(classroomId);
      showEventNotification(
        '🏆 신용등급 다양화 완료!',
        '학생들의 신용등급이 A+부터 D등급까지 다양하게 분포되었습니다.'
      );
    }
  };

  const handleSetCurrent = (id: string) => {
    setCurrentClassId(id);
  };

  // 시연용 학급 생성 함수
  const createDemoClassroom = async () => {
    setIsDemoCreating(true);
    try {
      // 1. 학급 생성
      const createdClass = createClassroom({
        name: '6학년 1반 (시연용)',
        currencyUnit: '비바',
        treasury: 500000,
        donation: 50000,
        settings: {
          taxRate: 10,
          payCycle: 'weekly',
          approvalRequired: true,
          salaryBase: 1000,
        }
      });

      // 2. 모든 시연용 데이터 생성
      const demoData = generateDemoData(createdClass.id);

      // 3. 직업 먼저 생성 (학생이 직업을 참조하므로)
      console.log('[DEBUG] Creating jobs:', demoData.jobs.map((j: any) => ({ id: j.id, title: j.title })));
      setJobs(demoData.jobs);

      // 4. 학생 생성 (demo data용 직접 추가)
      console.log('[DEBUG] Creating students:', demoData.students.map((s: any) => ({ name: s.name, jobId: s.jobId })));
      setStudents(demoData.students);

      // 5. 주식 일괄 생성 (ID 보존)
      console.log('[DEBUG] Creating stocks:', demoData.stocks.map((s: any) => ({ id: s.id, symbol: s.symbol })));
      bulkCreateStocks(demoData.stocks);

      // 6. 주식 거래 내역 생성
      console.log('[DEBUG] Creating stock transactions:', demoData.stockTransactions.length);
      demoData.stockTransactions.forEach((transaction: any) => {
        addStockTransaction(transaction);
      });

      // 7. 주식 포트폴리오 생성
      console.log('[DEBUG] Creating stock portfolios:', demoData.stockPortfolios.length);
      demoData.stockPortfolios.forEach((portfolio: any) => {
        createStockPortfolio(portfolio);
      });

      // 8. 주가 히스토리 생성
      demoData.stockPriceHistory.forEach((history: any) => {
        addStockPriceHistory(history);
      });

      // 9. 저축 계좌 생성
      demoData.savingsAccounts.forEach((account: any) => {
        createSavingsAccount(account);
      });

      // 10. 업적 생성
      demoData.achievements.forEach((achievement: any) => {
        createAchievement(achievement);
      });

      // 11. 학생 업적 진행도 생성
      demoData.studentAchievements.forEach((studentAchievement: any) => {
        createStudentAchievement(studentAchievement);
      });

      // 12. 시장 뉴스 생성
      demoData.marketNews.forEach((news: any) => {
        createMarketNews(news);
      });

      // 13. 시장 참여율 데이터 생성
      demoData.marketParticipation.forEach((mp: any) => {
        addMarketParticipation(mp);
      });

      // 14. 저축률 데이터 생성
      demoData.savingsRates.forEach((sr: any) => {
        addSavingsRate(sr);
      });

      // 15. 활동 히트맵 데이터 생성
      demoData.activityHeatmap.forEach((ah: any) => {
        addActivityHeatmap(ah);
      });

      // 16. 학급 선택
      setCurrentClassId(createdClass.id);

      // 14. 알림 표시
      showEventNotification(
        '🎉 완전한 시연용 학급 생성 완료!',
        '15명의 학생, 8개 종목, 거래내역, 예금, 업적, 뉴스까지 모든 데이터가 생성되었습니다!'
      );

    } catch (error) {
      console.error('시연용 학급 생성 실패:', error);
      showEventNotification(
        '❌ 생성 실패',
        '시연용 데이터 생성 중 오류가 발생했습니다.'
      );
    } finally {
      setIsDemoCreating(false);
    }
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingClass(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학급 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {classrooms.length}개 학급
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={createDemoClassroom}
            disabled={isDemoCreating}
            className="inline-flex items-center px-5 py-3 border-0 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isDemoCreating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <span className="mr-2">🎭</span>
                시연용 학급 생성
              </>
            )}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-5 py-3 border-0 text-sm font-medium rounded-xl text-white bg-accent-500 hover:bg-accent-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            새 학급 만들기
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100/50 sm:rounded-2xl">
          <div className="px-6 py-6 sm:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingClass ? '학급 수정' : '새 학급 만들기'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  학급(국가) 이름 *
                </label>
                <input
                  type="text"
                  {...register('name', { required: '학급 이름을 입력하세요' })}
                  className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                  placeholder="예: 6학년 1반, 해바라기반 등"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  학급 설명
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                  placeholder="학급에 대한 간단한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  화폐 단위 *
                </label>
                <input
                  type="text"
                  {...register('currencyUnit', { required: '화폐 단위를 입력하세요' })}
                  className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                  placeholder="예: 원, 달러, 해바라기 등"
                />
                {errors.currencyUnit && (
                  <p className="mt-1 text-sm text-red-600">{errors.currencyUnit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  화폐 디자인 선택
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CURRENCY_DESIGNS.map((design) => (
                    <label
                      key={design.value}
                      className="relative flex cursor-pointer rounded-xl border border-gray-200 p-4 focus:outline-none hover:bg-gray-50 transition-all duration-200"
                    >
                      <input
                        type="radio"
                        {...register('currencyDesign')}
                        value={design.value}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{design.preview}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {design.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  학급 규칙 (헌법)
                </label>
                <textarea
                  {...register('classRules')}
                  rows={6}
                  className="mt-1 block w-full border-gray-200 rounded-xl shadow-sm focus:ring-accent-500 focus:border-accent-500 bg-gray-50 transition-all duration-200 sm:text-sm"
                  placeholder="학급 경제 활동 규칙을 작성하세요&#10;예:&#10;1. 월급은 매주 금요일에 지급됩니다&#10;2. 성실히 일한 학생에게 보너스가 주어집니다&#10;3. 규칙을 어길 시 벌금이 부과됩니다&#10;4. 기부 활동을 장려합니다"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-6 py-3 border-0 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 border-0 rounded-xl text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  {editingClass ? '수정하기' : '만들기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100/50 overflow-hidden sm:rounded-2xl">
        <div className="px-6 py-6 sm:px-8">
          <h3 className="text-lg font-semibold text-gray-900">전체 학급 목록</h3>
          <p className="mt-1 text-sm text-gray-500">
            생성된 학급들을 관리하고 현재 활성 학급을 선택할 수 있습니다.
          </p>
        </div>

        {classrooms.length === 0 ? (
          <div className="text-center py-12 px-6">
            <svg
              className="mx-auto h-16 w-16 text-primary-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">비바빌리지에 오신 것을 환영합니다!</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              아직 생성된 학급이 없습니다.<br />
              학급 경제 시스템을 시작하려면 학급을 만들어주세요.
            </p>
            <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-center text-gray-700">
                💡 위의 <span className="font-semibold text-primary-600">"시연용 학급 생성"</span> 버튼을 눌러보세요
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {classrooms.map((classroom) => (
              <li key={classroom.id} className="px-6 py-4 sm:px-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-accent-600 truncate">
                        {classroom.name}
                      </h4>
                      {currentClassId === classroom.id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          현재 활성
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>화폐: {classroom.currencyUnit}</span>
                        <span className="mx-2">•</span>
                        <span>국고: {classroom.treasury.toLocaleString()}{classroom.currencyUnit}</span>
                        <span className="mx-2">•</span>
                        <span>기부금: {classroom.donation.toLocaleString()}{classroom.currencyUnit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentClassId !== classroom.id && (
                      <button
                        onClick={() => handleSetCurrent(classroom.id)}
                        className="px-3 py-1 text-xs font-medium text-accent-600 bg-accent-100 rounded-full hover:bg-accent-200 transition-all duration-200"
                      >
                        활성화
                      </button>
                    )}
                    {currentClassId === classroom.id && (
                      <button
                        onClick={() => setEditingTaxClass(classroom)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-all duration-200"
                      >
                        ⚙️ 세금 설정
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(classroom)}
                      className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-all duration-200"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDiversifyCreditScores(classroom.id)}
                      className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full hover:bg-purple-200 transition-all duration-200"
                    >
                      🏆 신용등급 다양화
                    </button>
                    <button
                      onClick={() => handleDelete(classroom.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-all duration-200"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 세금 설정 모달 */}
      {editingTaxClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border max-w-5xl shadow-xl rounded-xl bg-white">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  ⚙️ 세금 정책 관리
                </h3>
                <button
                  onClick={() => setEditingTaxClass(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium text-blue-900">{editingTaxClass.name}</h4>
                    <p className="text-sm text-blue-700">
                      다양한 세금 항목을 설정하여 학급 경제 정책을 관리해보세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* 기본 소득세 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    💼 기본 소득세
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        소득세율 (0% ~ 50%)
                      </label>
                      <div className="space-y-4">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="1"
                          value={editingTaxClass.settings.taxRate}
                          onChange={(e) => {
                            const newTaxRate = parseInt(e.target.value);
                            setEditingTaxClass({
                              ...editingTaxClass,
                              settings: {
                                ...editingTaxClass.settings,
                                taxRate: newTaxRate
                              }
                            });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span className="font-bold text-lg text-blue-600">
                            {editingTaxClass.settings.taxRate}%
                          </span>
                          <span>50%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <h5 className="font-medium text-gray-800 mb-2">예상 세수입 (월)</h5>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.floor((editingTaxClass.settings.taxRate / 100) * 2500 * 8).toLocaleString()}{editingTaxClass.currencyUnit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        * 평균 급여 2,500{editingTaxClass.currencyUnit} × 8명 기준
                      </p>
                    </div>
                  </div>
                </div>

                {/* 추가 세금 항목 테이블 */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        📋 추가 세금 항목
                      </h4>
                      <button
                        onClick={() => {
                          // 새 세금 항목 추가 로직 (나중에 구현)
                        }}
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm font-medium"
                      >
                        + 새 항목 추가
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            세금 항목
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            세율
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            적용 대상
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-2">💼</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">소득세</div>
                                <div className="text-sm text-gray-500">기본 급여에서 공제</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-blue-600">{editingTaxClass.settings.taxRate}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            모든 급여 소득
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              활성
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className="text-gray-400">기본 항목</span>
                          </td>
                        </tr>

                        {/* 예시 추가 세금 항목들 */}
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-2">🏠</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">교실 사용료</div>
                                <div className="text-sm text-gray-500">월 고정 징수</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-purple-600">200{editingTaxClass.currencyUnit}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            모든 학생
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              비활성
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">수정</button>
                            <button className="text-red-600 hover:text-red-900">삭제</button>
                          </td>
                        </tr>

                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-2">🌱</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">환경세</div>
                                <div className="text-sm text-gray-500">친환경 활동 지원</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-green-600">3%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            구매 거래시
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              활성
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">수정</button>
                            <button className="text-red-600 hover:text-red-900">삭제</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-500">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-yellow-800">세금 정책 변경 주의사항</h5>
                      <p className="text-sm text-yellow-700">
                        세금 정책 변경은 다음 급여 지급 및 거래부터 적용됩니다. 학생들에게 미리 공지해 주세요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  onClick={() => setEditingTaxClass(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 text-lg font-medium rounded-lg shadow-sm hover:bg-gray-300 transition-colors duration-200"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    updateClassroom(editingTaxClass.id, {
                      settings: editingTaxClass.settings
                    });
                    setEditingTaxClass(null);
                    showEventNotification(
                      '세금 정책 변경됨',
                      `소득세율이 ${editingTaxClass.settings.taxRate}%로 변경되었습니다.`
                    );
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
                >
                  정책 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classes;