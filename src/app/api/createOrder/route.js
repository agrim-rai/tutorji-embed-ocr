import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Payment from "@/models/Payment";

const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const planCredits = {
    bronze: 100,
    silver: 300,
    gold: 1000,
};

const planAmounts = {
    bronze: 177,
    silver: 478,
    gold: 1416,
};

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

        // Get request data
        const { amount, planType } = await request.json();
        
        // Validate plan type and amount
        if (!planType || !planAmounts[planType] || planAmounts[planType] !== amount) {
            return NextResponse.json(
                { error: "Invalid plan or amount" }, 
                { status: 400 }
            );
        }

        // Get user details
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" }, 
                { status: 404 }
            );
        }

        // Get client IP and user agent
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        // Generate receipt
        const receipt = "receipt_" + Math.random().toString(36).substring(2, 15);

        // Create Razorpay order
        const order = await razorpayClient.orders.create({
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: receipt,
        });

        // Create payment record in database
        const payment = new Payment({
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            orderId: order.id,
            amount: amount,
            currency: "INR",
            credits: planCredits[planType],
            planType: planType,
            status: "pending",
            receipt: receipt,
            ipAddress: ip,
            userAgent: userAgent,
        });

        await payment.save();

        // Return order details
        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            status: order.status,
            planType: planType,
            credits: planCredits[planType],
        });

    } catch (error) {
        console.error("Create order error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message }, 
            { status: 500 }
        );
    }
}
