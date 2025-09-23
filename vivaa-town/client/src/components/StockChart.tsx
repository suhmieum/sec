import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { StockPriceHistory } from '../schemas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockChartProps {
  priceHistory: StockPriceHistory[];
  stockName: string;
  currentPrice: number;
  previousPrice: number;
}

export default function StockChart({
  priceHistory,
  stockName,
  currentPrice,
  previousPrice
}: StockChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Generate sample data if no history exists
  useEffect(() => {
    if (priceHistory.length === 0) {
      // Auto-generate some sample price history for demonstration
      const sampleData = generateSampleData(currentPrice);
      // In a real app, this would be handled by the store
    }
  }, [priceHistory, currentPrice]);

  const generateSampleData = (basePrice: number) => {
    const data = [];
    let price = basePrice;
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simple random walk for demo
      const change = (Math.random() - 0.5) * 0.1;
      price = Math.max(price * (1 + change), basePrice * 0.5);

      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price),
      });
    }

    return data;
  };

  const sampleData = priceHistory.length > 0
    ? priceHistory.map(h => ({ date: h.date, price: h.closePrice }))
    : generateSampleData(currentPrice);

  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice * 100) : 0;
  const isPositive = priceChange >= 0;

  const data = {
    labels: sampleData.map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: stockName,
        data: sampleData.map(d => d.price),
        borderColor: isPositive ? '#ef4444' : '#3b82f6',
        backgroundColor: isPositive
          ? 'rgba(239, 68, 68, 0.1)'
          : 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointBackgroundColor: isPositive ? '#ef4444' : '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: isPositive ? '#ef4444' : '#3b82f6',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${stockName}: ${context.parsed.y.toLocaleString()}원`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return `${value.toLocaleString()}원`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    animation: {
      duration: 300,
    },
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{stockName}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {currentPrice.toLocaleString()}원
            </span>
            <span className={`text-sm font-medium ${
              isPositive ? 'text-red-500' : 'text-blue-500'
            }`}>
              {isPositive ? '+' : ''}{priceChange.toLocaleString()}원
              ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          isPositive
            ? 'bg-red-50 text-red-600'
            : 'bg-blue-50 text-blue-600'
        }`}>
          {isPositive ? '▲' : '▼'}
          {Math.abs(priceChangePercent).toFixed(2)}%
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <Line ref={chartRef} data={data} options={options} />
      </div>

      {/* Technical Indicators */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t border-gray-100 pt-4">
        <div>
          <div className="text-xs text-gray-500">이동평균(5일)</div>
          <div className="text-sm font-medium text-gray-900">
            {calculateMovingAverage(sampleData, 5).toLocaleString()}원
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">최고가</div>
          <div className="text-sm font-medium text-gray-900">
            {Math.max(...sampleData.map(d => d.price)).toLocaleString()}원
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">최저가</div>
          <div className="text-sm font-medium text-gray-900">
            {Math.min(...sampleData.map(d => d.price)).toLocaleString()}원
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateMovingAverage(data: { price: number }[], period: number): number {
  if (data.length < period) return 0;

  const recentPrices = data.slice(-period).map(d => d.price);
  const sum = recentPrices.reduce((acc, price) => acc + price, 0);
  return Math.round(sum / period);
}