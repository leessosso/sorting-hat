// ========================================
// Firebase 설정
// ========================================
// firebaseConfig는 firebase-config.js에서 로드됩니다
// (로컬 개발: firebase-config.js 파일 / GitHub Pages: GitHub Actions에서 자동 생성)

// Firebase 초기화
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// ========================================
// 상수 및 설정
// ========================================

// 조장별 고유 문양 및 색상
const LEADER_EMBLEMS = {
    '임범석': { icon: '🦁', image: 'images/emblem-lim.png', color: '#c41e3a', name: '용맹' },
    '김광림': { icon: '🦅', image: 'images/emblem-kim-k.png', color: '#0e1a40', name: '지혜' },
    '이혜미': { icon: '🦊', image: 'images/emblem-lee-h.png', color: '#ff6b35', name: '지략' },
    '이승석': { icon: '🐺', image: 'images/emblem-lee-s.png', color: '#4a5568', name: '충성' },
    '박기도': { icon: '🐉', image: 'images/emblem-park.png', color: '#2d5016', name: '힘' },
    '김이레': { icon: '🦉', image: 'images/emblem-kim-i.png', color: '#946b2d', name: '지식' },
    '정효정': { icon: '🐯', image: 'images/emblem-jung.png', color: '#ff8c42', name: '용기' },
    '우재황': { icon: '🦌', image: 'images/emblem-woo.png', color: '#60a5fa', name: '우아함' }
};

const THINKING_PHRASES = [
    "음... 어디가 좋을까...",
    "용기 있는 자로군!",
    "흠, 재능이 보이는군...",
    "어려운 선택이로군...",
    "네 진정한 모습을 알겠어...",
    "훌륭한 자질이야!",
    "네 운명을 찾았다!",
    "이 조가 딱이군!"
];

const SUCCESS_MESSAGES = [
    "축하합니다! 멋진 동료들과 함께하게 됩니다.",
    "당신의 새로운 여정이 시작됩니다!",
    "훌륭한 선택입니다! 팀워크를 발휘해보세요.",
    "이 조에서 큰 활약을 기대합니다!",
    "완벽한 배정입니다! 함께 성장하세요."
];

const TOP_SEAT_NUMBERS = [1, 2, 3, 4];
const TEAM_LEADER_RESTRICTED_NAMES = {
    '김광림': ['배유림', '유림', '유림이네', '유림이'],
    '이혜미': ['언이네', '장언', '장 언', '언']
};
// 서로 같은 조에 들어갈 수 없는 그룹 목록 (각 그룹 내에서는 한 조에 최대 1명만 배정)
const MUTUALLY_EXCLUSIVE_GROUPS = [
    ['장현진', '한성민']
];

// ========================================
// 유틸리티 함수
// ========================================

// 랜덤 요소 선택
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// SessionStorage 관리 (브라우저 세션 동안만 유지, 닫으면 자동 삭제)
function saveToSessionStorage(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('SessionStorage save error:', error);
    }
}

function getFromSessionStorage(key) {
    try {
        const value = sessionStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('SessionStorage get error:', error);
        return null;
    }
}

function clearFromSessionStorage(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
        console.error('SessionStorage clear error:', error);
    }
}

function parseSeatRestrictedNames(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
        return [];
    }

    return [...new Set(
        rawValue
            .split(/[\n,]/)
            .map(name => name.trim())
            .filter(Boolean)
    )];
}

function parseMemberList(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
        return [];
    }

    return [...new Set(
        rawValue
            .split(/[\n,]/)
            .map(name => name.trim())
            .filter(Boolean)
    )];
}

function formatLeaderRestrictionsText(obj) {
    if (!obj || typeof obj !== 'object') return '';
    return Object.entries(obj)
        .map(([leader, names]) => `${leader}: ${Array.isArray(names) ? names.join(', ') : names}`)
        .join('\n');
}

function parseLeaderRestrictionsText(text) {
    const result = {};
    if (!text) return result;
    const lines = text.split('\n');
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const leader = line.substring(0, colonIdx).trim();
        const namesStr = line.substring(colonIdx + 1).trim();
        if (!leader || !namesStr) continue;
        const names = namesStr.split(',').map(n => n.trim()).filter(Boolean);
        if (names.length > 0) {
            result[leader] = names;
        }
    }
    return result;
}

function formatMutuallyExclusiveText(groups) {
    if (!Array.isArray(groups)) return '';
    return groups
        .map(group => Array.isArray(group) ? group.join(', ') : group)
        .filter(Boolean)
        .join('\n');
}

function parseMutuallyExclusiveText(text) {
    if (!text) return [];
    return text.split('\n')
        .map(line => line.split(',').map(n => n.trim()).filter(Boolean))
        .filter(group => group.length > 1);
}

// 한글 초성 추출 함수 (초성 검색 지원)
const CHO_HANGUL = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
function getHangulInitial(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i) - 44032;
        if (code >= 0 && code <= 11172) {
            result += CHO_HANGUL[Math.floor(code / 588)];
        } else {
            result += str.charAt(i);
        }
    }
    return result;
}

function normalizeName(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, '')
        .toLowerCase();
}

// ========================================
// 핵심 배정 로직 (최소 인원 조 우선 알고리즘)
// ========================================

