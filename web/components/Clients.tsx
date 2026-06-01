/*
 * "Works with" row of real MCP clients (apps that connect to the server),
 * logos from Simple Icons (verified: claude, cursor, windsurf). Sui is the
 * chain the toolkit talks to, not an MCP client, so it does not belong here.
 * Grayscale so the logos sit quietly on the paper. Logos only, no labels.
 */
const LOGOS = [
  { slug: 'claude', label: 'Claude' },
  { slug: 'cursor', label: 'Cursor' },
  { slug: 'windsurf', label: 'Windsurf' },
];

export function Clients() {
  return (
    <section className="border-y border-line bg-paper-raised/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-9 sm:flex-row sm:justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-faint">
          Works with any MCP client
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
          {LOGOS.map((l) => (
            <li key={l.slug} className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://cdn.simpleicons.org/${l.slug}/16181d`}
                alt={l.label}
                width={22}
                height={22}
                className="h-5 w-auto opacity-55 grayscale transition-opacity hover:opacity-90"
              />
              <span className="ml-2 text-sm font-medium text-muted">
                {l.label}
              </span>
            </li>
          ))}
          <li className="text-sm font-medium text-muted">Claude Desktop</li>
        </ul>
      </div>
    </section>
  );
}
