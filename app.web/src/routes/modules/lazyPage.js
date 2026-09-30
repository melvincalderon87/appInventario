import { createElement, lazy, Suspense } from "react";

function RouteLoadingFallback({ fullPage = false } = {}) {
  return createElement("div", {
    "aria-busy": "true",
    style: {
      minHeight: fullPage ? "100vh" : "100%",
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: "var(--app-root-bg, var(--colorNeutralBackground2, #f5f9fd))",
      padding: fullPage ? 0 : "20px",
    },
  });
}

export function routeSuspense(element, options = {}) {
  return createElement(
    Suspense,
    {
      fallback: createElement(RouteLoadingFallback, {
        fullPage: options.fullPage,
      }),
    },
    element
  );
}

export function lazyPage(loader, options = {}) {
  const Page = lazy(loader);
  return routeSuspense(createElement(Page), options);
}
