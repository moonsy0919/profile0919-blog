---
description: "ROADMAP.md에서 완료된 작업을 체크하고 진행 상황을 업데이트합니다"
allowed-tools: ["Read(ROADMAP.md:*)", "Edit(ROADMAP.md:*)"]
---

# Claude 명령어: Update Roadmap

완료된 작업을 ROADMAP.md에 체크하고 진행 상황을 업데이트합니다.

## 사용법

```
/update-roadmap
```

## 프로세스

0. **ROADMAP.md 존재 여부 확인**: 루트에 `ROADMAP.md` 파일이 없으면, 아직 로드맵이 생성되지 않은 것이므로 `development-planner` 서브에이전트(또는 PRD 기반 최초 생성 절차)를 통해 먼저 ROADMAP.md를 생성하도록 안내하고 이 명령어는 중단한다.
1. ROADMAP.md 파일 읽기
2. 사용자에게 완료한 Task 번호 확인
3. 해당 Task와 하위 체크리스트에 체크 표시 추가
4. Phase 진행 상황 업데이트
5. 문서 버전 및 최종 업데이트 날짜 갱신
6. 진행 상황(X/N Tasks 완료) 업데이트

## 업데이트 규칙

### Task 체크 패턴

**Task 제목 업데이트:**

- Before: `- **Task XXX: 작업명** - 우선순위`
- After: `- **Task XXX: 작업명** ✅ - 완료`

**하위 항목 업데이트:**

- Before: `  - 항목명`
- After: `  - ✅ 항목명`

### Phase 상태

- 모든 Task 완료 시: `### Phase N: 제목` → `### Phase N: 제목 ✅`

### 진행 상황 업데이트

- 완료된 Task 수 / 전체 Task 수 계산
- 진행 상황 라인 업데이트

### 날짜 업데이트

- 최종 업데이트 날짜를 오늘 날짜로 자동 설정

## 대화형 프로세스

0. ROADMAP.md가 없으면 `development-planner` 서브에이전트 안내 후 중단 (위 프로세스 0단계 참고)
1. 현재 ROADMAP.md 읽기
2. 미완료 Task 목록 표시
3. "어떤 Task를 완료했나요? (예: 004 또는 004,005)" 질문
4. 사용자 입력 받기
5. 해당 Task와 모든 하위 항목에 체크 추가
6. Phase 상태 자동 확인 및 업데이트
7. 진행 상황 통계 업데이트
8. 변경 사항 확인 메시지 출력

## 구현 상세

### Task 완료 체크 로직

1. **Task 제목 찾기**: `- **Task XXX:` 패턴으로 검색
2. **이미 완료 확인**: 제목에 ✅가 있으면 건너뜀
3. **제목 업데이트**: 우선순위를 완료로 교체
4. **하위 항목 업데이트**: Task 다음 줄부터 ✅ 추가

### Phase 완료 체크 로직

1. Phase 내 모든 Task 확인
2. 모든 Task에 ✅가 있으면 Phase 제목에도 ✅ 추가
3. 단, 이미 ✅가 있는 Phase는 건너뜀

### 진행 상황 계산

```
전체 Task: 001~NNN (예: 전체 Task N개)
완료 Task: ✅ 표시가 있는 Task 개수
진행률: (완료 Task / 전체 Task) * 100
```

## 예시

**Before:**

```markdown
- **Task 004: 프로필 편집 페이지 구현** - 우선순위
  - 프로필 수정 폼 컴포넌트 작성
  - Supabase profiles 테이블 update 연동
  - RLS 정책 테스트

**📅 최종 업데이트**: 2025-10-07
**📊 진행 상황**: Phase 1 완료 (3/N Tasks 완료)
```

**After:**

```markdown
- **Task 004: 프로필 편집 페이지 구현** ✅ - 완료
  - ✅ 프로필 수정 폼 컴포넌트 작성
  - ✅ Supabase profiles 테이블 update 연동
  - ✅ RLS 정책 테스트

**📅 최종 업데이트**: 2025-10-08
**📊 진행 상황**: Phase 2 진행 중 (4/N Tasks 완료)
```

## 주의사항

- Task 번호는 3자리 숫자 형식 (001, 002, 003...)
- 이미 완료된(✅ 표시가 있는) Task는 건너뜀
- Phase 전체 완료 시 Phase 제목에도 ✅ 추가
- 날짜는 YYYY-MM-DD 형식 사용
- 여러 Task 동시 완료 지원 (004,005,006)

## 스마트 기능

1. **자동 Phase 진행 추적**
   - Phase 1 완료
   - Phase 2 진행 중
   - Phase 4 대기 중

2. **완료율 계산**
   - 전체 Task 중 완료 개수 자동 카운트 (예: 전체 N개 Task)
   - Phase별 완료 Task 수 추적

3. **날짜 자동 갱신**
   - 오늘 날짜로 자동 업데이트 (YYYY-MM-DD)

## 사용 예시

```bash
# 커맨드 실행
/update-roadmap

# 출력 예시:
현재 미완료 Task 목록:
- Task 004: 프로필 편집 페이지 구현
- Task 005: RLS 정책 테스트
- Task 006: 에러 및 로딩 상태 UI 구현
...

어떤 Task를 완료했나요? (예: 004 또는 004,005): 004

✅ Task 004 완료 체크 완료!
📊 진행 상황: 4/N Tasks 완료 (예: N%)
```
