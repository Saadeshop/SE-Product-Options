import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

// ── CSS property list ────────────────────────────────────────────────────────
const CSS_PROPERTIES = [
  "align-content", "align-items", "align-self",
  "animation", "animation-delay", "animation-direction", "animation-duration",
  "animation-fill-mode", "animation-iteration-count", "animation-name",
  "animation-play-state", "animation-timing-function",
  "backdrop-filter", "background", "background-attachment", "background-clip",
  "background-color", "background-image", "background-origin",
  "background-position", "background-repeat", "background-size",
  "border", "border-bottom", "border-bottom-color", "border-bottom-left-radius",
  "border-bottom-right-radius", "border-bottom-style", "border-bottom-width",
  "border-collapse", "border-color",
  "border-left", "border-left-color", "border-left-style", "border-left-width",
  "border-radius", "border-right", "border-right-color", "border-right-style",
  "border-right-width", "border-spacing", "border-style",
  "border-top", "border-top-color", "border-top-left-radius",
  "border-top-right-radius", "border-top-style", "border-top-width",
  "border-width", "bottom", "box-shadow", "box-sizing",
  "clip-path", "color", "column-gap", "content", "cursor",
  "display", "filter", "flex", "flex-basis", "flex-direction",
  "flex-flow", "flex-grow", "flex-shrink", "flex-wrap",
  "float", "font", "font-family", "font-size", "font-style",
  "font-variant", "font-weight",
  "gap", "grid", "grid-area", "grid-column", "grid-row",
  "grid-template", "grid-template-areas", "grid-template-columns", "grid-template-rows",
  "height", "justify-content", "justify-items", "justify-self",
  "left", "letter-spacing", "line-height", "list-style",
  "margin", "margin-bottom", "margin-left", "margin-right", "margin-top",
  "max-height", "max-width", "min-height", "min-width",
  "object-fit", "object-position", "opacity", "order", "outline",
  "outline-color", "outline-offset", "outline-style", "outline-width",
  "overflow", "overflow-x", "overflow-y",
  "padding", "padding-bottom", "padding-left", "padding-right", "padding-top",
  "pointer-events", "position",
  "right", "row-gap",
  "text-align", "text-decoration", "text-overflow", "text-shadow",
  "text-transform", "top", "transform", "transform-origin",
  "transition", "transition-delay", "transition-duration",
  "transition-property", "transition-timing-function",
  "vertical-align", "visibility",
  "white-space", "width", "word-break", "word-spacing",
  "z-index",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

interface TypingCtx {
  word: string;
  wordStart: number;
}

/** Returns the partial word being typed if we're in a CSS property name position. */
function getTypingContext(text: string, cursor: number): TypingCtx | null {
  const before = text.slice(0, cursor);
  const lineStart = before.lastIndexOf("\n") + 1;
  const currentLine = before.slice(lineStart);

  // If there's a colon before the cursor on this line we're in "value" position
  if (currentLine.includes(":")) return null;

  // Extract the current word (letters + hyphens), must be ≥2 chars to show suggestions
  const m = currentLine.match(/([\w-]+)$/);
  if (!m || m[1].length < 2) return null;

  return { word: m[1], wordStart: cursor - m[1].length };
}

/** Pretty prints CSS string with correct block indenting and spacings. */
export function formatCss(css: string): string {
  if (!css) return "";
  const tokens = css.split(/(\/\*[\s\S]*?\*\/|[\{\};])/g);
  let depth = 0;
  let result = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === undefined) continue;

    if (token.startsWith("/*") && token.endsWith("*/")) {
      const trimmedComment = token.trim();
      if (trimmedComment) {
        result = result.trimEnd();
        result += "\n" + "  ".repeat(depth) + trimmedComment + "\n" + "  ".repeat(depth);
      }
    } else if (token === "{") {
      result = result.trimEnd() + " {\n";
      depth++;
      result += "  ".repeat(depth);
    } else if (token === "}") {
      depth = Math.max(0, depth - 1);
      result = result.trimEnd();
      if (result.endsWith("\n" + "  ".repeat(depth + 1))) {
        result = result.slice(0, -(depth + 1) * 2);
      }
      result += "\n" + "  ".repeat(depth) + "}\n\n" + "  ".repeat(depth);
    } else if (token === ";") {
      result = result.trimEnd() + ";\n" + "  ".repeat(depth);
    } else {
      const trimmed = token.trim();
      if (!trimmed) continue;

      const lines = trimmed.split("\n");
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim();
        if (!line) continue;

        if (line.includes(":") && depth > 0 && !line.startsWith("@")) {
          const colonIdx = line.indexOf(":");
          const prop = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          result += `${prop}: ${val}`;
        } else {
          result += line;
        }
      }
    }
  }

  return result
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/\n\s*$/g, "")
    .trim();
}

// ── Component ────────────────────────────────────────────────────────────────

