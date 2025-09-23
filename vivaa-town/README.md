# 비바타운 (VivaaTown) - 학급 경제 운영 플랫폼

SEC(Small Economy in the Classroom) 프로그램 기반 초등 학급 경제 운영 웹 플랫폼

## 🚀 프로젝트 시작하기

### 필수 요구사항
- Node.js (v16 이상)
- PostgreSQL (설치 선택사항 - 나중에 설정 가능)

### 설치 및 실행

#### 1. 백엔드 서버 실행
```bash
cd vivaa-town/server
npm install
npm run dev
```
서버가 http://localhost:7001 에서 실행됩니다.

#### 2. 프론트엔드 실행
```bash
cd vivaa-town/client
npm install
npm run dev
```
프론트엔드가 http://localhost:6100 에서 실행됩니다.

## 📋 주요 기능

### 교사용 기능
- 학급 경제 개설 및 관리
- 직업 및 급여 관리
- 아이템 상점 운영
- 은행 상품 관리
- 경제 지표 모니터링

### 학생용 기능
- 개인 통장 관리
- 아이템 구매/거래
- 예금 및 대출
- 주식 투자
- 창업 활동

## 🛠 기술 스택

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Axios

### Backend
- Node.js + Express
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication

## 📁 프로젝트 구조

```
vivaa-town/
├── client/              # 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
│
└── server/              # 백엔드
    ├── src/
    │   ├── controllers/
    │   ├── entities/
    │   ├── middleware/
    │   ├── routes/
    │   ├── utils/
    │   └── index.ts
    └── package.json
```

## 🔧 환경 설정

### 백엔드 환경 변수 (.env)
```
PORT=7001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=vivaatown
JWT_SECRET=your-secret-key
```

## 📝 API 엔드포인트

### 기본 엔드포인트
- `GET /api/health` - 서버 상태 확인
- `GET /api/test` - API 테스트

### 인증 (추가 예정)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

## 🚧 개발 현황

- [x] 프로젝트 초기 설정
- [x] 프론트엔드 환경 구성
- [x] 백엔드 서버 구성
- [x] 기본 UI 구현
- [ ] PostgreSQL 데이터베이스 연결
- [ ] JWT 인증 시스템
- [ ] 학급 관리 기능
- [ ] 경제 활동 기능

## 📄 라이센스

MIT

## 👨‍💻 개발자

SEC 프로그램 기반 학급 경제 운영 플랫폼