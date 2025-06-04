import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Contact from '@/models/Contact';

// POST /api/contact - Create a new contact submission
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, subject, message, phone, company, isUrgent } = body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    // Create new contact submission
    const contact = new Contact({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      phone: phone ? phone.trim() : undefined,
      company: company ? company.trim() : undefined,
      isUrgent: Boolean(isUrgent),
    });

    await contact.save();

    return NextResponse.json(
      { 
        message: 'Contact form submitted successfully', 
        id: contact._id,
        estimatedResponse: isUrgent ? '24-48 hours' : '2-3 working days'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating contact submission:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/contact - Fetch all contact submissions (for admin)
export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all contacts sorted by creation date (newest first)
    const contacts = await Contact.find({})
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 