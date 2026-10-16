import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    const body = await req.json();
    const { equipmentId, quantity } = body;

    if (!bookingId || !equipmentId || !quantity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (equipmentId or quantity)" },
        { status: 400 }
      );
    }

    const booking = await (prisma as any).booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const equipment = await (prisma as any).equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: "Equipment item not found" },
        { status: 404 }
      );
    }

    let rentalDays = 1;
    if (booking.startDate && booking.endDate) {
      const start = new Date(booking.startDate).getTime();
      const end = new Date(booking.endDate).getTime();
      const diffTime = Math.abs(end - start);
      rentalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const addedPrice = equipment.dailyRate * Number(quantity) * rentalDays;

    const existingItem = await (prisma as any).bookingItem.findFirst({
      where: {
        bookingId,
        equipmentId,
      },
    });

    if (existingItem) {
      await (prisma as any).bookingItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + Number(quantity),
        },
      });
    } else {
      await (prisma as any).bookingItem.create({
        data: {
          bookingId,
          equipmentId,
          quantity: Number(quantity),
        },
      });
    }

    const updatedBooking = await (prisma as any).booking.update({
      where: { id: bookingId },
      data: {
        totalPrice: {
          increment: addedPrice,
        },
      },
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Item appended to Delivery Order successfully",
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error("Error adding item to booking:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add item to DO" },
      { status: 500 }
    );
  }
}
