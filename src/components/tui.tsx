import Link from 'next/link';

export function Prompt({ command }: { command?: string }): React.ReactElement {
  return (
    <span>
      <span className="font-bold text-success">kabilan@tools</span>
      <span className="text-subtle">:</span>
      <span className="font-bold text-info">~</span>
      <span className="text-foreground">$ {command}</span>
    </span>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mt-3">
      <div className="font-bold text-foreground">{heading}</div>
      <div className="mt-0.5 ml-[5ch]">{children}</div>
    </div>
  );
}

export function ManHeader({
  left,
  center,
  right,
}: {
  left: string;
  center: string;
  right: string;
}): React.ReactElement {
  return (
    <div className="flex justify-between font-bold text-foreground">
      <span>{left}</span>
      <span>{center}</span>
      <span>{right}</span>
    </div>
  );
}

export function TuiButton({
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.ReactElement {
  return (
    <button
      type="button"
      className="border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-border-focus hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function TuiInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  return (
    <input
      className={`w-full border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-border-focus ${className ?? ''}`}
      {...props}
    />
  );
}

export function TuiTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>): React.ReactElement {
  return (
    <textarea
      className={`w-full border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-border-focus ${className ?? ''}`}
      {...props}
    />
  );
}

export function TuiSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>): React.ReactElement {
  return (
    <select
      className={`cursor-pointer border border-border bg-transparent px-2 py-1 text-xs font-medium text-muted outline-none transition-colors hover:border-border-focus focus:border-accent ${className ?? ''}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function TuiStatus({
  type,
  message,
}: {
  type: 'info' | 'success' | 'error';
  message: string;
}): React.ReactElement {
  const colors = {
    info: 'text-info',
    success: 'text-success',
    error: 'text-error',
  };
  return (
    <div className={`text-sm ${colors[type]}`}>
      <span className="text-subtle">&gt;&gt; </span>
      {message}
    </div>
  );
}

export function TuiBackLink(): React.ReactElement {
  return (
    <Link
      href="/"
      className="text-sm text-muted transition-colors hover:text-foreground"
    >
      <span className="text-subtle">$ </span>
      <span>cd ..</span>
    </Link>
  );
}