async function assignToTeam(userName) {
    const teamsRef = database.ref('teams');
    const configRef = database.ref('config');

    try {
        // 1. 배정이 활성화되어 있는지 확인
        const configSnapshot = await configRef.once('value');
        const config = configSnapshot.val() || {};

        if (!config.sortingEnabled) {
            throw new Error('현재 배정이 중지되어 있습니다. 관리자에게 문의하세요.');
        }

        // 1-1. 명단 세팅이 되어 있는 경우, 명단 등록 여부 확인
        const memberList = Array.isArray(config.memberList) ? config.memberList : [];
        let canonicalName = userName.trim();
        if (memberList.length > 0) {
            const matchedName = memberList.find(m => normalizeName(m) === normalizeName(userName));
            if (!matchedName) {
                throw new Error('등록된 명단에 없는 이름입니다. 목록에서 이름을 선택해 주세요.');
            }
            canonicalName = matchedName;
        }

        // 2. 활성화된 조 목록 가져오기
        const teamsSnapshot = await teamsRef.once('value');
        const teamsData = teamsSnapshot.val() || {};

        const activeTeams = Object.entries(teamsData)
            .filter(([_, team]) => team.active)
            .map(([teamId, team]) => ({
                id: teamId,
                name: team.name,
                leader: team.leader,
                count: team.count || 0,
                members: team.members || []
            }));

        if (activeTeams.length === 0) {
            throw new Error('활성화된 팀이 없습니다. 관리자에게 문의하세요.');
        }

        // 2-1. 이미 배정된 사용자인지 전체 조에서 확인 (중복 배정 방지)
        for (const team of activeTeams) {
            const normalizedMembers = (team.members || []).map(normalizeName);
            if (normalizedMembers.includes(normalizeName(canonicalName))) {
                // 이미 배정된 경우 해당 조 정보 반환
                return {
                    teamId: team.id,
                    teamName: team.name,
                    leader: team.leader,
                    emblem: LEADER_EMBLEMS[team.leader]?.icon || '⭐',
                    emblemImage: LEADER_EMBLEMS[team.leader]?.image || '',
                    color: LEADER_EMBLEMS[team.leader]?.color || '#d4af37',
                    trait: LEADER_EMBLEMS[team.leader]?.name || '특별',
                    count: team.count,
                    alreadyAssigned: true
                };
            }
        }

        // 3. 이름 기반 조별 제한 및 상호 배타 그룹 제한 적용
        const teamLeaderRestrictions = config.teamLeaderRestrictions || TEAM_LEADER_RESTRICTED_NAMES;
        const mutuallyExclusiveGroups = Array.isArray(config.mutuallyExclusiveGroups)
            ? config.mutuallyExclusiveGroups
            : MUTUALLY_EXCLUSIVE_GROUPS;

        const normalizedUserName = normalizeName(userName);
        const restrictedLeaders = new Set(
            Object.entries(teamLeaderRestrictions)
                .filter(([_, restrictedNames]) =>
                    Array.isArray(restrictedNames) && restrictedNames.some(name => normalizeName(name) === normalizedUserName)
                )
                .map(([leader]) => leader)
        );

        let eligibleTeams = restrictedLeaders.size > 0
            ? activeTeams.filter(team => !restrictedLeaders.has(team.leader))
            : activeTeams;

        // 상호 배타 그룹 체크: 사용자가 속한 그룹 멤버가 이미 배정된 조는 제외
        for (const group of mutuallyExclusiveGroups) {
            if (!Array.isArray(group)) continue;
            const normalizedGroup = group.map(normalizeName);
            if (normalizedGroup.includes(normalizedUserName)) {
                const otherMemberNames = group.filter(name => normalizeName(name) !== normalizedUserName);
                eligibleTeams = eligibleTeams.filter(team => {
                    const normalizedMembers = (team.members || []).map(normalizeName);
                    return !otherMemberNames.some(otherName => normalizedMembers.includes(normalizeName(otherName)));
                });
            }
        }

        if (eligibleTeams.length === 0) {
            throw new Error('현재 배정 가능한 조가 없습니다. 관리자에게 문의하세요.');
        }

        // 4. 최소 인원(min) 조만 후보로 선택 (1명 차이도 제외)
        const minCount = Math.min(...eligibleTeams.map(t => t.count));
        const candidateTeams = eligibleTeams.filter(t => t.count === minCount);

        const selectedTeam = getRandomElement(candidateTeams);

        // 5. Transaction을 사용하여 동시성 제어
        const teamRef = database.ref(`teams/${selectedTeam.id}`);

        let assignedTeam = null;
        await teamRef.transaction((currentTeam) => {
            if (currentTeam === null) {
                return currentTeam;
            }

            // 멤버가 이미 존재하는지 확인 (이중 체크)
            const members = currentTeam.members || [];
            const normalizedMembers = members.map(normalizeName);
            if (normalizedMembers.includes(normalizeName(canonicalName))) {
                // 이미 배정된 경우 트랜잭션 중단
                return undefined;
            }

            // 새 멤버 추가
            currentTeam.members = [...members, canonicalName];
            currentTeam.count = (currentTeam.count || 0) + 1;
            currentTeam.updatedAt = Date.now();

            return currentTeam;
        });

        // 6. 최종 팀 정보 가져오기
        const finalSnapshot = await teamRef.once('value');
        assignedTeam = finalSnapshot.val();

        return {
            teamId: selectedTeam.id,
            teamName: assignedTeam.name,
            leader: assignedTeam.leader,
            emblem: assignedTeam.emblem,
            emblemImage: assignedTeam.emblemImage,
            color: assignedTeam.color,
            trait: assignedTeam.trait,
            count: assignedTeam.count,
            alreadyAssigned: false
        };

    } catch (error) {
        console.error('Team assignment error:', error);
        throw error;
    }
}

// ========================================
// 사용자 앱 (index.html)
// ========================================

