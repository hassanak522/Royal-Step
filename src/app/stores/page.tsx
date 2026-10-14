import React from 'react';
import { MapPin, Phone, Clock, MessageSquare } from 'lucide-react';

const KARACHI_STORES = [
  {
    branch: 'Tariq Road Flagship Store',
    address: 'Shop # 14-B, Dolmen Mall Tariq Road, PECHS Block 2, Karachi',
    phone: '+92 334 3239036',
    timings: '12:00 PM – 11:00 PM (Monday to Sunday)',
    mapUrl: 'https://maps.google.com/?q=Dolmen+Mall+Tariq+Road+Karachi',
    whatsapp: '923001234567',
  },
  {
    branch: 'Clifton Branch (2 Talwar)',
    address: 'Shop # 4, Near 2 Talwar, Block 8 Clifton, Karachi',
    phone: '+92 300 2345678',
    timings: '01:00 PM – 11:30 PM (Monday to Sunday)',
    mapUrl: 'https://maps.google.com/?q=2+Talwar+Clifton+Karachi',
    whatsapp: '923002345678',
  },
  {
    branch: 'Lucky One Mall Outlet',
    address: 'First Floor, Shop # F-42, Lucky One Mall, Main Rashid Minhas Rd, Karachi',
    phone: '+92 300 3456789',
    timings: '11:00 AM – 11:30 PM (Monday to Sunday)',
    mapUrl: 'https://maps.google.com/?q=Lucky+One+Mall+Karachi',
    whatsapp: '923003456789',
  }
];

export default function StoresPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-tight text-neutral-900">
          Our Karachi Outlets
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-500">
          Visit any of our physical stores for in-person shoe fittings, on-spot size exchanges, or instant collection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {KARACHI_STORES.map((store, i) => (
          <div
            key={i}
            className="border border-neutral-200 rounded-lg p-6 bg-white shadow-sm flex flex-col justify-between"
          >
            <div>
              <h2 className="text-base font-bold text-neutral-900">{store.branch}</h2>

              <div className="mt-4 flex items-start gap-2 text-xs text-neutral-600">
                <MapPin className="w-4 h-4 text-neutral-800 flex-shrink-0 mt-0.5" />
                <span>{store.address}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
                <Clock className="w-4 h-4 text-neutral-800 flex-shrink-0" />
                <span>{store.timings}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
                <Phone className="w-4 h-4 text-neutral-800 flex-shrink-0" />
                <span>{store.phone}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 flex gap-2">
              <a
                href={store.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 text-center text-[11px] font-bold uppercase tracking-wider border border-neutral-900 rounded hover:bg-neutral-900 hover:text-white transition"
              >
                Directions
              </a>
              <a
                href={`https://wa.me/${store.whatsapp}?text=Hello,%20I%20have%20an%20inquiry%20regarding%20shoes%20at%20${encodeURIComponent(store.branch)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600 text-white rounded flex items-center justify-center hover:bg-emerald-700 transition"
                aria-label="WhatsApp Store"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}