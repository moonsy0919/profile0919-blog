"use client";

import { XIcon } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tag } from "@/lib/data";
import { createTag } from "@/lib/data/actions";
import { TAGS_PER_POST_MAX } from "@/lib/validation/constants";
import { normalizeTagName, tagNameSchema } from "@/lib/validation/fields";

type TagPickerProps = {
  /** 서버가 넘긴 선택 후보(전체 태그) */
  tags: Tag[];
  /** 선택된 태그 id 목록 */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** 태그 필드 오류 문구 */
  error?: string;
  disabled?: boolean;
};

const MAX_MESSAGE = `태그는 최대 ${TAGS_PER_POST_MAX}개까지 선택할 수 있습니다`;

/** 이름을 대소문자 구분 없이 비교하려고 정규화한 키를 만든다 */
function nameKey(name: string) {
  return normalizeTagName(name).toLowerCase();
}

/**
 * TagPicker의 상태와 동작을 관리한다.
 * 검색·선택·새 태그 추가(createTag 서버 액션)·키보드 이동을 한곳에서 다룬다.
 */
function useTagPicker({ tags, selectedIds, onChange }: TagPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [created, setCreated] = useState<Tag[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const allTags = [...tags, ...created];
  const selected = selectedIds
    .map((id) => allTags.find((tag) => tag.id === id))
    .filter((tag): tag is Tag => Boolean(tag));
  const key = nameKey(query);
  const matches = allTags.filter(
    (tag) => !selectedIds.includes(tag.id) && nameKey(tag.name).includes(key),
  );
  const exists = allTags.some((tag) => nameKey(tag.name) === key);
  const addable = tagNameSchema.safeParse(query).success && !exists;

  /** 태그를 선택한다. 10개를 넘으면 막고 안내한다 */
  function select(tag: Tag) {
    if (selectedIds.length >= TAGS_PER_POST_MAX) {
      setLocalError(MAX_MESSAGE);
      return;
    }
    setLocalError(null);
    onChange([...selectedIds, tag.id]);
    setQuery("");
    setActiveIndex(-1);
  }

  /** 새 태그를 즉시 등록하고 선택한다. 이미 있는 이름이면 기존 태그를 고른다 */
  async function addNew() {
    if (!addable || adding) return;
    setAdding(true);
    const requested = normalizeTagName(query);
    const result = await createTag(requested);
    setAdding(false);
    if (!result.ok) {
      const message = result.error.fieldErrors?.name ?? result.error.message;
      setLocalError(message);
      return;
    }
    const known = allTags.some((tag) => tag.id === result.data.id);
    // 목록에 없어도 서버가 기존 태그(대소문자만 다른 표기)를 돌려줬다면 새로 만든 것이 아니다
    if (known || result.data.name !== requested) {
      toast.info("이미 있는 태그라서 기존 태그를 선택했습니다");
    }
    if (!known) setCreated((prev) => [...prev, result.data]);
    select(result.data);
  }

  /** ↑↓ 이동, Enter 선택(활성 항목이 없으면 [추가]), Esc 닫기 */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      const count = matches.length;
      if (count > 0) setActiveIndex((prev) => (prev + step + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = matches[activeIndex];
      if (active) select(active);
      else void addNew();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setActiveIndex(-1);
      setOpen(true);
    },
    open,
    setOpen,
    activeIndex,
    selected,
    matches,
    addable,
    adding,
    localError,
    select,
    addNew,
    handleKeyDown,
    remove: (id: string) => {
      setLocalError(null);
      onChange(selectedIds.filter((value) => value !== id));
    },
  };
}

/**
 * 태그 선택 UI. 선택된 태그 칩(× 제거)과 검색 입력, combobox 결과 목록, [추가] 버튼으로 이루어진다.
 * [추가]는 createTag(`add_tag`)로 즉시 등록하므로 글 [저장]을 취소해도 태그는 남는다.
 * @param tags 선택 후보(서버가 조회한 전체 태그)
 * @param selectedIds 선택된 태그 id
 * @param onChange 선택 변경 콜백
 * @param error 필드 오류 문구
 */
export function TagPicker(props: TagPickerProps) {
  const picker = useTagPicker(props);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const errorText = props.error ?? picker.localError;
  const showList = picker.open && picker.matches.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${baseId}-input`}>태그</Label>
      <SelectedTags
        tags={picker.selected}
        disabled={props.disabled}
        onRemove={picker.remove}
      />
      <div className="relative flex gap-2">
        <Input
          id={`${baseId}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            picker.activeIndex >= 0
              ? `${baseId}-option-${picker.activeIndex}`
              : undefined
          }
          aria-invalid={errorText ? true : undefined}
          aria-describedby={errorText ? `${baseId}-error` : undefined}
          autoComplete="off"
          placeholder="태그 검색 또는 새 태그 입력"
          value={picker.query}
          disabled={props.disabled}
          onChange={(event) => picker.setQuery(event.target.value)}
          onFocus={() => picker.setOpen(true)}
          onBlur={() => picker.setOpen(false)}
          onKeyDown={picker.handleKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          disabled={props.disabled || !picker.addable || picker.adding}
          onClick={picker.addNew}
        >
          추가
        </Button>
        {showList ? (
          <TagOptions
            id={listId}
            baseId={baseId}
            matches={picker.matches}
            activeIndex={picker.activeIndex}
            onSelect={picker.select}
          />
        ) : null}
      </div>
      {errorText ? (
        <p
          id={`${baseId}-error`}
          role="alert"
          className="text-sm text-destructive"
        >
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

/** 선택된 태그 칩 목록 */
function SelectedTags({
  tags,
  disabled,
  onRemove,
}: {
  tags: Tag[];
  disabled?: boolean;
  onRemove: (id: string) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="선택한 태그">
      {tags.map((tag) => (
        <li key={tag.id}>
          <Badge variant="secondary" className="gap-1">
            {tag.name}
            <button
              type="button"
              disabled={disabled}
              aria-label={`${tag.name} 태그 제거`}
              className="rounded-full hover:text-destructive"
              onClick={() => onRemove(tag.id)}
            >
              <XIcon className="size-3" aria-hidden="true" />
            </button>
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/** 검색 결과 드롭다운. 마우스로 눌러도 입력창 포커스가 빠지지 않게 mousedown을 막는다 */
function TagOptions({
  id,
  baseId,
  matches,
  activeIndex,
  onSelect,
}: {
  id: string;
  baseId: string;
  matches: Tag[];
  activeIndex: number;
  onSelect: (tag: Tag) => void;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute top-full left-0 z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-md"
    >
      {matches.map((tag, index) => (
        <li
          key={tag.id}
          id={`${baseId}-option-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          className="cursor-pointer rounded-md px-2 py-1.5 text-sm aria-selected:bg-muted"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(tag)}
        >
          {tag.name}
        </li>
      ))}
    </ul>
  );
}
