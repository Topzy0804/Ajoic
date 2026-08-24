"use client";

import { useEffect, useState } from "react";

type SettingsNavItem = {
  label: string;
  href: string;
};

export function SettingsNav({
  items,
}: {
  items: SettingsNavItem[];
}) {
  const [activeSection, setActiveSection] = useState(items[0]?.href.replace("#", ""));

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.href.replace("#", "")))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (visibleSection) {
            setActiveSection(visibleSection.target.id);
          }
      },
      {
        rootMargin: "-15px 0px -65% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((section) => observer.observe(section!));

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-6">
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        Settings
      </p>

      <div className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const sectionId = item.href.replace("#", "");
          const isActive = activeSection === sectionId;

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setActiveSection(sectionId)}
              className={`whitespace-nowrap border-l-2 px-3 py-2 text-left text-sm transition ${
                isActive
                  ? "border-green-700 font-medium text-green-800"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-900"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );


}