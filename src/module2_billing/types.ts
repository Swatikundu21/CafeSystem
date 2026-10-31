/**
 * Module 2: Order & Billing - Types & Constants
 * 
 * Strict typing for cart items, billing calculations, and relational order structures.
 */

import { MenuCategory } from '../module1_menu/types.ts';

export const MIN_ITEM_QUANTITY = 1;
export const MAX_ITEM_QUANTITY = 20;
export const DISCOUNT_THRESHOLD = 500.00; // strictly > 500
export const DISCOUNT_RATE = 0.10; // 10%
export const GST_RATE = 0.05; // 5%

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

/**
 * Cart Item inside the active POS checkout session
 * Reads from Module 1's live menu items
 */
export interface CartItem {
  menuItemId: string;
  name: string;
  category: MenuCategory;
  unitPrice: number;
  quantity: number; // strictly 1 to 20
  lineTotal: number;
}

/**
 * Deterministic breakdown of financial figures for an order
 */
export interface BillCalculation {
  subtotal: number;
  discountEligible: boolean; // subtotal > 500
  discountPercent: number; // 10 or 0
  discountAmount: number;
  taxableAmount: number; // subtotal - discountAmount
  taxPercent: number; // 5.00
  gstAmount: number; // 5% of taxableAmount
  grandTotal: number;
  amountNeededForDiscount: number; // if <= 500, how much more needed to reach >500
}

/**
 * Order Line Item stored in database (Table: order_items)
 */
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
}

/**
 * Master Order stored in database (Table: orders)
 */
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  orderStatus: 'COMPLETED' | 'PREPARING' | 'SERVED' | 'CANCELLED';
  items: OrderItem[];
  createdAt: string;
}

/**
 * Payload to place a new order
 */
export interface CreateOrderPayload {
  customerName: string; // Strictly required: cannot generate bill without guest name
  customerPhone?: string;
  tableNumber?: string;
  paymentMethod: PaymentMethod;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}
