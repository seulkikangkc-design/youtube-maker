# 🎨 YouTube Thumbnail Maker - AI 썸네일 제작기

YouTube 경쟁도 분석과 AI 기반 썸네일 자동 생성 플랫폼

## 🎯 프로젝트 개요

- **이름**: YouTube Thumbnail Maker
- **목표**: YouTube 키워드 분석 + AI 기반 자극적인 한글 제목이 포함된 16:9 썸네일 자동 생성
- **대상 사용자**: 1인 크리에이터, 유튜버, 콘텐츠 마케터

## 🌐 URL

- **개발 서버**: https://3000-ib1vrhp3boc20p22c1s5d-2b54fc91.sandbox.novita.ai
- **GitHub**: https://github.com/seulkikangkc-design/youtube-maker
- **프로젝트 위치**: `/home/user/webapp`

## ✨ 주요 기능

### 현재 완성된 기능

1. **회원 인증 시스템**
   - 이메일/비밀번호 기반 회원가입/로그인
   - JWT 토큰 기반 세션 관리
   - 가입 시 1000 크레딧 자동 지급

2. **🔥 트렌드 키워드 추천**
   - YouTube Trending API 기반 실시간 트렌드 분석
   - 카테고리별 인기 키워드 추천
   - 클릭 한 번으로 키워드 자동 입력

3. **키워드 분석**
   - YouTube Data API를 통한 경쟁도 분석
   - Gemini API를 통한 AI 기반 가치 판단
   - 영상 콘셉트 아이디어 3개 제안
   - Hook Line (첫 3초) 자동 생성

4. **🎨 썸네일 자동 생성 (NEW!)**
   - Google AI Studio Imagen 3 기반 실제 이미지 생성
   - 16:9 비율 최적화
   - 자극적이고 볼드한 한글 제목 포함
   - 오브제 + 제목 조합
   - 50 크레딧 소모

5. **크레딧 시스템**
   - 썸네일 생성 시 50 크레딧 차감
   - 영상 로그 생성 시 100 크레딧 차감
   - 원자적 트랜잭션으로 안전한 크레딧 관리
   - 최대 10개 영상 생성 제한
   - 모든 크레딧 변경 로그 기록

6. **관리자 패널**
   - 전체 사용자 목록 조회
   - 사용자별 크레딧 조정 (추가/차감)
   - 사용자 권한 관리 (user ↔ admin)
   - 크레딧 변경 로그 조회

### 아직 구현되지 않은 기능

- 결제 시스템 (Payment)
- 팀 계정 기능
- 다국어 지원

## 🎨 썸네일 생성 상세

### Google AI Studio API 통합

**텍스트 분석**: `gemini-3.1-pro-preview`
- YouTube 경쟁도 분석
- 영상 콘셉트 제안
- Hook Line 생성

**이미지 생성**: `gemini-3-pro-image-preview`
- 16:9 비율 (1920x1080)
- 자극적이고 볼드한 한글 제목
- 고품질 JPEG/PNG 이미지
- Base64 인코딩 직접 반환

### 썸네일 프롬프트 구조
```
- 16:9 ratio (YouTube 최적화)
- Eye-catching main object/subject
- LARGE, BOLD Korean text prominently displayed
- High contrast colors (vibrant and attention-grabbing)
- Professional, clean design
- Dramatic lighting or visual effects
```

### 생성 결과 예시
```json
{
  "success": true,
  "thumbnail": {
    "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
    "prompt": "YouTube thumbnail for 무선 이어폰...",
    "model": "gemini-3-pro-image-preview"
  },
  "keyword": "무선 이어폰",
  "hookLine": "🔥 가성비 최고 무선 이어폰 TOP 5",
  "creditsDeducted": 50
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
  - Google AI Studio API (Gemini + Imagen)
    - `gemini-3.1-pro-preview` - 텍스트 분석
    - `gemini-3-pro-image-preview` - 이미지 생성

## 💰 크레딧 시스템

| 기능 | 크레딧 | 설명 |
|------|--------|------|
| 가입 보너스 | +1,000 | 최초 가입 시 자동 지급 |
| 키워드 분석 | 무료 | YouTube + Gemini 분석 |
| 썸네일 생성 | -50 | Google AI Studio Imagen 3 |
| 영상 로그 생성 | -100 | 데이터베이스 저장 |

## 📖 사용 방법

### 일반 사용자

1. **회원가입**: 이메일과 비밀번호로 가입 (1000 크레딧 자동 지급)
2. **키워드 입력**: 분석하고 싶은 키워드 입력 (예: "무선 이어폰")
3. **분석 결과 확인**: YouTube 경쟁도 + AI 판단 + Hook Line 확인
4. **썸네일 생성**: 50 크레딧으로 자극적인 한글 제목 썸네일 생성

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

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs
```

### 환경 변수 (.dev.vars)

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=super-secret-jwt-key-change-in-production
```

**⚠️ 중요**: 
- `.dev.vars` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함)
- **실제 API 키는 절대 Git에 올리지 마세요!**
- 프로덕션 배포 시 Cloudflare Secrets로 관리

## 📦 프로덕션 배포

### Cloudflare Pages 배포 단계

1. **D1 데이터베이스 생성**
```bash
npx wrangler d1 create youtube-thumbnail-maker-production
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
│   │   ├── api.ts             # API 라우트 (썸네일 생성 포함)
│   │   └── admin.ts           # 관리자 라우트
│   ├── services/
│   │   ├── youtube.ts         # YouTube API 서비스
│   │   ├── gemini.ts          # Gemini 텍스트 분석
│   │   ├── gemini-media.ts    # Imagen 이미지 생성
│   │   └── trending.ts        # 트렌드 키워드
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
├── .dev.vars                  # 로컬 환경 변수 (Git 제외)
├── wrangler.jsonc             # Cloudflare 설정
└── package.json               # 프로젝트 설정
```

## 📋 다음 단계 권장사항

1. **첫 번째 테스트 계정 생성**
   - 회원가입 후 테스트
   - 키워드 분석 테스트
   - 썸네일 생성 테스트

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
- Google AI Studio API 키는 유출 시 즉시 재발급

## 📊 시스템 상태

- ✅ 인증 시스템: 완료
- ✅ YouTube API 통합: 완료
- ✅ Gemini 텍스트 분석: 완료 (gemini-3.1-pro-preview)
- ✅ **Imagen 이미지 생성: 완료 (gemini-3-pro-image-preview)**
- ✅ 트렌드 키워드 추천: 완료
- ✅ 크레딧 시스템: 완료
- ✅ 관리자 패널: 완료
- ✅ Frontend UI: 완료

## 🐛 최근 수정 사항

### 2026-02-24
- ✅ **YouTube Thumbnail Maker로 전환**
  - 영상 생성 기능 제거 (Veo는 async API 필요)
  - 썸네일 자동 생성 기능 추가
  - Google AI Studio Imagen 3 실제 작동 확인
  - 16:9 비율 + 한글 제목 최적화
  - UI/UX 업데이트 (브랜딩 변경)

### 2026-01-27
- ✅ Gemini JSON 파싱 안정화
- ✅ 트렌드 키워드 추천 기능 추가
- ✅ 정적 파일 서빙 문제 해결

## 🤝 기여

- **개발**: Claude (AI Assistant)
- **PRD**: 슬기님
- **마지막 업데이트**: 2026-02-24
