/**
 * Module 2: Order & Billing - Domain Billing Engine
 * 
 * Pure mathematical business logic for:
 * 1. Line Item calculation & Quantity boundary validation (1 to 20).
 * 2. Subtotal calculation.
 * 3. 10% Discount rule strictly when Subtotal > 500.
 * 4. 5% GST on net taxable amount.
 * 5. Grand Total computation with high-precision currency rounding.
 * 
 * Highly testable: Used in unit tests (White-box & Black-box).
 */

import {
  BillCalculation,
  CartItem,
  DISCOUNT_RATE,
  DISCOUNT_THRESHOLD,
  GST_RATE,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
} from './types.ts';

/**
 * Utility to round a financial value to exactly 2 decimal places
 */
export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Validates item quantity against requirements: 1 to 20
 * Returns validation status and clear error message
 */
export function validateQuantity(quantity: unknown): { isValid: boolean; error?: string; sanitizedQuantity: number } {
  if (quantity === undefined || quantity === null || quantity === '') {
    return { isValid: false, error: 'Quantity is required', sanitizedQuantity: 0 };
  }

  const num = typeof quantity === 'number' ? quantity : Number(quantity);

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: 'Quantity must be a valid number', sanitizedQuantity: 0 };
  }

  if (!Number.isInteger(num)) {
    return { isValid: false, error: 'Quantity must be a whole number', sanitizedQuantity: Math.floor(num) };
  }

  if (num < MIN_ITEM_QUANTITY) {
    return {
      isValid: false,
      error: `Quantity cannot be less than ${MIN_ITEM_QUANTITY}`,
      sanitizedQuantity: MIN_ITEM_QUANTITY,
    };
  }

  if (num > MAX_ITEM_QUANTITY) {
    return {
      isValid: false,
      error: `Quantity cannot exceed ${MAX_ITEM_QUANTITY} per item`,
      sanitizedQuantity: MAX_ITEM_QUANTITY,
    };
  }

  return { isValid: true, sanitizedQuantity: num };
}

/**
 * Computes the line total for a single item
 */
export function calculateLineTotal(unitPrice: number, quantity: number): number {
  const safePrice = Math.max(0, unitPrice || 0);
  const safeQty = Math.max(0, quantity || 0);
  return roundCurrency(safePrice * safeQty);
}

/**
 * Computes the subtotal across all cart items
 */
export function calculateSubtotal(items: Array<{ unitPrice: number; quantity: number }>): number {
  if (!items || items.length === 0) return 0.00;

  const rawSubtotal = items.reduce((acc, item) => {
    const lineTotal = calculateLineTotal(item.unitPrice, item.quantity);
    return acc + lineTotal;
  }, 0);

  return roundCurrency(rawSubtotal);
}

/**
 * Computes discount based on rule:
 * "a discount of 10% if the subtotal is over 500"
 * 
 * Boundary testing targets:
 * - Subtotal = 500.00 -> discount = 0
 * - Subtotal = 500.01 -> discount = 50.00
 * - Subtotal = 550.00 -> discount = 55.00
 */
export function calculateDiscount(subtotal: number): {
  isEligible: boolean;
  discountPercent: number;
  discountAmount: number;
  amountNeeded: number;
} {
  const cleanSubtotal = roundCurrency(subtotal);

  if (cleanSubtotal > DISCOUNT_THRESHOLD) {
    const discountAmount = roundCurrency(cleanSubtotal * DISCOUNT_RATE);
    return {
      isEligible: true,
      discountPercent: DISCOUNT_RATE * 100, // 10%
      discountAmount,
      amountNeeded: 0,
    };
  }

  const amountNeeded = roundCurrency(Math.max(0, DISCOUNT_THRESHOLD - cleanSubtotal + 0.01));
  return {
    isEligible: false,
    discountPercent: 0,
    discountAmount: 0.00,
    amountNeeded,
  };
}

/**
 * Computes 5% GST on the taxable amount (Subtotal - Discount)
 */
export function calculateGST(taxableAmount: number, gstRate: number = GST_RATE): number {
  const safeTaxable = Math.max(0, roundCurrency(taxableAmount));
  return roundCurrency(safeTaxable * gstRate);
}

/**
 * Master Billing calculation for the entire order
 * Fully deterministic & pure
 */
export function calculateBill(items: Array<{ unitPrice: number; quantity: number }>): BillCalculation {
  if (!items || items.length === 0) {
    return {
      subtotal: 0.00,
      discountEligible: false,
      discountPercent: 0,
      discountAmount: 0.00,
      taxableAmount: 0.00,
      taxPercent: GST_RATE * 100,
      gstAmount: 0.00,
      grandTotal: 0.00,
      amountNeededForDiscount: DISCOUNT_THRESHOLD + 0.01,
    };
  }

  const subtotal = calculateSubtotal(items);
  const discountInfo = calculateDiscount(subtotal);
  const taxableAmount = roundCurrency(Math.max(0, subtotal - discountInfo.discountAmount));
  const gstAmount = calculateGST(taxableAmount, GST_RATE);
  const grandTotal = roundCurrency(taxableAmount + gstAmount);

  return {
    subtotal,
    discountEligible: discountInfo.isEligible,
    discountPercent: discountInfo.discountPercent,
    discountAmount: discountInfo.discountAmount,
    taxableAmount,
    taxPercent: GST_RATE * 100, // 5%
    gstAmount,
    grandTotal,
    amountNeededForDiscount: discountInfo.amountNeeded,
  };
}
