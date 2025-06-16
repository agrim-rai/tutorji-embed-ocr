import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Transaction from "@/models/Transaction";

const generatedSignature = (
  razorpayOrderId,
  razorpayPaymentId
) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const sig = crypto
    .createHmac("sha256", keySecret)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest("hex");
  return sig;
};

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Authentication required", isOk: false },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    const { orderId, razorpayPaymentId, razorpaySignature } =
      await request.json();

    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { message: "Missing required payment parameters", isOk: false },
        { status: 400 }
      );
    }

    // Verify payment signature
    const signature = generatedSignature(orderId, razorpayPaymentId);
    if (signature !== razorpaySignature) {
      // Update payment record as failed
      const payment = await Payment.findOne({ orderId });
      if (payment) {
        await payment.markFailed("Signature verification failed", "Invalid payment signature");
      }

      return NextResponse.json(
        { message: "payment verification failed", isOk: false },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json(
        { message: "Payment record not found", isOk: false },
        { status: 404 }
      );
    }

    // Verify the payment belongs to the current user
    if (payment.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Payment verification failed - user mismatch", isOk: false },
        { status: 403 }
      );
    }

    // Check if payment is already processed
    if (payment.status === "success") {
      return NextResponse.json(
        { message: "Payment already processed", isOk: true },
        { status: 200 }
      );
    }

    // Start transaction to ensure data consistency
    const session_db = await dbConnect().then(conn => conn.startSession());
    session_db.startTransaction();

    try {
      // Update payment record as successful
      await payment.markSuccess(razorpayPaymentId, razorpaySignature);

      // Get user and update credits
      const user = await User.findById(payment.userId).session(session_db);
      if (!user) {
        throw new Error("User not found");
      }

      const oldCredits = user.credits;
      const newCredits = oldCredits + payment.credits;

      // Update user credits
      await User.findByIdAndUpdate(
        payment.userId,
        { 
          credits: newCredits,
          updatedAt: new Date()
        },
        { session: session_db }
      );

      // Create transaction record
      await Transaction.createCreditPurchase(
        payment.userId,
        payment.userEmail,
        payment.credits,
        payment._id,
        payment.orderId,
        payment.planType,
        payment.amount
      );

      // Commit the transaction
      await session_db.commitTransaction();

      console.log(`Payment successful: User ${user.email} purchased ${payment.credits} credits for ₹${payment.amount}`);

      return NextResponse.json(
        { 
          message: "payment verified successfully", 
          isOk: true,
          credits: payment.credits,
          newBalance: newCredits
        },
        { status: 200 }
      );

    } catch (error) {
      // Rollback transaction on error
      await session_db.abortTransaction();
      console.error("Payment processing error:", error);

      // Update payment record as failed
      await payment.markFailed("Processing error", error instanceof Error ? error.message : "Unknown error");

      return NextResponse.json(
        { message: "Payment processing failed", isOk: false },
        { status: 500 }
      );
    } finally {
      await session_db.endSession();
    }

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { message: "Internal server error", isOk: false },
      { status: 500 }
    );
  }
}