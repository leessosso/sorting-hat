# 🎓 배정 모자 - 실시간 조 편성 시스템

해리포터의 '배정 모자(Sorting Hat)' 컨셉을 활용한 실시간 조 편성 웹 애플리케이션입니다.  
여러 사용자가 동시에 접속하여 실시간으로 조를 배정받을 수 있습니다.

## ✨ 주요 기능

### 👥 사용자 기능
- **실시간 배정**: 이름 입력 후 3초간 애니메이션과 함께 조 배정
- **의외성 있는 배정**: min & min+1 알고리즘으로 예측 불가능한 배정 결과
- **결과 저장**: LocalStorage를 활용한 배정 결과 유지
- **실시간 현황**: 모든 조의 현재 인원 상태를 실시간으로 확인

### 🎮 관리자 기능
- **임원 관리**: 8명의 임원 중 출석한 인원 선택으로 조 자동 생성
- **배정 제어**: 배정 시작/중지 토글 스위치
- **데이터 관리**: 배정 결과 초기화 및 전체 데이터 리셋
- **실시간 통계**: 활성 조 수, 총 인원, 평균 조원 수 등

## 🚀 시작하기

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: sorting-hat)
4. Google Analytics는 선택 사항 (비활성화 가능)

### 2. Firebase Realtime Database 설정

1. Firebase 콘솔에서 좌측 메뉴의 **"빌드" > "Realtime Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. 위치 선택 (권장: asia-southeast1 - 싱가포르)
4. **테스트 모드**로 시작 (나중에 보안 규칙 수정 가능)

### 3. Firebase 설정 정보 가져오기

1. Firebase 콘솔에서 프로젝트 설정(⚙️) 클릭
2. "일반" 탭에서 "내 앱" 섹션으로 스크롤
3. 웹 앱 추가 (`</>` 아이콘 클릭)
4. 앱 닉네임 입력 (예: Sorting Hat Web)
5. **Firebase SDK 구성** 정보 복사

### 4. 앱 설정 파일 수정

`app.js` 파일을 열고 Firebase 설정 정보를 입력하세요:

```javascript
const firebaseConfig = {
    apiKey: "여기에_API_KEY_입력",
    authDomain: "여기에_AUTH_DOMAIN_입력",
    databaseURL: "여기에_DATABASE_URL_입력",
    projectId: "여기에_PROJECT_ID_입력",
    storageBucket: "여기에_STORAGE_BUCKET_입력",
    messagingSenderId: "여기에_MESSAGING_SENDER_ID_입력",
    appId: "여기에_APP_ID_입력"
};
```

### 5. Firebase 보안 규칙 설정 (권장)

Firebase Console의 Realtime Database > 규칙 탭에서 다음 규칙 적용:

```json
{
  "rules": {
    "teams": {
      ".read": true,
      ".write": true,
      "$teamId": {
        ".validate": "newData.hasChildren(['name', 'leader', 'active', 'count', 'members'])",
        "count": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "members": {
          ".validate": "newData.isString() || newData.hasChildren()"
        }
      }
    },
    "config": {
      ".read": true,
      ".write": true,
      "sortingEnabled": {
        ".validate": "newData.isBoolean()"
      }
    }
  }
}
```

## 📱 사용 방법

### 관리자 모드 (admin.html)

1. **조 구성하기**
   - 8명의 임원 리스트에서 오늘 출석한 임원 선택
   - "조 구성 적용하기" 버튼 클릭
   - 선택된 임원 수만큼 조가 자동 생성됨

2. **배정 시작**
   - "배정 상태 제어" 섹션에서 토글 스위치를 ON으로 전환
   - 이제 사용자들이 배정을 받을 수 있습니다

3. **데이터 관리**
   - **배정 결과만 초기화**: 조 구성은 유지하고 배정된 인원만 리셋
   - **전체 데이터 초기화**: 모든 조와 배정 데이터 삭제

### 사용자 모드 (index.html)

1. **이름 입력**
   - 이름 입력란에 본인 이름 입력 (최소 2글자)