function initUserApp() {
    console.log('Initializing user app...');

    const nameInput = document.getElementById('nameInput');
    const nameDropdown = document.getElementById('nameDropdown');
    const sortButton = document.getElementById('sortButton');
    const hatImage = document.getElementById('hatImage');
    const thinkingText = document.getElementById('thinkingText');
    const statusMessage = document.getElementById('statusMessage');
    const sortingScreen = document.getElementById('sortingScreen');
    const resultScreen = document.getElementById('resultScreen');
    const resultHouse = document.getElementById('resultHouse');
    const resultLeader = document.getElementById('resultLeader');
    const resultMessage = document.getElementById('resultMessage');
    const confetti = document.getElementById('confetti');

    let currentMemberList = [];
    let assignedNameSet = new Set();

    // 드롭다운 목록 렌더링 함수
    function renderDropdown(filterKeyword = '') {
        if (!nameDropdown) return;

        const keyword = normalizeName(filterKeyword);
        const initialKeyword = getHangulInitial(filterKeyword.trim().toLowerCase());

        const filtered = currentMemberList.filter(name => {
            if (!keyword) return true;
            const normalized = normalizeName(name);
            const initial = getHangulInitial(normalized);
            return normalized.includes(keyword) || initial.includes(initialKeyword);
        });

        if (filtered.length === 0) {
            nameDropdown.innerHTML = '<div class="dropdown-empty">일치하는 이름이 없습니다</div>';
            nameDropdown.classList.remove('hidden');
            return;
        }

        nameDropdown.innerHTML = filtered.map(name => {
            const isAssigned = assignedNameSet.has(normalizeName(name));
            return `
                <div class="dropdown-item ${isAssigned ? 'assigned' : ''}" data-name="${name}">
                    <span>${name}</span>
                    ${isAssigned ? '<span class="badge-assigned">배정완료</span>' : ''}
                </div>
            `;
        }).join('');

        nameDropdown.classList.remove('hidden');
    }

    // 명단 구독
    database.ref('config/memberList').on('value', (snapshot) => {
        currentMemberList = snapshot.val() || [];
    });

    // 배정된 인원 실시간 구독 (모든 조의 멤버 목록 수집)
    database.ref('teams').on('value', (snapshot) => {
        const teams = snapshot.val() || {};
        const assigned = new Set();
        Object.values(teams).forEach(team => {
            if (team.members && Array.isArray(team.members)) {
                team.members.forEach(m => assigned.add(normalizeName(m)));
            }
        });
        assignedNameSet = assigned;
        if (nameDropdown && !nameDropdown.classList.contains('hidden')) {
            renderDropdown(nameInput ? nameInput.value : '');
        }
    });

    if (nameInput && nameDropdown) {
        nameInput.addEventListener('focus', () => {
            if (currentMemberList.length > 0) {
                renderDropdown(nameInput.value);
            }
        });

        nameInput.addEventListener('input', () => {
            if (currentMemberList.length > 0) {
                renderDropdown(nameInput.value);
            }
        });

        nameDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (!item) return;
            
            if (item.classList.contains('assigned')) {
                showStatusMessage('이미 배정이 완료된 이름입니다!', 'error');
                return;
            }

            const selectedName = item.dataset.name;
            nameInput.value = selectedName;
            nameDropdown.classList.add('hidden');
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-dropdown-wrapper')) {
                nameDropdown.classList.add('hidden');
            }
        });
    }

    // SessionStorage에서 저장된 배정 결과 확인 및 검증
    const savedAssignment = getFromSessionStorage('userAssignment');
    if (savedAssignment) {
        // Firebase에서 실제로 배정이 유효한지 확인
        validateAndShowAssignment(savedAssignment);
    }
    
    // Firebase에서 배정 정보 검증 함수
    async function validateAndShowAssignment(savedData) {
        try {
            const teamsRef = database.ref('teams');
            const snapshot = await teamsRef.once('value');
            const teamsData = snapshot.val() || {};
            
            // 모든 활성 조에서 사용자 이름 찾기
            let found = false;
            for (const [teamId, team] of Object.entries(teamsData)) {
                if (team.active && team.members && team.members.includes(savedData.name)) {
                    found = true;
                    // Firebase 데이터로 업데이트된 정보 표시
                    const updatedData = {
                        ...savedData,
                        teamName: team.name,
                        leader: team.leader,
                        emblem: team.emblem,
                        emblemImage: team.emblemImage,
                        color: team.color,
                        trait: team.trait
                    };
                    showResult(updatedData);
                    break;
                }
            }
            
            // Firebase에 데이터가 없으면 SessionStorage 삭제
            if (!found) {
                console.log('배정 데이터가 초기화되었습니다. SessionStorage를 삭제합니다.');
                clearFromSessionStorage('userAssignment');
                // 입력 화면이 기본으로 표시됨
            }
        } catch (error) {
            console.error('Assignment validation error:', error);
            // 오류 발생 시 SessionStorage 삭제
            clearFromSessionStorage('userAssignment');
        }
    }

    // 배정 버튼 클릭
    sortButton.addEventListener('click', async () => {
        const name = nameInput.value.trim();

        if (!name) {
            showStatusMessage('이름을 입력하거나 검색해서 선택해주세요!', 'error');
            return;
        }

        if (name.length < 2) {
            showStatusMessage('이름은 최소 2글자 이상이어야 합니다.', 'error');
            return;
        }

        // 명단에 있는 이름인지 사전 검증
        if (currentMemberList.length > 0) {
            const matchedName = currentMemberList.find(m => normalizeName(m) === normalizeName(name));
            if (!matchedName) {
                showStatusMessage('목록에서 본인의 이름을 선택해 주세요!', 'error');
                return;
            }
        }

        // 이미 배정된 이름인지 1차 검증
        if (assignedNameSet.has(normalizeName(name))) {
            showStatusMessage('이미 배정이 완료된 이름입니다!', 'error');
            return;
        }

        // 버튼 비활성화
        if (nameDropdown) nameDropdown.classList.add('hidden');
        sortButton.disabled = true;
        nameInput.disabled = true;
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';

        // 애니메이션 시작
        hatImage.classList.add('wobbling');

        // 랜덤 대사 표시
        thinkingText.textContent = getRandomElement(THINKING_PHRASES);
        thinkingText.classList.remove('hidden');

        // 3초 후 배정 실행
        setTimeout(async () => {
            try {
                const assignment = await assignToTeam(name);

                // 이미 배정된 사용자인 경우
                if (assignment.alreadyAssigned) {
                    showStatusMessage('이미 배정이 완료되었습니다!', 'info');
                }

                // 결과 저장 (세션스토리지 - 브라우저 닫으면 삭제됨)
                const assignmentData = {
                    name: name,
                    teamName: assignment.teamName,
                    leader: assignment.leader,
                    emblem: assignment.emblem,
                    emblemImage: assignment.emblemImage,
                    color: assignment.color,
                    trait: assignment.trait,
                    timestamp: Date.now()
                };
                saveToSessionStorage('userAssignment', assignmentData);

                // 결과 화면 표시
                showResult(assignmentData);

            } catch (error) {
                console.error('Assignment error:', error);
                showStatusMessage(error.message, 'error');

                // 버튼 다시 활성화
                sortButton.disabled = false;
                nameInput.disabled = false;
                hatImage.classList.remove('wobbling');
                thinkingText.classList.add('hidden');
            }
        }, 3000);
    });

    // 상태 메시지 표시 함수
    function showStatusMessage(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
    }

    // 결과 화면 표시 함수
    function showResult(data) {
        // 애니메이션 중지
        hatImage.classList.remove('wobbling');
        thinkingText.classList.add('hidden');

        // 결과 데이터 설정
        const emblemInfo = data.emblemImage ?
            `<img src="${data.emblemImage}" alt="Emblem" style="width: 150px; height: 150px; object-fit: contain; margin-bottom: 20px;"><br>` :
            (data.emblem ? `<span style="font-size: 3rem;">${data.emblem}</span><br>` : '');

        resultHouse.innerHTML = `${emblemInfo}${data.teamName}`;
        if (data.color) {
            resultHouse.style.color = data.color;
            resultHouse.style.textShadow = `0 0 20px ${data.color}80`;
        }
        resultLeader.textContent = data.leader;
        resultMessage.textContent = getRandomElement(SUCCESS_MESSAGES);

        // 화면 전환
        sortingScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');

        // Confetti 효과
        confetti.classList.add('active');
        setTimeout(() => {
            confetti.classList.remove('active');
        }, 3000);
    }

    // 실시간 현황판 업데이트
    updateTeamsStatus();
    database.ref('teams').on('value', updateTeamsStatus);
}

