import type { ZodError } from "zod";

/**
 * Zod 오류를 필드별 첫 메시지로 바꾼다. ActionError.fieldErrors와 같은 모양이다.
 * 배열 항목 오류(tagIds[3])는 최상위 필드(tagIds)로 모으고, 필드가 없는 오류는 건너뛴다.
 * @param error safeParse가 돌려준 ZodError
 */
export function zodErrorToFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === undefined) continue;
    const key = String(field);
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
