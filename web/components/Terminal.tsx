import { CopyButton } from './CopyButton';

/*
 * A real terminal transcript rendered as text (not a div-based fake
 * screenshot): an actual Suisei tool call and the shape of its JSON
 * result. Teal and blue here are code-syntax colors, scoped to the
 * terminal only, never used as the page accent.
 */
export function Terminal() {
  const install = 'claude mcp add suisei -- npx -y @suisei-mcp/mcp';
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-term-bg font-mono text-[13px] leading-relaxed shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="h-3 w-3 rounded-full bg-white/15" />
          <span className="h-3 w-3 rounded-full bg-white/15" />
        </div>
        <span className="text-xs text-term-muted">suisei</span>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-term-ink">
            <span className="text-term-teal">$</span> {install}
          </p>
          <CopyButton value={install} label="Copy install command" />
        </div>
        <p className="text-term-muted">Added MCP server suisei. 33 tools.</p>
        <div className="pt-1">
          <p className="text-term-muted">
            you: <span className="text-term-ink">what is the balance of alice.sui?</span>
          </p>
          <p className="mt-2 text-term-blue">sui_get_balance</p>
          <pre className="mt-1 whitespace-pre-wrap text-term-ink">
{`{
  "address": "0x9a1f...c20e",
  "balance": "42.738601200",
  "coin": "SUI"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
