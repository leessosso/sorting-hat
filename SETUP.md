# ⚙️ 설정 가이드

## 🎯 한 번만 하면 되는 설정

### 1. GitHub Secrets 설정 (5분)

배포를 위해 Firebase 정보를 GitHub Secrets에 저장합니다.

**위치**: `https://github.com/leessosso/sorting-hat/settings/secrets/actions`

**추가할 Secrets**:

| Secret 이름 | 값 | 어디서 찾나요? |
|------------|-----|--------------|
| `FIREBASE_API_KEY` | `AIzaSyBEh5AU90VBb_7aoexmvcumLWFDvzkC38Y` | Firebase Console → 프로젝트 설정 |
| `FIREBASE_AUTH_DOMAIN` | `sorting-hat-9d69e.firebaseapp.com` | Firebase Console → 프로젝트 설정 |
| `FIREBASE_DATABASE_URL` | `https://sorting-hat-9d69e-default-rtdb.asia-southeast1.firebasedatabase.app` | Firebase Console → Realtime Database |
| `FIREBASE_PROJECT_ID` | `sorting-hat-9d69e` | Firebase Console → 프로젝트 설정 |
| `FIREBASE_STORAGE_BUCKET` | `sorting-hat-9d69e.firebasestorage.app` | Firebase Console → 프로젝트 설정 |
| `FIREBASE_MESSAGING_SENDER_ID` | `684009758588` | Firebase Console → 프로젝트 설정 |
| `FIREBASE_APP_ID` | `1:684009758588:web:23c8cf406571125c860ef9` | Firebase Console → 프로젝트 설정 |

**설정 방법**:

1. https://github.com/leessosso/sorting-hat/settings/secrets/actions 접속
2. "New repository secret" 클릭
3. Name과 Secret 입력
4. "Add secret" 클릭
5. 위 7개 모두 반복

### 2. GitHub Pages 설정 (30초)

**위치**: `https://github.com/leessosso/sorting-hat/settings/pages`

**설정**:
- Source: **GitHub Actions** 선택
- (드롭다운에서 선택, 브랜치가 아님!)

![GitHub Actions 선택](https://docs.github.com/assets/cb-88703/mw-1440/images/help/pages/publishing-source-drop-down.webp)

### 3. Firebase API 키 제한 (선택, 권장)

**위치**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**설정**:
1. "Browser key (auto created by Firebase)" 선택
2. 애플리케이션 제한사항 → **HTTP 리퍼러** 선택
3. 다음 URL 추가:
   ```
   https://leessosso.github.io/*
   http://localhost:*
   ```
4. 저장

---

## ✅ 완료!

이제 코드를 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "업데이트"
git push origin main
```

배포 진행 상황: https://github.com/leessosso/sorting-hat/actions

배포 URL: https://leessosso.github.io/sorting-hat/

---

## 📝 일상적인 작업

### 로컬에서 개발

```bash
# 1. firebase-config.js가 있는지 확인
ls firebase-config.js

# 없으면 생성
cp firebase-config.example.js firebase-config.js
nano firebase-config.js

# 2. 브라우저에서 열기
open index.html

# 3. 코드 수정
nano index.html

# 4. Git 커밋
git add .
git commit -m "기능 추가"
git push origin main

# 끝! GitHub Actions가 자동으로 배포합니다.
```

### 배포 확인

- **Actions 탭**: 배포 진행 상황
- **환경**: https://github.com/leessosso/sorting-hat/deployments
- **실제 사이트**: https://leessosso.github.io/sorting-hat/

---

## 🔍 문제 해결

### "GitHub Actions 배포가 실패합니다"

1. Actions 탭에서 에러 로그 확인
2. Secrets가 모두 설정되어 있는지 확인:
   ```bash
   # 7개 모두 있어야 함
   FIREBASE_API_KEY
   FIREBASE_AUTH_DOMAIN
   FIREBASE_DATABASE_URL
   FIREBASE_PROJECT_ID
   FIREBASE_STORAGE_BUCKET
   FIREBASE_MESSAGING_SENDER_ID
   FIREBASE_APP_ID
   ```
3. Secret 이름 철자 확인 (대소문자 구분!)

### "로컬에서 Firebase 연결 오류"

```bash
# firebase-config.js 파일이 있는지 확인
ls firebase-config.js

# 없으면 생성
cp firebase-config.example.js firebase-config.js

# 실제 Firebase 정보로 수정
nano firebase-config.js
```

### "GitHub Pages 사이트가 404 Not Found"

1. Settings → Pages에서 Source가 "GitHub Actions"인지 확인
2. Actions 탭에서 배포가 성공했는지 확인
3. 5~10분 정도 기다려보기 (첫 배포는 시간이 걸릴 수 있음)

---

## 💡 팁

### 빠른 테스트

로컬에서 수정 → 브라우저 새로고침으로 즉시 확인 가능

### 배포 테스트

```bash
# .github/workflows/deploy.yml에서
# on: workflow_dispatch 덕분에 수동 실행 가능

# Actions 탭 → Deploy to GitHub Pages → Run workflow
```

### Secrets 관리

팀원이 바뀌거나 API 키를 재생성한 경우:
1. GitHub Secrets 업데이트
2. Actions → Re-run jobs

---

**모든 설정 완료! 🎉**
