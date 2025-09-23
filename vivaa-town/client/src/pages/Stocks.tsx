import { useState, useEffect } from 'react';
import { useStockStore, useMarketStore, useCurrentClassroom, useCurrentStudents } from '../state';
import type { Stock, Student } from '../schemas';
import StockChart from '../components/StockChart';

export default function Stocks() {
  const currentClassroom = useCurrentClassroom();
  const students = useCurrentStudents();

  const {
    stocks,
    stockTransactions,
    stockPortfolios,
    createStock,
    buyStock,
    sellStock,
    updateStockPrices,
    getStocksByClassroom,
    getPortfolioByStudent,
    getTransactionsByStudent,
    calculatePortfolioValue,
    calculateProfitLoss,
    getTotalInvestment,
    getMarketMood
  } = useStockStore();

  const {
    getActiveNews,
    getTodayIndicators,
    generateDailyIndicators,
    getStockPriceHistory,
    generateRandomNews
  } = useMarketStore();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [selectedStockForChart, setSelectedStockForChart] = useState<Stock | null>(null);

  const classroomStocks = currentClassroom ? getStocksByClassroom(currentClassroom.id) : [];
  const studentPortfolio = selectedStudent ? getPortfolioByStudent(selectedStudent.id) : [];
  const studentTransactions = selectedStudent ? getTransactionsByStudent(selectedStudent.id) : [];
  const portfolioValue = selectedStudent ? calculatePortfolioValue(selectedStudent.id) : 0;
  const totalInvestment = selectedStudent ? getTotalInvestment(selectedStudent.id) : 0;
  const marketMood = currentClassroom ? getMarketMood(currentClassroom.id) : 'neutral';
  const activeNews = currentClassroom ? getActiveNews(currentClassroom.id) : [];
  const todayIndicators = currentClassroom ? getTodayIndicators(currentClassroom.id) : null;

  // 초기 일일 지표 생성 및 뉴스 생성
  useEffect(() => {
    if (!currentClassroom) return;
    generateDailyIndicators(currentClassroom.id);

    // 5분마다 랜덤 뉴스 생성 (실제로는 하루에 한 번 또는 특정 시간에)
    const newsInterval = setInterval(() => {
      const stockIds = classroomStocks.map(s => s.id);
      if (stockIds.length > 0) {
        generateRandomNews(currentClassroom.id, stockIds);
      }
    }, 300000); // 5분 = 300000ms

    return () => clearInterval(newsInterval);
  }, [currentClassroom, generateDailyIndicators, generateRandomNews, classroomStocks]);

  // 실시간 주가 업데이트 시뮬레이션 (30초마다)
  useEffect(() => {
    if (!currentClassroom) return;

    const interval = setInterval(() => {
      updateStockPrices(currentClassroom.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentClassroom, updateStockPrices]);

  const handleCreateStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentClassroom) return;

    const formData = new FormData(e.currentTarget);
    const stockData = {
      classroomId: currentClassroom.id,
      name: formData.get('name') as string,
      symbol: formData.get('symbol') as string,
      sector: formData.get('sector') as string,
      description: formData.get('description') as string,
      currentPrice: parseInt(formData.get('currentPrice') as string),
      previousPrice: parseInt(formData.get('currentPrice') as string),
      totalShares: parseInt(formData.get('totalShares') as string),
    };

    createStock(stockData);
    setShowCreateModal(false);
    e.currentTarget.reset();
  };

  const handleTrade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStock) return;

    const success = tradeType === 'buy'
      ? buyStock(selectedStudent.id, selectedStock.id, tradeQuantity, selectedStock.currentPrice)
      : sellStock(selectedStudent.id, selectedStock.id, tradeQuantity, selectedStock.currentPrice);

    if (success) {
      setShowTradeModal(false);
      setTradeQuantity(1);
    } else {
      alert(tradeType === 'buy' ? '매수에 실패했습니다.' : '매도에 실패했습니다. 보유 수량을 확인해주세요.');
    }
  };

  const getStudentStockQuantity = (studentId: string, stockId: string) => {
    const portfolio = stockPortfolios.find(p => p.studentId === studentId && p.stockId === stockId);
    return portfolio?.quantity || 0;
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '📊';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'bullish': return 'text-green-600 bg-green-50';
      case 'bearish': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case '환경': return '🌱';
      case '교육': return '📚';
      case '기술': return '💻';
      case '식품': return '🍎';
      default: return '🏢';
    }
  };

  const getPriceChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-red-500';
    if (current < previous) return 'text-blue-500';
    return 'text-gray-500';
  };

  if (!currentClassroom) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">먼저 교실을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">주식 투자</h1>
          <p className="text-gray-600">{currentClassroom.name}의 가상 주식 시장</p>
        </div>
        <div className="flex gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(marketMood)}`}>
            {getMoodIcon(marketMood)} 시장 분위기: {marketMood === 'bullish' ? '상승' : marketMood === 'bearish' ? '하락' : '보합'}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            새 종목 등록
          </button>
        </div>
      </div>

      {/* 시장 뉴스 및 오늘의 지표 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 오늘의 지표 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">📊 오늘의 시장 지표</h2>
          {todayIndicators ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-medium">🌫️ 미세먼지</div>
                <div className="text-lg font-bold">{todayIndicators.indicators.fineDust}㎍/㎥</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-green-600 font-medium">🌡️ 기온</div>
                <div className="text-lg font-bold">{todayIndicators.indicators.temperature}°C</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <div className="text-yellow-600 font-medium">😊 선생님 기분</div>
                <div className="text-lg font-bold">{todayIndicators.indicators.teacherMood}/10</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="text-purple-600 font-medium">📚 출석률</div>
                <div className="text-lg font-bold">{todayIndicators.indicators.studentAttendance}%</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="text-orange-600 font-medium">🍎 급식평점</div>
                <div className="text-lg font-bold">{todayIndicators.indicators.lunchMenuRating}/5</div>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <div className="text-red-600 font-medium">😰 시험스트레스</div>
                <div className="text-lg font-bold">{todayIndicators.indicators.examStress}/10</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">지표를 불러오는 중...</p>
          )}
        </div>

        {/* 시장 뉴스 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">📰 시장 뉴스</h2>
            <button
              onClick={() => {
                if (currentClassroom) {
                  const stockIds = classroomStocks.map(s => s.id);
                  if (stockIds.length > 0) {
                    generateRandomNews(currentClassroom.id, stockIds);
                  }
                }
              }}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔄 뉴스 생성
            </button>
          </div>
          {activeNews.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activeNews.map(news => (
                <div key={news.id} className="border-l-4 border-primary-500 pl-3 py-2 bg-gray-50 rounded-r">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm">{news.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      news.impact === 'positive' ? 'bg-red-100 text-red-600' :
                      news.impact === 'negative' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {news.impact === 'positive' ? '📈 상승' : news.impact === 'negative' ? '📉 하락' : '➡️ 보합'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{news.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{news.type} 섹터</span>
                    <span>영향도: {'⭐'.repeat(news.severity)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">오늘은 시장 뉴스가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 학생 선택 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">학생 선택</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={`p-3 rounded-lg border transition-colors ${
                selectedStudent?.id === student.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{student.name}</div>
              <div className="text-xs text-gray-500">💰 {student.balance.toLocaleString()}원</div>
            </button>
          ))}
        </div>
      </div>

      {/* 주식 목록 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">종목 현황</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">종목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">현재가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">등락</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">섹터</th>
                {selectedStudent && <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">보유수량</th>}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classroomStocks.map(stock => {
                const priceChange = stock.currentPrice - stock.previousPrice;
                const priceChangePercent = stock.previousPrice > 0 ? (priceChange / stock.previousPrice * 100) : 0;
                const studentQuantity = selectedStudent ? getStudentStockQuantity(selectedStudent.id, stock.id) : 0;

                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{stock.name}</div>
                        <div className="text-sm text-gray-500">{stock.symbol}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{stock.currentPrice.toLocaleString()}원</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${getPriceChangeColor(stock.currentPrice, stock.previousPrice)}`}>
                        {priceChange > 0 ? '+' : ''}{priceChange.toLocaleString()}원
                        <div className="text-xs">
                          ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {getSectorIcon(stock.sector)} {stock.sector}
                      </span>
                    </td>
                    {selectedStudent && (
                      <td className="px-4 py-3">
                        <div className="font-medium">{studentQuantity.toLocaleString()}주</div>
                        {studentQuantity > 0 && (
                          <div className="text-xs text-gray-500">
                            손익: {calculateProfitLoss(selectedStudent.id, stock.id).toLocaleString()}원
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStockForChart(stock)}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          📈 차트
                        </button>
                        {selectedStudent && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedStock(stock);
                                setTradeType('buy');
                                setShowTradeModal(true);
                              }}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              매수
                            </button>
                            {studentQuantity > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedStock(stock);
                                  setTradeType('sell');
                                  setShowTradeModal(true);
                                }}
                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                매도
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 선택된 주식 차트 */}
      {selectedStockForChart && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">{selectedStockForChart.name} 차트</h2>
            <button
              onClick={() => setSelectedStockForChart(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <StockChart
              priceHistory={getStockPriceHistory(selectedStockForChart.id)}
              stockName={selectedStockForChart.name}
              currentPrice={selectedStockForChart.currentPrice}
              previousPrice={selectedStockForChart.previousPrice}
            />
          </div>
        </div>
      )}

      {/* 선택된 학생의 포트폴리오 */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 포트폴리오 요약 */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{selectedStudent.name}의 포트폴리오</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-600">{portfolioValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">현재 가치</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalInvestment.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">총 투자금</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${portfolioValue - totalInvestment >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {(portfolioValue - totalInvestment).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">총 손익</div>
                </div>
              </div>

              {studentPortfolio.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">보유 종목</h4>
                  {studentPortfolio.map(portfolio => {
                    const stock = stocks.find(s => s.id === portfolio.stockId);
                    if (!stock) return null;

                    const currentValue = portfolio.quantity * stock.currentPrice;
                    const profitLoss = currentValue - portfolio.totalCost;

                    return (
                      <div key={portfolio.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{stock.name}</div>
                          <div className="text-sm text-gray-500">{portfolio.quantity}주 × {stock.currentPrice.toLocaleString()}원</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{currentValue.toLocaleString()}원</div>
                          <div className={`text-sm ${profitLoss >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                            {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 거래 내역 */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">최근 거래 내역</h3>
            </div>
            <div className="p-4">
              {studentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">거래 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {studentTransactions.slice(0, 10).map(transaction => {
                    const stock = stocks.find(s => s.id === transaction.stockId);
                    if (!stock) return null;

                    return (
                      <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                        <div>
                          <div className="font-medium">
                            <span className={transaction.type === 'buy' ? 'text-red-500' : 'text-blue-500'}>
                              {transaction.type === 'buy' ? '매수' : '매도'}
                            </span> {stock.name}
                          </div>
                          <div className="text-gray-500">
                            {transaction.quantity}주 × {transaction.price.toLocaleString()}원
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{transaction.totalAmount.toLocaleString()}원</div>
                          <div className="text-gray-500">수수료: {transaction.fee.toLocaleString()}원</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 종목 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">새 종목 등록</h3>
            </div>
            <form onSubmit={handleCreateStock} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종목명 *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="예: 그린에너지"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종목코드 *
                </label>
                <input
                  type="text"
                  name="symbol"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="예: GE001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  섹터 *
                </label>
                <select
                  name="sector"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">섹터 선택</option>
                  <option value="환경">🌱 환경</option>
                  <option value="교육">📚 교육</option>
                  <option value="기술">💻 기술</option>
                  <option value="식품">🍎 식품</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="종목에 대한 간단한 설명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주가 *
                </label>
                <input
                  type="number"
                  name="currentPrice"
                  required
                  min="100"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  발행주식수 *
                </label>
                <input
                  type="number"
                  name="totalShares"
                  required
                  min="1000"
                  step="1000"
                  defaultValue="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 거래 모달 */}
      {showTradeModal && selectedStock && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {selectedStock.name} {tradeType === 'buy' ? '매수' : '매도'}
              </h3>
            </div>
            <form onSubmit={handleTrade} className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">현재가</div>
                <div className="text-lg font-semibold">{selectedStock.currentPrice.toLocaleString()}원</div>
                {tradeType === 'sell' && (
                  <div className="text-sm text-gray-600 mt-1">
                    보유수량: {getStudentStockQuantity(selectedStudent.id, selectedStock.id)}주
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수량 *
                </label>
                <input
                  type="number"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  max={tradeType === 'sell' ? getStudentStockQuantity(selectedStudent.id, selectedStock.id) : undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>거래금액</span>
                  <span>{(tradeQuantity * selectedStock.currentPrice).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>수수료 (1%)</span>
                  <span>{Math.floor(tradeQuantity * selectedStock.currentPrice * 0.01).toLocaleString()}원</span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <div className="flex justify-between font-medium">
                    <span>총 {tradeType === 'buy' ? '결제' : '수령'}금액</span>
                    <span>
                      {tradeType === 'buy'
                        ? (tradeQuantity * selectedStock.currentPrice + Math.floor(tradeQuantity * selectedStock.currentPrice * 0.01)).toLocaleString()
                        : (tradeQuantity * selectedStock.currentPrice - Math.floor(tradeQuantity * selectedStock.currentPrice * 0.01)).toLocaleString()
                      }원
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 ${
                    tradeType === 'buy' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                >
                  {tradeType === 'buy' ? '매수' : '매도'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}