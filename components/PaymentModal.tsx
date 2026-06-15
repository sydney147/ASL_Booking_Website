'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, firebaseConfigured } from '@/lib/firebase';
import { formatPHP } from '@/lib/rates';
import { DEFAULT_PAYMENT_INFO, PaymentMethod } from '@/lib/types';

type BankOption = 'unionbank' | 'maribank' | 'bpi';

const BANK_OPTIONS: { id: BankOption; label: string; qr: string }[] = [
  { id: 'unionbank', label: 'UnionBank', qr: '/QRs/UnionBank_QR.jpg' },
  { id: 'maribank', label: 'Maribank', qr: '/QRs/MariBank_QR.jpg' },
  { id: 'bpi', label: 'BPI', qr: '/QRs/BPI_QR.jpg' },
];

type Props = {
  open: boolean;
  totalAmount: number;
  onCancel: () => void;
  onSubmit: (method: PaymentMethod, proofUrl: string) => Promise<void>;
};

export default function PaymentModal({ open, totalAmount, onCancel, onSubmit }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('gcash');
  const [bankOption, setBankOption] = useState<BankOption | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    setError(null);
    if (!method) {
      setError('Please select a payment method.');
      return;
    }
    if (method === 'bank' && !bankOption) {
      setError('Please select a bank.');
      return;
    }
    if (!file) {
      setError('Please upload your proof of payment before submitting.');
      return;
    }

    let proofUrl = '';
    if (file) {
      if (!firebaseConfigured) {
        setError('Firebase Storage is not configured. Set up .env.local first.');
        return;
      }
      try {
        setUploading(true);
        const path = `proofs/${Date.now()}-${file.name}`;
        const snap = await uploadBytes(ref(storage(), path), file);
        proofUrl = await getDownloadURL(snap.ref);
      } catch (err) {
        console.error(err);
        setError('Could not upload proof. You can try again.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    try {
      setSubmitting(true);
      await onSubmit(method, proofUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBank = BANK_OPTIONS.find((b) => b.id === bankOption);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
      <div className="bg-brand-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-brand-light">
        <h3 className="font-display text-2xl text-brand-primary mb-1">Complete Your Booking</h3>
        <p className="text-sm text-gray-600 mb-4">
          Send <strong>{formatPHP(totalAmount)}</strong> using one of the methods below, then
          upload your screenshot.
        </p>

        <div className="flex gap-3 mb-4">
          {/* Left: method + bank selectors */}
          <div className="flex flex-col gap-2 w-36 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setMethod('gcash'); setBankOption(null); }}
              className={`p-3 rounded-lg border text-left ${
                method === 'gcash' ? 'border-brand-primary bg-brand-bg' : 'border-brand-light'
              }`}
            >
              <div className="font-semibold text-sm">GCash</div>
              <div className="text-xs text-gray-500 mt-0.5">Scan QR to pay</div>
            </button>
            <button
              type="button"
              onClick={() => { setMethod('bank'); setBankOption(null); }}
              className={`p-3 rounded-lg border text-left ${
                method === 'bank' ? 'border-brand-primary bg-brand-bg' : 'border-brand-light'
              }`}
            >
              <div className="font-semibold text-sm">Bank Transfer</div>
              <div className="text-xs text-gray-500 mt-0.5">UnionBank · Maribank · BPI</div>
            </button>

            {method === 'bank' && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-brand-light">
                <p className="text-xs text-gray-500">Select bank:</p>
                {BANK_OPTIONS.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setBankOption(bank.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-left ${
                      bankOption === bank.id
                        ? 'border-brand-primary bg-brand-bg text-brand-primary'
                        : 'border-brand-light text-gray-700'
                    }`}
                  >
                    {bank.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: QR code */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-gray-50 border border-brand-light min-h-[200px]">
            {method === 'gcash' ? (
              <>
                <p className="text-xs font-medium text-gray-700">Scan to pay via GCash</p>
                <button
                  type="button"
                  onClick={() => setPreviewSrc('/QRs/Gcash_QR.jpg')}
                  className="relative w-56 h-56 cursor-zoom-in rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  title="Click to enlarge"
                >
                  <Image
                    src="/QRs/Gcash_QR.jpg"
                    alt="GCash QR Code"
                    fill
                    className="object-contain"
                  />
                </button>
                <p className="text-xs text-gray-400">Tap QR to enlarge</p>
                <p className="text-xs text-gray-600">
                  GCash: <span className="font-semibold text-brand-primary">0915 975 7367</span>
                </p>
                <a
                  href="/QRs/Gcash_QR.jpg"
                  download="GCash_QR.jpg"
                  className="text-xs text-brand-primary underline hover:opacity-75"
                >
                  Download QR
                </a>
              </>
            ) : selectedBank ? (
              <>
                <p className="text-xs font-medium text-gray-700">Scan to pay via {selectedBank.label}</p>
                <button
                  type="button"
                  onClick={() => setPreviewSrc(selectedBank.qr)}
                  className="relative w-56 h-56 cursor-zoom-in rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  title="Click to enlarge"
                >
                  <Image
                    src={selectedBank.qr}
                    alt={`${selectedBank.label} QR Code`}
                    fill
                    className="object-contain"
                  />
                </button>
                <p className="text-xs text-gray-400">Tap QR to enlarge</p>
                <a
                  href={selectedBank.qr}
                  download={`${selectedBank.label}_QR.jpg`}
                  className="text-xs text-brand-primary underline hover:opacity-75"
                >
                  Download QR
                </a>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center">Select a bank to view its QR code</p>
            )}
          </div>
        </div>

        {/* QR lightbox */}
        {previewSrc && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewSrc(null)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt="QR Code"
                className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setPreviewSrc(null)}
                className="absolute -top-3 -right-3 bg-white rounded-full w-7 h-7 flex items-center justify-center text-gray-700 shadow text-sm font-bold hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="label">
            Upload proof of payment <span className="text-red-400">*</span>
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="field"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Screenshot or PDF of your transaction receipt, max 5MB.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={uploading || submitting}
            className="btn-outline flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || submitting}
            className="btn-primary flex-1 justify-center"
          >
            {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
