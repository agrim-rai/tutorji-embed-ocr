import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Payment from "@/models/Payment";
import Transaction from "@/models/Transaction";

export async function GET(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = parseInt(searchParams.get("skip")) || 0;
    const type = searchParams.get("type"); // 'payments' or 'transactions' or 'all'

    const userId = session.user.id;

    let result = {};

    // Get payments if requested
    if (!type || type === "payments" || type === "all") {
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .select("-userAgent -ipAddress") // Hide sensitive data
        .lean();

      result.payments = payments;
    }

    // Get transactions if requested
    if (!type || type === "transactions" || type === "all") {
      const transactions = await Transaction.getUserTransactionHistory(
        userId,
        limit,
        skip
      );

      result.transactions = transactions;
    }

    // Get summary statistics
    if (!type || type === "all") {
      const paymentStats = await Payment.getPaymentStats(userId);
      const creditSummary = await Transaction.getUserCreditSummary(userId);

      result.statistics = {
        payments: paymentStats,
        credits: creditSummary,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
} 