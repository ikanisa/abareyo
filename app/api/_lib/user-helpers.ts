/**
 * Shared user-related utilities for API routes
 * 
 * These helpers handle common operations like resolving user IDs from phone numbers,
 * creating minimal user records, and normalizing user data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMiniContract } from '@rayon/contracts';

/**
 * Resolve a user ID from either a provided ID or user contact information.
 * If the user doesn't exist, creates a minimal user record.
 * 
 * @param supabase - Supabase client instance
 * @param userId - Optional existing user ID
 * @param user - Optional user contact information (phone, name, momo_number)
 * @returns User ID or null if unable to resolve
 * @throws Error if user creation fails
 */
export async function resolveUserId(
  supabase: SupabaseClient | null,
  userId: string | undefined,
  user: UserMiniContract | undefined
): Promise<string | null> {
  if (!supabase) return null;
  if (userId) return userId;

  const phone = user?.phone?.replace(/\s+/g, '');
  if (!phone) return null;

  // Try to find existing user by phone
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();
  
  if (existing?.id) return existing.id;

  // Create minimal user record if not found
  const { data: created, error } = await supabase
    .from('users')
    .insert({
      phone,
      name: user?.name ?? null,
      momo_number: user?.momo_number ?? phone,
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return created.id;
}

/**
 * Resolve a product ID by name, creating the product if it doesn't exist.
 * Useful for order creation flows that accept product names.
 * 
 * @param supabase - Supabase client instance
 * @param name - Product name to search for
 * @param fallbackPrice - Price to use if creating a new product
 * @returns Product ID or null if unable to resolve
 * @throws Error if product creation fails
 */
export async function resolveProductIdByName(
  supabase: SupabaseClient | null,
  name: string,
  fallbackPrice: number
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (!supabase) return null;

  // Try to find existing product by name (case-insensitive)
  const { data: existing } = await supabase
    .from('shop_products')
    .select('id')
    .ilike('name', trimmed)
    .maybeSingle();
  
  if (existing?.id) return existing.id;

  // Create product if not found
  const { data: created, error } = await supabase
    .from('shop_products')
    .insert({
      name: trimmed,
      category: 'misc',
      price: fallbackPrice,
      stock: 0,
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return created?.id ?? null;
}
