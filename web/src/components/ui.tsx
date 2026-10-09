export type Tone = "neutral" | "accent" | "warn" | "danger" | "success";

const TONES: Record<Tone, string> = {
  neutral: "border-border bg-surface-2 text-muted",
  accent: "border-accent/30 bg-accent-soft text-accent",
  warn: "border-warn/30 bg-warn-soft text-warn",
  danger: "border-danger/30 bg-danger-soft text-danger",
  success: "border-success/30 bg-success-soft text-success",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Card({
  title,
  icon,
  action,
  className = "",
  children,
}: {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center gap-3">
          {icon && (
            <span className="grid size-9 place-items-center rounded-lg border border-border bg-surface-2 text-accent">
              {icon}
            </span>
          )}
          <h2 className="flex-1 font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{children}</p>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
    </div>
  );
}
