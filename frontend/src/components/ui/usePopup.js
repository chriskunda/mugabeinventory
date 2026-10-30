import { useCallback, useEffect, useRef, useState } from "react";

const usePopup = (popWidth = 0) => {
  const anchorRef = useRef(null);
  const popRef = useRef(null);
  const [pos, setPos] = useState(null); // null = closed

  const close = useCallback(() => setPos(null), []);

  const toggle = () => {
    if (pos) return close();
    const r = anchorRef.current.getBoundingClientRect();
    const width = Math.max(r.width, popWidth);
    const below = window.innerHeight - r.bottom;
    const flip = below < 320 && r.top > below; // open upwards if there's no room
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
      minWidth: r.width,
      ...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
    });
  };

  useEffect(() => {
    if (!pos) return;
    const onDown = (e) => {
      if (!anchorRef.current?.contains(e.target) && !popRef.current?.contains(e.target)) close();
    };
    const onScroll = (e) => {
      if (!popRef.current?.contains(e.target)) close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [pos, close]);

  return { anchorRef, popRef, pos, toggle, close };
};

export default usePopup;