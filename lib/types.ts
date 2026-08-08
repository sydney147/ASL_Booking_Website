export type Unit = {
  id: string;
  name: string;
  description: string;
  address: string;       // Building / neighborhood
  location: string;      // Tower / Floor / Room within the building
  imageUrl: string;
  standardRate: number;
  cleaningFee: number;
  maxGuests: number;
  extraGuestRate: number;
};

export type Guests = {
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

export type Customer = {
  name: string;
  email: string;
  phone: string;
};

export type PaymentMethod = 'gcash' | 'bank' | null;
export type PaymentOption = 'reservation' | 'full';

export type BookingInput = {
  unitId: string;
  unitName: string;
  customer: Customer;
  checkIn: string;
  checkOut: string;
  guests: Guests;
  paymentMethod: PaymentMethod;
  paymentOption: PaymentOption;
  proofUrl: string;
  specialRequests?: string;
};

export type RateBreakdown = {
  nights: number;
  roomTotal: number;
  cleaningFee: number;
  extraGuestFee: number;
  totalAmount: number;
};

// A manually blocked date range for a unit — e.g. because it's booked on
// Airbnb directly rather than through this site. Not tied to a real booking.
export type BlockedRange = {
  id: string;
  unitId: string;
  unitName: string;
  startDate: string;   // YYYY-MM-DD, inclusive
  endDate: string;      // YYYY-MM-DD, exclusive (same convention as checkOut)
  reason: string;
  createdAt?: string | null;
  createdBy?: string;
};

export const DEFAULT_UNITS: Unit[] = [
  {
    id: 'room-2421',
    name: 'Unit 1',
    description: 'Tower 5, Floor 24, Room 2421 — A beautifully styled studio featuring a plush queen-size bed with elegant floral bedding, a cozy loveseat, and a wall-mounted Smart TV. The warm, well-lit space comes with a fully equipped kitchen, a clean private bathroom with hot and cold shower, and tasteful artwork throughout. Perfect for couples or small groups looking for a comfortable home away from home right in the heart of Cebu\'s IT Park.',
    address: 'Avida Towers Riala, Geonzon St., I.T. Park, Lahug, Cebu City',
    location: 'Tower 5, Floor 24, Room 2421',
    imageUrl: '/2421/IMG_4358.jpg',
    standardRate: 1600,
    cleaningFee: 400,
    maxGuests: 3,
    extraGuestRate: 400,
  },
  {
    id: 'room-2621',
    name: 'Unit 2',
    description: 'Tower 5, Floor 26, Room 2621 — A warmly furnished studio with a full-size bed dressed in classic blue floral bedding, a sofa with vibrant accent pillows, and a compact fully equipped kitchen with wooden cabinetry. Natural light fills the space through large windows, with open city and greenery views from the 26th floor. Comes with a wall-mounted Smart TV, aircon, fridge, and all the essentials for a relaxing stay — great for small families or groups of up to 4 guests.',
    address: 'Avida Towers Riala, Geonzon St., I.T. Park, Lahug, Cebu City',
    location: 'Tower 5, Floor 26, Room 2621',
    imageUrl: '/2621/IMG_4322.jpg',
    standardRate: 1600,
    cleaningFee: 500,
    maxGuests: 4,
    extraGuestRate: 500,
  },
  {
    id: 'room-2521',
    name: 'Unit 3',
    description: 'Tower 5, Floor 25, Room 2521 — A bright, thoughtfully arranged studio in Avida Towers Riala, right in the heart of Cebu\'s IT Park. Features a comfortable bed, a compact fully equipped kitchen, a private bathroom with hot and cold shower, and a wall-mounted Smart TV. Large windows fill the space with natural light and open views from the 25th floor. Ideal for small groups of up to 5 guests looking for a comfortable, homey stay close to dining, work, and city life.',
    address: 'Avida Towers Riala, Geonzon St., I.T. Park, Lahug, Cebu City',
    location: 'Tower 5, Floor 25, Room 2521',
    imageUrl: '/2521/IMG_4288.jpg',
    standardRate: 1600,
    cleaningFee: 400,
    maxGuests: 5,
    extraGuestRate: 350,
  },
  {
    id: 'room-526',
    name: 'Unit 5',
    description: 'Tower 5, Floor 5, Room 526 — A cozy, low-floor studio in Avida Towers Riala offering easy access with fewer elevator waits. Features a comfortable bed, a compact fully equipped kitchen, a private bathroom with hot and cold shower, and a wall-mounted Smart TV. Perfect for small groups of up to 5 guests who want a relaxed stay right in the heart of Cebu\'s IT Park — walking distance to dining, cafes, and business hubs.',
    address: 'Avida Towers Riala, Geonzon St., I.T. Park, Lahug, Cebu City',
    location: 'Tower 5, Floor 5, Room 526',
    imageUrl: '/526/att._fJPYgoPF6nBsG4WrStm6G2McqieI64zn1AQimNTqGE.jpg',
    standardRate: 1600,
    cleaningFee: 400,
    maxGuests: 5,
    extraGuestRate: 350,
  },
];

export const DEFAULT_PAYMENT_INFO = {
  gcashName: 'Booking Host',
  gcashNumber: '0917-000-0000',
  gcashQrUrl: '',
  bankName: 'BPI',
  bankAccountName: 'Booking Host Inc.',
  bankAccountNumber: '0000-0000-00',
};
