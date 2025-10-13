import type { Event } from "@/app/_data/matchday";

const icons: Record<Event["type"], string> = {
  goal: "⚽️",
  yellow: "🟨",
  red: "🟥",
  sub: "🔁",
  var: "🛰️",
  ht: "⏸️",
  ft: "🏁",
};

type TimelineListProps = {
  events: Event[];
};

const TimelineList = ({ events }: TimelineListProps) => {
  return (
    <ol className="space-y-3" aria-label="Live match timeline" aria-live="polite">
      {events.map((event) => (
        <li
          key={`${event.type}-${event.min}-${event.text}`}
          className="flex items-start gap-4 rounded-2xl bg-white/5 p-3 text-sm text-white/80"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-lg">
              {icons[event.type]}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
              {event.team === "home" ? "Rayon" : "APR"}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">
              {event.min}' • {event.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default TimelineList;
