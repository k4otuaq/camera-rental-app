"server-only";
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkEquipmentAvailability } from "@/lib/availability";

export interface BookingInput {
  customerName: string;
  phone: string;
  identityNo: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  paymentMethod: string;
  deliveryMethod: string;
  items: { equipmentId: string; quantity: number }[];
}

function generateDONumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DO-${dateStr}-${randomSuffix}`;
}

export async function createDispatchBooking(input: BookingInput) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return { success: false, error: "Invalid booking dates provided." };
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const rentalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        // Step A: Lock and check real-time stock availability inside transaction
        const availability = await checkEquipmentAvailability(
          input.items,
          start,
          end,
          tx as typeof prisma
        );

        if (!availability.isAvailable) {
          throw new Error(availability.shortages.join(" | "));
        }

        // Step B: Calculate financial totals and populate line item records
        let dailySubtotal = 0;
        const bookingItemsData = input.items.map((item) => {
          const gear = availability.catalogMap.get(item.equipmentId)!;
          const rate = Number(gear.dailyRate);
          const itemSubtotal = rate * item.quantity;
          dailySubtotal += itemSubtotal;

          return {
            equipment: { connect: { id: item.equipmentId } },
            quantity: item.quantity,
            unitRate: rate,
            subtotal: itemSubtotal,
            startDate: input.startDate,
            endDate: input.endDate,
          };
        });

        const grandTotal = dailySubtotal * rentalDays;
        const doNumber = generateDONumber();

        // Step C: Persist DO record matching the schema's totalPrice property
        return await tx.booking.create({
          data: {
            doNumber,
            customerName: input.customerName,
            phone: input.phone,
            identityNo: input.identityNo,
            startDate: start,
            endDate: end,
            totalPrice: grandTotal,
            paymentMethod: input.paymentMethod,
            deliveryMethod: input.deliveryMethod,
            status: "CONFIRMED",
            items: {
              create: bookingItemsData,
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
      },
      {
        timeout: 10000, // 10s transaction ceiling
      }
    );

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, booking };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create booking." };
  }
}
