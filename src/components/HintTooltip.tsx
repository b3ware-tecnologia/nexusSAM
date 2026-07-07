import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface HintTooltipProps {
  text: string;
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md";
}

export function HintTooltip({ text, side = "top", size = "sm" }: HintTooltipProps) {
  const [open, setOpen] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const hideTimer = useRef<number | null>(null);
  const showTimer = useRef<number | null>(null);

  const updatePos = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const gap = 8;
    const tipW = 224;
    const tipH = 60;

    let top = 0, left = 0;
    switch (side) {
      case "top":
        top = rect.top - tipH - gap;
        left = rect.left + rect.width / 2 - tipW / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tipW / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tipH / 2;
        left = rect.left - tipW - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tipH / 2;
        left = rect.right + gap;
        break;
    }
    setPos({ top, left });
  }, [side]);

  const show = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    if (showTimer.current) return;
    showTimer.current = window.setTimeout(() => {
      updatePos();
      setOpen(true);
      showTimer.current = null;
    }, 100);
  }, [updatePos]);

  const hide = useCallback(() => {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    if (hideTimer.current) return;
    hideTimer.current = window.setTimeout(() => {
      setOpen(false);
      hideTimer.current = null;
    }, 250);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => { updatePos(); };
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const iconSize = size === "md" ? "w-4 h-4" : "w-3 h-3";

  return (
    <>
      <span
        ref={iconRef}
        className={`inline-flex items-center cursor-help ${iconSize}`}
        style={{ color: "#9B9B9B", position: "relative" }}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <Info className={`${iconSize}`} />
      </span>
      {open && createPortal(
        <div
          className="fixed z-[9999]"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div
            className="text-[11px] leading-relaxed px-3 py-2 rounded-lg shadow-lg w-56"
            style={{ background: "#001833", color: "#FFFFFF" }}
          >
            {text}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
