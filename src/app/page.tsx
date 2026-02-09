import { ToolCard } from '@/components/tool-card';
import { tools } from '@/lib/tools';

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
      <p className="mt-2 text-muted">A collection of useful tools</p>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
}
