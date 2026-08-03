/**
 * The shareable rank card.
 *
 * Every launch story in the research had the same growth mechanic under
 * it: the product itself produces a piece of media the user WANTS to
 * post, and that media carries the name. Lobby made a group photo,
 * watermarked it, and friends who were not in the call asked "how did
 * this happen without me?". That is a cheaper and more durable loop
 * than any amount of ad spend.
 *
 * FORGE had nothing shareable. A rank you can only see by opening the
 * app cannot recruit anyone.
 *
 * Two rules this file exists to enforce:
 *
 *  1. The card states only what the user actually did. It is generated
 *     from the same derived rank as the Proof screen, so it cannot flatter
 *     anyone. A card that overstates would be the exact "streaks you can
 *     buy back" thing the app promises not to do.
 *  2. The wordmark is never optional. The whole point is that the image
 *     travels and identifies where it came from.
 *
 * Everything renders on a canvas on-device. No server, no account, and
 * it works offline.
 */

/** Instagram/TikTok story canvas. */
export const CARD_W = 1080;
export const CARD_H = 1920;

/**
 * Instagram and TikTok draw their own controls over roughly the bottom
 * 250px of a story. Nothing that has to be READ may sit below this.
 */
export const STORY_UI_SAFE_BOTTOM = 300;

export interface ShareCardData {
  rankName: string;
  xp: number;
  /** Consecutive kept days. */
  streak: number;
  /** Total kept days all time. */
  keptDays: number;
  /** 0..1 toward the next rank; 1 when maxed. */
  progress: number;
  nextRankName: string | null;
}

export interface CardLine {
  /** What the line says. */
  text: string;
  /** Semantic role, so the renderer picks size/weight without re-deciding. */
  role: "eyebrow" | "rank" | "metric" | "label" | "footer";
}

/**
 * The card's copy, decided in one place and unit-tested, because this
 * is the text that leaves the device and represents the app in public.
 */
export function cardLines(d: ShareCardData): CardLine[] {
  const lines: CardLine[] = [];
  lines.push({ text: "FORGE", role: "eyebrow" });
  lines.push({ text: d.rankName, role: "rank" });

  lines.push({ text: `${d.xp.toLocaleString()} XP`, role: "metric" });

  // Streak only appears when there IS one. "0 day streak" is a
  // discouraging thing to hand someone and a bad thing to post.
  if (d.streak > 0) {
    lines.push({
      text: `${d.streak} day${d.streak === 1 ? "" : "s"} in a row`,
      role: "label",
    });
  }

  if (d.keptDays > 0) {
    lines.push({
      text: `${d.keptDays} day${d.keptDays === 1 ? "" : "s"} kept`,
      role: "label",
    });
  }

  lines.push({
    text: d.nextRankName ? `Next: ${d.nextRankName}` : "Highest rank reached",
    role: "label",
  });

  // The watermark. Never conditional.
  lines.push({ text: "Earned in FORGE", role: "footer" });
  return lines;
}

/**
 * Nothing on the card is claimable without training, so there is no
 * "share before you start" state — but guard it anyway rather than
 * emitting an empty boast.
 */
export function canShare(d: ShareCardData): boolean {
  return d.keptDays > 0 || d.xp > 0;
}

/** Filename for the download fallback. */
export function shareCardFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `forge-rank-${y}-${m}-${d}.png`;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                            */
/* ------------------------------------------------------------------ */

const INK = "#f2f5fb";
const INK_MUTED = "#93a2bd";
const BG_TOP = "#0a1230";
const BG_BOTTOM = "#050818";
const CHROME = "#cfd8ea";

/**
 * Draw the card. `crestImage` is optional so the card still renders if
 * the asset fails to decode — a share that silently produces nothing is
 * worse than a share without the emblem.
 */
export function drawShareCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  crestImage?: CanvasImageSource | null,
): void {
  ctx.save();

  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = "center";
  const cx = CARD_W / 2;

  // Eyebrow
  ctx.fillStyle = INK_MUTED;
  ctx.font = "600 40px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.letterSpacing = "12px";
  ctx.fillText("FORGE", cx, 190);
  ctx.letterSpacing = "0px";

  // Crest
  const crestSize = 460;
  const crestY = 300;
  if (crestImage) {
    ctx.drawImage(crestImage, cx - crestSize / 2, crestY, crestSize, crestSize);
  }

  // Rank name
  ctx.fillStyle = INK;
  ctx.font = "700 104px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(data.rankName, cx, crestY + crestSize + 150);

  // XP
  ctx.fillStyle = CHROME;
  ctx.font = "600 64px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`${data.xp.toLocaleString()} XP`, cx, crestY + crestSize + 250);

  // Progress bar toward next rank
  const barW = 620;
  const barY = crestY + crestSize + 320;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, cx - barW / 2, barY, barW, 14, 7);
  ctx.fill();
  ctx.fillStyle = CHROME;
  roundRect(ctx, cx - barW / 2, barY, barW * clamp01(data.progress), 14, 7);
  ctx.fill();

  // Supporting lines
  ctx.fillStyle = INK_MUTED;
  ctx.font = "500 44px system-ui, -apple-system, Segoe UI, sans-serif";
  let y = barY + 110;
  for (const line of cardLines(data)) {
    if (line.role !== "label") continue;
    ctx.fillText(line.text, cx, y);
    y += 68;
  }

  // Watermark.
  //
  // Instagram and TikTok both overlay their own controls across roughly
  // the bottom 250px of a story. A watermark placed at the true bottom
  // edge gets covered, and a covered watermark defeats the entire point
  // of producing a shareable image — so it sits above that band.
  ctx.fillStyle = INK_MUTED;
  ctx.font = "600 38px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("EARNED IN FORGE", cx, CARD_H - STORY_UI_SAFE_BOTTOM);
  ctx.letterSpacing = "0px";

  ctx.restore();
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
