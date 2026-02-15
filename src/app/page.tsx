import Link from 'next/link';
import { Prompt, Section } from '@/components/tui';
import { type ToolDefinition, tools } from '@/lib/tools';

const ASCII_BANNER = `████████╗ ██████╗  ██████╗ ██╗     ███████╗
╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
   ██║   ██║   ██║██║   ██║██║     ███████╗
   ██║   ██║   ██║██║   ██║██║     ╚════██║
   ██║   ╚██████╔╝╚██████╔╝███████╗███████║
   ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`;

function ToolEntry({ tool }: { tool: ToolDefinition }): React.ReactElement {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="-mx-1 block px-1 py-1 transition-colors hover:bg-surface"
    >
      <div>
        <span className="font-bold text-info">{tool.slug}</span>
        <span className="text-muted">
          {'  '}({tool.name})
        </span>
      </div>
      <div className="mt-0.5 ml-[5ch] text-muted">{tool.description}</div>
      <div className="ml-[5ch] text-subtle">
        [{tool.tags.join(', ')}]
        {tool.requiresAuth && <span className="text-warning"> [requires auth]</span>}
      </div>
    </Link>
  );
}

export default function Home(): React.ReactElement {
  return (
    <div className="flex h-full flex-col px-5 py-4 text-sm leading-relaxed">
      <p className="text-subtle">Last login: Wed Feb 12 14:23:01 2026 on ttys001</p>

      <pre className="mt-3 text-xs leading-[1.1] text-accent">{ASCII_BANNER}</pre>

      <div className="mt-4">
        <Prompt command="man tools" />
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <Section heading="NAME">
          <p>
            <span className="font-bold text-foreground">tools</span>
            <span className="text-muted"> — a collection of useful tools</span>
          </p>
        </Section>

        <Section heading="DESCRIPTION">
          <p className="text-muted">
            A curated set of web-based tools for developers and tinkerers. Navigate to
            any tool below to get started.
          </p>
        </Section>

        <Section heading="TOOLS">
          <div className="space-y-3">
            {tools.map((tool) => (
              <ToolEntry key={tool.slug} tool={tool} />
            ))}
          </div>
        </Section>
      </div>

      <div className="mt-auto pt-4">
        <Prompt />
        <span className="cursor-blink text-success">█</span>
      </div>
    </div>
  );
}
