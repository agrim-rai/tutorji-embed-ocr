import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Payment from "@/models/Payment";

export async function POST(request) {
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

    const { orderId, error, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // Verify the payment belongs to the current user
    if (payment.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update payment as failed
    await payment.markFailed(error || "Payment failed", reason || "Payment was not completed");

    console.log(`Payment failed: Order ${orderId} for user ${payment.userEmail}`);

    return NextResponse.json({
      message: "Payment failure recorded",
      orderId: orderId,
    });

  } catch (error) {
    console.error("Payment failure recording error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
} 