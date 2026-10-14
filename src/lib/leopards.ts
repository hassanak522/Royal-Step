interface LeopardsBookingPayload {
  apiKey: string;
  apiPassword: string;
  bookedPacketWeight: number; // in grams or kg per Leopards tier
  bookedPacketVolWeight?: string;
  bookedPacketNoPiece: number;
  bookedPacketCollectAmount: number; // Collectible for COD
  bookedPacketOrderNumber: string;
  originCity: string; // e.g. "Karachi"
  destinationCity: string;
  shipmentNameEng: string;
  shipmentEmail: string;
  shipmentPhone: string;
  shipmentAddress: string;
  consignmentNameEng: string;
  consignmentPhone: string;
  consignmentAddress: string;
  specialInstructions?: string;
}

export async function bookLeopardsParcel(order: any, warehouse: any) {
  const LEOPARDS_API_URL = process.env.LEOPARDS_API_URL || 'https://merchantapi.leopardscourier.com/api/bookPacket/format/json/';

  const payload: LeopardsBookingPayload = {
    apiKey: process.env.LEOPARDS_API_KEY || 'sandbox_key',
    apiPassword: process.env.LEOPARDS_API_PASSWORD || 'sandbox_pass',
    bookedPacketWeight: 1.0,
    bookedPacketNoPiece: 1,
    bookedPacketCollectAmount: order.paymentMethod === 'COD' ? order.total : 0,
    bookedPacketOrderNumber: order.orderNumber,
    originCity: 'Karachi',
    destinationCity: order.city,
    shipmentNameEng: 'Royal Step Warehouse',
    shipmentEmail: 'dispatch@royalstep.pk',
    shipmentPhone: warehouse.phone || '02135051111',
    shipmentAddress: warehouse.address || 'Plot 48, Sector 15, Korangi, Karachi',
    consignmentNameEng: order.customerName,
    consignmentPhone: order.phone,
    consignmentAddress: `${order.address}, ${order.area}`,
    specialInstructions: 'Allow open-parcel inspection before cash collection.',
  };

  try {
    const res = await fetch(LEOPARDS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    // Leopards returns { status: 1, track_number: "LEO123456", error: 0 }
    if (data.status === 1 || data.track_number) {
      return {
        success: true,
        cnNumber: data.track_number,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Leopards booking rejected.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Leopards gateway timeout',
    };
  }
}