2. **배정 받기**
   - "배정 시작" 버튼 클릭
   - 3초간 모자가 흔들리며 고민하는 애니메이션 재생
   - 랜덤 대사와 함께 조가 배정됨

3. **결과 확인**
   - 배정된 조 이름과 조장 이름 표시
   - 하단 현황판에서 모든 조의 실시간 인원 현황 확인

4. **다시 배정받기**
   - "다시 배정받기" 버튼으로 재배정 가능
   - LocalStorage의 이전 배정 정보가 삭제됨

## 🎯 핵심 알고리즘: min & min+1 로직

배정 시스템은 **인원 균등 분배**와 **의외성**을 동시에 달성합니다:

### 알고리즘 설명

1. 모든 활성 조의 인원수를 확인
2. 가장 적은 인원수(`min`)를 찾음
3. 인원수가 `min` 또는 `min+1`인 조들을 "후보군"으로 선정
4. 후보군 중에서 **랜덤**으로 한 조를 선택하여 배정

### 예시

```
1조: 5명
2조: 5명
3조: 6명
4조: 6명

→ min = 5
→ 후보군 = [1조(5명), 2조(5명), 3조(6명), 4조(6명)]
→ 4개 조 중 랜덤 선택
```

이 방식의 장점:
- ✅ **균등 분배**: 모든 조의 인원 차이가 최대 1명
- ✅ **의외성**: 가장 적은 조에만 넣지 않아 결과가 예측 불가
- ✅ **공정성**: 모든 조에 배정될 기회가 동등함

## 🔒 동시성 제어 (Transaction)

여러 사용자가 동시에 배정 버튼을 누를 때 데이터 충돌을 방지하기 위해 **Firebase Transaction**을 사용합니다:

```javascript
await teamRef.transaction((currentTeam) => {
    if (currentTeam === null) return currentTeam;
    
    const members = currentTeam.members || [];
    if (members.includes(userName)) {
        return undefined; // 이미 배정된 경우 중단
    }
    
    currentTeam.members = [...members, userName];
    currentTeam.count = (currentTeam.count || 0) + 1;
    
    return currentTeam;
});
```

이렇게 하면:
- 동시에 100명이 접속해도 안전하게 처리
- 같은 사람이 중복 배정되는 것을 방지
- 인원수가 정확하게 카운트됨

## 📂 파일 구조

```
sorting-hat/
├── index.html          # 사용자 메인 화면
├── admin.html          # 관리자 설정 화면
├── style.css           # 호그와트 테마 디자인
├── app.js              # Firebase 연동 및 배정 로직
└── README.md           # 프로젝트 문서
```

## 🎨 디자인 특징

- **테마**: 호그와트 기숙사 배정식 분위기
- **색상**: 어두운 배경 + 금색 포인트 + 양피지 색상
- **폰트**: 
  - Cinzel: 타이틀용 고전적 세리프
  - MedievalSharp: 중세 분위기 강조
- **애니메이션**:
  - 모자 흔들림 애니메이션 (3초)
  - Confetti 효과
  - 부드러운 페이드 인/아웃
- **반응형**: 모바일 최적화 (세로형 레이아웃)

## 🌐 배포 방법

### Firebase Hosting 사용 (권장)

1. Firebase CLI 설치:
   ```bash
   npm install -g firebase-tools
   ```

2. 로그인:
   ```bash
   firebase login
   ```

3. 프로젝트 초기화:
   ```bash
   firebase init hosting
   ```
   - 기존 프로젝트 선택
   - public 디렉토리: 현재 폴더 (`.`)
   - SPA 설정: No
   - GitHub 자동 배포: 선택 사항

4. 배포:
   ```bash
   firebase deploy --only hosting
   ```

5. 배포 완료 후 제공되는 URL 확인 (예: `https://your-project.web.app`)

### 다른 호스팅 서비스

- **Netlify**: 드래그 앤 드롭으로 간편 배포
- **Vercel**: GitHub 연동 자동 배포
- **GitHub Pages**: 무료 정적 호스팅

## 📲 카카오톡 공유하기

