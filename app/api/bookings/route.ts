import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const db = prisma as any;

const parseValidDate = (dateStr: any) => {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

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
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      doNumber,
      customerName,
      phone,
      identityNo,
      email,
      deliveryMethod,
      address,
      paymentMethod,
      notes,
      totalPrice,
      cart,
    } = body;

    if (!customerName || !phone || !identityNo || !cart || cart.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required checkout details or empty cart." },
        { status: 400 }
      );
    }

    const firstStart = parseValidDate(cart[0]?.startDate);
    const firstEnd = parseValidDate(cart[0]?.endDate);

    const result = await db.$transaction(async (tx: any) => {
      const generatedDO = doNumber || `DO-${Math.floor(100000 + Math.random() * 900000)}`;

      const booking = await tx.booking.create({
        data: {
          doNumber: String(generatedDO),
          customerName: String(customerName),
          phone: String(phone),
          identityNo: String(identityNo),
          email: email ? String(email) : null,
          deliveryMethod: String(deliveryMethod || "Self Pickup"),
          address: address ? String(address) : null,
          paymentMethod: String(paymentMethod || "Cash"),
          notes: notes ? String(notes) : null,
          totalPrice: Number(totalPrice) || 0,
          status: "CONFIRMED",
          startDate: firstStart,
          endDate: firstEnd,
        },
      });

      for (const c of cart) {
        let matchedEquipmentId: string | null = null;
        const targetId = c.item?.id || c.equipmentId || c.id;

        if (targetId) {
          const found = await tx.equipment.findUnique({
            where: { id: String(targetId) },
          });
          if (found) {
            matchedEquipmentId = found.id;
            await tx.equipment.update({
              where: { id: found.id },
              data: {
                rentedOut: {
                  increment: Number(c.quantity) || 1,
                },
              },
            });
          }
        }

        await tx.bookingItem.create({
          data: {
            bookingId: booking.id,
            equipmentId: matchedEquipmentId,
            quantity: Number(c.quantity) || 1,
            startDate: String(c.startDate || new Date().toISOString().split("T")[0]),
            endDate: String(c.endDate || new Date().toISOString().split("T")[0]),
            subtotal: Number(c.subtotal) || 0,
          },
        });
      }

      return booking;
    });

    return NextResponse.json({ success: true, booking: result });
  } catch (error: any) {
    console.error("PRISMA CHECKOUT ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Booking ID is required." }, { status: 400 });
    }

    await db.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id: String(bookingId) },
        include: { items: true },
      });

      if (!booking) throw new Error("Booking not found");

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "RETURNED" },
      });

      for (const item of booking.items) {
        if (item.equipmentId) {
          await tx.equipment.update({
            where: { id: item.equipmentId },
            data: {
              rentedOut: {
                decrement: Number(item.quantity) || 1,
              },
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
