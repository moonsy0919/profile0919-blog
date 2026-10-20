"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  /** 오류 안내에 쓰는 영역 이름 (예: "게시글") */
  label: string;
  children: ReactNode;
};

type State = { failed: boolean };

/**
 * 페이지의 한 영역에서 난 오류를 그 영역 안에서만 처리하는 경계.
 * 다른 영역은 그대로 보이고, [다시 시도]를 누르면 영역을 다시 그린다.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  /** 하위 렌더링 오류가 나면 실패 상태로 전환한다 */
  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  /** 오류를 콘솔에 남긴다. 오류 수집 서비스를 연동한다면 이곳에서 전송한다 */
  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-12 text-center"
      >
        <p className="text-muted-foreground">
          {this.props.label}을(를) 불러오지 못했습니다
        </p>
        <Button
          variant="outline"
          onClick={() => this.setState({ failed: false })}
        >
          다시 시도
        </Button>
      </div>
    );
  }
}
