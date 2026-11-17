# 관리자 로그인 운영 절차

관리자 로그인의 IP 차단·신뢰 IP·이메일 인증을 운영할 때 쓰는 절차입니다. 설계는 PRD 3.2·3.3, 구현은 `src/lib/auth/`를 참고하세요.

모든 SQL은 **Supabase 대시보드 > SQL Editor**에서 실행합니다(Table Editor에서 행을 직접 삭제해도 됩니다). 아래 테이블은 서비스 키 전용이라 앱 화면에서는 다루지 않습니다.

## 1. 본인 IP가 차단됐을 때 (가장 먼저 볼 항목)

비밀번호를 5번 연속 틀리면 그 IP가 차단되고 자동으로 풀리지 않습니다. 신뢰 IP라도 차단이 우선합니다. 관리자 이메일로 차단 알림이 옵니다.

1. 차단된 IP 확인

   ```sql
   select ip, consecutive_failures, blocked_at
   from public.admin_ip_attempts
   where blocked_at is not null
   order by blocked_at desc;
   ```

2. 본인 IP 행 삭제(해제). 본인 IP가 아닌 행은 지우지 마세요.

   ```sql
   delete from public.admin_ip_attempts where ip = '여기에_IP';
   ```

- 로컬 개발 서버의 IP는 `0:0:0:0::/64`(IPv6 루프백)로 기록됩니다.
- IPv6는 /64 접두사(`2001:db8:1:2::/64`)로 묶여 저장됩니다.

## 2. 신뢰 IP 확인·삭제

```sql
-- 목록
select ip, created_at, last_used_at from public.admin_trusted_ips order by last_used_at desc;

-- 한 개 삭제 (그 IP에서는 다음 로그인부터 이메일 인증을 다시 요구)
delete from public.admin_trusted_ips where ip = '여기에_IP';

-- 전부 초기화
delete from public.admin_trusted_ips;
```

신뢰 IP는 90일간 쓰지 않으면 자동으로 만료됩니다.

## 3. 모든 관리자 세션 강제 종료

비밀번호 유출이 의심될 때: 비밀번호를 대시보드(Authentication > Users)에서 바꾸고, 세션을 모두 지우고, 신뢰 IP도 초기화하세요. `admin_verified_sessions`는 세션 삭제와 함께 지워집니다.

```sql
delete from auth.sessions
where user_id = (select user_id from public.admin_allowlist limit 1);
delete from public.admin_trusted_ips;
```

## 4. 이메일·Resend 장애로 새 IP에서 로그인할 수 없을 때 (비상 복구)

- 이미 신뢰 IP로 등록된 IP에서는 메일 없이 로그인되므로 평소 쓰던 환경은 영향이 없습니다.
- 새 IP에서 급히 로그인해야 하면 그 IP를 직접 신뢰 IP로 등록합니다. 로그인을 한 번 시도하면 시도한 IP가 인증 코드 기록에 남습니다.

  ```sql
  -- 최근에 시도한 IP 확인
  select ip, created_at from public.admin_login_challenges order by created_at desc limit 3;

  -- 신뢰 IP로 직접 등록
  insert into public.admin_trusted_ips (user_id, ip)
  values ((select user_id from public.admin_allowlist limit 1), '여기에_IP')
  on conflict do nothing;
  ```

- 그다음 다시 로그인하면 코드 없이 로그인됩니다. 장애가 풀린 뒤 필요 없으면 위 2번 절차로 삭제하세요.

## 5. 승인 기능 자체를 끄고 되돌려야 할 때

`is_admin()`을 이전 정의(허용 목록만 확인)로 복원하는 SQL이 `supabase/migrations/20261117152131_is_admin_require_verified_session.sql` 상단 주석에 있습니다. 복원하면 승인 전 세션도 관리자로 인정되므로 임시 조치로만 쓰고, 해결 후 다시 적용하세요.

## 6. 키가 유출됐을 때

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 대시보드 Settings > API Keys에서 재발급 → Vercel·`.env.local` 값 교체 → 재배포. 서비스 키로 해시한 인증 코드는 10분짜리라 교체 시 진행 중이던 코드만 무효가 됩니다.
- `RESEND_API_KEY`: Resend에서 키를 삭제하고 새로 발급 → Vercel·`.env.local` 교체 → 재배포.

## 7. 설정 값 요약

| 항목           | 값                                                                  |
| -------------- | ------------------------------------------------------------------- |
| 연속 실패 차단 | 5회, 수동 해제                                                      |
| 인증 코드      | 8자리, 10분, 1회용, 5회 오입력 시 폐기, 재발송 60초 간격·시간당 5회 |
| 신뢰 IP        | 90일 미사용 시 만료                                                 |
| 승인된 세션    | 30일                                                                |
| 차단 알림 메일 | 시간당 5통 초과 시 보내지 않음                                      |

값은 `src/lib/auth/constants.ts`에 있습니다.
