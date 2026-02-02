# 🎓 배정 모자 - 실시간 조 편성 시스템

해리포터의 '배정 모자(Sorting Hat)' 컨셉을 활용한 실시간 조 편성 웹 애플리케이션입니다.

## 🚀 빠른 시작

### 로컬 개발

```bash
# 1. 저장소 클론
git clone https://github.com/leessosso/sorting-hat.git
cd sorting-hat

# 2. Firebase 설정 파일 생성
cp firebase-config.example.js firebase-config.js
nano firebase-config.js  # 실제 Firebase 정보 입력

# 3. 브라우저에서 index.html 열기
open index.html
```

### GitHub Pages 배포

이 프로젝트는 GitHub Actions를 통해 자동으로 배포됩니다.

**1. GitHub Secrets 설정**

Repository → Settings → Secrets and variables → Actions에서 다음 secrets 추가:

```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_DATABASE_URL
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

**2. GitHub Pages 설정**

Repository → Settings → Pages에서:
- Source: **GitHub Actions** 선택

**3. 배포**

```bash
git push origin main
```

푸시하면 자동으로 배포됩니다! 🎉

배포 URL: `https://leessosso.github.io/sorting-hat/`

## ✨ 주요 기능

### 👥 사용자 기능
- 실시간 조 배정
- min & min+1 균등 분배 알고리즘
- 실시간 현황판

### 🎮 관리자 기능
- 임원 선택으로 조 자동 생성
- 배정 시작/중지 제어
- 실시간 통계 및 관리

## 🔒 보안

Firebase API 키는 GitHub Secrets로 안전하게 관리됩니다.

**중요**: 로컬 개발 시 `firebase-config.js` 파일은 절대 Git에 커밋하지 마세요!

## 📂 프로젝트 구조

```
sorting-hat/
├── index.html                      # 사용자 페이지
├── admin.html                      # 관리자 페이지
├── style.css                       # 스타일
├── app.js                          # 메인 로직
├── firebase-config.example.js      # Firebase 설정 예시
├── .gitignore                      # Git 제외 파일
└── .github/
    └── workflows/
        └── deploy.yml              # GitHub Actions 배포 설정
```

## 🎯 Firebase 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 생성
3. Realtime Database 활성화

### 2. 보안 규칙 설정

Firebase Console → Realtime Database → 규칙:

```json
{
  "rules": {
    "teams": {
      ".read": true,
      ".write": true
    },
    "config": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 3. API 키 제한 (권장)

[Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서:
- HTTP 리퍼러로 도메인 제한
- 필요한 API만 활성화

## 💡 min & min+1 알고리즘

```
현재 조별 인원:
1조: 5명, 2조: 5명, 3조: 6명, 4조: 6명

→ min = 5
→ 후보: [1조(5), 2조(5), 3조(6), 4조(6)]
→ 랜덤 선택
```

**장점**:
- 균등 분배 (최대 1명 차이)
- 예측 불가능 (재미)
- 공정성

## 🐛 문제 해결

### Firebase 연결 오류
- `firebase-config.js` 파일 확인
- Firebase Console에서 Database 생성 확인
- 브라우저 콘솔 확인 (F12)

### 배정이 안 됨
- 관리자 페이지에서 배정 상태 확인
- 활성화된 조가 있는지 확인

### GitHub Actions 배포 실패
- Secrets가 모두 설정되어 있는지 확인
- Actions 탭에서 에러 로그 확인

## 📝 라이선스

MIT License

## 🤝 기여

버그 리포트와 기능 제안을 환영합니다!

---

**Made with ✨ for amazing team building!**
