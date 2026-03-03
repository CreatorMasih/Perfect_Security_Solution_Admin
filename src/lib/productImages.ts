export const FALLBACK_PRODUCT_IMAGE = "/placeholder.svg";

function extractGoogleDriveFileId(url: string): string | null {
  const cleaned = url.trim();

  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function normalizeImageUrl(rawUrl: string): string {
  let url = rawUrl.trim().replace(/^['"]|['"]$/g, "");
  if (!url) return "";

  if (url.startsWith("//")) {
    url = `https:${url}`;
  } else if (url.startsWith("www.")) {
    url = `https://${url}`;
  } else if (url.startsWith("http://")) {
    url = `https://${url.slice(7)}`;
  }

  const driveFileId = extractGoogleDriveFileId(url);
  if (driveFileId) {
    // More stable than thumbnail/redirect variants from Drive.
    return `https://lh3.googleusercontent.com/d/${driveFileId}=w1200`;
  }

  try {
    return encodeURI(url.replace(/\\/g, "/"));
  } catch {
    return url;
  }
}

export function parseImageUrls(input: unknown): string[] {
  const rawValues: string[] = [];

  if (Array.isArray(input)) {
    for (const item of input) {
      rawValues.push(...parseImageUrls(item));
    }
  } else if (typeof input === "string") {
    rawValues.push(...input.split(/[\n,;|]+/));
  } else if (input != null) {
    rawValues.push(String(input));
  }

  const seen = new Set<string>();
  for (const raw of rawValues) {
    const normalized = normalizeImageUrl(raw);
    if (normalized) seen.add(normalized);
  }

  return Array.from(seen);
}
