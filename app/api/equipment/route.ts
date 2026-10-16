import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const db = prisma as any;
const defaultItems = [
  {
    name: "RED Komodo 6k",
    category: "CINEMA CAMERA",
    serialNumber: "KMDBK3468",
    dailyRate: 800,
    imageUrl: "/komodo.webp",
    stock: 3,
    rentedOut: 0,
  },
  {
    name: "AMARAN Ray 660c",
    category: "LIGHTING",
    serialNumber: "RAY660H2",
    dailyRate: 400,
    imageUrl: "/ray660.webp",
    stock: 2,
    rentedOut: 0,
  },
  {
    name: "AMARAN Ray 120c",
    category: "LIGHTING",
    serialNumber: "RAY120CH",
    dailyRate: 200,
    imageUrl: "/ray120.webp",
    stock: 4,
    rentedOut: 0,
  },
  {
    name: "C-stand",
    category: "GRIP",
    serialNumber: "CST-001",
    dailyRate: 20,
    imageUrl: null,
    stock: 10,
    rentedOut: 0,
  },
];

// GET ALL EQUIPMENT
export async function GET() {
  try {
    let equipment = await db.equipment.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (equipment.length === 0) {
      for (const item of defaultItems) {
        await db.equipment.create({ data: item });
      }
      equipment = await db.equipment.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(equipment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE NEW EQUIPMENT
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, serialNumber, dailyRate, stock, imageUrl } = body;

    if (!name || !category || !serialNumber || !dailyRate) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const item = await db.equipment.create({
      data: {
        name,
        category: category.toUpperCase(),
        serialNumber,
        dailyRate: parseFloat(dailyRate),
        stock: parseInt(stock || 1, 10),
        rentedOut: 0,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// EDIT/UPDATE EQUIPMENT
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, category, serialNumber, dailyRate, stock, imageUrl } = body;

    const updated = await db.equipment.update({
      where: { id },
      data: {
        name,
        category: category.toUpperCase(),
        serialNumber,
        dailyRate: parseFloat(dailyRate),
        stock: parseInt(stock, 10),
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE EQUIPMENT
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Equipment ID is required." }, { status: 400 });
    }

    await db.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
