import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentStudents, useCurrentClassroom } from '../state';
import { usePremiumStore } from '../state/premiumStore';
import PremiumModal from '../components/PremiumModal';

export default function PortfolioList() {
  const currentClass = useCurrentClassroom();
  const students = useCurrentStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { isPremiumActive, validateApiKey } = usePremiumStore();

  // 검색 필터
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-sky-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl">📊</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">학생 포트폴리오</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">학생들의 경제 활동을 종합 분석한 포트폴리오를 확인하세요</p>
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
          featureName="학생 포트폴리오"
          onApiKeySubmit={handleApiKeySubmit}
        />
      </>
    );
  }

  if (!currentClass) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">학급이 없습니다</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">먼저 학급을 생성해주세요.</p>
          <Link
            to="/classes"
            className="inline-flex items-center px-8 py-4 border-0 text-base font-semibold rounded-2xl shadow-lg text-white bg-slate-500 hover:bg-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="w-5 h-5 mr-3">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            학급 만들기
          </Link>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">학생이 없습니다</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">먼저 학생을 등록해주세요.</p>
          <Link
            to="/students"
            className="inline-flex items-center px-8 py-4 border-0 text-base font-semibold rounded-2xl shadow-lg text-white bg-slate-500 hover:bg-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="w-5 h-5 mr-3">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            학생 등록하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">학생 포트폴리오</h1>
            <p className="text-gray-500 mt-2">
              {currentClass.name} · 총 {students.length}명의 학생
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-8">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-3">
            학생 검색
          </label>
          <input
            id="search"
            type="text"
            placeholder="학생 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent shadow-sm transition-all duration-200"
          />
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Link
            key={student.id}
            to={`/portfolio/${student.id}`}
            className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-6 group"
          >
            {/* Student Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-slate-600 transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    신용등급 {student.creditGrade}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                  📊
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">현재 잔액</span>
                <span className="font-medium text-gray-900">
                  {student.balance.toLocaleString()}원
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">신용점수</span>
                <span className="font-medium text-gray-900">
                  {student.creditScore}점
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 수입</span>
                <span className="font-medium text-gray-900">
                  {student.totalEarnings.toLocaleString()}원
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">달성 업적</span>
                <span className="font-medium text-gray-900">
                  {student.achievements?.length || 0}개
                </span>
              </div>
            </div>

            {/* Credit Grade Badge */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${
                    student.creditGrade === 'A+' ? 'bg-green-100 text-green-800' :
                    student.creditGrade === 'A' ? 'bg-green-100 text-green-800' :
                    student.creditGrade === 'B+' ? 'bg-blue-100 text-blue-800' :
                    student.creditGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                    student.creditGrade === 'C+' ? 'bg-yellow-100 text-yellow-800' :
                    student.creditGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {student.creditGrade} 등급
                  </span>
                  {student.achievements && student.achievements.length > 0 && (
                    <span className="text-xs text-gray-500 font-medium">
                      🏆 {student.achievements.length}
                    </span>
                  )}
                </div>
                <div className="text-slate-600 group-hover:translate-x-2 transition-transform duration-300 text-lg">
                  →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* No Results */}
      {filteredStudents.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p>"{searchTerm}"과 일치하는 학생이 없습니다.</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">학급 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50">
            <div className="text-3xl font-bold text-slate-600 mb-1">
              {students.length}
            </div>
            <div className="text-sm text-gray-600 font-medium">총 학생 수</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200/50">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {students.reduce((sum, s) => sum + s.balance, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 font-medium">총 잔액 (원)</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {Math.round(students.reduce((sum, s) => sum + s.creditScore, 0) / students.length)}
            </div>
            <div className="text-sm text-gray-600 font-medium">평균 신용점수</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200/50">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {students.reduce((sum, s) => sum + (s.achievements?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600 font-medium">총 업적 수</div>
          </div>
        </div>
      </div>
    </div>
  );
}