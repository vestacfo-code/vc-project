#!/usr/bin/env python3
"""Fix serve(sentryServe(..., async ...)) and Deno.serve(sentryServe(...)) closing: use })); not }); or })."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "supabase" / "functions"


def uses_handler_form(text: str) -> bool:
    return bool(
        re.search(r"serve\s*\(\s*sentryServe\s*\([^,]+,\s*handler\s*\)", text)
        or re.search(
            r"Deno\.serve\s*\(\s*sentryServe\s*\([^,]+,\s*handler\s*\)", text
        )
    )


def needs_sentry_fix(text: str) -> bool:
    if "sentryServe(" not in text:
        return False
    if uses_handler_form(text):
        return False
    if not (
        re.search(r"serve\s*\(\s*sentryServe\s*\([^,]+,\s*async\s*\(", text)
        or re.search(
            r"Deno\.serve\s*\(\s*sentryServe\s*\([^,]+,\s*async\s*\(", text
        )
    ):
        return False
    return True


def _next_meaningful_line(lines: list[str], start: int) -> tuple[str | None, int]:
    j = start
    while j < len(lines):
        s = lines[j].strip()
        if not s:
            j += 1
            continue
        if s.startswith("//"):
            j += 1
            continue
        if s.startswith("/*"):
            j += 1
            continue
        return s, j
    return None, start


def fix_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if not needs_sentry_fix(text):
        return False

    lines = text.split("\n")
    changed = False
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped in ("});", "})"):
            nxt, _ = _next_meaningful_line(lines, i + 1)
            if nxt and (
                nxt.startswith(("async function ", "function ", "class "))
            ):
                if stripped == "});":
                    lines[i] = lines[i].replace("});", "}));", 1)
                else:
                    lines[i] = lines[i].replace("})", "}));", 1)
                changed = True
        i += 1

    new_text = "\n".join(lines)
    tail_ws = new_text[len(new_text.rstrip()) :]
    t = new_text.rstrip()
    if t.endswith("});") and not t.endswith("}));"):
        new_text = t[:-3] + "}));" + tail_ws
        changed = True
    elif (
        t.endswith("})")
        and not t.endswith("}))")
        and not t.endswith("}));")
        and "serve(sentryServe" in t
    ):
        new_text = t[:-2] + "}));" + tail_ws
        changed = True

    if changed and new_text != text:
        path.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> int:
    fixed = []
    for index in sorted(ROOT.glob("*/index.ts")):
        if index.parent.name.startswith("_"):
            continue
        try:
            if fix_file(index):
                fixed.append(str(index.relative_to(ROOT.parent.parent)))
        except OSError as e:
            print(e, file=sys.stderr)
            return 1
    for p in fixed:
        print(p)
    print(f"Fixed {len(fixed)} files.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
