# GenSpark API 통합 가이드

## ✅ GenSpark로 전환한 이유

Vertex AI Veo는 다음과 같은 문제로 사용이 어려웠습니다:
- ❌ PredictLongRunning API 필요 (복잡한 비동기 처리)
- ❌ Private Preview로 접근 권한 제한
- ❌ 복잡한 Google Cloud OAuth 인증

**GenSpark API 장점:**
- ✅ 간단한 REST API
- ✅ 다양한 최신 모델 지원
- ✅ 안정적인 프로덕션 서비스
- ✅ Bearer Token 인증만으로 충분

---

## 🔑 GenSpark API 키 발급

### 1. GenSpark 플랫폼 접속
https://www.genspark.ai/

### 2. API 키 발급
- 대시보드 → API Keys
- "Create New API Key" 클릭
- 키 이름 입력 (예: "youtube-maker")
- 생성된 키 복사

---

## 📦 환경 변수 설정

### 로컬 개발 (.dev.vars)
```bash
GENSPARK_API_KEY=gs_xxxxxxxxxxxxxxxxxxxxx
```

### Cloudflare Pages (프로덕션)
```bash
npx wrangler pages secret put GENSPARK_API_KEY
# 입력: gs_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🎬 비디오 생성 API

### 엔드포인트
```
POST https://api.genspark.ai/v1/video/generate
```

### 요청 예시
```bash
curl -X POST https://api.genspark.ai/v1/video/generate \
  -H "Authorization: Bearer gs_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Create a 5-second vertical video about wireless earbuds",
    "model": "kling/v2.6/pro",
    "aspect_ratio": "9:16",
    "duration": 5,
    "task_summary": "Generate short video for YouTube Shorts"
  }'
```

### 지원 모델
- `kling/v2.6/pro` - 최신 고품질 (권장)
- `gemini/veo3` - Google Veo 3
- `gemini/veo3/fast` - 빠른 생성
- `sora-2` - OpenAI Sora 2
- `runway/gen4_turbo` - Runway Gen-4

### 응답 예시
```json
{
  "video_url": "https://storage.genspark.ai/videos/xxx.mp4",
  "duration": 5,
  "model": "kling/v2.6/pro",
  "status": "completed"
}
```

---

## 🎨 이미지 생성 API

### 엔드포인트
```
POST https://api.genspark.ai/v1/image/generate
```

### 요청 예시
```bash
curl -X POST https://api.genspark.ai/v1/image/generate \
  -H "Authorization: Bearer gs_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "A modern YouTube thumbnail for wireless earbuds review",
    "model": "fal-ai/flux-2-pro",
    "aspect_ratio": "16:9",
    "task_summary": "Generate thumbnail image"
  }'
```

### 지원 모델
- `fal-ai/flux-2-pro` - 고품질 이미지 (권장)
- `imagen4` - Google Imagen 4
- `ideogram/V_3` - 텍스트 렌더링 특화
- `recraft-v3` - 사실적 이미지

### 응답 예시
```json
{
  "image_url": "https://storage.genspark.ai/images/xxx.png",
  "model": "fal-ai/flux-2-pro",
  "width": 1920,
  "height": 1080
}
```

---

## 💰 크레딧 비용

| 기능 | 비용 | 예상 GenSpark 비용 |
|------|-----|------------------|
| 이미지 생성 | 50 크레딧 | ~$0.05 |
| 영상 생성 | 200 크레딧 | ~$0.20 |

---

## 🧪 테스트

### 이미지 생성 테스트
```bash
curl -X POST http://localhost:3000/api/media/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A beautiful sunset over mountains"}'
```

### 영상 생성 테스트
```bash
curl -X POST http://localhost:3000/api/media/video \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a 5-second video of a cat playing"}'
```

---

## 📝 구현 파일

- `src/services/genspark-media.ts` - GenSpark API 서비스
- `src/routes/api.ts` - 이미지/영상 생성 엔드포인트
- `src/types.ts` - 환경 변수 타입 정의
- `.dev.vars` - 로컬 개발 환경 변수

---

## 🚀 배포

### 1. GenSpark API 키 설정
```bash
npx wrangler pages secret put GENSPARK_API_KEY
```

### 2. 배포
```bash
npm run deploy
```

### 3. 테스트
```bash
# 회원가입 → 키워드 분석 → 이미지/영상 생성
```

---

## 🔗 유용한 링크

- **GenSpark Platform**: https://www.genspark.ai/
- **API Documentation**: https://docs.genspark.ai/
- **Model Gallery**: https://www.genspark.ai/models

---

## ✅ 다음 단계

1. **GenSpark API 키 발급** (필수)
2. **로컬 환경 변수 설정**
3. **서버 재시작 및 테스트**
4. **프로덕션 배포**

GenSpark API 키를 받으시면 즉시 테스트해보겠습니다! 🚀
