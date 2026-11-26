"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers3,
  LayoutDashboard,
  Database,
  Code2,
  GraduationCap,
  Trophy,
  KeyRound,
  Webhook,
  BookOpen,
  Menu,
  Sun,
  Moon,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  X,
} from "lucide-react";
import { brand } from "@/config/studio";

const links = [
  { href: "/", title: "Overview", icon: LayoutDashboard },
  { href: "/playground", title: "SQL Playground & AI", icon: Code2 },
  { href: "/workspace", title: "Database explorer", icon: Database },
  { href: "/learn", title: "Learn SQL", icon: GraduationCap },
  { href: "/challenges", title: "Practice Challenges", icon: Trophy },
  { href: "/api-keys", title: "Developer API Keys", icon: KeyRound },
  { href: "/webhooks", title: "Webhooks", icon: Webhook },
  { href: "/docs", title: "Developer guide", icon: BookOpen },
];

function subscribe(callback: () => void) {
  window.addEventListener("studio-theme", callback);
  return () => window.removeEventListener("studio-theme", callback);
}

function readDark() {
  return document.documentElement.dataset.theme === "dark";
}

export function Shell({
  children,
  signedIn,
}: {
  children: React.ReactNode;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const [narrow, setNarrow] = useState(false);
  const [open, setOpen] = useState(false);
  const dark = useSyncExternalStore(subscribe, readDark, () => false);

  function theme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("studio-theme", next);
    } catch {}
    window.dispatchEvent(new Event("studio-theme"));
  }

  const current =
    links.find((item) => item.href === pathname)?.title ||
    (pathname === "/account" ? "Account" : "Sign in");

  return (
    <div
      className={`shell ${narrow ? "narrow" : ""} ${open ? "menu-open" : ""}`}
    >
      <a className="skip" href="#main">
        Skip to content
      </a>
      {open && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className="sidebar">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <span className="brand-icon">
            <Layers3 size={20} />
          </span>
          <strong>{brand}</strong>
        </Link>
        <button
          className="mobile-close icon"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <div className="nav-caption">Workspace</div>
        <nav>
          {links.map(({ href, title, icon: Icon }) => (
            <Link
              key={href}
              title={title}
              aria-current={pathname === href ? "page" : undefined}
              className={pathname === href ? "active" : ""}
              href={href}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{title}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            type="button"
            className="collapse"
            aria-label={narrow ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setNarrow((n) => !n)}
          >
            {narrow ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>Collapse</span>
          </button>
        </div>
      </aside>
      <div className="main-col">
        <header>
          <div className="crumb">
            <button
              type="button"
              className="mobile-menu icon"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={18} />
            </button>
            <Layers3 size={14} />
            <span>{brand}</span>
            <ChevronRight size={14} />
            <b>{current}</b>
          </div>
          <div className="tools">
            <button
              type="button"
              className="icon"
              aria-label="Toggle theme"
              onClick={theme}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link
              className="account-link"
              href={signedIn ? "/account" : "/login"}
            >
              <UserRound size={15} />
              <span>{signedIn ? "Account" : "Sign in"}</span>
            </Link>
          </div>
        </header>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