export interface CssEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CssEditor({ value, onChange }: CssEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [ctx, setCtx] = useState<TypingCtx | null>(null);

  // ── sync line-number scroll with textarea ──────────────────────────────────
  const handleScroll = () => {
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // ── derive suggestions from current cursor position ───────────────────────
  const computeSuggestions = useCallback((text: string, cursor: number) => {
    const typing = getTypingContext(text, cursor);
    if (!typing) {
      setSuggestions([]);
      setCtx(null);
      return;
    }
    const matches = CSS_PROPERTIES
      .filter((p) => p.startsWith(typing.word.toLowerCase()))
      .slice(0, 8);
    setSuggestions(matches);
    setSelectedIdx(0);
    setCtx(typing);
  }, []);

  // ── apply a chosen suggestion ─────────────────────────────────────────────
  const applySuggestion = useCallback(
    (suggestion: string) => {
      const ta = textareaRef.current;
      if (!ta || !ctx) return;
      const cursor = ta.selectionStart;
      const next =
        value.slice(0, ctx.wordStart) +
        suggestion +
        ": " +
        value.slice(cursor);
      onChange(next);
      setSuggestions([]);
      setCtx(null);
      const newCursor = ctx.wordStart + suggestion.length + 2;
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(newCursor, newCursor);
      });
    },
    [value, onChange, ctx]
  );

  // ── format CSS handler ──────────────────────────────────────────────────
  const handleFormat = useCallback(() => {
    const formatted = formatCss(value);
    onChange(formatted);
  }, [value, onChange]);

  // ── keyboard handler ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIdx((i) => (i + 1) % suggestions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
          return;
        }
        if ((e.key === "Enter" || e.key === "Tab") && suggestions[selectedIdx]) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIdx]);
          return;
        }
        if (e.key === "Escape") {
          setSuggestions([]);
          setCtx(null);
          return;
        }
      }

      // Tab → 2-space indent when no dropdown open
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = value.slice(0, start) + "  " + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => ta.setSelectionRange(start + 2, start + 2));
      }
    },
    [suggestions, selectedIdx, applySuggestion, value, onChange]
  );

  // ── textarea change ───────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      computeSuggestions(e.target.value, e.target.selectionStart);
    },
    [onChange, computeSuggestions]
  );

  // ── cursor move (click / key nav) ─────────────────────────────────────────
  const handleCursorMove = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    computeSuggestions(ta.value, ta.selectionStart);
  }, [computeSuggestions]);

  // ── key release (avoid resetting dropdown state on selection keys) ────────
  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (suggestions.length > 0 && ["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(e.key)) {
        return;
      }
      const ta = textareaRef.current;
      if (!ta) return;
      computeSuggestions(ta.value, ta.selectionStart);
    },
    [suggestions, computeSuggestions]
  );

  // ── close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
        setCtx(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const lines = (value || "").split("\n");

  return (
    <>
      <style>{`
        .se-css-editor-ta {
          width:100%;border:none !important;background:transparent !important;
          color:#e6edf3;padding:12px;line-height:1.6;outline:none;
          white-space:pre;overflow-wrap:normal;overflow-x:auto;
          font-family:inherit;font-size:inherit;margin:0;display:block;
          resize:none;scrollbar-width:thin;
        }
        .se-css-editor-ta::placeholder { color:#3d4450; }
        .se-css-editor-ta::-webkit-scrollbar { width:8px;height:8px; }
        .se-css-editor-ta::-webkit-scrollbar-thumb { background:#30363d;border-radius:10px; }
        .se-css-suggestion-item { transition: background 0.1s; }
        .se-css-suggestion-item:hover { background:#2d333b !important; }
      `}</style>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={handleFormat}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "#21262d",
            color: "#c9d1d9",
            border: "1px solid #30363d",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: "sans-serif",
            zIndex: 10,
            transition: "background 0.1s, color 0.1s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#30363d";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#21262d";
            e.currentTarget.style.color = "#c9d1d9";
          }}
        >
          Format CSS
        </button>
        {/* ── editor shell ─────────────────────────────── */}
        <div
          style={{
            display: "flex",
            background: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: "10px",
            height: "320px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "13px",
            overflow: "hidden",
          }}
        >
          {/* line numbers */}
          <div
            ref={lineNumRef}
            style={{
              padding: "12px 10px",
              background: "#161b22",
              color: "#484f58",
              textAlign: "right",
              minWidth: "40px",
              userSelect: "none",
              borderRight: "1px solid #30363d",
              lineHeight: "1.6",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* textarea */}
          <textarea
            ref={textareaRef}
            spellCheck={false}
            className="se-css-editor-ta"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onClick={handleCursorMove}
            onFocus={handleCursorMove}
            onKeyUp={handleKeyUp}
          />
        </div>

        {/* ── autocomplete dropdown ─────────────────────── */}
        {suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: "48px",
              background: "#1c2128",
              border: "1px solid #30363d",
              borderRadius: "8px",
              overflow: "hidden",
              zIndex: 1000,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              minWidth: "220px",
            }}
          >
            {/* header */}
            <div
              style={{
                padding: "5px 10px",
                fontSize: "10px",
                color: "#484f58",
                borderBottom: "1px solid #30363d",
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.02em",
              }}
            >
              CSS properties · ↑↓ navigate · ↵ / Tab select · Esc dismiss
            </div>

            {suggestions.map((s, i) => (
              <div
                key={s}
                className="se-css-suggestion-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySuggestion(s);
                }}
                style={{
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "12px",
                  color: i === selectedIdx ? "#ffffff" : "#79c0ff",
                  background: i === selectedIdx ? "#2d333b" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#7ee787", fontSize: "9px" }}>⬥</span>
                {/* bold-highlight the matching prefix */}
                <span>
                  <span style={{ fontWeight: 700, color: i === selectedIdx ? "#fff" : "#e6edf3" }}>
                    {s.slice(0, ctx?.word.length ?? 0)}
                  </span>
                  <span style={{ opacity: 0.7 }}>{s.slice(ctx?.word.length ?? 0)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
