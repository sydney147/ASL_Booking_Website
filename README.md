# Staycation Booking App

A modern web booking app inspired by the Google Apps Script staycation portal.
Built with **Next.js 14 + Tailwind + Firebase + Resend**, deployable for free.

## What you get

- Browse a list of properties (homepage)
- Per-unit booking flow: pick dates, guest counts, customer info
- Live rate breakdown (server-validated on submit)
- Payment-method modal (GCash / Bank Transfer) with proof-of-payment upload
- Booking saved to Firestore + optional confirmation email via Resend
- Simple admin page to confirm or cancel bookings

The app runs even **without** Firebase configured: it falls back to 3 sample
units so you can see the UI immediately. Bookings will only save once you
add your Firebase keys.

## Folder structure

```
booking-app/
├─ app/
│  ├─ layout.tsx              # site shell
│  ├─ page.tsx                # unit list / home
│  ├─ globals.css             # Tailwind layers + buttons/fields
│  ├─ units/[id]/page.tsx     # per-unit booking page
│  ├─ admin/page.tsx          # admin dashboard
│  └─ api/
│     ├─ bookings/route.ts        # POST /api/bookings
│     └─ calculate-rates/route.ts # POST /api/calculate-rates
├─ components/
│  ├─ BookingForm.tsx
│  ├─ GuestCounter.tsx
│  ├─ PaymentModal.tsx
│  └─ SuccessModal.tsx
├─ lib/
│  ├─ firebase.ts             # SDK init, exports db/storage/auth
│  ├─ types.ts                # Unit / Booking shape + default seed data
│  ├─ rates.ts                # rate calculation (used both client + server)
│  └─ units.ts                # fetchUnits / fetchUnit
├─ firestore.rules            # default-deny + create-only bookings
├─ storage.rules              # proof uploads max 5MB, image/* or pdf
├─ .env.local.example         # copy to .env.local and fill in
└─ package.json
```

## 1. Run locally

```powershell
cd C:\Users\joshua.d.solon\Downloads\booking-app
npm install
npm run dev
```

Visit http://localhost:3000. You will see the 3 sample units; clicking
**Book Here** opens the booking page. Submitting will fail with a clear
message until Firebase is configured (next step).

## 2. Create a Firebase project (free, no credit card)

1. Go to https://console.firebase.google.com and click **Add project**.
2. Skip Google Analytics for the MVP.
3. In the project, click the **</>** web-app icon, give it a nickname,
   and copy the **firebaseConfig** values.
4. Enable **Cloud Firestore** (Build &rarr; Firestore Database &rarr; Create database,
   Production mode, pick a region close to your users e.g. `asia-southeast1`).
5. Enable **Storage** (Build &rarr; Storage &rarr; Get started, Production mode).
6. Enable **Authentication** &rarr; Sign-in method &rarr; Email/Password
   (used later for the admin dashboard).

## 3. Configure environment variables

```powershell
copy .env.local.example .env.local
notepad .env.local
```

Paste the values from step 2:

```env
NEXT_PUBLIC_FB_API_KEY=AIza...
NEXT_PUBLIC_FB_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FB_PROJECT_ID=your-project
NEXT_PUBLIC_FB_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FB_APP_ID=1:123...:web:abc...
```

Restart `npm run dev` after editing. The booking submit and admin pages
should now work.

## 4. Apply security rules

Copy `firestore.rules` and `storage.rules` into the Firebase console
(Firestore &rarr; Rules tab; Storage &rarr; Rules tab) and **Publish**.

By default the rules:

- allow anyone to read unit listings and create a `pending` booking
- block all reads/updates of bookings except for users with the
  `admin: true` custom claim

## 5. (Optional) Grant yourself admin access

You'll need this before deploying so you can manage bookings.

1. Add Firebase Authentication &rarr; sign up your own admin account
   (email + password).
2. Set an admin custom claim. Easiest path: temporarily run a Node script
   with the **Admin SDK** using a service-account key from
   *Project settings &rarr; Service accounts &rarr; Generate new private key*.

```js
// scripts/make-admin.mjs  (run once, do NOT commit the key)
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'))
  ),
});
const uid = process.argv[2];
await admin.auth().setCustomUserClaims(uid, { admin: true });
console.log('done');
```

Run with: `node scripts/make-admin.mjs <your-uid>`.

## 6. (Optional) Wire confirmation emails

1. Create a free account at https://resend.com.
2. Verify a sending domain or use the test sender.
3. Add to `.env.local`:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@yourdomain.com
```

Restart the dev server. Every booking now triggers an email.

## 7. (Optional) Seed real properties

You can manage units directly in the Firebase console
(Firestore &rarr; Add collection `units` &rarr; documents with the fields
from `lib/types.ts`). The homepage will pick them up immediately
instead of using the sample data.

Or do it in code with a small script:

```ts
// scripts/seed-units.ts (run once with: npx tsx scripts/seed-units.ts)
import { initializeApp } from 'firebase/app';
import { collection, doc, getFirestore, setDoc } from 'firebase/firestore';
import { DEFAULT_UNITS } from '../lib/types';

const app = initializeApp({ /* same config as .env.local */ });
const db = getFirestore(app);
for (const u of DEFAULT_UNITS) {
  await setDoc(doc(collection(db, 'units'), u.id), u);
  console.log('seeded', u.id);
}
```

## 8. Deploy to Vercel (free, no credit card)

```powershell
cd C:\Users\joshua.d.solon\Downloads\booking-app
git init
git add .
git commit -m "Initial booking app"
gh repo create booking-app --public --source=. --remote=origin --push
```

(If you don't have `gh` installed, create the repo on github.com manually
and `git push` to it.)

Then:

1. Go to https://vercel.com, sign in with GitHub.
2. **Import Project** &rarr; pick `booking-app`.
3. Framework is auto-detected as **Next.js**. Click **Deploy**.
4. After the first build fails (missing env vars), open the project's
   **Settings &rarr; Environment Variables** and paste the same values
   from your `.env.local`.
5. Click **Redeploy**. You now have a live `https://booking-app-xxxx.vercel.app`
   URL that works on PC and mobile.

Every `git push` to `main` redeploys automatically.

## 9. Custom domain (optional, ~PHP 500/year)

1. Buy a domain at Cloudflare Registrar (sells at cost).
2. In Vercel &rarr; Project &rarr; Settings &rarr; Domains &rarr; add the domain.
3. Add the two DNS records Vercel shows you in Cloudflare. HTTPS issues
   automatically within minutes.

## Known limits & next steps

- The calendar today is two `<input type="date">` fields. To match the
  staycation app's visual calendar, drop in
  [`react-day-picker`](https://daypicker.dev/) and color booked dates from
  the `bookings` collection.
- No double-booking guard yet. Add a server-side check in
  `app/api/bookings/route.ts` that queries `bookings` for overlapping
  date ranges of the same unit before saving.
- Admin page is unprotected. Gate it with a Firebase Auth check that
  reads the `admin` custom claim.
- Rate limiting: add Vercel KV or Upstash and reject more than ~5 booking
  attempts per IP per minute.
- For automatic (non-manual) payments, replace the proof-upload flow with
  Stripe Checkout or PayMongo and listen for `payment_intent.succeeded`
  webhooks.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server at :3000 |
| `npm run build` | Production build (Vercel runs this automatically) |
| `npm run start` | Run the production build locally |
| `npm run lint` | Type-check + lint |
