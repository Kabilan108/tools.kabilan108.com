import Link from 'next/link';
import type { ToolDefinition } from '@/lib/tools';

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group block rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{tool.icon}</span>
        <h2 className="text-lg font-semibold">
          {tool.name}
          {tool.requiresAuth && (
            <span className="ml-2 text-sm text-muted" title="Requires sign-in">
              🔒
            </span>
          )}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{tool.description}</p>
      <div className="mt-4 flex gap-2">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
