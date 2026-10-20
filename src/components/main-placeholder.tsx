/** 메인 페이지의 임시 화면. 더미 게이트가 닫힌 프로덕션에서 실데이터 연결(Task 018·019) 전까지 보여준다. */
export function MainPlaceholder() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">메인</h1>
      <p className="mt-4 text-muted-foreground">
        로그인 후 보여줄 메인 화면이 들어올 자리입니다.
      </p>
    </div>
  );
}
