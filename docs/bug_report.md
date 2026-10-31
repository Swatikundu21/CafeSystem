# JIRA Defect Report: Cafe Management System
**Project Key:** `CAFE` | **Test Execution Cycle:** SPRINT-1-REGRESSION

---

## BUG-101 (CAFE-BUG-01): 10% Discount erroneously applied at Subtotal = 500.00
- **Severity:** HIGH
- **Priority:** P1 (Billing Logic)
- **Module:** Module 2 (Order & Billing)
- **Reporter:** QA Automation Engineer
- **Assignee:** Lead Software Engineer
- **Status:** CLOSED (VERIFIED)

### Problem Description
The requirement specifies: *"a discount of 10% if the subtotal is over 500"*. During boundary value testing, an order with subtotal exactly ₹500.00 (e.g. 2 x ₹250 items) was receiving a ₹50.00 discount.

### Steps to Reproduce
1. Navigate to Module 2 (Order & Billing POS).
2. Add items totaling exactly ₹500.00 (e.g., 2 x Belgian Dark Chocolate Tart @ ₹250).
3. Observe the Billing Summary section.

### Expected Result
- Discount must be ₹0.00 (0%). Subtotal must be strictly `> 500.00` to trigger discount.

### Actual Result
- System was using `>= 500.00` logic and deducted ₹50.00.

### Root Cause & Resolution
- In `src/module2_billing/billingEngine.ts`, the condition was adjusted to `cleanSubtotal > DISCOUNT_THRESHOLD`.
- Added unit test `TC-BIL-03` covering boundary values: 499, 500, 500.01, 501.
- Fix verified in build v1.0.1.

---

## BUG-102 (CAFE-BUG-02): Quantity input permitted manual keyboard entry of 0
- **Severity:** MEDIUM
- **Priority:** P2
- **Module:** Module 2 (Order & Billing)
- **Reporter:** Manual Tester
- **Assignee:** Frontend Developer
- **Status:** CLOSED (VERIFIED)

### Problem Description
While the increment and decrement buttons clamped between 1 and 20, a user typing `0` directly into the quantity input field was able to generate an order line with 0 quantity.

### Steps to Reproduce
1. Add an item to the POS order pad.
2. Highlight the quantity number and type `0`.
3. Submit "Generate Bill & Save Order".

### Expected Result
- The quantity must strictly remain between 1 and 20. Submission of quantity `0` should be blocked.

### Actual Result
- Zero was submitted to `order_items` table.

### Root Cause & Resolution
- Enhanced `validateQuantity()` with integer and range check `[1, 20]`. Applied sanitization on input blur and backend transaction validation in `OrderService.createOrder()`.
- Verified via unit test `TC-BIL-01`.

---

## BUG-103 (CAFE-BUG-03): Case-insensitive duplicate menu item names permitted
- **Severity:** MEDIUM
- **Priority:** P2
- **Module:** Module 1 (Menu Management)
- **Reporter:** Test Lead
- **Assignee:** Database Engineer
- **Status:** CLOSED (VERIFIED)

### Problem Description
Adding an item with the same name but in different casing (e.g., "hazelnut cappuccino" when "Hazelnut Cappuccino" already exists) succeeded.

### Expected Result
- Item name must be unique irrespective of case.

### Actual Result
- Duplicate items with identical pronunciation appeared on the customer ordering menu.

### Root Cause & Resolution
- Updated `validateMenuItemName()` to compare lowercased strings: `item.name.trim().toLowerCase() === trimmed.toLowerCase()`.
- Added database unique index in `database/schema.sql`: `CREATE UNIQUE INDEX uq_menu_item_name_lower ON menu_items (LOWER(name));`.
- Verified via unit test `TC-VAL-02`.
