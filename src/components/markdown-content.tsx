import { type ComponentProps, createElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

/** 외부 링크(http/https)인지 판정한다 */
function isExternalHref(href?: string): boolean {
  return Boolean(href && /^https?:\/\//i.test(href));
}

/** react-markdown이 모든 요소 컴포넌트에 넘기는 AST 노드 prop */
type WithNode<T> = T & { node?: unknown };

/**
 * node prop을 걸러낸 나머지 props만 돌려준다.
 * node를 DOM 요소에 그대로 펼치면 node="[object Object]" 속성이 생긴다.
 * @param props react-markdown이 넘긴 props
 */
function omitNode<P extends { node?: unknown }>(props: P): Omit<P, "node"> {
  const { node, ...rest } = props;
  void node;
  return rest;
}

/**
 * 클래스를 붙인 요소 컴포넌트를 만든다. tag로 실제 렌더할 요소를 정한다.
 * @param tag 렌더할 HTML 요소 이름
 * @param className 붙일 Tailwind 클래스
 */
function styled<T extends keyof React.JSX.IntrinsicElements>(
  tag: T,
  className: string,
) {
  return function StyledElement(props: WithNode<ComponentProps<T>>) {
    return createElement(tag, { className, ...omitNode(props) });
  };
}

/** 링크: 외부 주소는 새 탭에서 열고 noopener noreferrer를 붙인다 */
function MarkdownLink(props: WithNode<ComponentProps<"a">>) {
  const { href, ...rest } = omitNode(props);
  return (
    <a
      href={href}
      className="text-primary underline underline-offset-4"
      {...(isExternalHref(href) && {
        target: "_blank",
        rel: "noopener noreferrer",
      })}
      {...rest}
    />
  );
}

/** 표: 가로로 넘치면 표 안에서만 스크롤되도록 감싼다 */
function MarkdownTable(props: WithNode<ComponentProps<"table">>) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...omitNode(props)} />
    </div>
  );
}

/**
 * 마크다운 요소별 스타일(typography 플러그인이 없어 직접 지정).
 * 페이지 제목이 이미 h1이므로 본문의 # 제목은 h1 모양의 h2로 낮춰 그린다.
 */
const components: Components = {
  h1: styled("h2", "mt-8 mb-4 text-3xl font-bold"),
  h2: styled("h2", "mt-8 mb-3 text-2xl font-semibold"),
  h3: styled("h3", "mt-6 mb-2 text-xl font-semibold"),
  p: styled("p", "my-4 leading-7"),
  ul: styled("ul", "my-4 list-disc pl-6"),
  ol: styled("ol", "my-4 list-decimal pl-6"),
  blockquote: styled(
    "blockquote",
    "my-4 border-l-4 border-border pl-4 text-muted-foreground",
  ),
  pre: styled("pre", "my-4 overflow-x-auto rounded-md bg-muted p-4 text-sm"),
  code: styled("code", "rounded bg-muted px-1 py-0.5 text-sm"),
  table: MarkdownTable,
  th: styled("th", "border border-border px-3 py-2 text-left"),
  td: styled("td", "border border-border px-3 py-2"),
  a: MarkdownLink,
};

/**
 * 마크다운 본문을 렌더링한다.
 * rehype-raw를 쓰지 않으므로 원시 HTML은 해석되지 않고 텍스트로만 출력된다.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
