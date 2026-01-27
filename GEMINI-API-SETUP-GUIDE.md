# Gemini API 설정 가이드

## 🚨 현재 상태
- YouTube API: ✅ 정상
- Gemini API: ❌ 키 만료/차단

## 📋 API 키 발급 단계별 가이드

### 1단계: Google AI Studio 접속
```
https://aistudio.google.com/app/apikey
```

### 2단계: 로그인 확인
- Google 계정으로 로그인
- Terms of Service 동의 (첫 방문 시)

### 3단계: 새 API 키 생성
1. **"Create API key"** 버튼 클릭
2. **"Create API key in new project"** 선택 (권장)
   - 또는 기존 프로젝트 선택
3. **키 복사** (AIzaSy로 시작하는 긴 문자열)
4. **안전한 곳에 저장** (다시 볼 수 없습니다)

### 4단계: API 키 제한 설정 (선택사항)
- API 키 페이지에서 생성한 키 클릭
- "API restrictions" → "Restrict key"
- "Generative Language API" 선택
- 저장

### 5단계: 키 테스트
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_NEW_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Hello"}]}]}'
```

정상 응답: `{"candidates": [...]}`
에러 응답: `{"error": {...}}`

### 6단계: 프로젝트에 적용
```bash
cd /home/user/webapp
nano .dev.vars
# GEMINI_API_KEY=YOUR_NEW_KEY 로 변경
pm2 restart video-finder
```

## 🔍 문제 해결

### 에러: "API key expired"
→ 키가 만료되었습니다. 새 키를 발급받으세요.

### 에러: "API key was reported as leaked"
→ 키가 노출되었습니다. 즉시 삭제하고 새 키를 발급받으세요.

### 에러: "API_KEY_INVALID"
→ 키 형식이 잘못되었거나 프로젝트가 비활성화되었습니다.

### 에러: "PERMISSION_DENIED"
→ Gemini API가 프로젝트에 활성화되지 않았습니다.
→ https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com 에서 활성화

## 📞 지원

문제가 계속되면:
1. Google Cloud Console 확인
2. API 할당량 확인
3. 결제 정보 확인 (일부 API는 결제 정보 필요)

## 🎯 다음 단계

새 API 키를 받으시면:
1. 키를 테스트하여 작동 확인
2. .dev.vars 파일 업데이트
3. 서버 재시작
4. 키워드 분석 테스트

모든 기능이 정상 작동할 것입니다! 🚀
