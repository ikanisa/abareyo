'use client'

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * A modern onboarding modal for collecting WhatsApp and MoMo numbers.
 * It stores a unique 6‑digit code in localStorage and uses that code as
 * the user identifier in Supabase. Users can consent to promotional
 * messages on WhatsApp. The modal appears only if the user has not
 * completed onboarding previously.
 */
const DEFAULT_COUNTRY_CODE = "+250";

const getStorage = () => (typeof window === "undefined" ? null : window.localStorage);

const ensurePersonalCode = (storage: Storage | null) => {
  if (!storage) return "";
  let code = storage.getItem("personalCode");
  if (!code) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    storage.setItem("personalCode", code);
  }
  return code;
};

export function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [waNumber, setWaNumber] = useState("");
  const [consentWhatsApp, setConsentWhatsApp] = useState(true);
  const [momoSame, setMomoSame] = useState(true);
  const [momoNumber, setMomoNumber] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const previousOpen = useRef(open);

  // Check if the user has already completed onboarding on mount.
  useEffect(() => {
    const storage = getStorage();
    if (!storage) return;

    const complete = storage.getItem("profileComplete");
    if (complete) {
      // Hide the modal immediately if profile is complete.
      onClose();
      return;
    }
    // Generate or retrieve a unique 6‑digit code for the user.
    setPersonalCode(ensurePersonalCode(storage));
  }, []);

  useEffect(() => {
    if (open && !previousOpen.current) {
      setCountryCode(DEFAULT_COUNTRY_CODE);
      setWaNumber("");
      setConsentWhatsApp(true);
      setMomoSame(true);
      setMomoNumber("");
    }
    previousOpen.current = open;
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const whatsappFull = `${countryCode}${waNumber}`;
    const momoFull = momoSame ? whatsappFull : momoNumber;

    const storage = getStorage();
    const code = personalCode || ensurePersonalCode(storage);

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase && code) {
        await supabase.from("profiles").upsert({
          id: code,
          whatsapp: whatsappFull,
          momo: momoFull,
          consent_whatsapp: consentWhatsApp,
        });
      }
    } catch (error) {
      console.error(error);
    }
    // Mark profile as complete so the modal won't show again.
    if (storage) {
      if (!personalCode && code) {
        setPersonalCode(code);
      }
      storage.setItem("profileComplete", "1");
    }
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
            <label htmlFor="whatsapp-number" className="mb-1 block text-sm font-medium">
              WhatsApp number
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="whatsapp-country-code"
                type="tel"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                placeholder="+250"
                className="w-20"
                aria-label="Country code"
              />
              <Input
                id="whatsapp-number"
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
                id="momo-number"
                type="tel"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder="07xxxxxxx"
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
