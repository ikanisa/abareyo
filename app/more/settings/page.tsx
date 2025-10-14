import PageShell from "@/app/_components/shell/PageShell";

export default function Settings() {
  return (
    <PageShell>
      <section className="card">
        <h1>Settings</h1>
        <ul className="mt-2 space-y-2">
          <li>
            <button className="tile w-full text-left">🌐 Language</button>
          </li>
          <li>
            <button className="tile w-full text-left">🌓 Theme</button>
          </li>
          <li>
            <button className="tile w-full text-left">🔔 Notifications</button>
          </li>
          <li>
            <a className="tile block" href="/support">
              ❓ Help &amp; Legal
            </a>
          </li>
        </ul>
      </section>
    </PageShell>
  );
}

