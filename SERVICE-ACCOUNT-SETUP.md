# Google Cloud Service Account 설정 가이드

## 🔑 Service Account가 필요한 이유

Vertex AI API는 단순 API 키가 아닌 **OAuth 2.0 Bearer Token** 인증을 사용합니다.
이를 위해 Google Cloud Service Account JSON 키가 필요합니다.

---

## 📋 1단계: Service Account 생성

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/iam-admin/serviceaccounts?project=youtubeanalysis-485607

2. **CREATE SERVICE ACCOUNT 클릭**

3. **Service account details 입력**
   - Name: `vertex-ai-service`
   - Description: `For Vertex AI Imagen and Veo access`
   - CREATE AND CONTINUE 클릭

4. **Grant this service account access to project**
   - Role 선택: **Vertex AI User**
   - CONTINUE 클릭

5. **DONE 클릭**

---

## 📋 2단계: JSON 키 다운로드

1. 생성된 Service Account 클릭

2. **KEYS 탭** 선택

3. **ADD KEY** → **Create new key** 클릭

4. **Key type: JSON** 선택

5. **CREATE** 클릭 → JSON 파일 자동 다운로드

---

## 📋 3단계: JSON 키를 Single Line으로 변환

다운로드한 JSON 파일 내용:

```json
{
  "type": "service_account",
  "project_id": "youtubeanalysis-485607",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "vertex-ai-service@youtubeanalysis-485607.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 변환 방법:

**온라인 도구 사용:**
- https://www.text-utils.com/json-formatter/
- JSON을 붙여넣고 "Minify" 클릭
- 결과를 복사

**또는 직접 변환:**
- 모든 줄바꿈 제거
- 공백 제거
- 한 줄로 만들기

---

## 📋 4단계: 환경 변수에 추가

### 로컬 개발 (.dev.vars)

```bash
GOOGLE_CLOUD_SERVICE_ACCOUNT={"type":"service_account","project_id":"youtubeanalysis-485607",...}
```

### Cloudflare Pages (프로덕션)

```bash
npx wrangler pages secret put GOOGLE_CLOUD_SERVICE_ACCOUNT
# 전체 JSON 문자열을 붙여넣기
```

---

## 🧪 테스트

```bash
# Service Account JSON이 올바른지 테스트
curl -X POST http://localhost:3000/api/media/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A beautiful sunset over mountains"}'
```

성공 시:
```json
{
  "success": true,
  "image": {
    "imageUrl": "data:image/png;base64,...",
    "prompt": "A beautiful sunset over mountains",
    "model": "imagegeneration@006"
  },
  "creditsDeducted": 50
}
```

---

## ⚠️ 보안 주의사항

1. **절대 JSON 키를 Git에 커밋하지 마세요**
   - `.dev.vars`는 `.gitignore`에 포함되어 있습니다

2. **키가 노출되면 즉시 삭제**
   - Google Cloud Console → IAM → Service Accounts → Keys → DELETE

3. **최소 권한 원칙**
   - 필요한 권한만 부여 (Vertex AI User)

---

## 🔗 유용한 링크

- **Service Accounts**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=youtubeanalysis-485607
- **Vertex AI**: https://console.cloud.google.com/vertex-ai?project=youtubeanalysis-485607
- **IAM Permissions**: https://console.cloud.google.com/iam-admin/iam?project=youtubeanalysis-485607

---

## 🎉 완료!

Service Account를 설정하면:
- ✅ Imagen 3 이미지 생성 작동
- ✅ Veo 영상 생성 작동 (권한이 있는 경우)
- ✅ Bearer Token 인증으로 보안 강화

JSON 키를 받으시면 알려주세요! 바로 적용하겠습니다.
