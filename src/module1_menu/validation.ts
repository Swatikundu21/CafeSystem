/**
 * Module 1: Menu Management - Pure Validation Layer
 * 
 * Implements business rules for menu item validation:
 * 1. Name: Required, trimmed, unique (case-insensitive check against existing items).
 * 2. Price: Must be a positive number > 0 and <= 10,000.
 * 3. Category: Must be strictly one of the fixed categories in ALLOWED_CATEGORIES.
 * 
 * Designed for White-box and Black-box unit testing.
 */

import { ALLOWED_CATEGORIES, MenuCategory, MenuItem, MenuItemFormData, MenuItemValidationErrors, ValidationResult } from './types.ts';

export const MIN_PRICE = 0.00001; // strictly > 0
export const MAX_PRICE = 10000.00;

/**
 * Validates the Menu Item Name:
 * - Must not be empty or whitespace only
 * - Must not exceed 150 characters
 * - Must be unique across existing items (case-insensitive)
 * - If currentItemId is provided (update flow), item is allowed to keep its own name
 */
export function validateMenuItemName(
  name: unknown,
  existingItems: MenuItem[] = [],
  currentItemId?: string
): { isValid: boolean; error?: string; sanitizedName: string } {
  if (typeof name !== 'string') {
    return { isValid: false, error: 'Item name is required and must be text', sanitizedName: '' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Item name is required and cannot be empty', sanitizedName: '' };
  }

  if (trimmed.length > 150) {
    return { isValid: false, error: 'Item name cannot exceed 150 characters', sanitizedName: trimmed };
  }

  // Check uniqueness (case-insensitive)
  const isDuplicate = existingItems.some((item) => {
    // If updating, skip self
    if (currentItemId && item.id === currentItemId) {
      return false;
    }
    return item.name.trim().toLowerCase() === trimmed.toLowerCase();
  });

  if (isDuplicate) {
    return {
      isValid: false,
      error: `An item named "${trimmed}" already exists in the menu. Names must be unique.`,
      sanitizedName: trimmed,
    };
  }

  return { isValid: true, sanitizedName: trimmed };
}

/**
 * Validates the Menu Item Price:
 * - Must be a valid finite number
 * - Must be strictly greater than 0
 * - Must be less than or equal to 10,000.00
 * - Returns sanitized rounded number to 2 decimal places
 */
export function validateMenuItemPrice(
  price: unknown
): { isValid: boolean; error?: string; sanitizedPrice: number } {
  if (price === '' || price === null || price === undefined) {
    return { isValid: false, error: 'Price is required', sanitizedPrice: 0 };
  }

  const numPrice = typeof price === 'number' ? price : Number(price);

  if (isNaN(numPrice) || !isFinite(numPrice)) {
    return { isValid: false, error: 'Price must be a valid number', sanitizedPrice: 0 };
  }

  if (numPrice <= 0) {
    return { isValid: false, error: 'Price must be greater than 0 (e.g. ₹0.01 or higher)', sanitizedPrice: numPrice };
  }

  if (numPrice > MAX_PRICE) {
    return { isValid: false, error: `Price cannot exceed ₹${MAX_PRICE.toLocaleString()}`, sanitizedPrice: numPrice };
  }

  // Sanitize to 2 decimal places
  const rounded = Math.round(numPrice * 100) / 100;
  return { isValid: true, sanitizedPrice: rounded };
}

/**
 * Validates the Menu Item Category:
 * - Must match one of the fixed categories
 */
export function validateMenuItemCategory(
  category: unknown
): { isValid: boolean; error?: string; sanitizedCategory?: MenuCategory } {
  if (!category || typeof category !== 'string') {
    return { isValid: false, error: 'Category selection is required' };
  }

  const isAllowed = ALLOWED_CATEGORIES.includes(category as MenuCategory);
  if (!isAllowed) {
    return {
      isValid: false,
      error: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
    };
  }

  return { isValid: true, sanitizedCategory: category as MenuCategory };
}

/**
 * Full composite validator for Menu Item form data
 */
export function validateMenuItemForm(
  formData: MenuItemFormData,
  existingItems: MenuItem[] = [],
  currentItemId?: string
): ValidationResult {
  const errors: MenuItemValidationErrors = {};

  const nameResult = validateMenuItemName(formData.name, existingItems, currentItemId);
  if (!nameResult.isValid && nameResult.error) {
    errors.name = nameResult.error;
  }

  const priceResult = validateMenuItemPrice(formData.price);
  if (!priceResult.isValid && priceResult.error) {
    errors.price = priceResult.error;
  }

  const categoryResult = validateMenuItemCategory(formData.category);
  if (!categoryResult.isValid && categoryResult.error) {
    errors.category = categoryResult.error;
  }

  const isValid = Object.keys(errors).length === 0;

  if (isValid && categoryResult.sanitizedCategory) {
    return {
      isValid: true,
      errors: {},
      sanitizedData: {
        name: nameResult.sanitizedName,
        category: categoryResult.sanitizedCategory,
        price: priceResult.sanitizedPrice,
        availability: Boolean(formData.availability),
      },
    };
  }

  return {
    isValid: false,
    errors,
  };
}