1. 배포된 URL을 카카오톡 단톡방에 공유
2. 참가자들이 링크 클릭하여 접속
3. 관리자는 먼저 admin.html에서 조 구성 및 배정 시작
4. 참가자들은 index.html에서 각자 이름 입력 후 배정 받기

## 🔧 커스터마이징

### 임원(조장) 이름 변경

`admin.html`의 leaders-grid 섹션에서 `data-leader` 속성 수정:

```html
<input type="checkbox" class="leader-input" data-leader="새이름">
<span class="leader-name">새이름</span>
```

### 조 이름 변경

`app.js`의 `applyLeadersBtn` 이벤트 핸들러에서 수정:

```javascript
updates[teamId] = {
    name: `${teamNumber}조`,  // 여기를 수정 (예: `팀 ${teamNumber}`)
    // ...
};
```

### 대사 추가/변경

`app.js`의 `THINKING_PHRASES`와 `SUCCESS_MESSAGES` 배열 수정:

```javascript
const THINKING_PHRASES = [
    "당신만의 대사 추가!",
    // ...
];
```

### 모자 이미지 변경

`index.html`의 `hat-image` src 속성에 다른 이미지 URL 입력:

```html
<img src="새로운_이미지_URL" alt="Sorting Hat" class="hat-image" id="hatImage">
```

## 🐛 문제 해결

### Firebase 연결 오류
- `app.js`의 Firebase 설정 정보가 정확한지 확인
- Firebase Console에서 Database가 생성되어 있는지 확인
- 브라우저 콘솔(F12)에서 에러 메시지 확인

### 배정이 안 됨
- 관리자 페이지에서 배정 상태가 "진행 중"인지 확인
- 활성화된 조가 1개 이상 있는지 확인
- Firebase Database 규칙이 올바른지 확인

### 실시간 업데이트 안 됨
- Firebase Database URL이 정확한지 확인
- 네트워크 연결 상태 확인
- 다른 탭에서도 같은 문제가 발생하는지 테스트

### 모바일에서 레이아웃 깨짐
- 브라우저 캐시 삭제 후 재시도
- `style.css`의 반응형 미디어 쿼리 확인
- viewport 메타 태그 확인

## 📊 데이터 구조

Firebase Realtime Database의 데이터 구조:

```json
{
  "teams": {
    "team_1234567890_1": {
      "name": "1조",
      "leader": "김민수",
      "active": true,
      "count": 3,
      "members": ["홍길동", "김철수", "이영희"],
      "createdAt": 1234567890000,
      "updatedAt": 1234567890000
    },
    "team_1234567890_2": {
      "name": "2조",
      "leader": "이지은",
      "active": true,
      "count": 2,
      "members": ["박민지", "정우진"],
      "createdAt": 1234567890000
    }
  },
  "config": {
    "sortingEnabled": true
  }
}
```

## 🔐 보안 고려사항

### 프로덕션 환경에서는:

1. **Firebase 보안 규칙 강화**:
   ```json
   {
     "rules": {
       "teams": {
         ".read": true,
         ".write": "auth != null"  // 인증된 사용자만
       }
     }
   }
   ```

2. **관리자 페이지 보호**:
   - Firebase Authentication 사용
   - 비밀번호 또는 관리자 계정 설정
   - IP 화이트리스트 설정

3. **중복 배정 방지**:
   - 현재는 LocalStorage로 제한
   - 더 강력한 제어가 필요하면 서버 측 검증 추가

## 📝 라이선스

이 프로젝트는 MIT 라이선스로 제공됩니다. 자유롭게 사용, 수정, 배포 가능합니다.

## 💡 향후 개선 아이디어

- [ ] Firebase Authentication 추가 (소셜 로그인)
- [ ] 관리자 대시보드 강화 (차트, 그래프)
- [ ] 배정 히스토리 기록 및 다운로드
- [ ] 조별 채팅 기능 추가
- [ ] PWA(Progressive Web App) 지원
- [ ] 다크/라이트 모드 토글
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] 사운드 이펙트 추가

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Made with ✨ and 🪄 for amazing team building experiences!**
