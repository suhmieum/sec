import { useState, useEffect, useRef } from 'react';
import { useAIPlanStore } from '../state/aiPlanStore';
import { useCurrentClassroom, useCurrentStudents } from '../state';
import { usePremiumStore } from '../state/premiumStore';
import { geminiService, type ChatMessage, type LessonPlan } from '../services/geminiService';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import PremiumModal from '../components/PremiumModal';

type ChatPhase = 'dateSetup' | 'greeting' | 'collecting' | 'reviewing' | 'completed';

// 간단한 마크다운 렌더링 함수
const renderMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>') // `code`
    .replace(/\n/g, '<br>'); // newlines
};

export default function AIPlan() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatPhase, setChatPhase] = useState<ChatPhase>('dateSetup');
  const [questionCount, setQuestionCount] = useState(0);
  const [showPlanView, setShowPlanView] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { currentPlan, savedPlans, teacherProfile, setCurrentPlan, savePlan, updateTeacherProfile, clearCurrentPlan } = useAIPlanStore();
  const { isPremiumActive, validateApiKey } = usePremiumStore();
  const currentClassroom = useCurrentClassroom();
  const currentStudents = useCurrentStudents();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isPremiumActive) {
      setShowPremiumModal(true);
      return;
    }

    if (!showPlanView && messages.length === 0 && chatPhase === 'greeting') {
      startNewChat();
    }
  }, [chatPhase, isPremiumActive]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDateConfirm = () => {
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 모두 설정해주세요.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      alert('종료일은 시작일보다 나중이어야 합니다.');
      return;
    }
    setChatPhase('greeting');
    startNewChat();
  };

  const calculateWeeks = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const startNewChat = async () => {
    setIsLoading(true);
    setMessages([]);
    setChatPhase('greeting');
    setQuestionCount(0);

    // 현재 학급 정보 자동 업데이트
    if (currentClassroom) {
      const gradeMatch = currentClassroom.name.match(/(\d+)/);
      const grade = gradeMatch ? parseInt(gradeMatch[1]) : null;

      updateTeacherProfile({
        grade: grade || undefined,
        classSize: currentStudents.length,
        school: currentClassroom.name
      });
    }

    try {
      const dateContext = startDate && endDate ? `
선생님께서 설정하신 활동 기간:
- 시작일: ${format(new Date(startDate), 'yyyy년 M월 d일', { locale: ko })}
- 종료일: ${format(new Date(endDate), 'yyyy년 M월 d일', { locale: ko })}
- 총 기간: ${calculateWeeks()}주

이 기간에 맞는 비바빌리지 학급 경제 활동 계획을 세워드리겠습니다.` : '';

      const response = await geminiService.startChatWithDates(
        currentClassroom,
        currentStudents.length,
        startDate,
        endDate,
        calculateWeeks()
      );
      setMessages([{
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat start error:', error);
      const fallbackMessage = currentClassroom
        ? `안녕하세요! ${currentClassroom.name} 선생님! 학생 ${currentStudents.length}명과 함께하는 학급 경제 계획을 도와드리겠습니다. 언제부터 시작하실 예정인가요?`
        : '안녕하세요! 학급 경제 계획을 도와드리겠습니다. 먼저 몇 학년을 담당하고 계신가요?';

      setMessages([{
        role: 'assistant',
        content: fallbackMessage,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Extract information from user message
    extractProfileInfo(inputValue);

    try {
      // Force completion after 3 user inputs
      if (newQuestionCount >= 3) {
        const completionMessage: ChatMessage = {
          role: 'assistant',
          content: '좋습니다! 이제 계획을 확정하겠습니다. 잠시만 기다려주세요.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
        setChatPhase('reviewing');
        setIsLoading(false);
        return;
      }

      const response = await geminiService.sendMessage(
        [...messages, userMessage],
        teacherProfile
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if we should move to completion phase
      if (response.includes('계획을 확정') || response.includes('잠시만 기다려')) {
        setChatPhase('reviewing');
      }

    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractProfileInfo = (text: string) => {
    // Extract grade
    const gradeMatch = text.match(/(\d+)학년/);
    if (gradeMatch) {
      updateTeacherProfile({ grade: parseInt(gradeMatch[1]) });
    }

    // Extract class size
    const sizeMatch = text.match(/(\d+)명/);
    if (sizeMatch) {
      updateTeacherProfile({ classSize: parseInt(sizeMatch[1]) });
    }

    // Extract dates
    const datePattern = /(\d{1,2})월\s*(\d{1,2})일/g;
    const dates = [...text.matchAll(datePattern)];

    if (text.includes('개학')) {
      dates.forEach(date => {
        if (text.includes('3월') && text.includes('개학')) {
          updateTeacherProfile({
            academicCalendar: {
              ...teacherProfile.academicCalendar,
              semester1Start: `2025-03-${date[2].padStart(2, '0')}`
            }
          });
        }
      });
    }
  };

  const handleCompletePlan = async () => {
    setIsLoading(true);
    try {
      const plan = await geminiService.generateFinalPlanWithDates(
        messages,
        teacherProfile,
        startDate,
        endDate,
        calculateWeeks()
      );
      setCurrentPlan(plan);
      savePlan(plan);
      setChatPhase('completed');
      setShowPlanView(true);
    } catch (error) {
      console.error('Plan generation error:', error);
      alert('계획서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartModification = async () => {
    if (!currentPlan) return;

    setShowPlanView(false);
    setQuestionCount(0);
    setMessages([{
      role: 'assistant',
      content: `**기존 계획** "${currentPlan.title}"의 어느 부분을 수정하고 싶으신가요?`,
      timestamp: new Date()
    }]);
    setChatPhase('collecting');
  };

  const handleStartNew = () => {
    clearCurrentPlan();
    setShowPlanView(false);
    setQuestionCount(0);
    setMessages([]);
    setStartDate('');
    setEndDate('');
    setChatPhase('dateSetup');
  };

  const handleApiKeySubmit = async (apiKey: string) => {
    const isValid = await validateApiKey(apiKey);
    if (isValid) {
      setShowPremiumModal(false);
    } else {
      alert('유효하지 않은 API 키입니다. 다시 확인해주세요.');
      throw new Error('Invalid API key');
    }
  };

  if (showPlanView && currentPlan) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                📚 {currentPlan.title}
              </h1>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>📅 {currentPlan.duration}</span>
                <span>👥 {currentPlan.grade}학년 {currentPlan.classSize}명</span>
                <span>🗓️ {currentPlan.startDate} ~ {currentPlan.endDate}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStartModification}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                수정하기
              </button>
              <button
                onClick={handleStartNew}
                className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
              >
                새 계획 만들기
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Plans */}
        <div className="grid gap-4 mb-6">
          {currentPlan.weeklyPlans.map((week) => (
            <div key={week.week} className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {week.week}주차: {week.theme}
              </h3>

              {week.overview && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {week.overview}
                </p>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">🎯 활동</h4>
                  <ul className="space-y-1">
                    {week.activities.map((activity, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📊 목표</h4>
                  <ul className="space-y-1">
                    {week.goals.map((goal, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {week.materials.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📦 준비물</h4>
                  <div className="flex flex-wrap gap-2">
                    {week.materials.map((material, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded-lg text-gray-600">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Special Events */}
        {currentPlan.specialEvents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎉 특별 이벤트</h3>
            <div className="space-y-3">
              {currentPlan.specialEvents.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="px-3 py-1 bg-accent-100 text-accent-700 rounded-lg text-sm font-medium">
                    {event.date}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.event}</div>
                    <div className="text-sm text-gray-600 mt-1">{event.activity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment & Communication */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 평가 기준</h3>
            <ul className="space-y-2">
              {currentPlan.assessmentCriteria.map((criteria, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-accent-600 mr-2">{idx + 1}.</span>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 학부모 소통</h3>
            <ul className="space-y-2">
              {currentPlan.parentCommunication.map((comm, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-accent-600 mr-2">{idx + 1}.</span>
                  {comm}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI 활동 계획 도우미</h1>
              <p className="text-sm text-gray-600">학급 경제 교육 계획을 함께 만들어요</p>
            </div>
          </div>

          {savedPlans.length > 0 && (
            <button
              onClick={() => setShowPlanView(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              저장된 계획 ({savedPlans.length})
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>대화 진행도</span>
            <span>{chatPhase === 'completed' ? '완료' : '진행 중'}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-500"
              style={{
                width: chatPhase === 'dateSetup' ? '20%' :
                       chatPhase === 'greeting' ? '40%' :
                       chatPhase === 'collecting' ? '60%' :
                       chatPhase === 'reviewing' ? '80%' : '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Date Setup */}
      {chatPhase === 'dateSetup' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">📅 활동 기간 설정</h2>
            <p className="text-gray-600">비바빌리지 학급 경제 활동을 진행할 기간을 설정해주세요</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="mt-6 p-4 bg-accent-50 rounded-lg text-center">
              <p className="text-accent-700 font-medium">
                📊 예상 활동 기간: <span className="font-bold">{calculateWeeks()}주</span>
              </p>
              <p className="text-sm text-accent-600 mt-1">
                {format(new Date(startDate), 'yyyy년 M월 d일', { locale: ko })} ~ {format(new Date(endDate), 'yyyy년 M월 d일', { locale: ko })}
              </p>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <button
              onClick={handleDateConfirm}
              disabled={!startDate || !endDate}
              className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              다음 단계로 →
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      {chatPhase !== 'dateSetup' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 h-[600px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-accent-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs opacity-70">AI 도우미</span>
                  </div>
                )}
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                />
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {format(message.timestamp, 'HH:mm', { locale: ko })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200/50 p-4">
          {chatPhase === 'reviewing' && (
            <div className="mb-3 p-3 bg-accent-50 rounded-lg">
              <p className="text-sm text-accent-700 mb-2">
                계획이 준비되었습니다. 확정하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCompletePlan}
                  disabled={isLoading}
                  className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 text-sm"
                >
                  계획 확정하기
                </button>
                <button
                  onClick={() => setChatPhase('collecting')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
                >
                  더 수정하기
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                } else if (e.key === 'Enter' && e.shiftKey) {
                  // 줄바꿈 허용 (기본 동작)
                }
              }}
              placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
              disabled={isLoading || chatPhase === 'completed'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:bg-gray-100 min-h-[48px] max-h-[120px] resize-none"
              rows={1}
              style={{
                height: 'auto',
                overflowY: inputValue.split('\n').length > 2 ? 'scroll' : 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim() || chatPhase === 'completed'}
              className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50"
            >
              전송
            </button>
          </div>

          {/* Quick Actions */}
          {(() => {
            const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

            if (chatPhase === 'greeting' && questionCount === 0) {
              return (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setInputValue('3월 개학부터'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    3월 개학부터
                  </button>
                  <button
                    onClick={() => { setInputValue('다음 주부터'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    다음 주부터
                  </button>
                  <button
                    onClick={() => { setInputValue('1학기 전체'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    1학기 전체
                  </button>
                </div>
              );
            }

            if (lastMessage.includes('특별') || lastMessage.includes('행사')) {
              return (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setInputValue('운동회, 소풍 있어요'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    운동회, 소풍
                  </button>
                  <button
                    onClick={() => { setInputValue('특별 행사 없어요'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    없음
                  </button>
                </div>
              );
            }

            if (lastMessage.includes('목표') || lastMessage.includes('중점')) {
              return (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setInputValue('저축 습관 기르기에 집중'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    저축 습관
                  </button>
                  <button
                    onClick={() => { setInputValue('투자 개념 배우기'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    투자 개념
                  </button>
                  <button
                    onClick={() => { setInputValue('창업 체험 활동'); handleSend(); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    창업 체험
                  </button>
                </div>
              );
            }

            return null;
          })()}
        </div>
      </div>
      )}

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName="AI 활동 계획"
        onApiKeySubmit={handleApiKeySubmit}
      />
    </div>
  );
}