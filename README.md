# Low-Competition Video Finder & Generator

YouTube에 소개 영상이 부족하지만 수요는 증가 중인 아이템을 자동으로 찾고, Gemini 기반 기획 + 영상 생성까지 연결하는 자동화 플랫폼

## 🎯 프로젝트 개요

- **이름**: Low-Competition Video Finder & Generator
- **목표**: YouTube 경쟁도 분석과 AI 기반 영상 기획을 통한 콘텐츠 제작 지원
- **대상 사용자**: 1인 크리에이터, AI 실험가, Affiliate 마케터, 커머스 셀러

## 🌐 URL

- **개발 서버**: https://3000-ib1vrhp3boc20p22c1s5d-2b54fc91.sandbox.novita.ai
- **프로젝트 위치**: `/home/user/webapp`

## ✨ 주요 기능

### 현재 완성된 기능

1. **회원 인증 시스템**
   - 이메일/비밀번호 기반 회원가입/로그인
   - JWT 토큰 기반 세션 관리
   - 가입 시 1000 크레딧 자동 지급

2. **🔥 트렌드 키워드 추천 (NEW!)**
   - YouTube Trending API 기반 실시간 트렌드 분석
   - 카테고리별 인기 키워드 추천
   - 클릭 한 번으로 키워드 자동 입력
   - 수동 새로고침 가능

3. **키워드 분석**
   - YouTube Data API를 통한 경쟁도 분석
   - Gemini API를 통한 AI 기반 가치 판단
   - 영상 콘셉트 아이디어 3개 제안
   - Hook Line (첫 3초) 자동 생성

4. **🎬 영상 생성 (NEW!)**
   - AI 분석 기반 영상 자동 생성
   - 썸네일 자동 생성
   - 영상 URL 데이터베이스 저장

5. **크레딧 시스템**
   - 영상 생성 시 100 크레딧 자동 차감
   - 원자적 트랜잭션으로 안전한 크레딧 관리
   - 최대 10개 영상 생성 제한
   - 모든 크레딧 변경 로그 기록

6. **관리자 패널**
   - 전체 사용자 목록 조회
   - 사용자별 크레딧 조정 (추가/차감)
   - 사용자 권한 관리 (user ↔ admin)
   - 크레딧 변경 로그 조회

### 아직 구현되지 않은 기능

- 실제 영상 생성 API 연동 (현재 placeholder - GenSpark API 연동 필요)
- YouTube 자동 업로드
- 결제 시스템 (Payment)
- 팀 계정 기능
- 다국어 지원

## 🎥 Gemini API 통합 상세

### JSON 모드 사용
- `responseMimeType: "application/json"` 설정으로 순수 JSON 응답 보장
- 마크다운 코드 블록 파싱 불필요
- 안정적인 데이터 처리

### 분석 결과 구조
```json
{
  "worthCreating": true,
  "reasoning": "상세한 분석 및 추천 근거",
  "videoConcepts": [
    "콘셉트 1: 구체적인 영상 아이디어",
    "콘셉트 2: 대안적 접근 방식",
    "콘셉트 3: 차별화 전략"
  ],
  "hookLine": "시청자의 관심을 끄는 첫 3초 대사"
}
```

## 🏗️ 데이터 구조

### 데이터베이스 (D1 SQLite)

**Users 테이블**
- id, email, password_hash, role (user/admin)
- credits (기본 1000), videos_created (기본 0)
- created_at, last_login_at

**VideoLogs 테이블**
- id, user_id, keyword, credits_used
- status (processing/completed/failed)
- analysis_result (JSON), created_at

**CreditLogs 테이블**
- id, user_id, change_amount, reason
- admin_id (nullable), created_at

## 🛠️ 기술 스택

- **Backend**: Hono Framework on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript + TailwindCSS
- **Authentication**: JWT (Web Crypto API)
- **External APIs**: 
  - YouTube Data API v3
  - Google Gemini API (gemini-2.5-flash with JSON mode)

## 📖 사용 방법

### 일반 사용자

1. **회원가입**: 이메일과 비밀번호로 가입 (1000 크레딧 자동 지급)
2. **키워드 입력**: 분석하고 싶은 키워드 입력 (예: "무선 이어폰 추천")
3. **분석 결과 확인**: YouTube 경쟁도 + AI 판단 결과 확인
4. **영상 생성**: 추천된 경우 100 크레딧으로 영상 생성

### 관리자

