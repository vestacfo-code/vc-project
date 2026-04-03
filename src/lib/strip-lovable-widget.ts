/**
 * Removes third-party Lovable preview/badge nodes if they are injected into the page.
 */
export function stripLovableInjectedNodes(root: ParentNode = document): void {
  const selectors = [
    'script[src*="lovable"]',
    'script[src*="Lovable"]',
    'iframe[src*="lovable"]',
    'iframe[src*="Lovable"]',
    'link[href*="lovable"]',
    'a[href*="lovable.dev"]',
    'a[href*="lovableproject.com"]',
    '[id*="lovable"]',
    '[id*="Lovable"]',
    '[class*="lovable-badge"]',
    '[class*="LovableBadge"]',
    '[data-lovable]',
  ];

  for (const sel of selectors) {
    try {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    } catch {
      /* invalid selector in older engines */
    }
  }
}

export function initLovableWidgetStripper(durationMs = 12_000): () => void {
  const run = () => stripLovableInjectedNodes(document);
  run();

  const observer = new MutationObserver(() => run());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const t = window.setTimeout(() => observer.disconnect(), durationMs);

  return () => {
    window.clearTimeout(t);
    observer.disconnect();
  };
}
