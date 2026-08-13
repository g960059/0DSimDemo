/**
 * The public server keeps semantic HTML outside React's root. The client root
 * remains hidden until its route has resolved so a slow or failed bundle never
 * tears down readable first-response content merely to show a loading state.
 */
export function completePublicStaticContentHandoffV1(): void {
  const clientRoot = document.getElementById("root");
  const staticRoot = document.getElementById("public-static-root");
  if (clientRoot === null || staticRoot === null) return;
  const documentScrollTop = window.scrollY;

  window.requestAnimationFrame(() => {
    clientRoot.hidden = false;
    staticRoot.remove();
    const scrollHost = clientRoot.querySelector<HTMLElement>(
      '[data-public-static-scroll-host="true"]',
    );
    if (scrollHost !== null && documentScrollTop > 0) {
      scrollHost.scrollTop = documentScrollTop;
    }
  });
}