1. `/admin` 페이지 접속
2. 전체 사용자 목록 확인
3. 크레딧 조정 또는 권한 변경

## 🚀 개발 환경 설정

### 로컬 개발

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run db:migrate:local

# 빌드
npm run build

# 개발 서버 시작
npm run dev:sandbox

# PM2로 데몬 실행
pm2 start ecosystem.config.cjs
```

### 환경 변수 (.dev.vars)

```env
YOUTUBE_API_KEY=AIzaSyAyzofYWPyAWlCSqetVsvlnErGwqTm2EZg
GEMINI_API_KEY=AIzaSyBth8jSOTXe3m2PDW5-VW5_4fwhbm2_te8
JWT_SECRET=super-secret-jwt-key-change-in-production
```

## 📦 프로덕션 배포

### Cloudflare Pages 배포 단계

1. **D1 데이터베이스 생성**
```bash
npx wrangler d1 create video-finder-production
# 출력된 database_id를 wrangler.jsonc에 추가
```

2. **환경 변수 설정**
```bash
npx wrangler pages secret put YOUTUBE_API_KEY
npx wrangler pages secret put GEMINI_API_KEY
npx wrangler pages secret put JWT_SECRET
```

3. **데이터베이스 마이그레이션**
```bash
npm run db:migrate:prod
```

4. **빌드 및 배포**
```bash
npm run deploy
```

## 🎨 프로젝트 구조

```
webapp/
├── src/
│   ├── index.tsx              # 메인 애플리케이션
│   ├── types.ts               # TypeScript 타입 정의
│   ├── routes/
│   │   ├── auth.ts            # 인증 라우트
│   │   ├── api.ts             # API 라우트
│   │   └── admin.ts           # 관리자 라우트
│   ├── services/
│   │   ├── youtube.ts         # YouTube API 서비스
│   │   └── gemini.ts          # Gemini API 서비스
│   ├── middleware/
│   │   └── auth.ts            # 인증 미들웨어
│   └── utils/
│       ├── crypto.ts          # 비밀번호 해싱
│       └── jwt.ts             # JWT 토큰 관리
├── public/
│   ├── app.js                 # 프론트엔드 메인 로직
│   └── admin.js               # 관리자 페이지 로직
├── migrations/
│   └── 0001_initial_schema.sql # 데이터베이스 스키마
├── .dev.vars                  # 로컬 환경 변수
├── wrangler.jsonc             # Cloudflare 설정
└── package.json               # 프로젝트 설정
```

## 📋 다음 단계 권장사항

1. **첫 번째 테스트 계정 생성**
   - 회원가입 후 테스트
   - 키워드 분석 테스트
   - 영상 생성 테스트

2. **관리자 권한 부여**
   - 데이터베이스에 직접 접근하여 role을 'admin'으로 변경
   ```bash
   npm run db:console:local
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

3. **프로덕션 배포**
   - Cloudflare 계정 생성
   - D1 데이터베이스 생성
   - API 키 설정
   - 배포 및 테스트

## 🔐 보안 주의사항

- `.dev.vars` 파일은 절대 Git에 커밋하지 마세요
- 프로덕션에서는 강력한 JWT_SECRET 사용
- API 키는 Cloudflare Secrets로 관리
- 정기적인 크레딧 로그 모니터링

## 📊 시스템 상태

- ✅ 인증 시스템: 완료
- ✅ YouTube API 통합: 완료
- ✅ Gemini API 통합: 완료 (JSON 모드)
- ✅ 트렌드 키워드 추천: 완료
- ✅ 크레딧 시스템: 완료
- ✅ 관리자 패널: 완료
- ✅ Frontend UI: 완료
- ⏸️ 실제 영상 생성: Mock 구현 (GenSpark API 연동 필요)
- ⏸️ 결제 시스템: 미구현

## 🐛 최근 수정 사항

### 2026-01-27 오후
- ✅ Gemini JSON 파싱 안정화
  - `responseMimeType: "application/json"` 적용
  - 마크다운 코드 블록 파싱 제거
  - 순수 JSON 응답으로 파싱 안정성 향상
- ✅ 트렌드 키워드 추천 기능 추가
- ✅ 영상 생성 플로우 구현 (Mock)
- ✅ 정적 파일 서빙 문제 해결

## 🤝 기여

- **개발**: Claude (AI Assistant)
- **PRD**: 슬기님
- **마지막 업데이트**: 2026-01-27
