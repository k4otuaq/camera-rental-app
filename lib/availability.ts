import { prisma } from "@/lib/prisma";

export interface InventoryCheckRequest {
  equipmentId: string;
  quantity: number;
}

export async function checkEquipmentAvailability(
  items: InventoryCheckRequest[],
  startDate: Date,
  endDate: Date,
  txPrisma = prisma
) {
  const equipmentIds = items.map((i) => i.equipmentId);

  // 1. Fetch total registered stock for requested gear
  const gearCatalog = await txPrisma.equipment.findMany({
    where: { id: { in: equipmentIds } },
    select: { id: true, name: true, stock: true, dailyRate: true },
  });

  const catalogMap = new Map(gearCatalog.map((g) => [g.id, g]));

  // 2. Aggregate quantity reserved in overlapping, active bookings
  const overlappingItems = await txPrisma.bookingItem.groupBy({
    by: ["equipmentId"],
    _sum: { quantity: true },
    where: {
      equipmentId: { in: equipmentIds },
      booking: {
        status: { in: ["PENDING", "CONFIRMED", "DISPATCHED"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    },
  });

  const reservedMap = new Map(
    overlappingItems.map((i) => [i.equipmentId, i._sum.quantity || 0])
  );

  // 3. Verify stock sufficiency
  const shortages: string[] = [];

  for (const req of items) {
    const gear = catalogMap.get(req.equipmentId);
    if (!gear) {
      shortages.push(`Equipment ID ${req.equipmentId} not found.`);
      continue;
    }

    const reservedCount = reservedMap.get(req.equipmentId) || 0;
    const availableCount = gear.stock - reservedCount;

    if (req.quantity > availableCount) {
      shortages.push(
        `Insufficient stock for "${gear.name}". Requested: ${req.quantity}, Available: ${availableCount}`
      );
    }
  }

  return {
    isAvailable: shortages.length === 0,
    shortages,
    catalogMap,
  };
}