// 실시간 현황판 업데이트
function updateTeamsStatus() {
    const teamsList = document.getElementById('teamsList');
    if (!teamsList) return;

    database.ref('teams').once('value', (snapshot) => {
        const teamsData = snapshot.val() || {};
        const activeTeams = Object.entries(teamsData)
            .filter(([_, team]) => team.active)
            .sort((a, b) => a[1].name.localeCompare(b[1].name));

        if (activeTeams.length === 0) {
            teamsList.innerHTML = '<p class="loading-text">아직 생성된 조가 없습니다.</p>';
            return;
        }

        teamsList.innerHTML = activeTeams.map(([teamId, team]) => {
            const members = team.members || [];
            const count = team.count || 0;
            const emblem = team.emblem || '⭐';
            const emblemImage = team.emblemImage || '';
            const color = team.color || 'var(--color-gold)';

            const emblemDisplay = emblemImage ?
                `<img src="${emblemImage}" alt="Emblem" style="width: 40px; height: 40px; object-fit: contain; margin-right: 8px;">` :
                `<span style="font-size: 1.5rem; margin-right: 8px;">${emblem}</span>`;

            return `
                <div class="team-card" style="border-color: ${color}50;">
                    <div class="team-header">
                        <div class="team-name" style="color: ${color}; display: flex; align-items: center;">
                            ${emblemDisplay}
                            <span>${team.name} (조장: ${team.leader})</span>
                        </div>
                        <div class="team-count">${count}명</div>
                    </div>
                    <div class="team-members">
                        ${members.length > 0
                    ? members.map(m => `<span class="member-badge">${m}</span>`).join('')
                    : '<span class="member-badge" style="opacity: 0.5;">아직 배정된 인원이 없습니다</span>'
                }
                    </div>
                </div>
            `;
        }).join('');
    });
}

// ========================================
// 관리자 앱 (admin.html)
// ========================================

