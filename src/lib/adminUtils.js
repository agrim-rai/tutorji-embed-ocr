/**
 * Admin Management Utilities
 * 
 * This module provides utility functions for managing admin access control
 * including promoting users to admin, revoking admin access, and checking
 * admin permissions.
 */

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

/**
 * Promote a user to admin role by email
 * 
 * @param {string} email - Email of the user to promote
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function promoteUserToAdmin(email) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (user.role === 'admin') {
      return {
        success: false,
        message: 'User is already an admin'
      };
    }
    
    user.role = 'admin';
    await user.save();
    
    return {
      success: true,
      message: 'User promoted to admin successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return {
      success: false,
      message: 'An error occurred while promoting user'
    };
  }
}

/**
 * Revoke admin access from a user by email
 * 
 * @param {string} email - Email of the user to demote
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function revokeAdminAccess(email) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (user.role !== 'admin') {
      return {
        success: false,
        message: 'User is not an admin'
      };
    }
    
    user.role = 'user';
    await user.save();
    
    return {
      success: true,
      message: 'Admin access revoked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error revoking admin access:', error);
    return {
      success: false,
      message: 'An error occurred while revoking admin access'
    };
  }
}

/**
 * Get all admin users
 * 
 * @returns {Promise<{success: boolean, admins?: Array, message?: string}>}
 */
export async function getAllAdmins() {
  try {
    await dbConnect();
    
    const admins = await User.find({ role: 'admin' })
      .select('name email role createdAt')
      .sort({ createdAt: -1 });
    
    return {
      success: true,
      admins: admins.map(admin => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }))
    };
  } catch (error) {
    console.error('Error getting admins:', error);
    return {
      success: false,
      message: 'An error occurred while fetching admins'
    };
  }
}

/**
 * Check if a user is an admin by email
 * 
 * @param {string} email - Email to check
 * @returns {Promise<{isAdmin: boolean, user?: Object}>}
 */
export async function isUserAdmin(email) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return { isAdmin: false };
    }
    
    return {
      isAdmin: user.role === 'admin',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false };
  }
}

/**
 * Bulk promote users to admin
 * 
 * @param {string[]} emails - Array of emails to promote
 * @returns {Promise<{success: boolean, results: Array, message: string}>}
 */
export async function bulkPromoteToAdmin(emails) {
  try {
    await dbConnect();
    
    const results = [];
    
    for (const email of emails) {
      const result = await promoteUserToAdmin(email);
      results.push({
        email,
        ...result
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    return {
      success: true,
      results,
      message: `${successCount}/${totalCount} users promoted successfully`
    };
  } catch (error) {
    console.error('Error in bulk promotion:', error);
    return {
      success: false,
      results: [],
      message: 'An error occurred during bulk promotion'
    };
  }
} 