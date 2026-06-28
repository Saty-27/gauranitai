import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop – automatically scrolls the window to the top (0, 0)
 * whenever the route (pathname) changes.  Place this component once
 * inside the Router so it is re-rendered on every navigation.
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}
