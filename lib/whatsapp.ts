export function buildWhatsAppDispatchLink(booking: {
  doNumber: string;
  customerName: string;
  phone: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  deliveryMethod: string;
  paymentMethod: string;
  grandTotal: number;
  items: { name: string; quantity: number; dailyRate: number }[];
}): string {
  const itemsText = booking.items
    .map(
      (i) =>
        `• ${i.name} (x${i.quantity}) - RM ${(i.dailyRate * i.quantity).toFixed(2)}/day`
    )
    .join("\n");

  const rawMessage =
    `*DISPATCH ORDER INQUIRY — ${booking.doNumber}*\n\n` +
    `*Client:* ${booking.customerName}\n` +
    `*Phone:* ${booking.phone}\n` +
    `*Dates:* ${booking.startDate} to ${booking.endDate} (${booking.rentalDays} Days)\n` +
    `*Fulfillment:* ${booking.deliveryMethod} • ${booking.paymentMethod}\n\n` +
    `*Selected Equipment:*\n${itemsText}\n\n` +
    `*Estimated Total:* RM ${booking.grandTotal.toFixed(2)}\n\n` +
    `Hi tuaq k4o™! Please review and confirm gear availability for this dispatch order.`;

  return `https://wa.me/60123456789?text=${encodeURIComponent(rawMessage)}`;
}