function initAdminApp() {
    console.log('Initializing admin app...');

    const leadersGrid = document.getElementById('leadersGrid');
    const selectedCount = document.getElementById('selectedCount');
    const teamCount = document.getElementById('teamCount');
    const applyLeadersBtn = document.getElementById('applyLeadersBtn');
    const sortingToggle = document.getElementById('sortingToggle');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusInfo = document.getElementById('statusInfo');
    const resetAssignmentsBtn = document.getElementById('resetAssignmentsBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const activeTeams = document.getElementById('activeTeams');
    const totalMembers = document.getElementById('totalMembers');
    const avgMembers = document.getElementById('avgMembers');
    const teamsDetail = document.getElementById('teamsDetail');

    function updateSelectedLeaderCount() {
        const checked = leadersGrid.querySelectorAll('.leader-input:checked').length;
        selectedCount.textContent = checked;
        teamCount.textContent = checked;
    }

    // 임원 선택 카운트 업데이트
    leadersGrid.addEventListener('change', updateSelectedLeaderCount);
    updateSelectedLeaderCount();

    // 조 구성 적용
    applyLeadersBtn.addEventListener('click', async () => {
        const checkedInputs = leadersGrid.querySelectorAll('.leader-input:checked');

        if (checkedInputs.length === 0) {
            alert('최소 1명 이상의 임원을 선택해주세요.');
            return;
        }

        if (!confirm(`${checkedInputs.length}개의 조를 생성하시겠습니까?`)) {
            return;
        }

        applyLeadersBtn.disabled = true;
        applyLeadersBtn.textContent = '생성 중...';

        try {
            const teamsRef = database.ref('teams');

            // 기존 조 비활성화
            const snapshot = await teamsRef.once('value');
            const existingTeams = snapshot.val() || {};

            const updates = {};
            Object.keys(existingTeams).forEach(teamId => {
                updates[`${teamId}/active`] = false;
            });

            // 새 조 생성
            checkedInputs.forEach((input, index) => {
                const leaderName = input.dataset.leader;
                const teamNumber = index + 1;
                const teamId = `team_${Date.now()}_${teamNumber}`;
                const emblem = LEADER_EMBLEMS[leaderName] || { icon: '⭐', image: '', color: '#d4af37', name: '특별' };

                updates[teamId] = {
                    name: `${teamNumber}조`,
                    leader: leaderName,
                    emblem: emblem.icon,
                    emblemImage: emblem.image,
                    color: emblem.color,
                    trait: emblem.name,
                    active: true,
                    count: 0,
                    members: [],
                    createdAt: Date.now()
                };
            });

            await teamsRef.update(updates);

            alert('조 구성이 완료되었습니다!');

        } catch (error) {
            console.error('Apply leaders error:', error);
            alert('조 구성 중 오류가 발생했습니다: ' + error.message);
        } finally {
            applyLeadersBtn.disabled = false;
            applyLeadersBtn.textContent = '✅ 조 구성 적용하기';
        }
    });

    // 배정 상태 토글
    database.ref('config/sortingEnabled').on('value', (snapshot) => {
        const enabled = snapshot.val() || false;
        sortingToggle.checked = enabled;

        if (enabled) {
            statusIndicator.classList.add('active');
            statusIndicator.querySelector('.status-text').textContent = '배정 진행 중';
            statusInfo.textContent = '사용자들이 배정을 받을 수 있습니다.';
            statusInfo.style.color = 'var(--color-success)';
        } else {
            statusIndicator.classList.remove('active');
            statusIndicator.querySelector('.status-text').textContent = '배정 중지됨';
            statusInfo.textContent = '현재 사용자들은 배정을 받을 수 없습니다.';
            statusInfo.style.color = 'var(--color-parchment)';
        }
    });

    sortingToggle.addEventListener('change', async () => {
        const enabled = sortingToggle.checked;

        try {
            await database.ref('config/sortingEnabled').set(enabled);
        } catch (error) {
            console.error('Toggle sorting error:', error);
            alert('상태 변경 중 오류가 발생했습니다: ' + error.message);
            sortingToggle.checked = !enabled;
        }
    });

    // 배정 결과만 초기화
    resetAssignmentsBtn.addEventListener('click', async () => {
        if (!confirm('모든 배정 결과를 초기화하시겠습니까? (조 구성은 유지됩니다)')) {
            return;
        }

        try {
            const teamsRef = database.ref('teams');
            const snapshot = await teamsRef.once('value');
            const teams = snapshot.val() || {};

            const updates = {};
            Object.keys(teams).forEach(teamId => {
                updates[`${teamId}/count`] = 0;
                updates[`${teamId}/members`] = [];
            });

            await teamsRef.update(updates);
            alert('배정 결과가 초기화되었습니다.');

        } catch (error) {
            console.error('Reset assignments error:', error);
            alert('초기화 중 오류가 발생했습니다: ' + error.message);
        }
    });

    // 전체 데이터 초기화
    resetAllBtn.addEventListener('click', async () => {
        if (!confirm('⚠️ 경고: 모든 조와 배정 데이터를 삭제합니다. 계속하시겠습니까?')) {
            return;
        }

        if (!confirm('정말로 전체 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!')) {
            return;
        }

        try {
            await database.ref('teams').remove();
            await database.ref('seats').remove();
            await database.ref('config').set({
                sortingEnabled: false,
                seatDrawEnabled: false,
                seatTopRestrictedNames: []
            });

            alert('전체 데이터가 초기화되었습니다.');

        } catch (error) {
            console.error('Reset all error:', error);
            alert('초기화 중 오류가 발생했습니다: ' + error.message);
        }
    });

    // 자리 뽑기 제한 설정 섹션
    const seatDrawToggle = document.getElementById('seatDrawToggle');
    const seatStatusIndicator = document.getElementById('seatStatusIndicator');
    const seatStatusInfo = document.getElementById('seatStatusInfo');
    const resetSeatsBtn = document.getElementById('resetSeatsBtn');
    const assignedSeats = document.getElementById('assignedSeats');
    const remainingSeats = document.getElementById('remainingSeats');
    const seatsDetail = document.getElementById('seatsDetail');
    const seatRestrictedNamesInput = document.getElementById('seatRestrictedNamesInput');
    const saveSeatRestrictionsBtn = document.getElementById('saveSeatRestrictionsBtn');
    const memberListInput = document.getElementById('memberListInput');
    const saveMemberListBtn = document.getElementById('saveMemberListBtn');

    // 조 배정 명단 불러오기
    database.ref('config/memberList').on('value', (snapshot) => {
        if (!memberListInput) return;
        const names = snapshot.val() || [];
        if (Array.isArray(names)) {
            memberListInput.value = names.join('\n');
        } else {
            memberListInput.value = '';
        }
    });

    // 조 배정 명단 저장하기
    if (saveMemberListBtn && memberListInput) {
        saveMemberListBtn.addEventListener('click', async () => {
            const memberList = parseMemberList(memberListInput.value);

            try {
                saveMemberListBtn.disabled = true;
                saveMemberListBtn.textContent = '저장 중...';
                await database.ref('config/memberList').set(memberList);
                alert(`조 배정 명단이 저장되었습니다. (총 ${memberList.length}명)`);
            } catch (error) {
                console.error('Save member list error:', error);
                alert('명단 저장 중 오류가 발생했습니다: ' + error.message);
            } finally {
                saveMemberListBtn.disabled = false;
                saveMemberListBtn.textContent = '💾 명단 저장하기';
            }
        });
    }

    // 예외 배정 비밀 메뉴 로직
    const secretAuthForm = document.getElementById('secretAuthForm');
    const secretPasswordInput = document.getElementById('secretPasswordInput');
    const secretAuthBtn = document.getElementById('secretAuthBtn');
    const secretMenuContent = document.getElementById('secretMenuContent');
    const leaderRestrictionsInput = document.getElementById('leaderRestrictionsInput');
    const mutuallyExclusiveInput = document.getElementById('mutuallyExclusiveInput');
    const newSecretPasswordInput = document.getElementById('newSecretPasswordInput');
    const saveSecretConfigBtn = document.getElementById('saveSecretConfigBtn');
    const lockSecretMenuBtn = document.getElementById('lockSecretMenuBtn');

    let currentSecretPassword = "7777";
    let currentLeaderRestrictions = null;
    let currentMutuallyExclusiveGroups = null;

    database.ref('config').on('value', (snapshot) => {
        const config = snapshot.val() || {};
        currentSecretPassword = config.secretPassword || "7777";
        currentLeaderRestrictions = config.teamLeaderRestrictions || TEAM_LEADER_RESTRICTED_NAMES;
        currentMutuallyExclusiveGroups = config.mutuallyExclusiveGroups || MUTUALLY_EXCLUSIVE_GROUPS;

        if (secretMenuContent && !secretMenuContent.classList.contains('hidden')) {
            if (leaderRestrictionsInput) {
                leaderRestrictionsInput.value = formatLeaderRestrictionsText(currentLeaderRestrictions);
            }
            if (mutuallyExclusiveInput) {
                mutuallyExclusiveInput.value = formatMutuallyExclusiveText(currentMutuallyExclusiveGroups);
            }
        }
    });

    function authenticateSecretMenu() {
        const enteredPassword = secretPasswordInput ? secretPasswordInput.value.trim() : '';
        if (enteredPassword === currentSecretPassword) {
            secretAuthForm.classList.add('hidden');
            secretMenuContent.classList.remove('hidden');
            if (leaderRestrictionsInput) {
                leaderRestrictionsInput.value = formatLeaderRestrictionsText(currentLeaderRestrictions);
            }
            if (mutuallyExclusiveInput) {
                mutuallyExclusiveInput.value = formatMutuallyExclusiveText(currentMutuallyExclusiveGroups);
            }
            if (secretPasswordInput) secretPasswordInput.value = '';
        } else {
            alert('비밀번호가 올바르지 않습니다.');
        }
    }

    if (secretAuthBtn) {
        secretAuthBtn.addEventListener('click', authenticateSecretMenu);
    }
    if (secretPasswordInput) {
        secretPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') authenticateSecretMenu();
        });
    }

    if (lockSecretMenuBtn) {
        lockSecretMenuBtn.addEventListener('click', () => {
            secretMenuContent.classList.add('hidden');
            secretAuthForm.classList.remove('hidden');
            if (newSecretPasswordInput) newSecretPasswordInput.value = '';
        });
    }

    if (saveSecretConfigBtn) {
        saveSecretConfigBtn.addEventListener('click', async () => {
            const parsedLeaderRestrictions = parseLeaderRestrictionsText(leaderRestrictionsInput ? leaderRestrictionsInput.value : '');
            const parsedMutuallyExclusive = parseMutuallyExclusiveText(mutuallyExclusiveInput ? mutuallyExclusiveInput.value : '');
            const newPassword = newSecretPasswordInput ? newSecretPasswordInput.value.trim() : '';

            try {
                saveSecretConfigBtn.disabled = true;
                saveSecretConfigBtn.textContent = '저장 중...';

                const updates = {};
                updates['config/teamLeaderRestrictions'] = parsedLeaderRestrictions;
                updates['config/mutuallyExclusiveGroups'] = parsedMutuallyExclusive;
                if (newPassword) {
                    if (newPassword.length < 4) {
                        alert('새 비밀번호는 최소 4자리 이상이어야 합니다.');
                        saveSecretConfigBtn.disabled = false;
                        saveSecretConfigBtn.textContent = '💾 비밀 설정 저장하기';
                        return;
                    }
                    updates['config/secretPassword'] = newPassword;
                }

                await database.ref().update(updates);
                if (newSecretPasswordInput) newSecretPasswordInput.value = '';
                alert('비밀 설정이 성공적으로 저장되었습니다!');
            } catch (error) {
                console.error('Save secret config error:', error);
                alert('저장 중 오류가 발생했습니다: ' + error.message);
            } finally {
                saveSecretConfigBtn.disabled = false;
                saveSecretConfigBtn.textContent = '💾 비밀 설정 저장하기';
            }
        });
    }

    // 자리 뽑기 상태 토글
    database.ref('config/seatDrawEnabled').on('value', (snapshot) => {
        const enabled = snapshot.val() || false;
        seatDrawToggle.checked = enabled;

        if (enabled) {
            seatStatusIndicator.classList.add('active');
            seatStatusIndicator.querySelector('.status-text').textContent = '자리 뽑기 진행 중';
            seatStatusInfo.textContent = '조장들이 자리를 배정받을 수 있습니다.';
            seatStatusInfo.style.color = 'var(--color-success)';
        } else {
            seatStatusIndicator.classList.remove('active');
            seatStatusIndicator.querySelector('.status-text').textContent = '자리 뽑기 중지됨';
            seatStatusInfo.textContent = '현재 조장들은 자리를 배정받을 수 없습니다.';
            seatStatusInfo.style.color = 'var(--color-parchment)';
        }
    });

    seatDrawToggle.addEventListener('change', async () => {
        const enabled = seatDrawToggle.checked;

        try {
            await database.ref('config/seatDrawEnabled').set(enabled);
        } catch (error) {
            console.error('Toggle seat draw error:', error);
            alert('상태 변경 중 오류가 발생했습니다: ' + error.message);
            seatDrawToggle.checked = !enabled;
        }
    });

    // 자리 뽑기 1~4번 제한 명단 불러오기
    database.ref('config/seatTopRestrictedNames').on('value', (snapshot) => {
        if (!seatRestrictedNamesInput) return;
        const names = snapshot.val() || [];
        if (Array.isArray(names)) {
            seatRestrictedNamesInput.value = names.join(', ');
        } else {
            seatRestrictedNamesInput.value = '';
        }
    });

    // 자리 뽑기 1~4번 제한 명단 저장
    if (saveSeatRestrictionsBtn && seatRestrictedNamesInput) {
        saveSeatRestrictionsBtn.addEventListener('click', async () => {
            const restrictedNames = parseSeatRestrictedNames(seatRestrictedNamesInput.value);

            try {
                saveSeatRestrictionsBtn.disabled = true;
                saveSeatRestrictionsBtn.textContent = '저장 중...';
                await database.ref('config/seatTopRestrictedNames').set(restrictedNames);
                alert(`제한 명단이 저장되었습니다. (${restrictedNames.length}명)`);
            } catch (error) {
                console.error('Save seat restrictions error:', error);
                alert('제한 명단 저장 중 오류가 발생했습니다: ' + error.message);
            } finally {
                saveSeatRestrictionsBtn.disabled = false;
                saveSeatRestrictionsBtn.textContent = '💾 제한 명단 저장';
            }
        });
    }

    // 자리 배정 결과만 초기화
    resetSeatsBtn.addEventListener('click', async () => {
        if (!confirm('모든 자리 배정 결과를 초기화하시겠습니까?')) {
            return;
        }

        try {
            await database.ref('seats').remove();
            alert('자리 배정 결과가 초기화되었습니다.');

        } catch (error) {
            console.error('Reset seats error:', error);
            alert('초기화 중 오류가 발생했습니다: ' + error.message);
        }
    });

    // 자리 배정 실시간 통계
    database.ref('seats').on('value', (snapshot) => {
        const seatsData = snapshot.val() || {};
        const assigned = Object.keys(seatsData).length;
        const remaining = 22 - assigned;

        assignedSeats.textContent = assigned;
        remainingSeats.textContent = remaining;

        // 자리별 상세 정보
        if (assigned === 0) {
            seatsDetail.innerHTML = '<p class="loading-text">아직 배정된 자리가 없습니다.</p>';
        } else {
            const seatsList = Object.entries(seatsData)
                .map(([number, info]) => ({
                    number: parseInt(number),
                    leader: info.leader,
                    time: info.assignedAt
                }))
                .sort((a, b) => a.number - b.number);

            seatsDetail.innerHTML = seatsList.map(seat => `
                <div class="team-detail-card" style="border-color: var(--color-success)50;">
                    <div class="team-detail-header">
                        <div class="team-detail-name" style="color: var(--color-success); display: flex; align-items: center;">
                            <span style="font-size: 1.5rem; margin-right: 8px;">🪑</span>
                            <span>${seat.number}번 자리</span>
                        </div>
                        <div class="team-detail-count">${seat.leader}</div>
                    </div>
                </div>
            `).join('');
        }

        // 관리자 화면 자리 배치도 실시간 반영
        updateSeatsStatus();
    });

    // 실시간 통계 업데이트
    database.ref('teams').on('value', (snapshot) => {
        const teamsData = snapshot.val() || {};
        const teams = Object.entries(teamsData)
            .filter(([_, team]) => team.active)
            .map(([id, team]) => ({ id, ...team }));

        // 새로고침 시에도 현재 활성 조장 선택 상태가 유지되도록 체크박스를 동기화
        const activeLeaderNames = new Set(teams.map(team => team.leader));
        leadersGrid.querySelectorAll('.leader-input').forEach((input) => {
            input.checked = activeLeaderNames.has(input.dataset.leader);
        });
        updateSelectedLeaderCount();

        const active = teams.length;
        const total = teams.reduce((sum, team) => sum + (team.count || 0), 0);
        const avg = active > 0 ? (total / active).toFixed(1) : '0.0';

        activeTeams.textContent = active;
        totalMembers.textContent = total;
        avgMembers.textContent = avg;

        // 조별 상세 정보
        if (teams.length === 0) {
            teamsDetail.innerHTML = '<p class="loading-text">생성된 조가 없습니다.</p>';
        } else {
            teamsDetail.innerHTML = teams.sort((a, b) => a.name.localeCompare(b.name)).map(team => {
                const members = team.members || [];
                const emblem = team.emblem || '⭐';
                const emblemImage = team.emblemImage || '';
                const color = team.color || 'var(--color-gold)';

                const emblemDisplay = emblemImage ?
                    `<img src="${emblemImage}" alt="Emblem" style="width: 40px; height: 40px; object-fit: contain; margin-right: 8px;">` :
                    `<span style="font-size: 1.5rem; margin-right: 8px;">${emblem}</span>`;

                return `
                    <div class="team-detail-card" style="border-color: ${color}50;">
                        <div class="team-detail-header">
                            <div class="team-detail-name" style="color: ${color}; display: flex; align-items: center;">
                                ${emblemDisplay}
                                <span>${team.name} (조장: ${team.leader})</span>
                            </div>
                            <div class="team-detail-count">${team.count || 0}명</div>
                        </div>
                        <div class="team-detail-members">
                            ${members.length > 0
                        ? '👥 ' + members.join(', ')
                        : '아직 배정된 인원이 없습니다.'
                    }
                        </div>
                    </div>
                `;
            }).join('');
        }
    });
}

