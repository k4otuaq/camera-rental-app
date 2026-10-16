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
          subtotal: (existingItem.subtotal || 0) + addedPrice,
        },
      });
    } else {
      await (prisma as any).bookingItem.create({
        data: {
          bookingId,
          equipmentId,
          quantity: Number(quantity),
          startDate: booking.startDate ? new Date(booking.startDate).toISOString() : "",
          endDate: booking.endDate ? new Date(booking.endDate).toISOString() : "",
          subtotal: addedPrice,
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
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!bookingId || !itemId) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId or itemId" },
        { status: 400 }
      );
    }

    // Find item to get its subtotal
    const item = await (prisma as any).bookingItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Booking item not found" },
        { status: 404 }
      );
    }

    const itemSubtotal = item.subtotal || 0;

    // Delete the booking item
    await (prisma as any).bookingItem.delete({
      where: { id: itemId },
    });

    // Decrement parent booking total price
    const updatedBooking = await (prisma as any).booking.update({
      where: { id: bookingId },
      data: {
        totalPrice: {
          decrement: itemSubtotal,
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
      message: "Item removed from Delivery Order successfully",
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error("Error removing item from booking:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove item from DO" },
      { status: 500 }
    );
  }
}
