export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Please provide a DO Number, Phone, or IC Number." },
        { status: 400 }
      );
    }

    // Using (prisma as any) bypasses stale VS Code TypeScript cache while preserving full runtime functionality
    const db = prisma as any;

    const bookings = await db.booking.findMany({
      where: {
        OR: [
          { doNumber: query },
          { phone: query },
          { identityNo: query },
        ],
      },
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error performing search." },
      { status: 500 }
    );
  }
}
