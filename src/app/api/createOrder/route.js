import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
    try{
    const {amount} = await request.json();
    const order = await razorpayClient.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: "receipt_" + Math.random().toString(36).substring(2, 15),
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
