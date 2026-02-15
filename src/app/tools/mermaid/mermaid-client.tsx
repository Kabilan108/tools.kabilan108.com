'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TuiSelect } from '@/components/tui';

type ThemeColors = {
  bg: string;
  fg: string;
  line?: string;
  accent?: string;
  muted?: string;
  surface?: string;
  border?: string;
};

type RenderFn = (code: string, theme: ThemeColors) => Promise<string>;
type Themes = Record<string, ThemeColors>;

const THEME_LABELS: Record<string, string> = {
  'tokyo-night': 'Tokyo Night',
  'catppuccin-mocha': 'Catppuccin Mocha',
  dracula: 'Dracula',
  nord: 'Nord',
  'github-dark': 'GitHub Dark',
  'one-dark': 'One Dark',
  'solarized-dark': 'Solarized Dark',
  'zinc-dark': 'Zinc Dark',
  'github-light': 'GitHub Light',
  'catppuccin-latte': 'Catppuccin Latte',
  'nord-light': 'Nord Light',
  'tokyo-night-light': 'Tokyo Night Light',
  'solarized-light': 'Solarized Light',
};

const DEFAULT_CODE =
  'graph TD\n  A[User Request] --> B{Authenticated?}\n  B -->|Yes| C[Load Dashboard]\n  B -->|No| D[Login Page]\n  C --> E{Role Check}\n  E -->|Admin| F[Admin Panel]\n  E -->|User| G[User View]\n  D --> H[Enter Credentials]\n  H --> B';

