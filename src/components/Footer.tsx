import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, MessageSquare, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Footer() {
  const MalirTownAddress = 'Plot # 12, Commercial Block, Phase 1, Malir Town, Karachi';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Royal Step Shoes Malir Town Karachi'
  )}`;

  return (
    <footer id="store-locator" className="bg-neutral-950 text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Bio */}
        <div>
          <h3 className="text-xl font-black tracking-widest text-white uppercase">ROYAL &bull; STEP</h3>
          <p className="mt-3 text-xs leading-relaxed text-neutral-400">
            Authentic Pakistani footwear crafted with grade-A full grain cow and buffalo leather. Nationwide delivery with our signature open-parcel guarantee.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Open Parcel Before Payment Guaranteed</span>
          </div>
        </div>

        {/* Quick Nav */}
        <div>
          <h4 className="text-xs font-bold tracking-wider text-white uppercase">Categories</h4>
          <ul className="mt-4 space-y-2 text-xs text-neutral-400">
            <li><Link href="/category/traditional" className="hover:text-white">Peshawari & Kaptaan Chappals</Link></li>
            <li><Link href="/category/men" className="hover:text-white">Men&apos;s Formal Oxfords & Derbies</Link></li>
            <li><Link href="/category/women" className="hover:text-white">Women&apos;s Block Heels & Khussas</Link></li>
            <li><Link href="/category/kids" className="hover:text-white">Kids&apos; School & Active Shoes</Link></li>
          </ul>
        </div>

        {/* Physical Karachi Outlet / Store Locator */}
        <div className="md:col-span-2 border border-neutral-800 rounded-lg p-5 bg-neutral-900/60">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" />
              Visit Our Malir Town, Karachi Outlet
            </h4>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              Open in Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="mt-4 space-y-2 text-xs text-neutral-300">
            <p className="leading-relaxed">
              <strong>Address:</strong> {MalirTownAddress}
            </p>
            <p className="flex items-center gap-2 text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-neutral-300" />
              <span>11:00 AM – 11:00 PM (Monday to Sunday)</span>
            </p>
            <p className="flex items-center gap-2 text-neutral-400">
              <Phone className="w-3.5 h-3.5 text-neutral-300" />
              <span>+92 334 3239036 / 021-3518XXXX</span>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-neutral-900 rounded font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition"
            >
              Get Store Directions
            </a>
            <a
              href="https://wa.me/923001234567?text=Hi%20Royal%20Step,%20I%20am%20outside%20your%20Malir%20Town%20branch."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#25D366] text-white rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#20ba5a] transition"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Outlet Support
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-neutral-900 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} Royal Step Footwear. Handcrafted in Pakistan.
      </div>
    </footer>
  );
}