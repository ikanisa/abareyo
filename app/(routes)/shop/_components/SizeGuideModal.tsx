"use client";

import { useState } from "react";

const SizeGuideModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Size guide
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md space-y-3 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold text-white">Size guide</h2>
            <p className="text-sm text-white/70">
              Jerseys fit true to size. Size up for a relaxed feel or down for a slim fit.
            </p>
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SizeGuideModal;
