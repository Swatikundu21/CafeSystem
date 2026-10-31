/**
 * Unit Tests: Module 2 Order & Billing Logic
 * 
 * Target: src/module2_billing/billingEngine.ts
 * Techniques: Boundary Value Analysis (BVA), Equivalence Partitioning (EP), Mathematical Verification.
 * Traceability: JIRA CAFE-201 (Item Quantity 1-20), CAFE-202 (Subtotal), CAFE-203 (10% Discount Threshold > 500), CAFE-204 (5% GST).
 */

import {
  calculateBill,
  calculateDiscount,
  calculateGST,
  calculateLineTotal,
  calculateSubtotal,
  roundCurrency,
  validateQuantity,
} from '../module2_billing/billingEngine.ts';
import { OrderService } from '../module2_billing/orderService.ts';
import { TestRegistry } from './testRunner.ts';

const SUITE_NAME = 'Module 2: Order & Billing Suite';

export function registerBillingTests(): void {
  // --------------------------------------------------------------------------
  // TEST CASE 8: Quantity Boundary Value Analysis (1 to 20)
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-01: Quantity validation strictly enforces range [1, 20] (BVA: 0, 1, 10, 20, 21)',
    (t) => {
      // BVA: 0 (Below minimum boundary 1)
      const qZero = validateQuantity(0);
      t.expect(qZero.isValid, 'Quantity of 0 must be rejected').toBeFalsy();
      t.expect(qZero.error, 'Error message informs minimum quantity is 1').toContain('cannot be less than 1');

      // Negative value
      const qNeg = validateQuantity(-2);
      t.expect(qNeg.isValid, 'Negative quantity must be rejected').toBeFalsy();

      // BVA: 1 (Lower boundary minimum valid)
      const qOne = validateQuantity(1);
      t.expect(qOne.isValid, 'Quantity of 1 must be accepted').toBeTruthy();
      t.expect(qOne.sanitizedQuantity, 'Sanitized quantity is 1').toBe(1);

      // Normal value
      const qMid = validateQuantity(5);
      t.expect(qMid.isValid, 'Quantity of 5 must be accepted').toBeTruthy();

      // BVA: 20 (Upper boundary maximum valid)
      const qTwenty = validateQuantity(20);
      t.expect(qTwenty.isValid, 'Quantity of 20 must be accepted').toBeTruthy();
      t.expect(qTwenty.sanitizedQuantity, 'Sanitized quantity is 20').toBe(20);

      // BVA: 21 (Exceeds maximum boundary 20)
      const qOverTwenty = validateQuantity(21);
      t.expect(qOverTwenty.isValid, 'Quantity of 21 must be rejected').toBeFalsy();
      t.expect(qOverTwenty.error, 'Error message informs maximum is 20').toContain('cannot exceed 20');

      // Decimal values (Must be whole integer)
      const qDecimal = validateQuantity(3.5);
      t.expect(qDecimal.isValid, 'Decimal quantity 3.5 must be rejected').toBeFalsy();
    },
    'CAFE-201',
    'TC-BIL-01'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 9: Line Total & Subtotal Computation
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-02: Subtotal correctly sums item line totals (unit_price * quantity)',
    (t) => {
      // Single line total
      const single = calculateLineTotal(185.00, 3);
      t.expect(single, '185 * 3 = 555.00').toBe(555.00);

      // Multiple items subtotal
      const items = [
        { unitPrice: 150.00, quantity: 2 }, // 300.00
        { unitPrice: 75.50, quantity: 4 },  // 302.00
      ];
      const subtotal = calculateSubtotal(items);
      t.expect(subtotal, '300 + 302 = 602.00').toBe(602.00);

      // Empty cart
      const emptySubtotal = calculateSubtotal([]);
      t.expect(emptySubtotal, 'Empty items subtotal is 0.00').toBe(0.00);
    },
    'CAFE-202',
    'TC-BIL-02'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 10: 10% Discount Boundary Value Analysis around 500 threshold
  // Rule: "a discount of 10% if the subtotal is over 500"
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-03: Discount strictly triggers when subtotal > 500 (BVA: 499, 500, 500.01, 501, 1000)',
    (t) => {
      // Subtotal: 499.00 (Below threshold)
      const d499 = calculateDiscount(499.00);
      t.expect(d499.isEligible, 'Subtotal 499 is not eligible for discount').toBeFalsy();
      t.expect(d499.discountAmount, 'Discount amount is 0 for 499').toBe(0.00);
      t.expect(d499.amountNeeded, 'Needs 1.01 more to unlock discount').toBe(1.01);

      // Subtotal: 500.00 (EXACT THRESHOLD: Rule states "OVER 500", not >= 500)
      const d500 = calculateDiscount(500.00);
      t.expect(d500.isEligible, 'Subtotal exactly 500.00 does not trigger discount (> 500 required)').toBeFalsy();
      t.expect(d500.discountAmount, 'Discount amount is 0 for exactly 500.00').toBe(0.00);

      // Subtotal: 500.01 (Boundary Just Above Threshold)
      const d500_01 = calculateDiscount(500.01);
      t.expect(d500_01.isEligible, 'Subtotal 500.01 triggers discount').toBeTruthy();
      t.expect(d500_01.discountAmount, '10% of 500.01 is 50.00').toBe(50.00);

      // Subtotal: 501.00
      const d501 = calculateDiscount(501.00);
      t.expect(d501.isEligible, 'Subtotal 501 triggers discount').toBeTruthy();
      t.expect(d501.discountAmount, '10% of 501.00 is 50.10').toBe(50.10);

      // Subtotal: 1000.00 (Equivalence Partition: Well above threshold)
      const d1000 = calculateDiscount(1000.00);
      t.expect(d1000.isEligible, 'Subtotal 1000 is eligible').toBeTruthy();
      t.expect(d1000.discountPercent, 'Discount percentage is 10%').toBe(10);
      t.expect(d1000.discountAmount, '10% of 1000 is 100.00').toBe(100.00);
    },
    'CAFE-203',
    'TC-BIL-03'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 11: 5% GST Calculation on Taxable Amount
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-04: 5% GST is computed on the discounted taxable amount',
    (t) => {
      // Taxable amount: 200.00
      const gst200 = calculateGST(200.00);
      t.expect(gst200, '5% GST on 200 is 10.00').toBe(10.00);

      // Taxable amount: 900.00 (e.g. 1000 subtotal - 100 discount)
      const gst900 = calculateGST(900.00);
      t.expect(gst900, '5% GST on 900 is 45.00').toBe(45.00);

      // Precision check with uneven decimal (145.25 * 0.05 = 7.2625 -> 7.26)
      const gstUneven = calculateGST(145.25);
      t.expect(gstUneven, '5% GST on 145.25 rounded to 2 decimals is 7.26').toBe(7.26);
    },
    'CAFE-204',
    'TC-BIL-04'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 12: Comprehensive Bill Calculation - Below 500 (No Discount)
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-05: Comprehensive bill calculation under 500 (Subtotal ₹400 -> No Discount -> GST ₹20 -> Total ₹420)',
    (t) => {
      const items = [
        { unitPrice: 200.00, quantity: 2 }, // Subtotal: 400.00
      ];
      const bill = calculateBill(items);

      t.expect(bill.subtotal, 'Subtotal is 400.00').toBe(400.00);
      t.expect(bill.discountEligible, 'Discount eligible is false').toBeFalsy();
      t.expect(bill.discountAmount, 'Discount amount is 0.00').toBe(0.00);
      t.expect(bill.taxableAmount, 'Taxable amount is 400.00').toBe(400.00);
      t.expect(bill.gstAmount, '5% GST on 400 is 20.00').toBe(20.00);
      t.expect(bill.grandTotal, 'Grand total is 420.00').toBe(420.00);
    },
    'CAFE-205',
    'TC-BIL-05'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 13: Comprehensive Bill Calculation - Above 500 (10% Discount Applied)
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-06: Comprehensive bill calculation over 500 (Subtotal ₹1000 -> 10% Disc ₹100 -> Taxable ₹900 -> GST ₹45 -> Total ₹945)',
    (t) => {
      const items = [
        { unitPrice: 250.00, quantity: 4 }, // Subtotal: 1000.00
      ];
      const bill = calculateBill(items);

      t.expect(bill.subtotal, 'Subtotal is 1000.00').toBe(1000.00);
      t.expect(bill.discountEligible, 'Discount eligible is true').toBeTruthy();
      t.expect(bill.discountPercent, 'Discount percent is 10%').toBe(10);
      t.expect(bill.discountAmount, '10% discount is 100.00').toBe(100.00);
      t.expect(bill.taxableAmount, 'Taxable amount is 900.00').toBe(900.00);
      t.expect(bill.gstAmount, '5% GST on 900 is 45.00').toBe(45.00);
      t.expect(bill.grandTotal, 'Grand total is 945.00').toBe(945.00);
    },
    'CAFE-205',
    'TC-BIL-06'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 14: Precision Currency Rounding Verification
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-07: Financial rounding avoids IEEE 754 floating point inaccuracies',
    (t) => {
      const floatSum = 0.1 + 0.2; // 0.30000000000000004 in raw JS
      const rounded = roundCurrency(floatSum);
      t.expect(rounded, '0.1 + 0.2 rounded to currency is 0.30').toBe(0.3);

      const itemsWithCents = [
        { unitPrice: 33.33, quantity: 3 }, // 99.99
      ];
      const bill = calculateBill(itemsWithCents);
      t.expect(bill.subtotal, '33.33 * 3 = 99.99').toBe(99.99);
      // Taxable = 99.99, GST 5% = 4.9995 -> 5.00
      t.expect(bill.gstAmount, 'GST rounded properly').toBe(5.00);
      t.expect(bill.grandTotal, '99.99 + 5.00 = 104.99').toBe(104.99);
    },
    'CAFE-206',
    'TC-BIL-07'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 15: Guest Name Required to Generate Bill
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-BIL-08: Order & bill generation strictly requires guest name (rejects empty or whitespace)',
    (t) => {
      // Empty string
      const emptyOrder = OrderService.createOrder({
        customerName: '',
        paymentMethod: 'CASH',
        items: [{ menuItemId: 'm-1', quantity: 1 }],
      });
      t.expect(emptyOrder.success, 'Order with empty guest name must fail').toBeFalsy();
      t.expect(emptyOrder.error, 'Error message indicates guest name is required').toContain('Guest Name is required');

      // Whitespace only
      const whitespaceOrder = OrderService.createOrder({
        customerName: '   ',
        paymentMethod: 'CASH',
        items: [{ menuItemId: 'm-1', quantity: 1 }],
      });
      t.expect(whitespaceOrder.success, 'Order with whitespace guest name must fail').toBeFalsy();
      t.expect(whitespaceOrder.error, 'Error message indicates guest name is required').toContain('Guest Name is required');

      // Valid guest name
      const validOrder = OrderService.createOrder({
        customerName: 'Aarav Patel',
        paymentMethod: 'CASH',
        items: [{ menuItemId: 'm-1', quantity: 1 }],
      });
      t.expect(validOrder.success, 'Order with valid guest name succeeds').toBeTruthy();
      t.expect(validOrder.order?.customerName, 'Customer name matches trimmed value').toBe('Aarav Patel');
    },
    'CAFE-207',
    'TC-BIL-08'
  );
}
