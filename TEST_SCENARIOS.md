# 🧪 테스트 시나리오

## 시나리오 1: 조 배정 초기화 후 사용자 새로고침

### 준비
1. 사용자가 조 배정을 받음
2. 결과 화면이 표시됨
3. SessionStorage에 배정 정보 저장됨

### 관리자 작업
관리자가 "배정 결과만 초기화" 버튼 클릭

### 테스트
1. 사용자가 페이지 새로고침 (F5)
2. **예상 결과**: 
   - ✅ 입력 화면으로 돌아감
   - ✅ 이전 배정 정보가 표시되지 않음
   - ✅ 새로 이름을 입력할 수 있음

### 기술적 동작
```javascript
// 페이지 로드 시
1. SessionStorage에서 'userAssignment' 확인
2. Firebase에서 해당 사용자가 조에 속해있는지 확인
3. Firebase에 없음 → SessionStorage 삭제
4. 입력 화면 표시
```

---

## 시나리오 2: 자리 배정 초기화 후 사용자 새로고침

### 준비
1. 조장이 자리 뽑기를 함
2. "3번" 자리 배정받음
3. 결과 화면이 표시됨
4. SessionStorage에 자리 정보 저장됨

### 관리자 작업
관리자가 "자리 배정 결과만 초기화" 버튼 클릭

### 테스트
1. 조장이 페이지 새로고침 (F5)
2. **예상 결과**:
   - ✅ 입력 화면으로 돌아감
   - ✅ 이전 자리 번호가 표시되지 않음
   - ✅ 다시 자리 뽑기 가능

### 기술적 동작
```javascript
// 페이지 로드 시
1. SessionStorage에서 'userSeat' 확인
2. Firebase seats/3 에 해당 조장이 있는지 확인
3. Firebase에 없음 → SessionStorage 삭제
4. 입력 화면 표시
```

---

## 시나리오 3: 전체 데이터 초기화

### 관리자 작업
"전체 데이터 초기화" 버튼 클릭

### 영향받는 사용자
- 조 배정 받은 사람들 → 새로고침 시 입력 화면
- 자리 뽑기 한 조장들 → 새로고침 시 입력 화면

---

## 시나리오 4: 정상적인 경우 (초기화 안 함)

### 테스트
1. 사용자가 조 배정을 받음
2. 페이지 새로고침
3. **예상 결과**:
   - ✅ 배정 결과 화면 그대로 표시
   - ✅ Firebase 데이터와 일치하는 정보 표시

---

## 에지 케이스

### 케이스 1: Firebase 연결 오류
- SessionStorage에 데이터 있음
- Firebase 접속 실패
- **처리**: SessionStorage 삭제, 입력 화면 표시

### 케이스 2: 조가 비활성화됨
- 사용자가 "1조"에 배정됨
- 관리자가 새로운 조 구성 (기존 조 비활성화)
- 사용자 새로고침
- **처리**: active=false인 조는 무시, SessionStorage 삭제

### 케이스 3: 동시 접속 중 초기화
- 사용자 A가 배정 받는 중 (3초 대기)
- 관리자가 초기화
- 사용자 A의 배정 완료
- **처리**: Firebase에 저장 안 됨 (sortingEnabled=false)

---

## 테스트 체크리스트

### 조 배정
- [ ] 정상 배정 후 새로고침 → 결과 유지
- [ ] 초기화 후 새로고침 → 입력 화면
- [ ] 조 재구성 후 새로고침 → 입력 화면
- [ ] 배정 중지 상태에서 배정 시도 → 에러 메시지

### 자리 뽑기
- [ ] 정상 배정 후 새로고침 → 결과 유지
- [ ] 초기화 후 새로고침 → 입력 화면
- [ ] 자리 뽑기 중지 상태에서 시도 → 에러 메시지
- [ ] 22명 배정 후 23번째 시도 → "자리 없음" 에러

### 관리자
- [ ] 조 배정 초기화 → 실시간 통계 0으로 변경
- [ ] 자리 배정 초기화 → 실시간 통계 0으로 변경
- [ ] 전체 초기화 → 모든 데이터 삭제
- [ ] 토글 스위치 → 즉시 반영

---

## 개선된 사용자 경험

### Before (이전)
```
사용자: 조 배정 받음 → 결과 표시
관리자: 초기화
사용자: 새로고침 → ❌ 이전 결과가 그대로 표시됨 (혼란)
```

### After (현재)
```
사용자: 조 배정 받음 → 결과 표시
관리자: 초기화
사용자: 새로고침 → ✅ 입력 화면으로 자동 전환
```

---

## 코드 설명

### 검증 함수 (조 배정)
```javascript
async function validateAndShowAssignment(savedData) {
    // 1. Firebase에서 모든 활성 조 가져오기
    const teamsData = await database.ref('teams').once('value');
    
    // 2. 저장된 이름이 실제로 조에 속해있는지 확인
    let found = false;
    for (const team of teams) {
        if (team.members.includes(savedData.name)) {
            found = true;
            showResult(updatedData);
            break;
        }
    }
    
    // 3. 없으면 SessionStorage 삭제
    if (!found) {
        clearFromSessionStorage('userAssignment');
    }
}
```

### 검증 함수 (자리 뽑기)
```javascript
async function validateAndShowSeat(savedData) {
    // 1. Firebase에서 자리 정보 가져오기
    const seatsData = await database.ref('seats').once('value');
    
    // 2. 해당 자리에 저장된 이름이 맞는지 확인
    const seatInfo = seatsData[savedData.seatNumber];
    
    if (seatInfo && seatInfo.leader === savedData.name) {
        showSeatResult(savedData);
    } else {
        // 3. 없으면 SessionStorage 삭제
        clearFromSessionStorage('userSeat');
    }
}
```

---

**결론**: 이제 관리자가 초기화하면 사용자는 새로고침 시 자동으로 입력 화면을 보게 됩니다! ✅