const VALID_HEADERS = [
  /^(graph|flowchart)\s+(td|tb|lr|bt|rl)\s*$/i,
  /^sequencediagram\s*$/i,
  /^classdiagram\s*$/i,
  /^erdiagram\s*$/i,
  /^statediagram(-v2)?\s*$/i,
];

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) =>
        Math.round(Math.max(0, Math.min(255, c)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function mixColors(fg: string, bg: string, pct: number): string {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  const p = pct / 100;
  return rgbToHex(
    f[0] * p + b[0] * (1 - p),
    f[1] * p + b[1] * (1 - p),
    f[2] * p + b[2] * (1 - p),
  );
}

function enrichTheme(t: ThemeColors): ThemeColors {
  return {
    bg: t.bg,
    fg: t.fg,
    line: t.line,
    accent: t.accent,
    muted: t.muted,
    surface: t.surface || mixColors(t.fg, t.bg, 3),
    border: t.border || mixColors(t.fg, t.bg, 20),
  };
}

export default function MermaidClient(): React.ReactElement {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [svgOutput, setSvgOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState('tokyo-night');
  const [status, setStatus] = useState<'idle' | 'valid' | 'error'>('idle');
  const [statusText, setStatusText] = useState('Waiting');
  const [copied, setCopied] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const lastSvgRef = useRef('');
  const renderRef = useRef<RenderFn | null>(null);
  const themesRef = useRef<Themes | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const editorPaneRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('beautiful-mermaid').then((mod) => {
      renderRef.current = mod.renderMermaid;
      themesRef.current = mod.THEMES;
    });
  }, []);

  const renderDiagram = useCallback(async (source: string, theme: string) => {
    const trimmed = source.trim();

    if (!trimmed) {
      setSvgOutput('');
      setError(null);
      setStatus('idle');
      setStatusText('Waiting');
      lastSvgRef.current = '';
      return;
    }

    const firstLine = trimmed.split(/[\n;]/)[0].trim();
    const hasValidHeader = VALID_HEADERS.some((r) => r.test(firstLine));

    if (!hasValidHeader) {
      setStatus('error');
      setStatusText('Invalid header');
      setError(
        'Invalid diagram header. Expected one of: graph TD / flowchart LR, sequenceDiagram, classDiagram, erDiagram, stateDiagram-v2',
      );
      setSvgOutput('');
      lastSvgRef.current = '';
      return;
    }

    if (!renderRef.current || !themesRef.current) return;

    try {
      setStatus('idle');
      setStatusText('Rendering\u2026');
      const themeColors = enrichTheme(
        themesRef.current[theme] ?? themesRef.current['tokyo-night'],
      );
      const svg = await renderRef.current(trimmed, themeColors);
      setSvgOutput(svg);
      setError(null);
      lastSvgRef.current = svg;
      setStatus('valid');
      setStatusText('Rendered');
    } catch (err) {
      setStatus('error');
      setStatusText('Error');
      setSvgOutput('');
      lastSvgRef.current = '';
      setError(err instanceof Error ? err.message : 'Failed to render diagram');
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on mount
  useEffect(() => {
    if (!renderRef.current) {
      const interval = setInterval(() => {
        if (renderRef.current) {
          clearInterval(interval);
          renderDiagram(code, currentTheme);
        }
      }, 50);
      return () => clearInterval(interval);
    }
    renderDiagram(code, currentTheme);
  }, [renderDiagram]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setCode(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        renderDiagram(val, currentTheme);
      }, 400);
    },
    [currentTheme, renderDiagram],
  );

  const handleThemeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const theme = e.target.value;
      setCurrentTheme(theme);
      if (code.trim()) renderDiagram(code, theme);
    },
    [code, renderDiagram],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newVal = `${ta.value.substring(0, start)}  ${ta.value.substring(end)}`;
        setCode(newVal);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          renderDiagram(newVal, currentTheme);
        }, 400);
      }
    },
    [currentTheme, renderDiagram],
  );

  const handleEditorScroll = useCallback(() => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!lastSvgRef.current) return;
    await navigator.clipboard.writeText(lastSvgRef.current);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const handleDownload = useCallback(() => {
    if (!lastSvgRef.current) return;
    const blob = new Blob([lastSvgRef.current], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!mainRef.current || !editorPaneRef.current) return;
      const containerWidth = mainRef.current.offsetWidth;
      const newWidth = Math.max(250, Math.min(e.clientX, containerWidth - 250));
      editorPaneRef.current.style.width = `${newWidth}px`;
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

  const lines = code.split('\n');
  const lineCount = lines.length;
  const hasSvg = svgOutput.length > 0;

  const statusColor =
    status === 'valid'
      ? 'text-success'
      : status === 'error'
        ? 'text-error'
        : 'text-subtle';

  return (
    <div className="flex h-full flex-col overflow-hidden text-foreground">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-focus px-4 py-1.5 text-xs">
        <span className="font-bold text-foreground">MERMAID(1)</span>
        <div className="flex items-center gap-3">
          <TuiSelect value={currentTheme} onChange={handleThemeChange}>
            {Object.entries(THEME_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </TuiSelect>
          <span className={statusColor}>[{statusText}]</span>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden" ref={mainRef}>
        {/* Editor pane */}
        <div
          className="flex min-w-[300px] flex-col border-r border-border-focus"
          style={{ width: '42%' }}
          ref={editorPaneRef}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-1.5 text-xs">
            <span className="text-subtle">── SOURCE ──</span>
            <span className="text-subtle">
              {lineCount} line{lineCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div
              className="w-11 shrink-0 select-none overflow-hidden pr-3 pt-4 text-right text-xs leading-5 text-subtle"
              ref={lineNumbersRef}
            >
              {lines.map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are inherently index-based
                <div key={`ln${i}`} className="h-5 leading-5">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              className="flex-1 resize-none border-none bg-transparent py-4 pr-4 pl-2 text-xs leading-5 text-foreground outline-none"
              style={{ tabSize: 2 }}
              spellCheck={false}
              placeholder={`Paste your Mermaid diagram here...\n\nExamples:\n  graph TD\n    A[Start] --> B{Decision}\n\n  sequenceDiagram\n    Alice->>Bob: Hello!\n\n  classDiagram\n    Animal <|-- Dog`}
              value={code}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onScroll={handleEditorScroll}
            />
          </div>
        </div>

        {/* Resize handle */}
        <hr
          className="relative z-10 w-[5px] shrink-0 cursor-col-resize border-none p-0 -ml-[3px] -mr-[2px] after:absolute after:top-0 after:bottom-0 after:left-[2px] after:w-px after:bg-border-focus after:transition-all after:duration-150 hover:after:w-[2px] hover:after:left-[1.5px] hover:after:bg-accent active:after:w-[2px] active:after:left-[1.5px] active:after:bg-accent"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />

        {/* Preview pane */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-1.5 text-xs">
            <span className="text-subtle">── PREVIEW ──</span>
            <div className="flex gap-2">
              <button
                type="button"
                className={`text-xs transition-colors disabled:opacity-35 ${
                  copied ? 'text-success' : 'text-subtle hover:text-foreground'
                }`}
                disabled={!hasSvg}
                onClick={handleCopy}
              >
                [{copied ? 'copied!' : 'copy'}]
              </button>
              <button
                type="button"
                className="text-xs text-subtle transition-colors hover:text-foreground disabled:opacity-35"
                disabled={!hasSvg}
                onClick={handleDownload}
              >
                [save]
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto bg-surface p-8">
            <div className="max-w-full transition-opacity duration-150 [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:block">
              {error ? (
                <p className="max-w-[480px] text-xs text-error">error: {error}</p>
              ) : svgOutput ? (
                <div
                  className="animate-fade-in"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from our renderer
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              ) : (
                <p className="text-xs text-subtle">(no diagram)</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
