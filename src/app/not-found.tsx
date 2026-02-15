import Link from 'next/link';
import { Prompt } from '@/components/tui';

export default function NotFound(): React.ReactElement {
  return (
    <div className="px-5 py-4 text-sm leading-relaxed">
      <div>
        <Prompt command="goto page" />
      </div>
      <p className="mt-2 text-error">bash: page: command not found</p>
      <p className="mt-3 text-muted">
        Try &apos;man tools&apos; for available commands.
      </p>
      <div className="mt-4">
        <Prompt />
        <Link href="/" className="text-info transition-colors hover:text-foreground">
          cd ~
        </Link>
      </div>
    </div>
  );
}
