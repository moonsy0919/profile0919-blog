/**
 * 구현 전 라우트의 빈 화면. 제목과 안내 문구만 보여 준다.
 * @param title 페이지 제목(h1)
 * @param description 보조 설명 (선택)
 */
export function PlaceholderPage({
  title,
  description = "준비 중인 화면입니다.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4 text-muted-foreground">{description}</p>
    </div>
  );
}
