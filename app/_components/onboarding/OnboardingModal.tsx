'use client'

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabase } from '@/app/_lib/supabase';

/**
 * A modern onboarding modal for collecting WhatsApp and MoMo numbers.
 * It stores a unique 6‑digit code in localStorage and uses that code as
 * the user identifier in Supabase. Users can consent to promotional
 * messages on WhatsApp. The modal appears only if the user has not
 * completed onboarding previously.
 */
export function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [countryCode, setCountryCode] = useState("+250");
  const [waNumber, setWaNumber] = useState("");
  const [consentWhatsApp, setConsentWhatsApp] = useState(false);
  const [momoSame, setMomoSame] = useState(true);
  const [momoNumber, setMomoNumber] = useState("");
  const [personalCode, setPersonalCode] = useState("");

  // Check if the user has already completed onboarding on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const complete = localStorage.getItem("profileComplete");
    if (complete) {
      // Hide the modal immediately if profile is complete.
      onClose();
      return;
    }
    // Generate or retrieve a unique 6‑digit code for the user.
    let code = localStorage.getItem("personalCode");
    if (!code) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem("personalCode", code);
    }
    setPersonalCode(code);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const whatsappFull = `${countryCode}${waNumber}`;
    const momoFull = momoSame ? whatsappFull : momoNumber;

    try {
      const supabase = getSupabase && getSupabase();
      if (supabase) {
        await supabase.from("profiles").upsert({
          id: personalCode,
          whatsapp: whatsappFull,
          momo: momoFull,
          consent_whatsapp: consentWhatsApp,
        });
      }
    } catch (error) {
      console.error(error);
    }
    // Mark profile as complete so the modal won't show again.
    localStorage.setItem("profileComplete", "1");
    onClose();
  }

  function handleClose() {
    // If the user clicks Later, simply close the modal; do not mark profile complete.
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}> 
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Optional Onboarding</DialogTitle>
          <DialogDescription>
            Share your contact details to personalise your experience. This step is optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp number</label>
            <div className="flex items-center gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="rounded-md border border-gray-300 p-2 bg-background text-foreground">
                <option value="+250">🇷🇼 +250</option>
                <option value="+254">🇰🇪 +254</option>
                <option value="+256">🇺🇬 +256</option>
                <option value="+257">🇧🇮 +257</option>
                <option value="+255">🇹🇿 +255</option>
              </select>
              <Input
                type="tel"
                required
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="7xxxxxxxx"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="consent-whatsapp"
              checked={consentWhatsApp}
              onChange={(e) => setConsentWhatsApp(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="consent-whatsapp" className="text-sm">
              I consent to receive WhatsApp promotions
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">MoMo number</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="momo-same"
                checked={momoSame}
                onChange={(e) => setMomoSame(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="momo-same" className="text-sm">Same as WhatsApp</label>
            </div>
            {!momoSame && (
              <Input
                type="tel"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder="078xxxxxxx"
                className="mt-2"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose}>Later</Button>
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default OnboardingModal;
