import { useCurrentClassroom, useStudentStore } from '../state';

function Leaderboard() {
  const currentClass = useCurrentClassroom();
  const { getStudentRanking, getCreditGrade, getInterestRate } = useStudentStore();

  if (!currentClass) return null;

  const rankedStudents = getStudentRanking(currentClass.id);
  const topStudents = rankedStudents.slice(0, 3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getAchievementName = (achievement: string) => {
    const achievementNames: Record<string, string> = {
      'first_transaction': '첫 거래',
      'frequent_trader': '거래 전문가',
      'transaction_master': '거래 마스터',
      'money_saver': '저축왕',
      'wealth_builder': '재산가',
    };
    return achievementNames[achievement] || achievement;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          🏆 학생 랭킹
        </h3>
        <span className="text-sm text-gray-500">신용점수 & 총 수익 기준</span>
      </div>

      <div className="space-y-4">
        {topStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>아직 랭킹 데이터가 없습니다</p>
            <p className="text-xs mt-1">급여를 지급하거나 활동을 시작해보세요!</p>
          </div>
        ) : (
          topStudents.map((student, index) => {
            const rank = index + 1;
            const creditGrade = student.creditGrade || getCreditGrade(student.creditScore || 650);
            const interestRate = getInterestRate(student.creditScore || 650);

            return (
              <div
                key={student.id}
                className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                  rank <= 3
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-2xl">{getRankIcon(rank)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {student.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          creditGrade === 'A+' || creditGrade === 'A' ? 'bg-green-100 text-green-700' :
                          creditGrade === 'B+' || creditGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                          creditGrade === 'C+' || creditGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {creditGrade}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-600">점수:</span>
                          <span className="text-xs font-medium text-gray-700">
                            {student.creditScore || 650}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-600">이자:</span>
                          <span className="text-xs font-medium text-green-600">
                            {(interestRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {student.balance.toLocaleString()}{currentClass.currencyUnit}
                      </div>
                      <div className="text-xs text-gray-500">
                        총수익 {(student.totalEarnings || 0).toLocaleString()}{currentClass.currencyUnit}
                      </div>
                      <div className="text-xs text-gray-500">
                        거래 {student.totalTransactions || 0}회
                      </div>
                    </div>
                  </div>

                  {/* 최근 업적 표시 */}
                  {student.achievements && student.achievements.length > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      <span className="text-xs text-gray-600">최근 업적:</span>
                      {student.achievements.slice(-2).map((achievement, achIndex) => (
                        <span
                          key={achIndex}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"
                        >
                          {getAchievementName(achievement)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {rankedStudents.length > 3 && (
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-500">
            총 {rankedStudents.length}명 중 상위 3명 표시
          </span>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;