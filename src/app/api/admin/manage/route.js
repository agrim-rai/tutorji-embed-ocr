/**
 * Admin Management API Route
 * 
 * This API route provides endpoints for managing admin users in the system.
 * Only existing admins can use these endpoints to promote or demote users.
 * 
 * @route /api/admin/manage
 * @access Admin only
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  promoteUserToAdmin,
  revokeAdminAccess,
  getAllAdmins,
  bulkPromoteToAdmin
} from '@/lib/adminUtils';

/**
 * GET - Get all admin users
 */
export async function GET() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const result = await getAllAdmins();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to fetch admins' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admins: result.admins
    });

  } catch (error) {
    console.error('Error in GET /api/admin/manage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Promote user(s) to admin or revoke admin access
 */
export async function POST(request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, email, emails } = body;

    // Validate request
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!email && !emails) {
      return NextResponse.json(
        { error: 'Email or emails array is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'promote':
        if (emails && Array.isArray(emails)) {
          // Bulk promotion
          result = await bulkPromoteToAdmin(emails);
        } else if (email) {
          // Single promotion
          result = await promoteUserToAdmin(email);
        } else {
          return NextResponse.json(
            { error: 'Invalid request format' },
            { status: 400 }
          );
        }
        break;

      case 'revoke':
        if (!email) {
          return NextResponse.json(
            { error: 'Email is required for revoke action' },
            { status: 400 }
          );
        }
        
        // Prevent self-demotion
        if (email.toLowerCase() === session.user?.email?.toLowerCase()) {
          return NextResponse.json(
            { error: 'Cannot revoke your own admin access' },
            { status: 400 }
          );
        }
        
        result = await revokeAdminAccess(email);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "promote" or "revoke"' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Operation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.user || result.results || null
    });

  } catch (error) {
    console.error('Error in POST /api/admin/manage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 