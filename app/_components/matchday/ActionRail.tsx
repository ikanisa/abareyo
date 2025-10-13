"use client";

type ActionRailProps = {
  onPredict: () => void;
  onTickets: () => void;
  onShop: () => void;
  onDonate: () => void;
};

const ActionRail = ({ onPredict, onTickets, onShop, onDonate }: ActionRailProps) => {
  const actions = [
    { label: "Predict & Win", icon: "🔮", handler: onPredict },
    { label: "Buy Tickets", icon: "🎟️", handler: onTickets },
    { label: "Club Shop", icon: "🛍️", handler: onShop },
    { label: "Donate", icon: "🤝", handler: onDonate },
  ];

  return (
    <nav
      aria-label="Fan engagement actions"
      className="sticky bottom-4 z-30 mt-8 flex justify-center"
    >
      <ul className="flex w-full max-w-xl gap-3 rounded-full bg-slate-900/80 p-2 text-sm text-white shadow-2xl">
        {actions.map((action) => (
          <li key={action.label} className="flex-1">
            <button
              type="button"
              onClick={action.handler}
              className="flex w-full flex-col items-center gap-1 rounded-full bg-white/5 px-3 py-2 font-semibold transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <span aria-hidden="true" className="text-lg">
                {action.icon}
              </span>
              <span className="text-[0.7rem] uppercase tracking-wide">
                {action.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default ActionRail;
