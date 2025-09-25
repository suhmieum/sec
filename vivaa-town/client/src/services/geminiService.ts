import { GoogleGenerativeAI } from '@google/generative-ai';

// 프리미엄 스토어에서 API 키를 가져와 사용
const getGenAI = () => {
  // 동적 import로 순환 의존성 방지
  const premiumStore = JSON.parse(localStorage.getItem('premium-store') || '{}');
  const apiKey = premiumStore.state?.geminiApiKey;

  if (!apiKey) {
    throw new Error('API key not found. Please enter a valid Gemini API key.');
  }

  return new GoogleGenerativeAI(apiKey);
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TeacherProfile {
  school?: string;
  grade?: number;
  classSize?: number;
  experience?: string;
  academicCalendar: {
    semester1Start?: string;
    summerBreak?: string;
    semester2Start?: string;
    winterBreak?: string;
  };
  specialEvents?: Array<{date: string; event: string}>;
  preferences?: {
    duration?: string;
    focus?: string;
    parentInvolvement?: string;
    curriculumIntegration?: string[];
  };
}

export interface LessonPlan {
  id: string;
  title: string;
  duration: string;
  startDate: string;
  endDate: string;
  grade: number;
  classSize: number;
  weeklyPlans: Array<{
    week: number;
    theme: string;
    overview: string;
    activities: string[];
    goals: string[];
    materials: string[];
  }>;
  specialEvents: Array<{date: string; event: string; activity: string}>;
  assessmentCriteria: string[];
  parentCommunication: string[];
  createdAt: Date;
  modifiedAt?: Date;
}

class GeminiService {
  private model;
  private systemPrompt = `비바빌리지 학급 경제 계획 전문 도우미.

비바빌리지는 100% 디지털 가상화폐 기반 교육 플랫폼입니다:
- 가상화폐: 선생님이 설정한 화폐 단위 (실제 돈 사용 안함)
- 모든 활동이 컴퓨터/태블릿에서 이루어짐
- 실제 예산이나 물리적 물건 구매 없음
- 가상 직업, 가상 상점, 가상 투자 등 디지털 경제 체험

핵심 기능: 개인통장, 직업시스템, 급여, 세금, 아이템상점, 거래, 예금/적금, 주식투자, 업적시스템

3-4개 질문으로 교육 목표와 중점사항만 파악하여 계획 완성.`;

  constructor() {
    // 생성자에서는 모델을 초기화하지 않고 지연 초기화 사용
  }

  private getModel() {
    if (!this.model) {
      const genAI = getGenAI();
      this.model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 10,
          maxOutputTokens: 300,
        }
      });
    }
    return this.model;
  }

  async startChatWithDates(
    classroom?: any,
    studentCount?: number,
    startDate?: string,
    endDate?: string,
    weekCount?: number
  ): Promise<string> {
    let contextInfo = '';

    if (classroom) {
      const gradeMatch = classroom.name.match(/(\d+)/);
      const grade = gradeMatch ? gradeMatch[1] : null;

      contextInfo = `
현재 교사가 운영 중인 학급 정보:
- 학급명: ${classroom.name}
- 학생 수: ${studentCount || 0}명
- 화폐 단위: ${classroom.currencyUnit}
${grade ? `- 학년: ${grade}학년 (학급명에서 추출)` : ''}
${startDate && endDate ? `
- 활동 기간: ${startDate} ~ ${endDate}
- 예상 주차 수: ${weekCount}주` : ''}

이미 학급이 만들어져 있고 활동 기간이 설정되었습니다.
`;
    }

    const gradeInfo = classroom ? (() => {
      const gradeMatch = classroom.name.match(/(\d+)/);
      return gradeMatch ? `${gradeMatch[1]}학년` : '학급';
    })() : '학급';

    const prompt = classroom
      ? `${this.systemPrompt}

안녕하세요! ${classroom.name} ${gradeInfo} ${studentCount}명의 비바빌리지 학급 경제 계획을 도와드리겠습니다.

${startDate && endDate ? `활동 기간이 ${startDate}부터 ${endDate}까지 ${weekCount}주로 설정되었네요!` : ''}

비바빌리지는 모든 활동이 디지털로 이뤄지는 가상화폐 플랫폼입니다. 실제 돈이나 물건 없이 ${classroom.currencyUnit}로 경제를 배워요.

어떤 경제 개념을 중점적으로 가르치고 싶으신가요? (저축습관, 투자체험, 직업체험, 창업정신 등)`
      : '비바빌리지 학급 경제 계획을 도와드리겠습니다. 학년과 학급 규모를 알려주세요.';

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('AI 응답 생성 중 오류가 발생했습니다.');
    }
  }

  async startChat(classroom?: any, studentCount?: number): Promise<string> {
    let contextInfo = '';

    if (classroom) {
      const gradeMatch = classroom.name.match(/(\d+)/);
      const grade = gradeMatch ? gradeMatch[1] : null;

      contextInfo = `
현재 교사가 운영 중인 학급 정보:
- 학급명: ${classroom.name}
- 학생 수: ${studentCount || 0}명
- 화폐 단위: ${classroom.currencyUnit}
${grade ? `- 학년: ${grade}학년 (학급명에서 추출)` : ''}

이미 학급이 만들어져 있으므로, 학년과 인원수는 확인되었습니다.
`;
    }

    const gradeInfo = classroom ? (() => {
      const gradeMatch = classroom.name.match(/(\d+)/);
      return gradeMatch ? `${gradeMatch[1]}학년` : '학급';
    })() : '학급';

    const prompt = classroom
      ? `${this.systemPrompt}

안녕하세요! ${classroom.name} ${gradeInfo} ${studentCount}명의 비바빌리지 학급 경제 계획을 도와드리겠습니다.

언제부터 시작하실 계획인가요?`
      : '비바빌리지 학급 경제 계획을 도와드리겠습니다. 학년과 학급 규모를 알려주세요.';

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('AI 응답 생성 중 오류가 발생했습니다.');
    }
  }

  async sendMessage(messages: ChatMessage[], currentProfile: TeacherProfile): Promise<string> {
    const conversationHistory = messages
      .map(msg => `${msg.role === 'user' ? '교사' : 'AI'}: ${msg.content}`)
      .join('\n');

    const profileContext = `
현재까지 파악된 교사 프로필:
- 학급명: ${currentProfile.school || '미정'}
- 학년: ${currentProfile.grade ? `${currentProfile.grade}학년` : '미정'}
- 학급 규모: ${currentProfile.classSize || '미정'}명
- 경험: ${currentProfile.experience || '미정'}
- 1학기 시작: ${currentProfile.academicCalendar.semester1Start || '미정'}
- 여름방학: ${currentProfile.academicCalendar.summerBreak || '미정'}
- 2학기 시작: ${currentProfile.academicCalendar.semester2Start || '미정'}
- 겨울방학: ${currentProfile.academicCalendar.winterBreak || '미정'}
`;

    const conversationCount = messages.length;

    const todayDate = new Date().toLocaleDateString('ko-KR');

    const prompt = `오늘 날짜: ${todayDate}
${this.systemPrompt}

${profileContext}

대화 내역:
${conversationHistory}

지금까지 ${conversationCount}번 대화했습니다.

3번째 대화에서는 반드시 "계획을 확정하겠습니다! 잠시만 기다려주세요."라고 말해야 합니다.

비바빌리지 디지털 플랫폼 기반으로 간단히 질문하세요:
- 1번째: 중점 교육 목표 (저축습관/투자체험/직업체험/창업정신 등)
- 2번째: 학생들 특성이나 관심사 (활발한편인지, 경제에 관심있는지 등)
- 3번째: "계획을 확정하겠습니다! 잠시만 기다려주세요."

비바빌리지는 가상화폐 기반이므로 실제 예산이나 물리적 준비물은 묻지 마세요.`;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('AI 응답 생성 중 오류가 발생했습니다.');
    }
  }

  async generateFinalPlanWithDates(
    messages: ChatMessage[],
    profile: TeacherProfile,
    startDate?: string,
    endDate?: string,
    weekCount?: number
  ): Promise<LessonPlan> {
    const conversationHistory = messages
      .map(msg => `${msg.role === 'user' ? '교사' : 'AI'}: ${msg.content}`)
      .join('\n');

    // 날짜 정보가 제공된 경우 사용, 아니면 기본 로직 사용
    let actualWeekCount = weekCount || 14;
    let actualStartDate = startDate || "2025-09-25";
    let actualEndDate = endDate || "2025-12-31";
    let duration = `${actualWeekCount}주`;

    const prompt = `비바빌리지 학급 경제 교육 계획서를 JSON으로 생성하세요.

대화 내역: ${conversationHistory}

설정된 활동 기간:
- 시작일: ${actualStartDate}
- 종료일: ${actualEndDate}
- 총 기간: ${actualWeekCount}주

비바빌리지 기능: 가상화폐, 직업시스템, 급여, 거래, 예금/적금, 주식투자, 아이템상점, 업적시스템

대화 내용을 바탕으로 ${actualWeekCount}주간 상세 계획을 생성하세요. 아래 JSON 형식만 반환하세요. 설명이나 다른 텍스트 없이 JSON만:

{
  "title": "비바빌리지 학급경제 계획",
  "duration": "${duration}",
  "startDate": "${actualStartDate}",
  "endDate": "${actualEndDate}",
  "grade": 6,
  "classSize": 25,
  "weeklyPlans": [
    {
      "week": 1,
      "theme": "비바코인과 개인통장",
      "overview": "비바빌리지 학급경제의 첫걸음으로 가상화폐 개념을 이해하고 개인 경제활동의 기초를 다집니다. 학생들이 디지털 화폐 시스템에 친숙해지도록 합니다.",
      "activities": ["가상화폐 소개", "개인통장 개설", "기본 거래 실습"],
      "goals": ["화폐 개념 이해", "개인통장 사용법 학습"],
      "materials": ["컴퓨터", "비바빌리지 플랫폼"]
    },
    {
      "week": 2,
      "theme": "직업과 급여시스템",
      "overview": "다양한 직업을 통해 책임감과 근로 의식을 기르고, 급여를 받는 과정에서 노동의 가치를 이해합니다. 세금의 개념도 자연스럽게 학습합니다.",
      "activities": ["직업 선택", "급여 수령", "세금 이해"],
      "goals": ["직업 책임감", "급여 관리"],
      "materials": ["직업 카드", "급여명세서"]
    }
  ],
  "specialEvents": [
    {"date": "2025-10-15", "event": "중간 성과 발표회", "activity": "개인 경제 활동 발표"}
  ],
  "assessmentCriteria": ["참여도", "활동 완성도", "협력적 태도"],
  "parentCommunication": ["월간 보고서", "가정통신문", "경제 활동 포트폴리오"]
}

※ weeklyPlans는 ${actualWeekCount}주분 모두 작성하고, 각 주차별 overview를 2-3줄로 작성하세요. 비바빌리지 핵심 기능(가상화폐, 직업, 거래, 예금/적금, 주식투자, 아이템상점, 업적)을 순차적으로 다루세요.`;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSON 추출 및 정리 (코드 블록이나 마크다운 제거)
      let jsonString = text.trim();

      // 마크다운 코드 블록 제거
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '');

      // JSON 패턴 매칭
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('유효한 JSON을 찾을 수 없습니다.');
      }

      let planData;
      try {
        planData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', text);

        // 기본 계획 데이터 생성 (동적 주차 수)
        planData = {
          title: "비바빌리지 학급경제 계획",
          duration: duration,
          startDate: actualStartDate,
          endDate: actualEndDate,
          grade: 6,
          classSize: 25,
          weeklyPlans: this.generateWeeklyPlans(actualWeekCount),
          specialEvents: [
            {date: "2025-10-15", event: "중간 경제 성과 발표회", activity: "개인별 경제 활동 발표"},
            {date: "2025-11-15", event: "모의 창업 경진대회", activity: "팀별 사업 아이디어 발표"},
            {date: "2025-12-20", event: "학급 경제 축제", activity: "전체 활동 정리 및 시상"}
          ],
          assessmentCriteria: ["참여도", "활동 완성도", "협력적 태도", "창의적 사고"],
          parentCommunication: ["월간 보고서", "가정통신문", "경제 활동 포트폴리오"]
        };
      }

      return {
        id: crypto.randomUUID(),
        ...planData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Plan generation error:', error);
      throw new Error('계획서 생성 중 오류가 발생했습니다.');
    }
  }

  async generateFinalPlan(messages: ChatMessage[], profile: TeacherProfile): Promise<LessonPlan> {
    const conversationHistory = messages
      .map(msg => `${msg.role === 'user' ? '교사' : 'AI'}: ${msg.content}`)
      .join('\n');

    // 대화에서 시작일과 종료일 추출
    const startDateMatch = conversationHistory.match(/(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}월\s*\d{1,2}일|오늘|내일|\d{1,2}일)/);
    const endDateMatch = conversationHistory.match(/(12월|겨울방학|학기말|\d{1,2}월\s*말|\d{4}-\d{1,2}-\d{1,2})/);

    // 기간 계산 (9월 25일부터 12월 말까지 = 약 14주)
    let weekCount = 14;
    let startDate = "2025-09-25";
    let endDate = "2025-12-31";
    let duration = "14주";

    // 간단한 기간 계산
    if (conversationHistory.includes("12월")) {
      weekCount = 14;
      duration = "14주 (3개월)";
    } else if (conversationHistory.includes("11월")) {
      weekCount = 10;
      duration = "10주 (2개월)";
      endDate = "2025-11-30";
    }

    const prompt = `비바빌리지 학급 경제 교육 계획서를 JSON으로 생성하세요.

대화 내역: ${conversationHistory}

비바빌리지 기능: 가상화폐, 직업시스템, 급여, 거래, 예금/적금, 주식투자, 아이템상점, 업적시스템

대화 내용을 바탕으로 ${weekCount}주간 상세 계획을 생성하세요. 아래 JSON 형식만 반환하세요. 설명이나 다른 텍스트 없이 JSON만:

{
  "title": "비바빌리지 학급경제 계획",
  "duration": "${duration}",
  "startDate": "${startDate}",
  "endDate": "${endDate}",
  "grade": 6,
  "classSize": 25,
  "weeklyPlans": [
    {
      "week": 1,
      "theme": "비바코인과 개인통장",
      "overview": "비바빌리지 학급경제의 첫걸음으로 가상화폐 개념을 이해하고 개인 경제활동의 기초를 다집니다. 학생들이 디지털 화폐 시스템에 친숙해지도록 합니다.",
      "activities": ["가상화폐 소개", "개인통장 개설", "기본 거래 실습"],
      "goals": ["화폐 개념 이해", "개인통장 사용법 학습"],
      "materials": ["컴퓨터", "비바빌리지 플랫폼"]
    },
    {
      "week": 2,
      "theme": "직업과 급여시스템",
      "overview": "다양한 직업을 통해 책임감과 근로 의식을 기르고, 급여를 받는 과정에서 노동의 가치를 이해합니다. 세금의 개념도 자연스럽게 학습합니다.",
      "activities": ["직업 선택", "급여 수령", "세금 이해"],
      "goals": ["직업 책임감", "급여 관리"],
      "materials": ["직업 카드", "급여명세서"]
    }
  ],
  "specialEvents": [
    {"date": "2025-10-15", "event": "중간 성과 발표회", "activity": "개인 경제 활동 발표"}
  ],
  "assessmentCriteria": ["참여도", "활동 완성도", "협력적 태도"],
  "parentCommunication": ["월간 보고서", "가정통신문", "경제 활동 포트폴리오"]
}

※ weeklyPlans는 ${weekCount}주분 모두 작성하고, 각 주차별 overview를 2-3줄로 작성하세요. 비바빌리지 핵심 기능(가상화폐, 직업, 거래, 예금/적금, 주식투자, 아이템상점, 업적)을 순차적으로 다루세요.`;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSON 추출 및 정리 (코드 블록이나 마크다운 제거)
      let jsonString = text.trim();

      // 마크다운 코드 블록 제거
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '');

      // JSON 패턴 매칭
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('유효한 JSON을 찾을 수 없습니다.');
      }

      let planData;
      try {
        planData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', text);

        // 기본 계획 데이터 생성 (동적 주차 수)
        planData = {
          title: "비바빌리지 학급경제 계획",
          duration: duration,
          startDate: startDate,
          endDate: endDate,
          grade: 6,
          classSize: 25,
          weeklyPlans: this.generateWeeklyPlans(weekCount),
          specialEvents: [
            {date: "2025-10-15", event: "중간 경제 성과 발표회", activity: "개인별 경제 활동 발표"},
            {date: "2025-11-15", event: "모의 창업 경진대회", activity: "팀별 사업 아이디어 발표"},
            {date: "2025-12-20", event: "학급 경제 축제", activity: "전체 활동 정리 및 시상"}
          ],
          assessmentCriteria: ["참여도", "활동 완성도", "협력적 태도", "창의적 사고"],
          parentCommunication: ["월간 보고서", "가정통신문", "경제 활동 포트폴리오"]
        };
      }

      return {
        id: crypto.randomUUID(),
        ...planData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Plan generation error:', error);
      throw new Error('계획서 생성 중 오류가 발생했습니다.');
    }
  }

  async modifyPlan(existingPlan: LessonPlan, modificationRequest: string): Promise<LessonPlan> {
    const prompt = `${this.systemPrompt}

기존 계획서:
${JSON.stringify(existingPlan, null, 2)}

수정 요청사항:
${modificationRequest}

위 요청사항을 반영하여 계획서를 수정하고, 수정된 전체 계획서를 JSON 형식으로 반환하세요.
기존 계획서의 형식을 유지하면서 요청된 부분만 수정하세요.

JSON만 반환하고 다른 설명은 포함하지 마세요.`;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('계획서 수정 실패');
      }

      const planData = JSON.parse(jsonMatch[0]);

      return {
        ...planData,
        id: existingPlan.id,
        createdAt: existingPlan.createdAt,
        modifiedAt: new Date()
      };
    } catch (error) {
      console.error('Plan modification error:', error);
      throw new Error('계획서 수정 중 오류가 발생했습니다.');
    }
  }

  private generateWeeklyPlans(weekCount: number) {
    const baseWeeks = [
      {
        week: 1,
        theme: "비바코인과 개인통장",
        overview: "비바빌리지 학급경제의 첫걸음으로 가상화폐 개념을 이해하고 개인 경제활동의 기초를 다집니다. 학생들이 디지털 화폐 시스템에 친숙해지도록 합니다.",
        activities: ["가상화폐 소개", "개인통장 개설", "기본 거래 실습"],
        goals: ["화폐 개념 이해", "개인통장 사용법 학습"],
        materials: ["컴퓨터", "비바빌리지 플랫폼"]
      },
      {
        week: 2,
        theme: "직업과 급여시스템",
        overview: "다양한 직업을 통해 책임감과 근로 의식을 기르고, 급여를 받는 과정에서 노동의 가치를 이해합니다. 세금의 개념도 자연스럽게 학습합니다.",
        activities: ["직업 선택", "급여 수령", "세금 이해"],
        goals: ["직업 책임감", "급여 관리"],
        materials: ["직업 카드", "급여명세서"]
      },
      {
        week: 3,
        theme: "아이템 상점과 거래",
        overview: "비바빌리지 상점에서 아이템을 구매하고 친구들과 거래하는 경험을 통해 시장경제 원리를 체험합니다. 합리적인 소비 습관을 기릅니다.",
        activities: ["아이템 구매", "거래 체험", "가격 협상"],
        goals: ["거래 원리 이해", "합리적 소비"],
        materials: ["아이템 카탈로그", "거래 장부"]
      },
      {
        week: 4,
        theme: "저축과 예금",
        overview: "정기예금과 적금을 통해 저축의 중요성을 배우고 복리 이자의 마법을 경험합니다. 미래를 위한 계획적인 저축 습관을 형성합니다.",
        activities: ["정기예금 가입", "적금 시작", "이자 계산"],
        goals: ["저축 습관 형성", "복리 이해"],
        materials: ["예금상품 안내서", "계산기"]
      },
      {
        week: 5,
        theme: "세금과 국고",
        overview: "세금을 납부하고 공공재를 구매하는 과정을 통해 세금의 필요성과 공동체 의식을 기릅니다. 국고 운영에 참여하여 민주시민 의식을 함양합니다.",
        activities: ["세금 납부", "공공재 구매", "국고 운영"],
        goals: ["세금의 필요성 이해", "공동체 의식"],
        materials: ["세금 신고서", "국고 장부"]
      },
      {
        week: 6,
        theme: "주식 투자 기초",
        overview: "주식의 개념을 배우고 기업을 분석하여 모의 투자를 해봅니다. 투자의 기본 원리와 위험 관리의 중요성을 이해합니다.",
        activities: ["주식 개념", "종목 분석", "모의 투자"],
        goals: ["투자 원리 이해", "위험 관리"],
        materials: ["주식 차트", "투자 일지"]
      },
      {
        week: 7,
        theme: "포트폴리오 관리",
        overview: "투자 포트폴리오를 구성하고 수익률을 계산해봅니다. 분산 투자를 통한 리스크 관리 방법을 학습하고 투자 전략을 수립합니다.",
        activities: ["수익률 계산", "분산 투자", "투자 전략"],
        goals: ["포트폴리오 구성", "리스크 관리"],
        materials: ["투자 현황표", "계산기"]
      },
      {
        week: 8,
        theme: "대출과 신용",
        overview: "필요할 때 대출을 신청하고 신용등급의 중요성을 배웁니다. 계획적인 차용과 상환 계획 수립의 중요성을 이해합니다.",
        activities: ["대출 신청", "신용등급 확인", "상환 계획"],
        goals: ["신용의 중요성", "계획적 차용"],
        materials: ["대출 신청서", "신용등급표"]
      },
      {
        week: 9,
        theme: "창업과 사업",
        overview: "창의적인 사업 아이디어를 발굴하고 창업을 준비해봅니다. 기업가 정신을 기르고 수익 계산을 통해 사업의 기본을 이해합니다.",
        activities: ["사업 아이디어", "창업 준비", "수익 계산"],
        goals: ["기업가 정신", "사업 계획 수립"],
        materials: ["사업계획서", "창업 자금"]
      },
      {
        week: 10,
        theme: "경제 지표 분석",
        overview: "인플레이션과 경기 변동을 체험하며 거시경제 개념을 이해합니다. 시장 분석을 통해 경제 흐름을 읽는 능력을 기릅니다.",
        activities: ["인플레이션 체험", "경기 변동", "시장 분석"],
        goals: ["거시경제 이해", "시장 동향 파악"],
        materials: ["경제 지표 자료", "분석 도구"]
      },
      {
        week: 11,
        theme: "업적과 성과 평가",
        overview: "지금까지의 경제 활동을 돌아보고 달성한 업적을 확인합니다. 자신의 성과를 분석하고 개선점을 찾아 성장 마인드를 기릅니다.",
        activities: ["업적 달성 확인", "성과 분석", "개선점 도출"],
        goals: ["자기 평가 능력", "성장 마인드"],
        materials: ["업적 체크리스트", "성과표"]
      },
      {
        week: 12,
        theme: "종합 정리 및 발표",
        overview: "학급 경제 활동을 종합 정리하고 친구들 앞에서 성과를 발표합니다. 학습한 내용을 성찰하고 표현 능력을 기릅니다.",
        activities: ["경제 활동 정리", "성과 발표", "소감 나누기"],
        goals: ["학습 성찰", "표현 능력 향상"],
        materials: ["발표 자료", "활동 포트폴리오"]
      },
      {
        week: 13,
        theme: "심화 경제 활동",
        overview: "기본 활동을 넘어서 더 복잡한 경제 상황을 체험해봅니다. 실제 경제에서 일어나는 다양한 상황들을 시뮬레이션합니다.",
        activities: ["복합 거래", "경제 위기 대응", "국제 거래"],
        goals: ["응용 능력", "문제 해결력"],
        materials: ["시뮬레이션 도구", "상황 카드"]
      },
      {
        week: 14,
        theme: "미래 설계와 마무리",
        overview: "학습한 경제 지식을 바탕으로 미래 계획을 세우고 비바빌리지 활동을 마무리합니다. 실생활에 적용할 수 있는 경제 습관을 다짐합니다.",
        activities: ["미래 계획 수립", "경제 습관 다짐", "활동 마무리"],
        goals: ["미래 설계 능력", "실생활 적용"],
        materials: ["계획서", "다짐 카드"]
      }
    ];

    return baseWeeks.slice(0, weekCount);
  }
}

export const geminiService = new GeminiService();