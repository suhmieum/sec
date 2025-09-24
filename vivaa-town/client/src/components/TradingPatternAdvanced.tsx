import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TradingPatternProps {
  transactionPattern: any;
  currentClass: any;
}

const TradingPatternAdvanced: React.FC<TradingPatternProps> = ({ transactionPattern, currentClass }) => {
  // 매수/매도 비율 도넛 차트 데이터
  const tradingRatioData = {
    labels: ['매수', '매도'],
    datasets: [{
      data: [transactionPattern.buyCount, transactionPattern.sellCount],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2,
    }]
  };

  // 시간대별 거래 패턴 라인 차트
  const hourlyTradingData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}시`),
    datasets: [{
      label: '거래량',
      data: transactionPattern.hourlyPattern,
      fill: true,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  };

  // 거래 규모 분포 차트
  const transactionSizeData = {
    labels: ['소액 (<1000)', '중간 (1000-5000)', '대액 (>5000)'],
    datasets: [{
      label: '거래 건수',
      data: [
        transactionPattern.smallTransactions || 0,
        transactionPattern.mediumTransactions || 0,
        transactionPattern.largeTransactions || 0
      ],
      backgroundColor: [
        'rgba(147, 51, 234, 0.5)',
        'rgba(59, 130, 246, 0.5)',
        'rgba(245, 158, 11, 0.5)'
      ],
      borderColor: [
        'rgb(147, 51, 234)',
        'rgb(59, 130, 246)',
        'rgb(245, 158, 11)'
      ],
      borderWidth: 1,
    }]
  };

  // 거래 스타일 점수 계산
  const calculateTradingScore = () => {
    const frequency = Math.min((transactionPattern.totalTransactions / 100) * 100, 100);
    const diversity = (transactionPattern.uniqueStocks || 0) * 20;
    const timing = transactionPattern.peakHour >= 9 && transactionPattern.peakHour <= 15 ? 80 : 60;
    return Math.round((frequency + diversity + timing) / 3);
  };

  const tradingScore = calculateTradingScore();

  return (
    <div className="space-y-6">
      {/* 핵심 지표 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-700 font-medium">매수 활동</span>
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-3xl font-bold text-green-900">{transactionPattern.buyCount}</div>
          <div className="text-sm text-green-600 mt-1">
            전체의 {(transactionPattern.buyRatio * 100).toFixed(1)}%
          </div>
          <div className="mt-3 h-2 bg-green-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${transactionPattern.buyRatio * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-700 font-medium">매도 활동</span>
            <span className="text-2xl">📉</span>
          </div>
          <div className="text-3xl font-bold text-red-900">{transactionPattern.sellCount}</div>
          <div className="text-sm text-red-600 mt-1">
            전체의 {((1 - transactionPattern.buyRatio) * 100).toFixed(1)}%
          </div>
          <div className="mt-3 h-2 bg-red-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${(1 - transactionPattern.buyRatio) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-700 font-medium">평균 거래액</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {transactionPattern.averageTransactionSize?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-blue-600 mt-1">{currentClass?.currencyUnit}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-700 font-medium">거래 점수</span>
            <span className="text-2xl">⭐</span>
          </div>
          <div className="text-3xl font-bold text-purple-900">{tradingScore}</div>
          <div className="text-sm text-purple-600 mt-1">100점 만점</div>
          <div className="mt-3 h-2 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${tradingScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매수/매도 비율 차트 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">거래 유형 분석</h4>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut
                data={tradingRatioData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        font: {
                          size: 14
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.parsed || 0;
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: ${value}건 (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 거래 규모 분포 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">거래 규모 분포</h4>
          <div className="h-64">
            <Bar
              data={transactionSizeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                      size: 14
                    },
                    bodyFont: {
                      size: 13
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      display: false
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 시간대별 거래 패턴 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">24시간 거래 패턴</h4>
        <div className="h-64">
          <Line
            data={hourlyTradingData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 12,
                  callbacks: {
                    label: function(context) {
                      return `거래량: ${context.parsed.y}건`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">피크 시간: <span className="font-medium text-blue-600">{transactionPattern.peakHour}시</span></span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-gray-600">평균 거래: <span className="font-medium">{(transactionPattern.totalTransactions / 24).toFixed(1)}건/시간</span></span>
          </div>
        </div>
      </div>

      {/* 거래 스타일 인사이트 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">거래 스타일 인사이트</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="text-2xl mb-2">
              {transactionPattern.tradingStyle === 'aggressive' ? '🔥' :
               transactionPattern.tradingStyle === 'conservative' ? '🛡️' : '⚖️'}
            </div>
            <div className="font-medium text-gray-900">
              {transactionPattern.tradingStyle === 'aggressive' ? '공격적 거래' :
               transactionPattern.tradingStyle === 'conservative' ? '보수적 거래' : '균형적 거래'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              학급 거래 성향
            </div>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900">
              {transactionPattern.totalTransactions > 100 ? '매우 활발' :
               transactionPattern.totalTransactions > 50 ? '활발' :
               transactionPattern.totalTransactions > 20 ? '보통' : '저조'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              거래 활동 수준
            </div>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium text-gray-900">
              {transactionPattern.peakHour >= 9 && transactionPattern.peakHour <= 15 ? '정규 시간' : '시간 외'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              주요 거래 시간대
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPatternAdvanced;