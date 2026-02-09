'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './mermaid.module.css';

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </div>
          <h1>Mermaid Editor</h1>
        </div>
        <div className={styles.headerRight}>
          <select
            className={styles.themeSelect}
            value={currentTheme}
            onChange={handleThemeChange}
          >
            {Object.entries(THEME_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <div className={`${styles.statusPill} ${styles[status]}`}>
            <span className={styles.statusDot} />
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      <div className={styles.main} ref={mainRef}>
        <div className={styles.editorPane} ref={editorPaneRef}>
          <div className={styles.paneHeader}>
            <span className={styles.paneTitle}>Source</span>
            <span className={styles.lineCount}>
              {lineCount} line{lineCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles.editorWrap}>
            <div className={styles.lineNumbers} ref={lineNumbersRef}>
              {lines.map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are inherently index-based
                <div key={`ln${i}`}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              className={styles.editor}
              spellCheck={false}
              placeholder={`Paste your Mermaid diagram here...\n\nExamples:\n  graph TD\n    A[Start] --> B{Decision}\n\n  sequenceDiagram\n    Alice->>Bob: Hello!\n\n  classDiagram\n    Animal <|-- Dog`}
              value={code}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onScroll={handleEditorScroll}
            />
          </div>
        </div>

        <hr
          className={styles.resizeHandle}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />

        <div className={styles.previewPane}>
          <div className={styles.paneHeader}>
            <span className={styles.paneTitle}>Preview</span>
            <div className={styles.previewActions}>
              <button
                type="button"
                className={`${styles.actionBtn} ${copied ? styles.copied : ''}`}
                disabled={!hasSvg}
                onClick={handleCopy}
                title="Copy SVG"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>{copied ? 'Copied!' : 'Copy SVG'}</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                disabled={!hasSvg}
                onClick={handleDownload}
                title="Download SVG"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className={styles.previewWrap}>
            <div className={styles.preview}>
              {error ? (
                <div className={styles.errorDisplay}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <p>{error}</p>
                </div>
              ) : svgOutput ? (
                <div
                  className={styles.rendered}
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from our renderer
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              ) : (
                <div className={styles.placeholder}>
                  <div className={styles.placeholderIcon}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 3v18" />
                    </svg>
                  </div>
                  <p>Type or paste Mermaid syntax to see your diagram rendered live</p>
                  <span className={styles.hint}>
                    Supports flowcharts, sequence, class, ER &amp; state diagrams
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
