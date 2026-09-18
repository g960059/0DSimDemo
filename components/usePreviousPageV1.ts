import React from "react";
import { useNavigate } from "react-router-dom";

/** BrowserRouter's index survives reloads and replace navigations such as Save.
 * A direct/new-tab entry has index zero; history.length could include another site.
 */
export function usePreviousPageV1(fallbackHref: string): () => void {
  const navigate = useNavigate();
  return React.useCallback(() => {
    const index = window.history.state?.idx;
    if (typeof index === "number" && index > 0) navigate(-1);
    else navigate(fallbackHref, { replace: true });
  }, [fallbackHref, navigate]);
}
