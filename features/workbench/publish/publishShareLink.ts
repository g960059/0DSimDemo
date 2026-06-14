import { caseHref } from "@/homeLinks";
import type { Locale } from "@/localeRouting";

export function buildShareUrl(caseId: string, locale?: Locale, origin?: string): string {
  const baseOrigin = origin ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost");
  return new URL(caseHref(caseId, locale), baseOrigin).toString();
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // clipboard API rejected (permission / insecure context) — fall through to execCommand
  }

  try {
    if (typeof document === "undefined") return false;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = typeof document.execCommand === "function" && document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
