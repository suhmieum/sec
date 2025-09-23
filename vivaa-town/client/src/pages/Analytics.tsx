import { useState, useEffect } from 'react';
import { useAnalyticsStore, useCurrentClassroom, useStudentStore } from '../state';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const currentClassroom = useCurrentClassroom();
  const { students } = useStudentStore();
  const {
    calculateEconomicMetrics,
    getStudentActivityHeatmap,
    predictEconomicTrend,
    identifyRiskStudents,
    analyzeTransactionPatterns
  } = useAnalyticsStore();

  const [metrics, setMetrics] = useState<any>(null);
  const [activityHeatmap, setActivityHeatmap] = useState<any[]>([]);
  const [trend, setTrend] = useState<string>('stable');
  const [riskStudents, setRiskStudents] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'heatmap' | 'patterns'>('overview');

  useEffect(() => {
    if (!currentClassroom) return;

    const metrics = calculateEconomicMetrics(currentClassroom.id);
    const heatmap = getStudentActivityHeatmap(currentClassroom.id);
    const trend = predictEconomicTrend(currentClassroom.id);
    const risks = identifyRiskStudents(currentClassroom.id);

    setMetrics(metrics);
    setActivityHeatmap(heatmap);
    setTrend(trend);
    setRiskStudents(risks);
  }, [currentClassroom, calculateEconomicMetrics, getStudentActivityHeatmap, predictEconomicTrend, identifyRiskStudents]);

  if (!currentClassroom) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">먼저 교실을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  // 지니계수 색상 결정
  const getGiniColor = (gini: number) => {
    if (gini < 0.3) return 'text-green-600 bg-green-50';
    if (gini < 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // 트렌드 아이콘과 색상
  const getTrendDisplay = (trend: string) => {
    switch (trend) {
      case 'growing':
        return { icon: '📈', text: '성장', color: 'text-green-600 bg-green-50' };
      case 'declining':
        return { icon: '📉', text: '하락', color: 'text-red-600 bg-red-50' };
      default:
        return { icon: '➡️', text: '안정', color: 'text-blue-600 bg-blue-50' };
    }
  };

  const trendDisplay = getTrendDisplay(trend);

  // 학생 활동 히트맵 데이터 준비
  const prepareHeatmapData = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}시`);

    // 모든 학생의 시간대별 활동 합계
    const aggregatedHourly = new Array(24).fill(0);
    const aggregatedWeekly = new Array(7).fill(0);

    activityHeatmap.forEach(student => {
      student.hourlyActivity.forEach((count, hour) => {
        aggregatedHourly[hour] += count;
      });
      student.weeklyActivity.forEach((count, day) => {
        aggregatedWeekly[day] += count;
      });
    });

    return {
      hourlyData: {
        labels: hours,
        datasets: [{
          label: '시간대별 활동',
          data: aggregatedHourly,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      weeklyData: {
        labels: days,
        datasets: [{
          label: '요일별 활동',
          data: aggregatedWeekly,
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        }]
      }
    };
  };

  const { hourlyData, weeklyData } = prepareHeatmapData();

  // 개별 지표 차트 데이터 준비
  const participationChart = {
    labels: ['참여', '미참여'],
    datasets: [{
      data: [
        metrics?.marketParticipation || 0,
        100 - (metrics?.marketParticipation || 0)
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.5)',
        'rgba(229, 231, 235, 0.5)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(229, 231, 235, 1)'
      ],
      borderWidth: 1
    }]
  };

  const employmentChart = {
    labels: ['고용', '실업'],
    datasets: [{
      data: [
        metrics?.employmentRate || 0,
        100 - (metrics?.employmentRate || 0)
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.5)',
        'rgba(229, 231, 235, 0.5)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(229, 231, 235, 1)'
      ],
      borderWidth: 1
    }]
  };

  const savingsChart = {
    labels: ['저축', '유통'],
    datasets: [{
      data: [
        metrics?.savingsRate || 0,
        100 - (metrics?.savingsRate || 0)
      ],
      backgroundColor: [
        'rgba(251, 146, 60, 0.5)',
        'rgba(229, 231, 235, 0.5)'
      ],
      borderColor: [
        'rgba(251, 146, 60, 1)',
        'rgba(229, 231, 235, 1)'
      ],
      borderWidth: 1
    }]
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 교사용 분석 대시보드</h1>
          <p className="text-gray-600">{currentClassroom.name}의 경제 분석</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg ${
              selectedView === 'overview'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 개요
          </button>
          <button
            onClick={() => setSelectedView('heatmap')}
            className={`px-4 py-2 rounded-lg ${
              selectedView === 'heatmap'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            활동 히트맵
          </button>
          <button
            onClick={() => setSelectedView('patterns')}
            className={`px-4 py-2 rounded-lg ${
              selectedView === 'patterns'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            거래 패턴
          </button>
        </div>
      </div>

      {selectedView === 'overview' && metrics && (
        <>
          {/* 주요 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 경제 트렌드 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">경제 트렌드</p>
                  <p className="text-2xl font-bold">{trendDisplay.text}</p>
                </div>
                <div className={`text-3xl p-2 rounded ${trendDisplay.color}`}>
                  {trendDisplay.icon}
                </div>
              </div>
            </div>

            {/* 지니계수 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">지니계수 (빈부격차)</p>
                  <p className="text-2xl font-bold">{metrics.giniCoefficient.toFixed(3)}</p>
                  <p className="text-xs text-gray-400">
                    {metrics.giniCoefficient < 0.3 ? '낮음' :
                     metrics.giniCoefficient < 0.5 ? '보통' : '높음'}
                  </p>
                </div>
                <div className={`text-3xl p-2 rounded ${getGiniColor(metrics.giniCoefficient)}`}>
                  ⚖️
                </div>
              </div>
            </div>

            {/* 평균 잔고 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">평균 잔고</p>
                  <p className="text-2xl font-bold">{Math.round(metrics.averageBalance).toLocaleString()}원</p>
                  <p className="text-xs text-gray-400">총 {metrics.totalCirculation.toLocaleString()}원</p>
                </div>
                <div className="text-3xl p-2 rounded bg-blue-50 text-blue-600">
                  💰
                </div>
              </div>
            </div>

            {/* 위험 학생 수 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">경제적 위험 학생</p>
                  <p className="text-2xl font-bold">{riskStudents.length}명</p>
                  <p className="text-xs text-gray-400">
                    전체 {students.filter(s => s.classroomId === currentClassroom.id).length}명 중
                  </p>
                </div>
                <div className={`text-3xl p-2 rounded ${
                  riskStudents.length === 0 ? 'bg-green-50 text-green-600' :
                  riskStudents.length < 3 ? 'bg-yellow-50 text-yellow-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  ⚠️
                </div>
              </div>
            </div>
          </div>

          {/* 경제 지표 차트 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 시장 참여율 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-base font-semibold mb-3 text-center">시장 참여율</h4>
              <div className="h-48">
                <Doughnut
                  data={participationChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            return `${context.label}: ${context.parsed.toFixed(1)}%`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="text-center mt-2">
                <p className="text-2xl font-bold text-blue-600">{metrics?.marketParticipation?.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">주식/예금 보유 학생</p>
              </div>
            </div>

            {/* 고용률 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-base font-semibold mb-3 text-center">고용률</h4>
              <div className="h-48">
                <Doughnut
                  data={employmentChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            return `${context.label}: ${context.parsed.toFixed(1)}%`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="text-center mt-2">
                <p className="text-2xl font-bold text-green-600">{metrics?.employmentRate?.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">직업 보유 학생</p>
              </div>
            </div>

            {/* 저축률 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-base font-semibold mb-3 text-center">저축률</h4>
              <div className="h-48">
                <Doughnut
                  data={savingsChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            return `${context.label}: ${context.parsed.toFixed(1)}%`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="text-center mt-2">
                <p className="text-2xl font-bold text-orange-600">{metrics?.savingsRate?.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">전체 통화 중 저축</p>
              </div>
            </div>
          </div>

          {/* 추가 지표 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 인플레이션 및 거래 지표 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">경제 활동 지표</h3>
              <div className="space-y-4">
                {/* 인플레이션율 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">인플레이션율 (연간)</span>
                    <span className={`text-sm font-bold ${
                      metrics?.inflationRate > 5 ? 'text-red-600' :
                      metrics?.inflationRate < -2 ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {metrics?.inflationRate > 0 ? '+' : ''}{metrics?.inflationRate?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metrics?.inflationRate > 5 ? 'bg-red-500' :
                        metrics?.inflationRate < -2 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, (metrics?.inflationRate + 10) * 5))}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics?.inflationRate > 5 ? '⚠️ 물가 급등' :
                     metrics?.inflationRate > 2 ? '📈 적정 상승' :
                     metrics?.inflationRate > -2 ? '✅ 안정적' :
                     '📉 디플레이션 위험'}
                  </p>
                </div>

                {/* 주간 거래량 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">주간 거래량</span>
                    <span className="text-sm font-bold text-gray-900">
                      {metrics?.tradingVolume?.toLocaleString()}원
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (metrics?.tradingVolume / (metrics?.totalCirculation || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">전체 통화량 대비 거래 비율</p>
                </div>

                {/* 빈부격차 (지니계수) 시각적 표현 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">빈부격차 (지니계수)</span>
                    <span className={`text-sm font-bold ${
                      metrics?.giniCoefficient < 0.3 ? 'text-green-600' :
                      metrics?.giniCoefficient < 0.5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {metrics?.giniCoefficient?.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metrics?.giniCoefficient < 0.3 ? 'bg-green-500' :
                        metrics?.giniCoefficient < 0.5 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(metrics?.giniCoefficient || 0) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics?.giniCoefficient < 0.3 ? '✅ 평등한 분배' :
                     metrics?.giniCoefficient < 0.5 ? '⚠️ 보통 격차' :
                     '🚨 심각한 격차'}
                  </p>
                </div>
              </div>
            </div>

            {/* 상세 지표 테이블 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">경제 규모</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">총 통화량</div>
                  <div className="text-2xl font-bold text-blue-900">{metrics?.totalCirculation?.toLocaleString()}원</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">평균 잔고</div>
                  <div className="text-2xl font-bold text-green-900">{metrics?.averageBalance?.toLocaleString()}원</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">주간 거래량</div>
                  <div className="text-2xl font-bold text-purple-900">{metrics?.tradingVolume?.toLocaleString()}원</div>
                </div>
              </div>
            </div>
          </div>

          {/* 위험 학생 목록 */}
          {riskStudents.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ 경제적 관심 필요 학생</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {riskStudents.map(studentId => {
                  const student = students.find(s => s.id === studentId);
                  if (!student) return null;
                  return (
                    <div key={studentId} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">잔고: {student.balance.toLocaleString()}원</p>
                      <p className="text-sm text-gray-600">신용: {student.creditGrade}</p>
                      <p className="text-sm text-gray-600">
                        {!student.jobId && '🚫 무직'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {selectedView === 'heatmap' && (
        <>
          {/* 활동 히트맵 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">📅 요일별 활동 분포</h3>
              <div className="h-64">
                <Bar
                  data={weeklyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '거래 횟수'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">🕐 시간대별 활동 분포</h3>
              <div className="h-64">
                <Line
                  data={hourlyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '거래 횟수'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* 학생별 활동 점수 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-4">👥 학생별 활동 점수</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">학생</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">활동 점수</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">총 거래</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">최근 활동</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">활동 히트맵</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activityHeatmap
                    .sort((a, b) => b.activityScore - a.activityScore)
                    .map(student => (
                      <tr key={student.studentId}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{student.studentName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${student.activityScore}%` }}
                              />
                            </div>
                            <span className="text-sm">{student.activityScore}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {student.totalTransactions}회
                        </td>
                        <td className="px-4 py-3">
                          {student.lastActivityDate ?
                            new Date(student.lastActivityDate).toLocaleDateString() :
                            '없음'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {student.weeklyActivity.map((count, day) => (
                              <div
                                key={day}
                                className={`w-4 h-4 rounded ${
                                  count === 0 ? 'bg-gray-200' :
                                  count < 3 ? 'bg-blue-300' :
                                  count < 5 ? 'bg-blue-500' :
                                  'bg-blue-700'
                                }`}
                                title={`${['일', '월', '화', '수', '목', '금', '토'][day]}: ${count}회`}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedView === 'patterns' && (
        <>
          {/* 거래 패턴 분석 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-4">📈 전체 거래 패턴</h3>
            {(() => {
              const patterns = analyzeTransactionPatterns(currentClassroom.id);
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">{patterns.totalTransactions}</p>
                    <p className="text-gray-600">총 거래 횟수</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">{patterns.buyCount}</p>
                    <p className="text-gray-600">매수 거래</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-500">{patterns.sellCount}</p>
                    <p className="text-gray-600">매도 거래</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{patterns.totalVolume.toLocaleString()}원</p>
                    <p className="text-gray-600">총 거래 금액</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{patterns.averageTransactionSize.toLocaleString()}원</p>
                    <p className="text-gray-600">평균 거래 규모</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{patterns.peakHour}시</p>
                    <p className="text-gray-600">최다 거래 시간</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}