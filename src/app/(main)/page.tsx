/** 메인 페이지. 로그인 성공 후 보여줄 화면의 임시 자리 표시자. */
export default function Home() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">메인</h1>
      <p className="mt-4 text-muted-foreground">
        로그인 후 보여줄 메인 화면이 들어올 자리입니다.
      </p>
    </div>
  );
}
