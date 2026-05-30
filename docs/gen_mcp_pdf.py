#!/usr/bin/env python3
"""Generate the Sui Skills MCP capability-reference PDF.

Reproducible source for docs/sui-skills-mcp.pdf. Requires reportlab:
    pip install reportlab
    python3 docs/gen_mcp_pdf.py
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, KeepTogether,
)

OUT = "docs/sui-skills-mcp.pdf"

# --- Suisei brand palette (from tailwind.config.js) --------------------------
# The cream "paper" surface is the site's landing + MCP-docs surface.
PAPER = colors.HexColor("#F2EBDC")       # page background (paper.DEFAULT)
PAPER_SOFT = colors.HexColor("#F6F0E3")  # paper.soft
PAPER_DEEP = colors.HexColor("#E8DFCB")  # table header bg (paper.deep)
PAPER_LINE = colors.HexColor("#DCD1B7")  # grid lines (paper.line)
NIGHT = colors.HexColor("#15171F")       # cover band (night.DEFAULT)
NIGHT_DEEP = colors.HexColor("#0F1117")  # code blocks (night.deep)
INK = colors.HexColor("#16171C")         # body text (ink.DEFAULT)
INK_DIM = colors.HexColor("#5A5A66")     # ink.dim
CREAM = colors.HexColor("#F2EBDC")       # foreground on night
CREAM_DIM = colors.HexColor("#B5AD9D")   # cream.dim (subtext on night)
TERRACOTTA = colors.HexColor("#D7552E")  # heading rules + pills
BUTTER = colors.HexColor("#E6B23A")      # warning bar / cover pill
SAGE = colors.HexColor("#7FA88E")        # security bar
SAGE_TINT = colors.HexColor("#E6EEE9")   # pale sage callout bg
BUTTER_TINT = colors.HexColor("#F6EBCC") # pale butter callout bg
MUTE = INK_DIM

styles = getSampleStyleSheet()
S = {}
S["title"] = ParagraphStyle("t", parent=styles["Title"], fontSize=26,
                            textColor=CREAM, alignment=TA_LEFT,
                            spaceAfter=2, leading=30)
S["sub"] = ParagraphStyle("sub", fontSize=12, textColor=colors.HexColor("#CFC6B3"),
                          leading=15, spaceBefore=2)
S["meta"] = ParagraphStyle("meta", fontSize=8.5, textColor=CREAM_DIM,
                           spaceBefore=8)
S["lead"] = ParagraphStyle("lead", fontSize=11, textColor=colors.HexColor("#3F3E45"),
                           leading=15, spaceBefore=4, spaceAfter=4)
S["h2"] = ParagraphStyle("h2", fontSize=15, textColor=INK, spaceBefore=16,
                         spaceAfter=4, leading=18, fontName="Helvetica-Bold")
S["h3"] = ParagraphStyle("h3", fontSize=11.5, textColor=TERRACOTTA, spaceBefore=10,
                         spaceAfter=2, leading=14, fontName="Helvetica-Bold")
S["h4"] = ParagraphStyle("h4", fontSize=10.5, textColor=colors.HexColor("#9A4423"),
                         spaceBefore=7, spaceAfter=1, leading=13,
                         fontName="Helvetica-Bold")
S["body"] = ParagraphStyle("body", fontSize=10, textColor=INK, leading=14,
                           spaceAfter=3)
S["cell"] = ParagraphStyle("cell", fontSize=8.8, textColor=INK, leading=11)
S["cellh"] = ParagraphStyle("cellh", fontSize=8.8, textColor=INK, leading=11,
                            fontName="Helvetica-Bold")
S["code"] = ParagraphStyle("code", fontSize=8.3, textColor=colors.HexColor("#EDE6D6"),
                           fontName="Courier", leading=11.5, leftIndent=6,
                           rightIndent=6, spaceBefore=2, spaceAfter=2)
S["small"] = ParagraphStyle("small", fontSize=8, textColor=MUTE, leading=10,
                            spaceBefore=4)
S["li"] = ParagraphStyle("li", fontSize=10, textColor=INK, leading=13,
                         leftIndent=12, bulletIndent=2, spaceAfter=2)

story = []
W = A4[0] - 32 * mm  # content width with 16mm side margins


def P(t, s="body"):
    story.append(Paragraph(t, S[s]))


def H2(t):
    story.append(Paragraph(t, S["h2"]))
    story.append(_rule())


def _rule():
    tbl = Table([[""]], colWidths=[W], rowHeights=[2])
    tbl.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 1.4, TERRACOTTA)]))
    return tbl


def code(lines):
    para = Paragraph("<br/>".join(lines), S["code"])
    t = Table([[para]], colWidths=[W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NIGHT_DEEP),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 3))
    story.append(t)
    story.append(Spacer(1, 3))


def bullets(items):
    for it in items:
        story.append(Paragraph(it, S["li"], bulletText=u"•"))


def table(rows, widths, header=True):
    data = []
    for r_i, row in enumerate(rows):
        st = "cellh" if (header and r_i == 0) else "cell"
        data.append([Paragraph(str(c), S[st]) for c in row])
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    style = [
        ("GRID", (0, 0), (-1, -1), 0.5, PAPER_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), PAPER_DEEP))
    t.setStyle(TableStyle(style))
    story.append(t)
    story.append(Spacer(1, 5))


def callout(text, bg, bar):
    para = Paragraph(text, ParagraphStyle("co", fontSize=9, textColor=INK, leading=12))
    t = Table([[para]], colWidths=[W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, bar),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 2))
    story.append(t)
    story.append(Spacer(1, 4))


# ---- Cover band -----------------------------------------------------------
pill = ParagraphStyle("pill", fontSize=8, textColor=BUTTER, fontName="Helvetica-Bold")
cover_inner = [
    [Paragraph("@suisei/sui-skills-mcp&nbsp;&nbsp;&nbsp;v0.1.0", pill)],
    [Paragraph("Sui Skills MCP", S["title"])],
    [Paragraph("The Sui Stack as one-job-per-tool primitives, over the "
               "Model Context Protocol.", S["sub"])],
    [Paragraph("Capability Reference&nbsp;&nbsp;&middot;&nbsp;&nbsp;21 tools"
               "&nbsp;&nbsp;&middot;&nbsp;&nbsp;Generated 2026-05-29", S["meta"])],
]
cover = Table(cover_inner, colWidths=[W])
cover.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NIGHT),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (0, 0), 16),
    ("BOTTOMPADDING", (-1, -1), (-1, -1), 16),
]))
story.append(cover)
story.append(Spacer(1, 8))

P("This MCP server is the product: plug it into Claude Desktop, Cursor, Windsurf, or any "
  "MCP-aware agent and you get one-line tools for reading chain state, building any Sui "
  "transaction, simulating it, submitting it, and storing data on Walrus. <b>Suisei</b> &mdash; "
  "the Sui teaching agent &mdash; is a showcase of it: a working app built entirely on these "
  "tools, demonstrating what an agent can do once it speaks Sui.", "lead")

# ---- 1. What it is --------------------------------------------------------
H2("1. What it is")
P("Most Sui SDKs assume you are writing <i>application</i> code. This package assumes you are "
  "writing <i>agent</i> code: short tool calls, structured JSON in, structured JSON out, no React, "
  "no UI. The agent decides what to do; the tool does exactly one thing and returns "
  "machine-readable output.")
P("The server speaks JSON-RPC 2.0 over <b>stdio</b> per the MCP specification. There is no network "
  "listener &mdash; the host agent process spawns the binary, talks to it over stdin/stdout, and "
  "supervises its lifecycle.")

# ---- 2. Design principles -------------------------------------------------
H2("2. Design principles")
table([
    ["Principle", "What it means in practice"],
    ["No private keys", "Tools that produce transactions return base64 transaction bytes. The "
     "host signs and submits. A tool that holds a key is a tool that can spend money &mdash; so "
     "this toolkit never holds one."],
    ["One job per tool", "No mega-tools with twelve flags. Each tool is unambiguous, which "
     "sharpens the calling agent's reasoning about when to use it."],
    ["Structured output", "Every successful return is a JSON string in the text content block. "
     "Agents parse structured data far more reliably than prose."],
], [0.28 * W, 0.72 * W])

# ---- 3. Build loop --------------------------------------------------------
H2("3. The build loop")
P("Write operations follow a four-step, non-custodial loop. The toolkit covers steps 1, 2 and 4; "
  "the host owns the key and performs step 3.")
code([
    "1. *_build tool          &rarr;  returns base64 unsigned tx bytes",
    "2. sui_dry_run           &rarr;  simulate: status + gas, no spend",
    "3. host signs the bytes        (outside the toolkit &mdash; the host holds the key)",
    "4. sui_execute_signed_tx &rarr;  submit signed bytes, return digest + effects",
])
callout("<b>Security invariant:</b> every transaction-building tool ends by returning bytes, "
        "never by signing. The private key never enters the MCP process.",
        SAGE_TINT, SAGE)

# ---- 4. Install -----------------------------------------------------------
H2("4. Install &amp; connect")
code(["npm install -g @suisei/sui-skills-mcp"])
P("Then register it with an MCP host. For Claude Desktop, edit "
  "<font name='Courier' size=9>claude_desktop_config.json</font>:")
code([
    "{",
    "&nbsp;&nbsp;\"mcpServers\": {",
    "&nbsp;&nbsp;&nbsp;&nbsp;\"sui\": {",
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\"command\": \"npx\",",
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\"args\": [\"-y\", \"@suisei/sui-skills-mcp\"]",
    "&nbsp;&nbsp;&nbsp;&nbsp;}",
    "&nbsp;&nbsp;}",
    "}",
])
P("Restart the host. All tools are exposed under the <font name='Courier' size=9>sui</font> "
  "server namespace.")

# ---- 5. Tool reference ----------------------------------------------------
H2("5. Tool reference")
P("Twenty-one tools across four groups. Every tool accepts a "
  "<font name='Courier' size=9>network</font> argument (testnet &middot; mainnet &middot; devnet, "
  "default testnet) except the two Walrus tools, which target Walrus endpoints directly.")

P("5.1 Read the chain", "h3")
table([
    ["Tool", "What it does"],
    ["sui_resolve_address", "SuiNS name &rarr; 0x address (idempotent on 0x input)"],
    ["sui_get_balance", "SUI balance in MIST + human-readable SUI"],
    ["sui_get_all_balances", "Every coin balance a wallet holds, not just SUI"],
    ["sui_get_object", "Any object's type, owner, version, fields, and Display"],
    ["sui_get_owned_objects", "List objects by owner, filter by struct type, paginated"],
    ["sui_get_owned_badges", "List a wallet's Suisei quest-completion badges"],
    ["sui_get_coins", "List coin objects of a type (the ids you spend), paginated"],
    ["sui_get_transaction", "Look up a finalized tx by digest: status, gas, changes"],
    ["sui_get_reference_gas_price", "Current network reference gas price (MIST)"],
    ["sui_get_dynamic_fields", "List an object's dynamic fields (Tables, Bags)"],
    ["sui_deepbook_quote", "Read-only DeepBook v3 quote: expected out + DEEP fee"],
], [0.32 * W, 0.68 * W])

P("sui_resolve_address", "h4")
P("If given a 0x address, returns it canonicalized (lowercased). Otherwise treats the input as a "
  "SuiNS name and resolves it. Use this whenever a user gives a human-readable name.")
table([
    ["Input", "Type", "Req", "Notes"],
    ["name_or_address", "string", "yes", "A SuiNS name or 0x address"],
    ["network", "enum", "no", "default testnet"],
], [0.30 * W, 0.16 * W, 0.12 * W, 0.42 * W])
code(['&rarr; { "address": "0x…", "source": "suins", "name": "alice.sui" }'])

P("sui_get_balance / sui_get_all_balances", "h4")
P("<font name='Courier' size=9>sui_get_balance</font> returns the native SUI balance for one "
  "address; <font name='Courier' size=9>sui_get_all_balances</font> returns every coin type held. "
  "Both take address + network.")
code(['&rarr; { "coin_type": "0x2::sui::SUI", "total_mist": "1500000000",',
      '    "total_sui": 1.5, "coin_object_count": 3 }'])

P("sui_get_object", "h4")
P("The general read primitive &mdash; every other read tool is a special case of it. Returns Move "
  "type, owner, version, digest, content fields, and Display metadata for any object id.")
code(['&rarr; { "type": "0x…::badge::Badge", "owner": {…}, "version": "…",',
      '    "fields": {…}, "display": {…} }'])

P("sui_get_owned_objects", "h4")
P("Lists objects owned by an address, optionally filtered to a single fully-qualified Move struct "
  "type. Paginated &mdash; pass the returned next_cursor to continue.")
table([
    ["Input", "Type", "Req", "Notes"],
    ["address", "string", "yes", "Wallet to list"],
    ["struct_type", "string", "no", "e.g. 0x2::coin::Coin&lt;0x2::sui::SUI&gt;"],
    ["cursor", "string", "no", "Pagination cursor"],
    ["limit", "number", "no", "1&ndash;50, default 50"],
    ["network", "enum", "no", "default testnet"],
], [0.24 * W, 0.16 * W, 0.10 * W, 0.50 * W])

P("sui_get_owned_badges", "h4")
P("Lists Suisei badges (soulbound quest-completion NFTs) owned by an address &mdash; useful for "
  "showing curriculum progress. Resolves the badge package from the badge_package argument, the "
  "SUISEI_BADGE_PACKAGE env var, or a built-in per-network default.")
code(['&rarr; { "count": 3, "badges": [ { "object_id": "…",',
      '    "quest_id": "zklogin", "quest_number": 1, "minted_at_ms": "…" } ] }'])

P("sui_get_coins", "h4")
P("Unlike sui_get_balance (which sums), this returns the concrete coin_object_id values an agent "
  "needs to spend or split in a transaction. Defaults to native SUI; pass coin_type for any other "
  "coin. Paginated.")
code(['&rarr; { "coin_type": "0x2::sui::SUI", "count": 4, "has_next_page": false,',
      '    "coins": [ { "coin_object_id": "…", "balance": "1000000000" }, … ] }'])

P("sui_get_transaction", "h4")
P("Fetch a finalized transaction by digest &mdash; the same digest sui_execute_signed_tx returns. "
  "Returns status, gas used, balance changes, timestamp, and event count.")
code(['&rarr; { "digest": "…", "status": "success", "timestamp_ms": "…",',
      '    "gas_used": {…}, "balance_changes": [...], "events_count": 1 }'])

P("sui_get_reference_gas_price / sui_get_dynamic_fields", "h4")
P("sui_get_reference_gas_price returns the current network gas price in MIST (takes only network). "
  "sui_get_dynamic_fields lists the dynamic fields attached to a parent object &mdash; how Sui "
  "stores Tables, Bags, and other on-chain collections &mdash; returning each field's name, type, "
  "and child object id (paginated).")

P("5.2 Build a transaction (returns unsigned bytes)", "h3")
table([
    ["Tool", "What it does"],
    ["sui_move_call", "Build a call to ANY Move entry function &mdash; the universal write"],
    ["sui_transfer", "Build a transfer of SUI and/or whole objects"],
    ["sui_stake", "Build a native staking delegation to a validator"],
    ["sui_unstake", "Build a withdraw-stake for a StakedSui object"],
    ["sui_mint_badge", "Build a Suisei completion-badge mint"],
    ["sui_deepbook_swap", "Build a DeepBook v3 market swap (CLOB liquidity)"],
], [0.32 * W, 0.68 * W])

P("sui_move_call &mdash; the universal write primitive", "h4")
P("Builds an unsigned transaction calling any Move entry function. Arguments are encoded as "
  "strings so the schema stays flat and unambiguous:")
bullets([
    "<font name='Courier' size=9>object:&lt;id&gt;</font> &mdash; an owned or shared object by id",
    "<font name='Courier' size=9>pure:&lt;type&gt;:&lt;value&gt;</font> &mdash; type is address, "
    "id, bool, string, or u8/u16/u32/u64/u128/u256",
])
callout("Vector and nested-struct arguments are intentionally out of scope for the generic tool. "
        "Use a purpose-built tool (e.g. sui_transfer) for those, so the generic schema stays "
        "unambiguous for the calling agent.",
        BUTTER_TINT, BUTTER)
table([
    ["Input", "Type", "Req", "Notes"],
    ["target", "string", "yes", "0xpkg::module::function"],
    ["type_arguments", "string[]", "no", 'generics, e.g. ["0x2::sui::SUI"]'],
    ["arguments", "string[]", "no", "encoded as above"],
    ["sender", "string", "yes", "0x address that will sign &amp; pay"],
    ["network", "enum", "no", "default testnet"],
], [0.26 * W, 0.16 * W, 0.10 * W, 0.48 * W])
code(['&rarr; { "tx_bytes_base64": "…", "target": "0x…::m::f",',
      '    "sender": "0x…", "next_step": "Dry-run, then sign and submit." }'])

P("sui_transfer", "h4")
P("Provide amount_mist to send SUI (split from the gas coin) and/or object_ids to send whole "
  "objects. At least one is required.")
table([
    ["Input", "Type", "Req", "Notes"],
    ["sender", "string", "yes", "Sends &amp; pays"],
    ["recipient", "string", "yes", "Receives"],
    ["amount_mist", "string", "no*", "SUI in MIST (string, avoids precision loss)"],
    ["object_ids", "string[]", "no*", "Whole objects to transfer"],
], [0.24 * W, 0.16 * W, 0.10 * W, 0.50 * W])
P("* one of amount_mist or object_ids is required.", "small")

P("sui_stake / sui_unstake", "h4")
P("sui_stake splits amount_mist from gas and delegates to a validator via "
  "0x3::sui_system::request_add_stake; the StakedSui object lands in the sender once signed. "
  "sui_unstake withdraws a StakedSui by id via request_withdraw_stake, returning principal plus "
  "rewards.")
table([
    ["Tool", "Required inputs"],
    ["sui_stake", "sender, amount_mist, validator"],
    ["sui_unstake", "sender, staked_sui_id"],
], [0.30 * W, 0.70 * W])

P("sui_mint_badge", "h4")
P("Builds a PTB that mints a Suisei completion badge to a recipient through the canonical badge "
  "module. Returns unsigned bytes; the caller signs and submits.")
table([
    ["Input", "Type", "Req", "Notes"],
    ["recipient", "string", "yes", "0x address receiving the badge"],
    ["quest_id", "string", "yes", "e.g. zklogin, sponsored"],
    ["quest_number", "number", "yes", "1&ndash;255"],
    ["badge_package", "string", "yes", "Move package with the badge module"],
], [0.26 * W, 0.16 * W, 0.10 * W, 0.48 * W])

P("sui_deepbook_quote", "h4")
P("Read-only DeepBook v3 quote via devInspect — no gas, no signing, no funds. Given an input "
  "amount and direction, returns the expected output and the DEEP fee required, so an agent can "
  "size min_out before building a swap. Same pool selection as the swap (known key, or explicit "
  "pool_id + base_type + quote_type). All values are raw smallest-units, so expected_out feeds "
  "straight into the swap's min_out.")
code(['&rarr; { "expected_out": "900000", "deep_required": "27770",',
      '    "base_out": "0", "quote_out": "900000", "direction": "base_to_quote" }'])

P("sui_deepbook_swap", "h4")
P("Builds the exact market-swap PTB the official DeepBook v3 SDK emits "
  "(pool::swap_exact_base_for_quote / swap_exact_quote_for_base), on the current @mysten/sui v1, "
  "so the toolkit stays non-custodial. Pass a known pool key (SUI_DBUSDC on testnet, SUI_USDC on "
  "mainnet) or explicit pool_id + base_type + quote_type. amount and min_out are raw smallest-unit "
  "strings (caller handles decimals and slippage). DeepBook charges fees in DEEP: whitelisted pools "
  "take deep_amount 0, others require the sender to hold DEEP. The three output coins are "
  "transferred back to the sender.")
table([
    ["Input", "Type", "Req", "Notes"],
    ["sender", "string", "yes", "Signs, pays, receives output"],
    ["direction", "enum", "yes", "base_to_quote | quote_to_base"],
    ["amount", "string", "yes", "Input in smallest units"],
    ["min_out", "string", "no", "Slippage floor (default 0)"],
    ["deep_amount", "string", "no", "DEEP fee (default 0; whitelisted pools)"],
    ["pool", "string", "no*", "Known pool key, e.g. SUI_DBUSDC"],
    ["pool_id / base_type / quote_type", "string", "no*", "Explicit pool (overrides key)"],
], [0.30 * W, 0.13 * W, 0.10 * W, 0.47 * W])
P("* provide a known pool key or the explicit pool_id + base_type + quote_type trio.", "small")

P("5.3 Simulate &amp; submit", "h3")
table([
    ["Tool", "What it does"],
    ["sui_dry_run", "Simulate built tx bytes (status + gas, no spend)"],
    ["sui_execute_signed_tx", "Submit host-signed bytes, return digest + effects"],
], [0.36 * W, 0.64 * W])
P("sui_dry_run", "h4")
P("Simulates an unsigned transaction without spending gas, so an agent can verify a builder result "
  "before asking the host to sign. Takes tx_bytes_base64.")
code(['&rarr; { "status": "success", "gas_used": {…}, "balance_changes": [...],',
      '    "object_changes_count": 2, "events_count": 0 }'])
P("sui_execute_signed_tx", "h4")
P("Submits a host-signed transaction. Takes the same tx_bytes_base64 that were signed plus one or "
  "more base64 signatures. The toolkit holds no keys &mdash; signing happens in the host.")
code(['&rarr; { "digest": "…", "status": "success", "gas_used": {…},',
      '    "balance_changes": [...], "events_count": 1 }'])

P("5.4 Walrus storage", "h3")
table([
    ["Tool", "Key inputs", "Returns"],
    ["walrus_publish", "content, encoding (utf8/base64), epochs (default 5), publisher_url?",
     "blob_id, status, size_bytes"],
    ["walrus_fetch", "blob_id, as (utf8/base64), aggregator_url?",
     "content, encoding, size_bytes"],
], [0.22 * W, 0.50 * W, 0.28 * W])

# ---- 6. Configuration -----------------------------------------------------
H2("6. Configuration")
table([
    ["Variable", "Purpose"],
    ["SUISEI_BADGE_PACKAGE", "Default badge package id for sui_get_owned_badges when not passed "
     "explicitly."],
    ["Walrus endpoints", "Default to the public Walrus testnet publisher/aggregator; override "
     "per-call via publisher_url / aggregator_url."],
    ["Network", "Defaults to testnet; pass network on any tool to switch."],
], [0.30 * W, 0.70 * W])

# ---- 7. Security model ----------------------------------------------------
H2("7. Security model")
bullets([
    "<b>Non-custodial by construction.</b> No tool accepts, stores, or derives a private key. "
    "Builder tools return unsigned bytes; only sui_execute_signed_tx touches a signature, and "
    "that signature is produced by the host.",
    "<b>No ambient network surface.</b> Stdio transport only &mdash; the server opens no port and "
    "accepts no inbound connections.",
    "<b>Verify before spend.</b> The documented loop routes every write through sui_dry_run before "
    "signing, so an agent can confirm gas and effects up front.",
])

P("&copy; 2026 Suisei &middot; @suisei/sui-skills-mcp v0.1.0 &middot; MIT License. The build loop "
  "is: a builder tool returns base64 tx bytes &rarr; dry-run to verify &rarr; the host signs "
  "&rarr; execute to submit. The toolkit never holds keys.", "small")


def footer(canvas, doc):
    canvas.saveState()
    # Cream "paper" surface across the whole page — the site's docs background.
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTE)
    canvas.drawString(16 * mm, 10 * mm, "Sui Skills MCP · Capability Reference")
    canvas.drawRightString(A4[0] - 16 * mm, 10 * mm, "Page %d" % doc.page)
    canvas.setStrokeColor(PAPER_LINE)
    canvas.line(16 * mm, 13 * mm, A4[0] - 16 * mm, 13 * mm)
    canvas.restoreState()


doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm,
                      topMargin=15 * mm, bottomMargin=18 * mm, title="Sui Skills MCP")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=footer)])
doc.build(story)
print("wrote", OUT)
