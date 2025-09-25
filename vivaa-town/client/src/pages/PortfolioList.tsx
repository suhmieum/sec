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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">학생 포트폴리오</h2>
              <p className="text-gray-600 mb-6">학생들의 경제 활동을 종합 분석한 포트폴리오를 확인하세요</p>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
              >
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">학급이 없습니다</h2>
          <p className="text-gray-500 mb-4">먼저 학급을 생성해주세요.</p>
          <Link
            to="/classes"
            className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
          >
            학급 관리로 이동
          </Link>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">학생이 없습니다</h2>
          <p className="text-gray-500 mb-4">먼저 학생을 등록해주세요.</p>
          <Link
            to="/students"
            className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
          >
            학생 관리로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학생 포트폴리오</h1>
          <p className="text-gray-500 mt-2">
            {currentClass.name} · 총 {students.length}명의 학생
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            학생 검색
          </label>
          <input
            id="search"
            type="text"
            placeholder="학생 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Link
            key={student.id}
            to={`/portfolio/${student.id}`}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 group"
          >
            {/* Student Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    신용등급 {student.creditGrade}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">포트폴리오</div>
                <div className="text-sky-600 group-hover:text-sky-700">
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
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                    <span className="text-xs text-gray-500">
                      🏆 {student.achievements.length}
                    </span>
                  )}
                </div>
                <div className="text-sky-600 group-hover:translate-x-1 transition-transform">
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">학급 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-600">
              {students.length}
            </div>
            <div className="text-sm text-gray-500">총 학생 수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {students.reduce((sum, s) => sum + s.balance, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">총 잔액 (원)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(students.reduce((sum, s) => sum + s.creditScore, 0) / students.length)}
            </div>
            <div className="text-sm text-gray-500">평균 신용점수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {students.reduce((sum, s) => sum + (s.achievements?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">총 업적 수</div>
          </div>
        </div>
      </div>
    </div>
  );
}