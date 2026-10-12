import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const db = prisma as any;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { doNumber } = body;

    if (!doNumber) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid DO Number." },
        { status: 400 }
      );
    }

    // Clean up input (e.g. "do-123456" -> "DO-123456")
    const formattedDO = doNumber.trim().toUpperCase();

    const booking = await db.booking.findFirst({
      where: {
        doNumber: formattedDO,
      },
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: `No rental order found matching DO Number "${formattedDO}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Order lookup error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
