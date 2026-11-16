"use client";

import { MarkdownContent } from "@/components/markdown-content";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type MarkdownEditorProps = {
  /** 입력과 라벨을 잇는 id (오류 문구 id의 바탕이 된다) */
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** 본문 필드 오류 문구 */
  error?: string;
  disabled?: boolean;
};

/**
 * 마크다운 본문 에디터. [작성]/[미리보기] 탭으로 전환한다.
 * 미리보기는 상세와 같은 MarkdownContent로 그려 저장 후 모양과 맞춘다.
 * @param id 입력 id
 * @param value 현재 본문
 * @param onChange 본문 변경 콜백
 * @param error 필드 오류 문구 (없으면 표시하지 않음)
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  error,
  disabled,
}: MarkdownEditorProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>본문</Label>
      <Tabs defaultValue="write">
        <TabsList>
          <TabsTrigger value="write">작성</TabsTrigger>
          <TabsTrigger value="preview">미리보기</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <Textarea
            id={id}
            value={value}
            disabled={disabled}
            rows={14}
            placeholder="마크다운으로 본문을 작성하세요"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="min-h-64 font-mono"
            onChange={(event) => onChange(event.target.value)}
          />
        </TabsContent>
        <TabsContent
          value="preview"
          className="min-h-64 rounded-lg border border-input p-4"
        >
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-muted-foreground">미리볼 내용이 없습니다</p>
          )}
        </TabsContent>
      </Tabs>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
