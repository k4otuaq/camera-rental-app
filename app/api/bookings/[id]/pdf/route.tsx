import { NextRequest, NextResponse } from "next/server";
import React from "react";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";

const styles = StyleSheet.create({
  page: { padding: 35, fontSize: 10, fontFamily: "Helvetica", color: "#18181b" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderColor: "#e4e4e7", paddingBottom: 15, marginBottom: 15 },
  brand: { fontSize: 20, fontWeight: "bold" },
  doBadge: { fontSize: 12, color: "#059669", fontWeight: "bold" },
  section: { marginVertical: 8 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderColor: "#f4f4f5" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 4, fontWeight: "bold" },
  colItem: { width: "50%" },
  colQty: { width: "20%", textAlign: "center" },
  colRate: { width: "30%", textAlign: "right" },
  totalBox: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderColor: "#18181b", textAlign: "right" },
  alignRight: { alignItems: "flex-end" },
  boldMarginBottom: { fontWeight: "bold", marginBottom: 2 },
  boldMarginTop: { fontWeight: "bold", marginTop: 4 },
  grandTotalText: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
});

function InvoicePdf({ booking }: { booking: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>tuaq k4o™ tech & support</Text>
            <Text>Kuala Lumpur, Malaysia • k4otuaqstudio@gmail.com</Text>
          </View>
          <View style={styles.alignRight}>
            <Text style={styles.doBadge}>DISPATCH QUOTE</Text>
            <Text style={styles.boldMarginTop}>{booking.doNumber}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.boldMarginBottom}>CLIENT INFORMATION</Text>
            <Text>{booking.customerName}</Text>
            <Text>{booking.phone}</Text>
            <Text>IC/Passport: {booking.identityNo}</Text>
          </View>
          <View>
            <Text style={styles.boldMarginBottom}>RENTAL DATES</Text>
            <Text>Start: {new Date(booking.startDate).toISOString().split("T")[0]}</Text>
            <Text>End: {new Date(booking.endDate).toISOString().split("T")[0]}</Text>
            <Text>Duration: {booking.rentalDays} Day(s)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>EQUIPMENT ITEM</Text>
            <Text style={styles.colQty}>QTY</Text>
            <Text style={styles.colRate}>DAILY RATE</Text>
          </View>
          {booking.items?.map((item: any, idx: number) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.colItem}>{item.equipment?.name || item.name || "Gear Item"}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>RM {Number(item.unitRate || item.dailyRate || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text>Daily Subtotal: RM {Number(booking.dailySubtotal || 0).toFixed(2)}</Text>
          <Text style={styles.grandTotalText}>
            Estimated Total: RM {Number(booking.grandTotal || booking.totalPrice || 0).toFixed(2)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { items: { include: { equipment: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const pdfBuffer = await pdf(<InvoicePdf booking={booking} />).toBuffer();

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${booking.doNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate PDF" }, { status: 500 });
  }
}