// ========================================
// 전역 함수 노출 (HTML에서 호출용)
// ========================================
window.initUserApp = initUserApp;
window.initAdminApp = initAdminApp;

// ========================================
// 자리 뽑기 기능
// ========================================

const SEAT_THINKING_PHRASES = [
    "자리를 고민하는 중...",
    "어디가 좋을까요?",
    "운명의 번호를 찾는 중...",
    "완벽한 자리를 찾고 있어요!",
    "잠시만 기다려주세요...",
    "좋은 자리가 나올 거예요!",
    "번호를 뽑는 중..."
];

const SEAT_SUCCESS_MESSAGES = [
    "축하합니다! 좋은 자리네요!",
    "당신의 자리가 결정되었습니다!",
    "완벽한 선택입니다!",
    "이 자리에서 좋은 시간 보내세요!",
    "멋진 자리를 배정받았어요!"
];

// 자리 배정 로직
async function assignSeat(leaderName) {
    const seatsRef = database.ref('seats');
    const configRef = database.ref('config');
    
    try {
        // 1. 자리 배정이 활성화되어 있는지 확인
        const configSnapshot = await configRef.once('value');
        const config = configSnapshot.val() || {};
        const restrictedNames = Array.isArray(config.seatTopRestrictedNames)
            ? config.seatTopRestrictedNames
            : [];
        const isTopSeatRestricted = restrictedNames.includes(leaderName);
        
        if (!config.seatDrawEnabled) {
            throw new Error('현재 자리 뽑기가 중지되어 있습니다. 관리자에게 문의하세요.');
        }
        
        // 2. 현재 배정된 자리 목록 가져오기
        const seatsSnapshot = await seatsRef.once('value');
        const seatsData = seatsSnapshot.val() || {};
        
        // 2-1. 이미 배정받은 사람인지 확인
        const existingAssignment = Object.entries(seatsData).find(
            ([_, seat]) => seat.leader === leaderName
        );
        
        if (existingAssignment) {
            const [seatNumber, seatInfo] = existingAssignment;
            return {
                seatNumber: parseInt(seatNumber),
                leader: seatInfo.leader,
                alreadyAssigned: true
            };
        }
        
        // 3. 사용 가능한 자리 번호 찾기 (1~22)
        const assignedNumbers = Object.keys(seatsData).map(n => parseInt(n));
        const availableNumbers = [];
        for (let i = 1; i <= 22; i++) {
            if (!assignedNumbers.includes(i)) {
                availableNumbers.push(i);
            }
        }
        
        if (availableNumbers.length === 0) {
            throw new Error('모든 자리가 배정되었습니다!');
        }
        
        // 4. 랜덤으로 자리 선택 (필요 시 1~4번 제외)
        let candidateNumbers = availableNumbers;
        if (isTopSeatRestricted) {
            const nonTopNumbers = availableNumbers.filter(n => !TOP_SEAT_NUMBERS.includes(n));
            if (nonTopNumbers.length === 0) {
                throw new Error('현재 남은 자리가 1~4번뿐이라 배정할 수 없습니다. 관리자에게 문의하세요.');
            }
            candidateNumbers = nonTopNumbers;
        }

        const selectedNumber = getRandomElement(candidateNumbers);
        
        // 5. Transaction으로 동시성 제어
        const seatRef = database.ref(`seats/${selectedNumber}`);
        
        await seatRef.transaction((currentSeat) => {
            if (currentSeat !== null) {
                // 이미 누군가 배정받음
                return undefined;
            }
            
            return {
                leader: leaderName,
                assignedAt: Date.now()
            };
        });
        
        return {
            seatNumber: selectedNumber,
            leader: leaderName,
            alreadyAssigned: false
        };
        
    } catch (error) {
        console.error('Seat assignment error:', error);
        throw error;
    }
}

