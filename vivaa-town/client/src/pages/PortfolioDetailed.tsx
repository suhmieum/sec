import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../state/studentStore';
import { useClassroomStore } from '../state/classroomStore';
import { useStockStore } from '../state/stockStore';
import { useSavingsStore } from '../state/savingsStore';
import { usePremiumStore } from '../state/premiumStore';
import PremiumModal from '../components/PremiumModal';

interface TeacherComment {
  id: string;
  content: string;
  isAI: boolean;
  createdAt: string;
  author: string;
}

export default function PortfolioDetailed() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'activities' | 'comments'>('overview');
  const [comments, setComments] = useState<TeacherComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { getStudent } = useStudentStore();
  const { getClassroom } = useClassroomStore();
  const { getPortfolioByStudent } = useStockStore();
  const { getSavingsAccountsByStudent } = useSavingsStore();
  const { isPremiumActive, validateApiKey } = usePremiumStore();

  const student = studentId ? getStudent(studentId) : null;
  const classroom = student ? getClassroom(student.classroomId) : null;
  const stockPortfolios = getPortfolioByStudent(studentId!) || [];
  const savingsAccounts = getSavingsAccountsByStudent(studentId!) || [];

  // 자산 계산
  const stockValue = stockPortfolios.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0);
  const savingsValue = savingsAccounts.reduce((sum, acc) => sum + acc.totalBalance, 0);
  const totalAssets = (student?.balance || 0) + stockValue + savingsValue;
  const savingsRate = totalAssets > 0 ? (savingsValue / totalAssets) * 100 : 0;

  const handleApiKeySubmit = async (apiKey: string) => {
    const isValid = await validateApiKey(apiKey);
    if (isValid) {
      setShowPremiumModal(false);
    } else {
      alert('유효하지 않은 API 키입니다. 다시 확인해주세요.');
      throw new Error('Invalid API key');
    }
  };

  // 프리미엄 기능 체크
  if (!isPremiumActive) {
    return (
      <>
        <div className="max-w-7xl mx-auto space-y-6">
          <button
            onClick={() => navigate('/portfolio')}
            className="inline-flex items-center px-6 py-3 text-slate-600 hover:text-slate-700 hover:bg-white/50 rounded-2xl font-medium transition-all duration-200"
          >
            <span className="mr-2">←</span>
            <span>포트폴리오 목록</span>
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-sky-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl">📊</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">학생 상세 포트폴리오</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">개별 학생의 경제 활동을 심층 분석한 포트폴리오를 확인하세요</p>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="inline-flex items-center px-8 py-4 border-0 text-base font-semibold rounded-2xl shadow-lg text-white bg-slate-500 hover:bg-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="w-5 h-5 mr-3">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                포트폴리오 보기
              </button>
            </div>
          </div>
        </div>

        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          featureName="학생 상세 포트폴리오"
          onApiKeySubmit={handleApiKeySubmit}
        />
      </>
    );
  }

  // AI 코멘트 생성
  const generateAIComment = async () => {
    if (!student) return;

    setIsGeneratingAI(true);
    try {
      // 프리미엄 스토어에서 API 키 가져오기
      const premiumStore = JSON.parse(localStorage.getItem('premium-store') || '{}');
      const apiKey = premiumStore.state?.geminiApiKey;

      if (!apiKey) {
        alert('API 키를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-001',
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1000
        }
      });

      const prompt = `당신은 초등학교 경제교육 전문가이며, SEC(Small Economy in Classroom) 프로그램을 운영하는 교사입니다.
학생의 종합적인 경제활동 데이터를 분석하여 전문적이고 개인맞춤형 교육적 피드백을 제공해주세요.

📊 학생 경제활동 종합 분석 데이터:

🎓 기본 정보
- 학생명: ${student.name}
- 소속: ${classroom?.name}
- 현재 신용등급: ${student.creditGrade} (${student.creditScore}점/850점 만점)

💰 자산 포트폴리오 현황
- 총 자산: ${totalAssets.toLocaleString()}원
- 현금 보유액: ${student.balance.toLocaleString()}원 (${((student.balance/totalAssets)*100).toFixed(1)}%)
- 주식 투자금: ${stockValue.toLocaleString()}원 (${((stockValue/totalAssets)*100).toFixed(1)}%)
- 예금/적금: ${savingsValue.toLocaleString()}원 (${((savingsValue/totalAssets)*100).toFixed(1)}%)
- 저축률: ${savingsRate.toFixed(1)}%

📈 거래 활동 분석
- 누적 총수익: ${student.totalEarnings.toLocaleString()}원
- 총 거래 횟수: ${student.totalTransactions}회
- 평균 거래 금액: ${student.totalTransactions > 0 ? (student.totalEarnings / student.totalTransactions).toLocaleString() : '0'}원
- 달성 업적 수: ${student.achievements?.length || 0}개

🎯 학습 태도 지표
- 지각: ${student.lateCount}회
- 숙제 미제출: ${student.homeworkMissed}회
- 도서 연체: ${student.bookOverdue}회

다음 구조로 500-700자 분량의 종합적이고 전문적인 피드백을 작성해주세요:

1. **경제활동 성과 분석** (2-3문장)
   - 자산 구성의 균형성과 투자 성향 분석
   - 신용등급과 저축률을 통한 재무 관리 능력 평가

2. **강점과 특장점** (2-3문장)
   - 구체적인 데이터를 인용하여 학생의 뛰어난 점 칭찬
   - 다른 학생들과 비교했을 때의 상대적 우위 언급

3. **성장 기회와 개선 방향** (2-3문장)
   - 현재 포트폴리오의 취약점 분석
   - 학습 태도와 연관지은 종합적 개선 제안

4. **구체적 실행 방안** (1-2문장)
   - 다음 단계에서 실천할 수 있는 명확한 액션 아이템 제시
   - 기대되는 구체적 목표 수치 포함

따뜻하면서도 전문적인 어조로, 학생이 성취감을 느끼면서도 더 발전할 동기를 얻을 수 있도록 작성해주세요.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const comment = response.text();

      const newAIComment: TeacherComment = {
        id: Date.now().toString(),
        content: comment,
        isAI: true,
        createdAt: new Date().toISOString(),
        author: 'AI 경제교육 전문가'
      };

      setComments(prev => [newAIComment, ...prev]);
    } catch (error) {
      console.error('AI 코멘트 생성 실패:', error);
      alert('AI 코멘트 생성에 실패했습니다.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 교사 코멘트 추가
  const addTeacherComment = () => {
    if (!newComment.trim()) return;

    const comment: TeacherComment = {
      id: Date.now().toString(),
      content: newComment,
      isAI: false,
      createdAt: new Date().toISOString(),
      author: '담임 선생님'
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  if (!student || !classroom) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">학생을 찾을 수 없습니다</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">잘못된 학생 ID이거나 학생 데이터가 없습니다.</p>
          <button
            onClick={() => navigate('/portfolio')}
            className="inline-flex items-center px-8 py-4 border-0 text-base font-semibold rounded-2xl shadow-lg text-white bg-slate-500 hover:bg-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="w-5 h-5 mr-3">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            포트폴리오 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-600 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{student.name}의 경제 활동 포트폴리오</h1>
              <p className="text-gray-600 mt-2">
                {classroom.name} · 신용등급 {student.creditGrade} · {student.creditScore}점
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portfolio')}
            className="inline-flex items-center px-6 py-3 text-slate-600 hover:text-white bg-white hover:bg-slate-500 rounded-2xl font-medium transition-all duration-300 border border-slate-200 hover:border-slate-500 shadow-md hover:shadow-lg"
          >
            <span className="mr-2">←</span>
            <span>목록으로</span>
          </button>
        </div>
      </div>

      {/* AI 코멘트 생성 카드 */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border border-slate-200/50 shadow-lg p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">AI 경제교육 전문가</h3>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">자산 포트폴리오, 거래 패턴, 학습 태도를 종합 분석하여 500-700자 분량의 전문적인 교육 컨설팅을 제공합니다</p>
            </div>
          </div>
          <button
            onClick={generateAIComment}
            disabled={isGeneratingAI}
            className="inline-flex items-center px-8 py-4 border-0 text-base font-semibold rounded-2xl shadow-lg text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            {isGeneratingAI ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>생성 중...</span>
              </div>
            ) : (
              <>
                <span className="mr-2">✨</span>
                <span>AI 코멘트 생성</span>
              </>
            )}
          </button>
        </div>

        {/* 최근 AI 코멘트 미리보기 */}
        {comments.filter(c => c.isAI).length > 0 && (
          <div className="mt-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700 font-semibold">최근 AI 코멘트</span>
              <span className="text-xs text-gray-500 font-medium">
                {new Date(comments.filter(c => c.isAI)[0]?.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
              {comments.filter(c => c.isAI)[0]?.content}
            </p>
            <button
              onClick={() => setActiveTab('comments')}
              className="text-slate-600 hover:text-slate-700 text-sm mt-3 underline font-semibold transition-colors"
            >
              전체 코멘트 보기 →
            </button>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">총 자산</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalAssets.toLocaleString()}원
              </p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-md text-2xl">
              💰
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">신용점수</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.creditScore}점
              </p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center shadow-md text-2xl">
              📊
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">저축률</p>
              <p className="text-2xl font-bold text-gray-900">
                {savingsRate.toFixed(1)}%
              </p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-md text-2xl">
              📈
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">달성 업적</p>
              <p className="text-2xl font-bold text-gray-900">
                {student.achievements?.length || 0}개
              </p>
            </div>
            <div className="h-14 w-14 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center shadow-md text-2xl">
              🏆
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8" aria-label="Tabs">
            {[
              { id: 'overview', name: '개요', icon: '📋' },
              { id: 'assets', name: '자산 구성', icon: '💼' },
              { id: 'activities', name: '활동 분석', icon: '📈' },
              { id: 'comments', name: '교사 피드백', icon: '💬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-2 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all duration-200
                  ${activeTab === tab.id
                    ? 'border-slate-500 text-slate-700'
                    : 'border-transparent text-gray-500 hover:text-slate-600 hover:border-slate-300'
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">이름</span>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">학급</span>
                      <span className="font-medium">{classroom.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">가입일</span>
                      <span className="font-medium">{new Date(student.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 거래 횟수</span>
                      <span className="font-medium">{student.totalTransactions}회</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">신용 관리</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">신용등급</span>
                      <span className={`font-medium px-2 py-1 rounded text-sm ${
                        student.creditGrade === 'A+' || student.creditGrade === 'A' ? 'bg-green-100 text-green-800' :
                        student.creditGrade === 'B+' || student.creditGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                        student.creditGrade === 'C+' || student.creditGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.creditGrade}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">지각 횟수</span>
                      <span className="font-medium">{student.lateCount}회</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">숙제 미제출</span>
                      <span className="font-medium">{student.homeworkMissed}회</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">도서 연체</span>
                      <span className="font-medium">{student.bookOverdue}회</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">경제 성과 요약</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sky-600">
                      {student.totalEarnings.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">총 수입 (원)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {savingsValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">저축액 (원)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stockValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">투자액 (원)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {student.achievements?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">달성 업적</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/50 shadow-sm text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="font-semibold text-gray-900">현금</h3>
                  <p className="text-2xl font-bold text-sky-600 mt-2">
                    {student.balance.toLocaleString()}원
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ({((student.balance / totalAssets) * 100).toFixed(1)}%)
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50 shadow-sm text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <h3 className="font-semibold text-gray-900">주식 투자</h3>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {stockValue.toLocaleString()}원
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stockPortfolios.length}개 종목 ({((stockValue / totalAssets) * 100).toFixed(1)}%)
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200/50 shadow-sm text-center">
                  <div className="text-3xl mb-2">🏦</div>
                  <h3 className="font-semibold text-gray-900">예금/적금</h3>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {savingsValue.toLocaleString()}원
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {savingsAccounts.length}개 계좌 ({((savingsValue / totalAssets) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Portfolio Details */}
              {stockPortfolios.length > 0 && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 p-4 border-b">보유 주식</h3>
                  <div className="divide-y">
                    {stockPortfolios.map((portfolio, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{portfolio.stockSymbol}</p>
                          <p className="text-sm text-gray-500">{portfolio.quantity}주 보유</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{(portfolio.quantity * portfolio.currentPrice).toLocaleString()}원</p>
                          <p className="text-sm text-gray-500">@{portfolio.currentPrice.toLocaleString()}원</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savingsAccounts.length > 0 && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 p-4 border-b">예금/적금 계좌</h3>
                  <div className="divide-y">
                    {savingsAccounts.map((account, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-gray-500">
                            {account.type === 'deposit' ? '정기예금' : '적금'} · {account.interestRate}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{account.totalBalance.toLocaleString()}원</p>
                          <p className="text-sm text-gray-500">만기: {new Date(account.maturityDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">거래 활동</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 거래 횟수</span>
                      <span className="font-medium">{student.totalTransactions}회</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">평균 거래액</span>
                      <span className="font-medium">
                        {student.totalTransactions > 0
                          ? Math.round(student.totalEarnings / student.totalTransactions).toLocaleString()
                          : 0}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">거래 유형</span>
                      <span className="font-medium">
                        {stockPortfolios.length > 0 ? '적극형' : savingsAccounts.length > 0 ? '안정형' : '보수형'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200/50 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">금융 습관</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">저축형</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        savingsRate > 30 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {savingsRate > 30 ? '예' : '아니오'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">투자형</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        stockPortfolios.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stockPortfolios.length > 0 ? '예' : '아니오'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">활동 수준</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        student.totalTransactions > 10 ? 'bg-yellow-100 text-yellow-800' :
                        student.totalTransactions > 5 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.totalTransactions > 10 ? '높음' :
                         student.totalTransactions > 5 ? '보통' : '낮음'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              {student.achievements && student.achievements.length > 0 && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">달성 업적</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {student.achievements.map((achievement, idx) => (
                      <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">🏆</div>
                        <p className="text-sm font-medium text-gray-800">{achievement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* Add Comment Section */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">피드백 작성</h3>
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="학생에 대한 피드백을 작성해주세요..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent shadow-sm transition-all duration-200"
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <button
                      onClick={generateAIComment}
                      disabled={isGeneratingAI}
                      className="inline-flex items-center px-6 py-3 border-0 font-semibold rounded-2xl shadow-md text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                    >
                      {isGeneratingAI ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          AI 코멘트 생성 중...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🤖</span>
                          AI 코멘트 생성
                        </>
                      )}
                    </button>
                    <button
                      onClick={addTeacherComment}
                      disabled={!newComment.trim()}
                      className="inline-flex items-center px-6 py-3 border-0 font-semibold rounded-2xl shadow-md text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                    >
                      코멘트 추가
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">피드백 목록</h3>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className={`rounded-2xl p-6 shadow-sm ${
                        comment.isAI ? 'bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/50' : 'bg-white/60 backdrop-blur-sm border border-gray-200/50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{comment.author}</span>
                            {comment.isAI && (
                              <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded flex items-center gap-1">
                                🤖 AI 생성
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setComments(prev => prev.filter(c => c.id !== comment.id))}
                            className="text-gray-400 hover:text-red-600 transition"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">아직 피드백이 없습니다</h3>
                    <p>AI 코멘트를 생성하거나 직접 피드백을 작성해보세요.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}