'use client';

import { useState, FormEvent, useEffect } from 'react';

type Info = { name: string; email: string; phone: string };

type Props = {
  open: boolean;
  initial: Info & { specialRequests: string };
  onCancel: () => void;
  onContinue: (info: Info, specialRequests: string) => void;
};

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

function isValidPHMobile(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('09');
}

export default function GuestInfoDialog({ open, initial, onCancel, onContinue }: Props) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [specialRequests, setSpecialRequests] = useState(initial.specialRequests);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset state if the dialog reopens with fresh data.
  useEffect(() => {
    if (open) {
      setName(initial.name);
      setEmail(initial.email);
      setPhone(initial.phone);
      setSpecialRequests(initial.specialRequests);
      setErrors([]);
    }
  }, [open, initial.name, initial.email, initial.phone, initial.specialRequests]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim())                       errs.push('Full name is required.');
    if (!/^\S+@\S+\.\S+$/.test(email))      errs.push('Valid email is required.');
    if (!phone.trim())                      errs.push('Contact number is required.');
    else if (!isValidPHMobile(phone))       errs.push('Phone must be an 11-digit number starting with 09 (e.g. 0945 392 1991).');
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    onContinue({ name: name.trim(), email: email.trim(), phone }, specialRequests.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-brand-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 border border-brand-light"
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="flex items-center gap-1 text-brand-primary font-semibold">
            <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px]">1</span>
            Your details
          </span>
          <div className="flex-1 h-0.5 bg-brand-light" />
          <span className="flex items-center gap-1 text-brand-secondary">
            <span className="w-5 h-5 rounded-full bg-brand-light text-gray-500 flex items-center justify-center text-[10px]">2</span>
            Payment
          </span>
        </div>

        <h3 className="font-display text-xl sm:text-2xl text-brand-primary mb-1">Your Details</h3>
        <p className="text-sm text-gray-600 mb-4">
          We&apos;ll use these to confirm your booking and send you the receipt.
        </p>

        <div className="space-y-3">
          <div>
            <label className="label">Full Name <span className="text-red-400">*</span></label>
            <input
              className="field"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Contact Number <span className="text-red-400">*</span></label>
            <input
              type="tel"
              inputMode="numeric"
              className="field"
              placeholder="0000 000 0000"
              maxLength={13}
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Email Address <span className="text-red-400">*</span></label>
            <input
              type="email"
              className="field"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Special Requests <span className="text-brand-secondary normal-case tracking-normal text-[10px] ml-1">(optional)</span></label>
            <textarea
              className="field resize-none"
              rows={2}
              maxLength={500}
              placeholder="Early check-in? Accessibility needs? Let us know."
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
            <ul className="space-y-1 text-xs text-red-600">
              {errors.map(err => <li key={err}>• {err}</li>)}
            </ul>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 justify-center"
          >
            Continue to Payment →
          </button>
        </div>
      </form>
    </div>
  );
}
