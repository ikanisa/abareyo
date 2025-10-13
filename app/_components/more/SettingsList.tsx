"use client";

import Link from "next/link";

export type SettingsItem = {
  label: string;
  href: string;
  description?: string;
};

type SettingsListProps = {
  items: SettingsItem[];
};

const SettingsList = ({ items }: SettingsListProps) => {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link className="tile flex w-full items-center justify-between" href={item.href} aria-label={item.label}>
            <span className="text-sm font-semibold text-white">{item.label}</span>
            {item.description ? <span className="text-xs text-white/70">{item.description}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default SettingsList;
