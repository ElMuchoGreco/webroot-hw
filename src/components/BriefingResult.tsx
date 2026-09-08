import type { ArticleBriefing } from "@/lib/briefing/schema";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TagList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm italic text-foreground/50">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/80 dark:border-white/15"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm italic text-foreground/50">{emptyLabel}</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function BriefingResult({ briefing }: { briefing: ArticleBriefing }) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-black/10 p-5 dark:border-white/15">
      <Section title="Summary">
        <p className="text-sm leading-relaxed">{briefing.summary}</p>
      </Section>

      <Section title="Key points">
        <BulletList items={briefing.keyPoints} emptyLabel="No key points identified." />
      </Section>

      <Section title="People">
        <TagList items={briefing.entities.people} emptyLabel="No named people found." />
      </Section>

      <Section title="Organizations">
        <TagList
          items={briefing.entities.organizations}
          emptyLabel="No named organizations found."
        />
      </Section>

      <Section title="Locations">
        <TagList items={briefing.entities.locations} emptyLabel="No named locations found." />
      </Section>

      <Section title="Category">
        <p className="inline-block w-fit rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
          {briefing.category}
        </p>
      </Section>

      <Section title="Topics">
        <TagList items={briefing.topics} emptyLabel="No topics identified." />
      </Section>

      <Section title="Checkable claims">
        <BulletList
          items={briefing.checkableClaims}
          emptyLabel="No specific checkable claims identified. This does not mean the article is unverified — only that no distinct factual claims were extracted."
        />
      </Section>
    </div>
  );
}
