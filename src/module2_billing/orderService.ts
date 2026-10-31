/**
 * Module 2: Order & Billing - Service Layer
 * 
 * Intermediary handling order creation, validation against Module 1's live menu items,
 * billing computation via billingEngine, and relational persistence.
 */

import { db } from '../database/db.ts';
import { MenuService } from '../module1_menu/menuService.ts';
import { calculateBill, calculateLineTotal, validateQuantity } from './billingEngine.ts';
import { CartItem, CreateOrderPayload, Order, OrderItem } from './types.ts';

export class OrderService {
  /**
   * Generates a sequential, professional order invoice number (e.g. CAFE-2026-1001)
   */
  public static generateOrderNumber(): string {
    const orders = db.getOrders();
    const count = orders.length + 1;
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const paddedCount = count.toString().padStart(4, '0');
    return `CF-${dateStr}-${paddedCount}`;
  }

  /**
   * Reads all orders from relational storage
   */
  public static getAllOrders(): Order[] {
    return db.getOrders();
  }

  /**
   * Finds order by ID including line items
   */
  public static getOrderById(id: string): Order | undefined {
    return db.getOrders().find((o) => o.id === id);
  }

  /**
   * Deletes an order and cascades line items
   */
  public static deleteOrder(id: string): void {
    db.deleteOrder(id);
  }

  /**
   * Validates and creates a new order:
   * 1. Checks that items exist in Module 1
   * 2. Checks that items are marked AVAILABLE
   * 3. Validates quantity bounds (1 to 20 per item)
   * 4. Computes financial figures via billingEngine
   * 5. Atomically persists Order + OrderItem records
   */
  public static createOrder(payload: CreateOrderPayload): {
    success: boolean;
    order?: Order;
    error?: string;
  } {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Cannot create an empty order. Please select at least one item.' };
    }

    // Validate guest name requirement: Cannot generate bill without guest name
    if (!payload.customerName || !payload.customerName.trim()) {
      return {
        success: false,
        error: 'Guest Name is required. Cannot generate the bill without entering a guest name.',
      };
    }

    // Read Module 1 menu data directly
    const allMenuItems = MenuService.getAll();
    const menuMap = new Map(allMenuItems.map((item) => [item.id, item]));

    const validatedLines: Array<{
      menuItemId: string;
      itemName: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }> = [];

    // Verify every line item
    for (const itemPayload of payload.items) {
      const menuItem = menuMap.get(itemPayload.menuItemId);

      if (!menuItem) {
        return {
          success: false,
          error: `Item with ID "${itemPayload.menuItemId}" does not exist in the Menu Management database.`,
        };
      }

      if (!menuItem.availability) {
        return {
          success: false,
          error: `"${menuItem.name}" is currently marked OUT OF STOCK in Menu Management and cannot be ordered.`,
        };
      }

      const qtyCheck = validateQuantity(itemPayload.quantity);
      if (!qtyCheck.isValid) {
        return {
          success: false,
          error: `Invalid quantity for "${menuItem.name}": ${qtyCheck.error}`,
        };
      }

      const lineTotal = calculateLineTotal(menuItem.price, qtyCheck.sanitizedQuantity);

      validatedLines.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        unitPrice: menuItem.price,
        quantity: qtyCheck.sanitizedQuantity,
        lineTotal,
      });
    }

    // Calculate billing breakdown using pure billing engine
    const bill = calculateBill(
      validatedLines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity }))
    );

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = this.generateOrderNumber();
    const nowIso = new Date().toISOString();

    // Construct relational OrderItems (Table: order_items)
    const orderItems: OrderItem[] = validatedLines.map((line, idx) => ({
      id: `item_${orderId}_${idx + 1}`,
      orderId,
      menuItemId: line.menuItemId,
      itemName: line.itemName,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      createdAt: nowIso,
    }));

    // Construct master Order (Table: orders)
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone?.trim() || undefined,
      tableNumber: payload.tableNumber?.trim() || undefined,
      subtotal: bill.subtotal,
      discountPercent: bill.discountPercent,
      discountAmount: bill.discountAmount,
      taxPercent: bill.taxPercent,
      gstAmount: bill.gstAmount,
      grandTotal: bill.grandTotal,
      paymentMethod: payload.paymentMethod || 'CASH',
      paymentStatus: 'PAID',
      orderStatus: 'COMPLETED',
      items: orderItems,
      createdAt: nowIso,
    };

    // Save to relational storage
    db.saveOrderTransaction(newOrder, orderItems);

    // Dispatch event to Jira Cloud project SCRUM
    import('../services/jiraSyncService.ts').then(({ jiraSyncService }) => {
      const itemListStr = newOrder.items.map((i) => `${i.itemName} (x${i.quantity})`).join(', ');
      jiraSyncService.logEvent({
        type: 'order_created',
        summary: `[Order Placed] ${newOrder.orderNumber} - ₹${newOrder.grandTotal.toFixed(2)} (${newOrder.customerName})`,
        details: `Order Transaction Persisted:\nOrder: ${newOrder.orderNumber}\nCustomer: ${newOrder.customerName}\nSubtotal: ₹${newOrder.subtotal.toFixed(2)}\nDiscount: ₹${newOrder.discountAmount.toFixed(2)} (${newOrder.discountPercent}%)\nGST: ₹${newOrder.gstAmount.toFixed(2)}\nGrand Total: ₹${newOrder.grandTotal.toFixed(2)}\nPayment: ${newOrder.paymentMethod}\nItems: ${itemListStr}`,
        issueType: 'Task',
      });
    }).catch(() => {});

    return { success: true, order: newOrder };
  }

  /**
   * Aggregates store performance KPIs
   */
  public static getOrderStats(): {
    totalRevenue: number;
    orderCount: number;
    totalGstCollected: number;
    totalDiscountGiven: number;
    averageOrderValue: number;
  } {
    const orders = db.getOrders();
    const orderCount = orders.length;

    if (orderCount === 0) {
      return {
        totalRevenue: 0,
        orderCount: 0,
        totalGstCollected: 0,
        totalDiscountGiven: 0,
        averageOrderValue: 0,
      };
    }

    const totalRevenue = orders.reduce((acc, o) => acc + o.grandTotal, 0);
    const totalGstCollected = orders.reduce((acc, o) => acc + o.gstAmount, 0);
    const totalDiscountGiven = orders.reduce((acc, o) => acc + o.discountAmount, 0);
    const averageOrderValue = totalRevenue / orderCount;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      orderCount,
      totalGstCollected: Math.round(totalGstCollected * 100) / 100,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    };
  }
}
