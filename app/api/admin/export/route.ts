import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

export async function GET() {
  try {
    const bookings = await db.booking.findMany({
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // CSV Headers
    const headers = [
      "DO Number",
      "Order Date",
      "Customer Name",
      "IC / Passport",
      "Phone",
      "Email",
      "Equipment Rented",
      "Rental Start",
      "Rental End",
      "Fulfillment Method",
      "Payment Method",
      "Status",
      "Total Amount (RM)",
    ];

    // Format rows safely escaping commas & quotes
    const rows = bookings.map((b: any) => {
      const equipSummary = (b.items || [])
        .map((i: any) => `${i.equipment?.name || "Gear"} (${i.quantity}x)`)
        .join("; ");

      const startDate = b.items?.[0]?.startDate
        ? new Date(b.items[0].startDate).toISOString().split("T")[0]
        : "N/A";
      const endDate = b.items?.[0]?.endDate
        ? new Date(b.items[0].endDate).toISOString().split("T")[0]
        : "N/A";

      const escapeCsv = (str: any) => {
        if (!str) return '""';
        const clean = String(str).replace(/"/g, '""');
        return `"${clean}"`;
      };

      return [
        escapeCsv(b.doNumber),
        escapeCsv(new Date(b.createdAt).toISOString().split("T")[0]),
        escapeCsv(b.customerName),
        escapeCsv(b.identityNo),
        escapeCsv(b.phone),
        escapeCsv(b.email || ""),
        escapeCsv(equipSummary),
        escapeCsv(startDate),
        escapeCsv(endDate),
        escapeCsv(b.deliveryMethod),
        escapeCsv(b.paymentMethod),
        escapeCsv(b.status),
        Number(b.totalPrice || 0).toFixed(2),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rental_orders_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });

    return response;
  } catch (error: any) {
    console.error("CSV Export Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
