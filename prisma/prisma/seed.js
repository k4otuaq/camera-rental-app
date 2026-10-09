const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear out old records
  await prisma.booking.deleteMany();
  await prisma.equipment.deleteMany();

  // Populate items with exact stock numbers
  await prisma.equipment.createMany({
    data: [
      {
        name: "C-stand",
        category: "Stand",
        serialNumber: "CST-001",
        dailyRate: 20.0,
        imageUrl: "/cstand.jpeg",
        stock: 50
      },
      {
        name: "RED Komodo 6k",
        category: "CINEMA CAMERA",
        serialNumber: "KMDBK3468",
        dailyRate: 800.0,
        imageUrl: "/komodo.webp",
        stock: 1
      },
      {
        name: "AMARAN Ray 660c",
        category: "RGB Light",
        serialNumber: "RAY660H2",
        dailyRate: 400.0,
        imageUrl: "/ray660.webp",
        stock: 1
      },
      {
        name: "AMARAN Ray 120c",
        category: "RGB Light",
        serialNumber: "RAY120CH",
        dailyRate: 200.0,
        imageUrl: "/ray120.webp",
        stock: 1
      }
    ]
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
