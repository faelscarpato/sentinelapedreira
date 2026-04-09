import { type ElementType, type ReactNode } from "react";
import { AlertCircle, CircleCheck, Info, Loader2 } from "lucide-react";
import { cn } from "../ui/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

interface PageHeroProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  icon?: ElementType;
  actions?: ReactNode;
  className?: string;
}

export function PageHero({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("border-b border-slate-200/80 bg-slate-50/70 py-10", className)}>
      <PageContainer>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            {eyebrow && (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {eyebrow}
              </p>
            )}
            <div className="flex items-start gap-3">
              {Icon ? (
                <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
              ) : null}
              <div>
                <h1 className="font-headline text-3xl font-black tracking-tight text-slate-950 md:text-5xl md:leading-tight">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">{description}</p>
                ) : null}
              </div>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </PageContainer>
    </section>
  );
}

interface SectionBlockProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({ title, description, actions, children, className }: SectionBlockProps) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6", className)}>
      {(title || description || actions) && (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? <h2 className="font-headline text-xl font-bold tracking-tight text-slate-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

interface InlineStatusProps {
  kind?: "info" | "success" | "warning" | "error";
  children: ReactNode;
  className?: string;
}

const inlineStatusStyles: Record<NonNullable<InlineStatusProps["kind"]>, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function InlineStatus({ kind = "info", children, className }: InlineStatusProps) {
  return (
    <div className={cn("rounded-xl border p-3 text-sm", inlineStatusStyles[kind], className)}>{children}</div>
  );
}

interface PageStateProps {
  mode: "loading" | "empty" | "error";
  title: string;
  description?: string;
  className?: string;
}

export function PageState({ mode, title, description, className }: PageStateProps) {
  const iconMap: Record<PageStateProps["mode"], ElementType> = {
    loading: Loader2,
    empty: Info,
    error: AlertCircle,
  };

  const Icon = iconMap[mode];

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center", className)}>
      <Icon className={cn("mx-auto mb-3 h-9 w-9 text-slate-400", mode === "loading" ? "animate-spin" : "")} />
      <p className="font-headline text-lg font-bold tracking-tight text-slate-900">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

interface StatKpiProps {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  className?: string;
}

export function StatKpi({ label, value, trend, className }: StatKpiProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 font-headline text-2xl font-black tracking-tight text-slate-950">{value}</p>
      {trend ? <p className="mt-2 text-xs font-semibold text-slate-600">{trend}</p> : null}
    </div>
  );
}

interface SectionHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeading({ title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-5", className)}>
      <h2 className="font-headline text-2xl font-black tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

interface AuthBadgeProps {
  text: string;
  className?: string;
}

export function AuthBadge({ text, className }: AuthBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white",
        className,
      )}
    >
      <CircleCheck className="h-3 w-3" />
      {text}
    </span>
  );
}
