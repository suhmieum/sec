import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { Stock } from '../schemas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CandleChartProps {
  stock: Stock;
  priceHistory: Array<{ price: number; timestamp: Date }>;
}

export default function CandleChart({ stock, priceHistory }: CandleChartProps) {
  // 캔들 데이터 생성 (시뮬레이션)
  const candleData = useMemo(() => {
    if (priceHistory.length < 2) {
      // 기본 데이터 생성
      const days = 20;
      const data = [];
      let basePrice = stock.currentPrice;

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // 랜덤 변동 생성
        const volatility = 0.03; // 3% 변동성
        const open = basePrice;
        const close = basePrice * (1 + (Math.random() - 0.5) * volatility);
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

        data.push({
          date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          open: Math.round(open),
          high: Math.round(high),
          low: Math.round(low),
          close: Math.round(close),
          volume: Math.floor(Math.random() * 1000) + 100
        });

        basePrice = close;
      }

      return data;
    }

    // 실제 가격 히스토리에서 캔들 데이터 생성
    const grouped: { [key: string]: number[] } = {};

    priceHistory.forEach(({ price, timestamp }) => {
      const dateKey = new Date(timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(price);
    });

    return Object.entries(grouped).map(([date, prices]) => ({
      date,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume: Math.floor(Math.random() * 1000) + 100
    })).slice(-20); // 최근 20일만 표시
  }, [priceHistory, stock.currentPrice]);

  // 차트 데이터
  const chartData = {
    labels: candleData.map(d => d.date),
    datasets: [
      {
        label: '캔들스틱',
        data: candleData.map(d => [d.low, d.open, d.close, d.high]),
        backgroundColor: candleData.map(d =>
          d.close >= d.open ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)'
        ),
        borderColor: candleData.map(d =>
          d.close >= d.open ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'
        ),
        borderWidth: 1,
        barThickness: 'flex',
        maxBarThickness: 20,
        categoryPercentage: 0.8,
        barPercentage: 0.9
      }
    ]
  };

  // 이동평균선 데이터
  const movingAverage = (period: number) => {
    const ma = [];
    for (let i = 0; i < candleData.length; i++) {
      if (i < period - 1) {
        ma.push(null);
      } else {
        const sum = candleData.slice(i - period + 1, i + 1)
          .reduce((acc, d) => acc + d.close, 0);
        ma.push(sum / period);
      }
    }
    return ma;
  };

  const lineData = {
    labels: candleData.map(d => d.date),
    datasets: [
      {
        label: '종가',
        data: candleData.map(d => d.close),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        fill: true
      },
      {
        label: '5일 이동평균',
        data: movingAverage(5),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false
      },
      {
        label: '10일 이동평균',
        data: movingAverage(10),
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false
      }
    ]
  };

  // 거래량 차트 데이터
  const volumeData = {
    labels: candleData.map(d => d.date),
    datasets: [
      {
        label: '거래량',
        data: candleData.map(d => d.volume),
        backgroundColor: candleData.map(d =>
          d.close >= d.open ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'
        ),
        borderColor: candleData.map(d =>
          d.close >= d.open ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'
        ),
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const data = candleData[context.dataIndex];
            return [
              `시가: ${data.open.toLocaleString()}원`,
              `고가: ${data.high.toLocaleString()}원`,
              `저가: ${data.low.toLocaleString()}원`,
              `종가: ${data.close.toLocaleString()}원`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value: any) => value.toLocaleString() + '원'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `거래량: ${context.parsed.y.toLocaleString()}주`
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
  };

  // 현재 가격 정보
  const lastCandle = candleData[candleData.length - 1];
  const priceChange = lastCandle ? lastCandle.close - lastCandle.open : 0;
  const priceChangePercent = lastCandle && lastCandle.open > 0
    ? (priceChange / lastCandle.open * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 현재 가격 정보 */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold">{stock.name}</h3>
          <p className="text-sm text-gray-500">{stock.symbol} · {stock.sector}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {stock.currentPrice.toLocaleString()}원
          </div>
          <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toLocaleString()}원
            ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-xs text-gray-500">시가</span>
          <p className="font-medium">{lastCandle?.open.toLocaleString()}원</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">고가</span>
          <p className="font-medium text-red-500">{lastCandle?.high.toLocaleString()}원</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">저가</span>
          <p className="font-medium text-blue-500">{lastCandle?.low.toLocaleString()}원</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">거래량</span>
          <p className="font-medium">{lastCandle?.volume.toLocaleString()}주</p>
        </div>
      </div>

      {/* 차트 탭 */}
      <div className="space-y-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button className="border-b-2 border-primary-500 py-2 px-1 text-sm font-medium text-primary-600">
              캔들차트
            </button>
          </nav>
        </div>

        {/* 메인 차트 */}
        <div className="h-64">
          <Line data={lineData} options={options} />
        </div>

        {/* 거래량 차트 */}
        <div className="h-32">
          <Bar data={volumeData} options={volumeOptions} />
        </div>
      </div>

      {/* 설명 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 빨간색: 상승 (종가 &gt; 시가)</p>
        <p>• 파란색: 하락 (종가 &lt; 시가)</p>
        <p>• 점선: 이동평균선 (5일, 10일)</p>
      </div>
    </div>
  );
}