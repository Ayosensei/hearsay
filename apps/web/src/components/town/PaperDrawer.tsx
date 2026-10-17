"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";

export function PaperDrawer({ title, onClose, children, dark = false }: { title: string; onClose: () => void; children: React.ReactNode; dark?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const element = ref.current;
    element?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab" || !element) return;
      const targets = [...element.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex="0"]')].filter((node) => node.getClientRects().length > 0);
      const first = targets[0], last = targets.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === element)) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); previous?.focus(); };
  }, []);
  return <aside ref={ref} tabIndex={-1} className={`paper-drawer ${dark ? "engine-drawer" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
    <header className="drawer-heading"><h2>{title}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer"><X size={20} /></Button></header>
    <div className="drawer-body">{children}</div>
  </aside>;
}
