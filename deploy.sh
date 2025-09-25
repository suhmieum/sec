#!/bin/bash

# 비바빌리지 GitHub Pages 배포 스크립트

echo "🚀 비바빌리지 배포 시작..."

# 1. 빌드 디렉토리 정리
echo "📁 기존 빌드 파일 정리 중..."
cd vivaa-town/client
rm -rf dist

# 2. 프로젝트 빌드
echo "🔨 프로젝트 빌드 중..."
npm run build

# 3. 빌드 결과를 루트로 복사
echo "📦 빌드 파일 복사 중..."
cd ../../
rm -rf *.html *.js *.css assets/
cp -r vivaa-town/client/dist/* .

# 4. Git에 커밋 및 푸시
echo "📤 Git에 배포 중..."
git add .
git commit -m "🚀 Deploy: 포트폴리오 기능 추가 및 API 키 보안 강화

- 학생 개별 포트폴리오 시스템 완성
- AI 교사 피드백 기능 (Gemini 2.0 Flash-001)
- 하늘색 테마로 UI 통일
- 환경변수로 API 키 보안 처리
- 4개 탭으로 체계적인 정보 구성"

git push origin main

echo "✅ 배포 완료! https://suhmieum.github.io/sec 에서 확인하세요"