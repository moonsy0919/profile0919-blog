import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("조건부 클래스를 합친다", () => {
    expect(cn("px-2", false && "hidden", "text-sm")).toBe("px-2 text-sm");
  });

  it("충돌하는 Tailwind 클래스는 뒤의 값으로 덮어쓴다", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