// 자리 뽑기 앱 초기화
function initSeatDrawApp() {
    console.log('Initializing seat draw app...');
    
    const seatNameInput = document.getElementById('seatNameInput');
    const seatDrawButton = document.getElementById('seatDrawButton');
    const seatThinkingText = document.getElementById('seatThinkingText');
    const seatStatusMessage = document.getElementById('seatStatusMessage');
    const seatDrawScreen = document.getElementById('seatDrawScreen');
    const seatResultScreen = document.getElementById('seatResultScreen');
    const seatNumber = document.getElementById('seatNumber');
    const seatResultName = document.getElementById('seatResultName');
    const seatMessage = document.getElementById('seatMessage');
    const seatConfetti = document.getElementById('seatConfetti');
    
    // SessionStorage에서 저장된 자리 배정 확인 및 검증
    const savedSeat = getFromSessionStorage('userSeat');
    if (savedSeat) {
        // Firebase에서 실제로 자리 배정이 유효한지 확인
        validateAndShowSeat(savedSeat);
    }
    
    // Firebase에서 자리 배정 정보 검증 함수
    async function validateAndShowSeat(savedData) {
        try {
            const seatsRef = database.ref('seats');
            const snapshot = await seatsRef.once('value');
            const seatsData = snapshot.val() || {};
            
            // 저장된 자리 번호에 해당 사용자가 있는지 확인
            const seatInfo = seatsData[savedData.seatNumber];
            
            if (seatInfo && seatInfo.leader === savedData.name) {
                // 유효한 배정이면 결과 표시
                showSeatResult(savedData);
            } else {
                // Firebase에 데이터가 없으면 SessionStorage 삭제
                console.log('자리 배정이 초기화되었습니다. SessionStorage를 삭제합니다.');
                clearFromSessionStorage('userSeat');
                // 입력 화면이 기본으로 표시됨
            }
        } catch (error) {
            console.error('Seat validation error:', error);
            // 오류 발생 시 SessionStorage 삭제
            clearFromSessionStorage('userSeat');
        }
    }
    
    // 자리 뽑기 버튼 클릭
    seatDrawButton.addEventListener('click', async () => {
        const name = seatNameInput.value.trim();
        
        if (!name) {
            showSeatStatusMessage("이름을 '~네'로 입력해주세요!", 'error');
            return;
        }
        
        if (name.length < 2) {
            showSeatStatusMessage('이름은 최소 2글자 이상이어야 합니다.', 'error');
            return;
        }
        
        // 버튼 비활성화
        seatDrawButton.disabled = true;
        seatNameInput.disabled = true;
        seatStatusMessage.textContent = '';
        seatStatusMessage.className = 'status-message';
        
        // 랜덤 대사 표시
        seatThinkingText.textContent = getRandomElement(SEAT_THINKING_PHRASES);
        seatThinkingText.classList.remove('hidden');
        
        // 2초 후 자리 배정 실행
        setTimeout(async () => {
            try {
                const assignment = await assignSeat(name);
                
                // 이미 배정된 경우
                if (assignment.alreadyAssigned) {
                    showSeatStatusMessage('이미 자리 배정이 완료되었습니다!', 'info');
                }
                
                // 결과 저장
                const seatData = {
                    name: name,
                    seatNumber: assignment.seatNumber,
                    timestamp: Date.now()
                };
                saveToSessionStorage('userSeat', seatData);
                
                // 결과 화면 표시
                showSeatResult(seatData);
                
            } catch (error) {
                console.error('Seat draw error:', error);
                showSeatStatusMessage(error.message, 'error');
                
                // 버튼 다시 활성화
                seatDrawButton.disabled = false;
                seatNameInput.disabled = false;
                seatThinkingText.classList.add('hidden');
            }
        }, 2000);
    });
    
    // 상태 메시지 표시 함수
    function showSeatStatusMessage(message, type = 'info') {
        seatStatusMessage.textContent = message;
        seatStatusMessage.className = `status-message ${type}`;
    }
    
    // 결과 화면 표시 함수 (번호 + 뽑힌 사람 이름)
    function showSeatResult(data) {
        seatThinkingText.classList.add('hidden');
        
        seatNumber.textContent = `${data.seatNumber}번`;
        if (seatResultName) {
            seatResultName.textContent = data.name ? `${data.name}님` : '';
            seatResultName.style.display = data.name ? '' : 'none';
        }
        seatMessage.textContent = getRandomElement(SEAT_SUCCESS_MESSAGES);
        
        // 화면 전환
        seatDrawScreen.classList.add('hidden');
        seatResultScreen.classList.remove('hidden');
        
        // Confetti 효과
        seatConfetti.classList.add('active');
        setTimeout(() => {
            seatConfetti.classList.remove('active');
        }, 3000);
    }
    
    // 실시간 자리 현황판 업데이트
    updateSeatsStatus();
    database.ref('seats').on('value', updateSeatsStatus);
}

