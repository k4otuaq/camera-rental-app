import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const fallbackEquipment = [
  {
    id: "c-stand-id",
    name: "C-stand",
    category: "Stand",
    serialNumber: "CST-001",
    dailyRate: 20.0,
    imageUrl: "/cstand.jpeg",
    stock: 50
  },
  {
    id: "komodo-id",
    name: "RED Komodo 6k",
    category: "CINEMA CAMERA",
    serialNumber: "KMDBK3468",
    dailyRate: 800.0,
    imageUrl: "/komodo.webp",
    stock: 1
  },
  {
    id: "ray660-id",
    name: "AMARAN Ray 660c",
    category: "RGB Light",
    serialNumber: "RAY660H2",
    dailyRate: 400.0,
    imageUrl: "/ray660.webp",
    stock: 1
  },
  {
    id: "ray120-id",
    name: "AMARAN Ray 120c",
    category: "RGB Light",
    serialNumber: "RAY120CH",
    dailyRate: 200.0,
    imageUrl: "/ray120.webp",
    stock: 1
  }
];

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany();
    if (equipment && equipment.length > 0) {
      return NextResponse.json(equipment);
    }
    return NextResponse.json(fallbackEquipment);
  } catch (error) {
    console.error("Prisma fetch error, serving fallback inventory:", error);
    return NextResponse.json(fallbackEquipment);
  }
}

