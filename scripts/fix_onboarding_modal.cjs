const fs = require('fs');

// Path to the existing onboarding modal component
const filePath = 'app/_components/onboarding/OnboardingModal.tsx';

const newContent = `"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "@/app/_lib/supabase";

type OnboardingModalProps = {
  open: boolean;
  onClose: () => void;
};

// Generate a random 6‑digit code for the user if none exists yet
const generateUserCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const supabase = getSupabase();
  const [countryCode, setCountryCode] = useState("+250");
  const [waNumber, setWaNumber] = useState("");
  const [sameNumber, setSameNumber] = useState(true);
  const [momoNumber, setMomoNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  // If the modal opens and the profile is already complete, immediately close it
  useEffect(() => {
    if (!open) return;
    if (typeof window !== "undefined") {
      const completed = window.localStorage.getItem('profileComplete');
      if (completed === 'true') {
        onClose();
      }
    }
  }, [open, onClose]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const whatsappFull = `${countryCode}${waNumber}`;
    const momoFull = sameNumber ? whatsappFull : momoNumber;

    // Use existing userCode from localStorage or generate a new one
    let userCode: string | null = null;
    if (typeof window !== "undefined") {
      userCode = window.localStorage.getItem('userCode');
    }
    if (!userCode) {
      userCode = generateUserCode();
    }

    // Persist the data to Supabase if the client is available
    if (supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(
            {
              user_code: userCode,
              whatsapp: whatsappFull,
              momo: momoFull,
              consent: consent,
            },
            { onConflict: 'user_code' }
          );
        if (error) {
          console.error('Failed to save profile', error);
        }
      } catch (error) {
        console.error('Error saving profile', error);
      }
    }

    // Mark the profile as complete locally
    if (typeof window !== "undefined") {
      window.localStorage.setItem('userCode', userCode);
      window.localStorage.setItem('profileComplete', 'true');
    }

    setLoading(false);
    onClose();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="card fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-lg -translate-y-1/2 space-y-4 p-6 focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">
                Optional Onboarding
              </Dialog.Title>
              <Dialog.Description className="muted text-sm">
                Share contact details now or come back later. We’ll only use this to personalise your experience.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="btn" aria-label="Close onboarding">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form className="space-y-4" onSubmit={handleSave}>
            {/* WhatsApp number */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">WhatsApp number</label>
              <div className="flex gap-2">
                <select
                  className="rounded-md bg-black/25 px-3 py-2 text-white"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="+250">🇷🇼 +250</option>
                  <option value="+254">🇰🇪 +254</option>
                  <option value="+255">🇹🇿 +255</option>
                  <option value="+256">🇺🇬 +256</option>
                  <option value="+257">🇧🇮 +257</option>
                </select>
                <input
                  type="tel"
                  pattern="\d{6,12}"
                  placeholder="7xxx xxx xxx"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 rounded-md bg-black/25 px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <label htmlFor="consent" className="text-xs text-white/80">
                  I agree to be contacted on WhatsApp for team promotions and updates.
                </label>
              </div>
            </div>

            {/* MoMo number toggle and field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="sameNumber"
                  type="checkbox"
                  checked={sameNumber}
                  onChange={(e) => setSameNumber(e.target.checked)}
                />
                <label htmlFor="sameNumber" className="text-sm text-white">
                  MoMo number is same as WhatsApp number
                </label>
              </div>
              {!sameNumber && (
                <div>
                  <label className="text-sm font-semibold text-white">MoMo number</label>
                  <input
                    type="tel"
                    pattern="^07\d{8}$"
                    placeholder="078x xxxx"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-md bg-black/25 px-3 py-2 text-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  // Skip and mark as complete without saving numbers
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('profileComplete', 'true');
                  }
                  onClose();
                }}
              >
                Later
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
            <p className="muted text-xs">
              Sharing your WhatsApp and MoMo numbers is optional. You can update it later in your profile.
            </p>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
`;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log(`Updated ${filePath} with new onboarding modal.`);