// 실시간 자리 현황판 업데이트 (배치도 + 그리드)
function updateSeatsStatus() {
    const seatStatusBoard = document.getElementById('seatStatusBoard');
    const seatsList = document.getElementById('seatsList');
    const seatSlots = document.querySelectorAll('.seat-slot-numbered[data-seat-number]');
    
    database.ref('seats').once('value', (snapshot) => {
        const seatsData = snapshot.val() || {};
        const assignedCount = Object.values(seatsData).filter(seat => seat && seat.leader).length;
        const isAllSeatsAssigned = assignedCount >= 22;

        if (seatStatusBoard) {
            seatStatusBoard.classList.toggle('hidden', !isAllSeatsAssigned);
        }
        
        // 그리드 뷰: 1~22번 카드
        if (seatsList) {
            const seatsHTML = [];
            for (let i = 1; i <= 22; i++) {
                const seat = seatsData[i];
                const isAssigned = seat && seat.leader;
                const nameText = isAssigned ? seat.leader : '-';
                seatsHTML.push(`
                    <div class="seat-card ${isAssigned ? 'assigned' : 'available'}">
                        <div class="seat-number-display">${i}번</div>
                        <div class="seat-leader-name" ${!isAssigned ? 'style="opacity: 0.5;"' : ''}>${nameText}</div>
                    </div>
                `);
            }
            seatsList.innerHTML = seatsHTML.join('');
        }
        
        // 배치도 뷰: 번호 박스 내부 이름 업데이트
        if (seatSlots.length > 0) {
            seatSlots.forEach(slot => {
                const seatNumber = slot.dataset.seatNumber;
                const seat = seatsData[seatNumber];
                const isAssigned = seat && seat.leader;
                const nameText = isAssigned ? seat.leader : '-';
                const nameEl = slot.querySelector('.seat-slot-name');

                slot.classList.toggle('assigned', !!isAssigned);
                slot.classList.toggle('available', !isAssigned);
                if (nameEl) {
                    nameEl.textContent = nameText;
                }
            });
        }
    });
}

// 자리 현황 보기 전환 (배치도 / 목록)
function initSeatViewToggle() {
    const toggleBtns = document.querySelectorAll('.seat-view-toggle .toggle-btn');
    const mapWrap = document.getElementById('seatMapView');
    const gridWrap = document.getElementById('seatGridView');
    if (!toggleBtns.length || !mapWrap || !gridWrap) return;
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            toggleBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            if (view === 'map') {
                mapWrap.classList.remove('hidden');
                gridWrap.classList.add('hidden');
            } else {
                mapWrap.classList.add('hidden');
                gridWrap.classList.remove('hidden');
            }
        });
    });
}

// 탭 전환 기능
function initTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // 모든 탭 버튼과 콘텐츠 비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 선택된 탭 활성화
            button.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}Tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    initTabSwitching();
    initSeatViewToggle();
    initSeatDrawApp();
});

