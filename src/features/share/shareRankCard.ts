/**
 * Turn the rank into a PNG and hand it to the OS share sheet.
 *
 * iOS Safari supports navigator.share with files, which is what puts
 * the card straight into an Instagram or TikTok story. Where that isn't
 * available we fall back to a download, because a share button that
 * does nothing is worse than one that saves a file.
 *
 * The image is produced on-device. Nothing is uploaded and there is no
 * server, which keeps the local-first promise intact even though the
 * output is meant to be posted publicly.
 */

import {
  CARD_H,
  CARD_W,
  drawShareCard,
  shareCardFilename,
  type ShareCardData,
} from "./shareCard";

export type ShareOutcome =
  | { ok: true; via: "share" | "download" }
  | { ok: false; reason: "cancelled" | "unsupported" | "failed" };

async function loadCrest(src: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    await img.decode();
    return img;
  } catch {
    // The card is still worth producing without the emblem.
    return null;
  }
}

export async function renderRankCard(
  data: ShareCardData,
  crestSrc?: string,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const crest = crestSrc ? await loadCrest(crestSrc) : null;
  drawShareCard(ctx, data, crest);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function shareRankCard(
  data: ShareCardData,
  crestSrc?: string,
): Promise<ShareOutcome> {
  let blob: Blob | null;
  try {
    blob = await renderRankCard(data, crestSrc);
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (!blob) return { ok: false, reason: "failed" };

  const filename = shareCardFilename();
  const file = new File([blob], filename, { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean;
    share?: (d: ShareData) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "FORGE" });
      return { ok: true, via: "share" };
    } catch (err) {
      // The user backing out of the sheet is not an error worth
      // reporting as one.
      if (err instanceof DOMException && err.name === "AbortError") {
        return { ok: false, reason: "cancelled" };
      }
      // Fall through to download rather than dead-ending.
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick; revoking immediately can cancel the
    // download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { ok: true, via: "download" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
