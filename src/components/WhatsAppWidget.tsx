'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

const SUPPORT_PHONE = '923001234567'; // Update with Royal Step official WhatsApp line

export default function WhatsAppWidget() {
  const genericMessage = encodeURIComponent(
    'Hi Royal Step! I have a question about your footwear collection and sizes.'
  );

  return (
    <aside
      aria-label="Customer Support"
      className="fixed bottom-5 right-5 z-50 flex items-center group"
    >
      <div className="hidden sm:block mr-2.5 bg-neutral-900 text-white text-[11px] font-semibold py-1.5 px-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Chat with us on WhatsApp
      </div>
      <a
        href={`https://wa.me/${SUPPORT_PHONE}?text=${genericMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-13 h-13 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform duration-150"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
      </a>
    </aside>
  );
}