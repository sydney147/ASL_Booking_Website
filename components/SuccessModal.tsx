'use client';

import Link from 'next/link';

type Props = {
  open: boolean;
  bookingId: string;
  email?: string;
  onClose: () => void;
};

export default function SuccessModal({ open, bookingId, email, onClose }: Props) {
  if (!open) return null;

  const viewHref = email
    ? `/my-booking?id=${encodeURIComponent(bookingId)}&email=${encodeURIComponent(email)}`
    : `/my-booking?id=${encodeURIComponent(bookingId)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-brand-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-brand-light">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-100 text-green-600
                          flex items-center justify-center text-3xl mb-3">
            &#10003;
          </div>
          <h3 className="font-display text-2xl text-brand-primary mb-2">Booking received!</h3>
          <p className="text-sm text-gray-600 mb-1">
            Your booking ID is <strong className="font-mono">{bookingId}</strong>.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Save this ID. We&apos;ll also email it to you, along with a link to track your booking.
          </p>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <Link href={viewHref} className="btn-primary w-full justify-center">
            View my booking
          </Link>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-outline flex-1 justify-center">Close</button>
            <Link href="/" className="btn-outline flex-1 justify-center">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
