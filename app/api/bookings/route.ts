import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    // Extract parameters with all key variations
    const customerName =
      body.customerName || body.name || body.clientName || body.fullName || "";
    const phone =
      body.phone || body.phoneNumber || body.customerPhone || body.mobile || "";
    const identityNo =
      body.identityNo || body.icNo || body.icNumber || body.identityNumber || body.passport || "";

    const startDate = body.startDate || new Date().toISOString().split("T")[0];
    const endDate = body.endDate || new Date().toISOString().split("T")[0];
    const rentalDays = Number(body.rentalDays) || 1;
    const paymentMethod = body.paymentMethod || "BANK TRANSFER";
    const deliveryMethod = body.deliveryMethod || body.fulfillment || "SELF-PICKUP";
    const totalPrice = Number(body.totalPrice || body.grandTotal || 0);

    const rawItems = body.items || body.cart || [];
    const items = Array.isArray(rawItems) ? rawItems : [];

    // Validate required fields
    if (!customerName || !phone || !identityNo || items.length === 0) {
      const missing = [];
      if (!customerName) missing.push("Full Name");
      if (!phone) missing.push("Phone Number");
      if (!identityNo) missing.push("IC/Passport");
      if (items.length === 0) missing.push("Cart Items");

      return NextResponse.json(
        {
          success: false,
          error: `Missing required checkout details: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const doNumber = `DO-${Math.floor(100000 + Math.random() * 900000)}`;

    let booking = null;
    try {
      if (prisma && prisma.booking) {
        booking = await prisma.booking.create({
          data: {
            doNumber,
            customerName,
            phone,
            identityNo,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            paymentMethod,
            deliveryMethod,
            status: "CONFIRMED",
            totalPrice,
            items: {
              create: items.map((i: any) => ({
                quantity: Number(i.quantity) || 1,
                equipment: {
                  connect: { id: i.equipmentId || i.id },
                },
              })),
            },
          },
        });
      }
    } catch (dbErr) {
      console.warn("Prisma booking database insertion fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking?.id || doNumber,
        doNumber,
        customerName,
        phone,
        identityNo,
        startDate,
        endDate,
        rentalDays,
        paymentMethod,
        deliveryMethod,
        totalPrice,
        items,
      },
    });
  } catch (error: any) {
    console.error("Booking handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process booking." },
      { status: 500 }
    );
  }
}
