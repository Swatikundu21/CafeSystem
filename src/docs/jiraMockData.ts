/**
 * JIRA Project Testing & Quality Assurance Data Model
 * 
 * Contains:
 * 1. JIRA Epics & User Stories with Acceptance Criteria
 * 2. Formal Test Cases Matrix (White-Box, Black-Box, BVA, Equivalence Partitioning)
 * 3. Bug Reports with Defect Lifecycle (Steps to Reproduce, Severity, Status)
 * 4. Traceability Matrix mapping Requirements -> Code -> Test Cases -> JIRA Issues
 * 5. CSV Generator for test_cases.xlsx export
 */

export interface JiraUserStory {
  key: string;
  module: 'Module 1: Menu' | 'Module 2: Order & Billing';
  summary: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  status: 'DONE' | 'IN PROGRESS' | 'READY FOR TEST';
  assignee: string;
}

export interface JiraTestCase {
  id: string; // e.g. CAFE-TC-001
  jiraStoryKey: string;
  module: 'Module 1: Menu' | 'Module 2: Order & Billing';
  testType: 'Black Box (BVA)' | 'Black Box (EP)' | 'White Box (Branch)' | 'Integration';
  title: string;
  preconditions: string;
  testSteps: string[];
  testData: string;
  expectedResult: string;
  actualResult: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  executionType: 'Automated' | 'Manual';
}

export interface JiraBugReport {
  bugId: string;
  key: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority: 'P1' | 'P2' | 'P3';
  module: 'Module 1: Menu' | 'Module 2: Order & Billing';
  environment: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  status: 'CLOSED (VERIFIED)' | 'RESOLVED' | 'IN PROGRESS';
  resolutionNotes: string;
}

export const JIRA_USER_STORIES: JiraUserStory[] = [
  {
    key: 'CAFE-1',
    module: 'Module 1: Menu',
    summary: 'Manage Cafe Menu Items (CRUD & Field Constraints)',
    description: 'As a Cafe Store Manager, I want to add, view, update, and delete menu items with strict input validation so that only accurate products are sold.',
    acceptanceCriteria: [
      'Item name is mandatory and unique across the catalog (case-insensitive).',
      'Price must be strictly positive (> 0) and capped at 10,000.00.',
      'Category must strictly belong to the 6 fixed categories.',
      'Availability flag can be toggled on/off in real-time.',
    ],
    storyPoints: 5,
    status: 'DONE',
    assignee: 'Lead Software Engineer',
  },
  {
    key: 'CAFE-2',
    module: 'Module 2: Order & Billing',
    summary: 'POS Item Selection & Quantity Range Enforcement',
    description: 'As a Cashier/Barista, I want to pick available menu items and adjust quantities between 1 and 20 so that customer orders can be captured accurately.',
    acceptanceCriteria: [
      'Catalog must only permit selection of available menu items.',
      'Item quantity per line item must be constrained between 1 and 20 (inclusive).',
      'Out of stock items from Module 1 cannot be added to cart.',
      'Guest Name is strictly mandatory to generate the bill and place the order (empty or whitespace name blocks bill generation).',
    ],
    storyPoints: 5,
    status: 'DONE',
    assignee: 'Full Stack Engineer',
  },
  {
    key: 'CAFE-3',
    module: 'Module 2: Order & Billing',
    summary: 'Automated Billing Engine (10% Discount > 500 & 5% GST)',
    description: 'As a Customer & Accountant, I want transparent financial computation with 10% discount if subtotal exceeds 500 and 5% GST applied.',
    acceptanceCriteria: [
      'Subtotal computed as sum of item unit price * quantity.',
      'If subtotal > 500, apply 10% discount on subtotal.',
      'If subtotal <= 500, no discount applied (0.00).',
      'Apply 5% GST on the discounted taxable amount.',
      'Grand Total = (Subtotal - Discount) + 5% GST.',
    ],
    storyPoints: 8,
    status: 'DONE',
    assignee: 'Domain Engine Specialist',
  },
  {
    key: 'CAFE-4',
    module: 'Module 2: Order & Billing',
    summary: 'Relational Order Persistence & Bill Receipt Generation',
    description: 'As an Auditor, I want completed orders and individual order lines stored in the relational database with printable receipts.',
    acceptanceCriteria: [
      'Atomic persistence to "orders" table and "order_items" table.',
      'Foreign key linkage from order_items.order_id -> orders.id.',
      'Printable and downloadable thermal receipt layout.',
    ],
    storyPoints: 5,
    status: 'DONE',
    assignee: 'Database Engineer',
  },
];

export const JIRA_TEST_CASES: JiraTestCase[] = [
  // Module 1 Test Cases
  {
    id: 'CAFE-TC-001',
    jiraStoryKey: 'CAFE-1',
    module: 'Module 1: Menu',
    testType: 'Black Box (EP)',
    title: 'Verify item creation fails when item name is empty or whitespaces',
    preconditions: 'Manager is on Menu Management screen.',
    testSteps: ['Click "Add Menu Item"', 'Enter "" or "   " into Name field', 'Fill valid category & price', 'Submit form'],
    testData: 'Name: "   ", Category: "Hot Coffee", Price: 150',
    expectedResult: 'System blocks submission and displays: "Item name is required and cannot be empty".',
    actualResult: 'Field validation error displayed inline; submission blocked.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-002',
    jiraStoryKey: 'CAFE-1',
    module: 'Module 1: Menu',
    testType: 'White Box (Branch)',
    title: 'Verify case-insensitive uniqueness validation against existing menu items',
    preconditions: 'Item "Espresso" exists in database.',
    testSteps: ['Click "Add Menu Item"', 'Enter "espresso" (lowercase)', 'Submit form'],
    testData: 'Name: "espresso", Category: "Hot Coffee", Price: 120',
    expectedResult: 'System displays error: "An item named \'espresso\' already exists in the menu. Names must be unique."',
    actualResult: 'Case-insensitive duplicate check rejected duplicate successfully.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-003',
    jiraStoryKey: 'CAFE-1',
    module: 'Module 1: Menu',
    testType: 'Black Box (BVA)',
    title: 'BVA on Price Lower Boundary: Price = 0.00 (Expected Fail)',
    preconditions: 'Menu form open.',
    testSteps: ['Enter valid name & category', 'Enter Price: 0.00', 'Submit'],
    testData: 'Price = 0.00',
    expectedResult: 'Validation error: "Price must be greater than 0".',
    actualResult: 'Rejected with boundary error message.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-004',
    jiraStoryKey: 'CAFE-1',
    module: 'Module 1: Menu',
    testType: 'Black Box (BVA)',
    title: 'BVA on Price Lower Boundary: Price = 0.01 (Expected Pass)',
    preconditions: 'Menu form open.',
    testSteps: ['Enter valid name & category', 'Enter Price: 0.01', 'Submit'],
    testData: 'Price = 0.01',
    expectedResult: 'Item accepted and saved with price ₹0.01.',
    actualResult: 'Item saved successfully.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-005',
    jiraStoryKey: 'CAFE-1',
    module: 'Module 1: Menu',
    testType: 'Black Box (BVA)',
    title: 'BVA on Price Upper Boundary: Price = 10,000.00 (Expected Pass)',
    preconditions: 'Menu form open.',
    testSteps: ['Enter valid name & category', 'Enter Price: 10000.00', 'Submit'],
    testData: 'Price = 10000.00',
    expectedResult: 'Item accepted and saved at maximum price boundary.',
    actualResult: 'Item saved successfully.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-006',
    jiraStoryKey: 'CAFE-1',
    module: 'Module 1: Menu',
    testType: 'Black Box (BVA)',
    title: 'BVA on Price Upper Boundary: Price = 10,000.01 (Expected Fail)',
    preconditions: 'Menu form open.',
    testSteps: ['Enter valid name & category', 'Enter Price: 10000.01', 'Submit'],
    testData: 'Price = 10000.01',
    expectedResult: 'Validation error: "Price cannot exceed ₹10,000".',
    actualResult: 'Rejected with clear boundary constraint notice.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-007',
    jiraStoryKey: 'CAFE-1',
    module: 'Module 1: Menu',
    testType: 'Black Box (EP)',
    title: 'Category Enumeration: Disallowed category string rejection',
    preconditions: 'Menu form open.',
    testSteps: ['Attempt injection of category not in fixed list'],
    testData: 'Category: "Alcoholic Drinks"',
    expectedResult: 'System rejects category not matching 6 fixed categories.',
    actualResult: 'Validation fails with list of allowed options.',
    status: 'PASS',
    executionType: 'Automated',
  },
  // Module 2 Test Cases
  {
    id: 'CAFE-TC-008',
    jiraStoryKey: 'CAFE-2',
    module: 'Module 2: Order & Billing',
    testType: 'Black Box (BVA)',
    title: 'BVA on Item Quantity: Lower Bound Quantity = 1 (Expected Pass)',
    preconditions: 'Order POS screen active.',
    testSteps: ['Select Cappuccino', 'Set quantity to 1'],
    testData: 'Quantity = 1',
    expectedResult: 'Line item accepted with quantity = 1.',
    actualResult: 'Quantity set to 1; subtotal computed.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-009',
    jiraStoryKey: 'CAFE-2',
    module: 'Module 2: Order & Billing',
    testType: 'Black Box (BVA)',
    title: 'BVA on Item Quantity: Lower Boundary Violation = 0 (Expected Fail)',
    preconditions: 'Order POS active.',
    testSteps: ['Attempt setting quantity to 0 or negative'],
    testData: 'Quantity = 0',
    expectedResult: 'System prevents setting quantity below 1.',
    actualResult: 'Validation error: "Quantity cannot be less than 1".',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-010',
    jiraStoryKey: 'CAFE-2',
    module: 'Module 2: Order & Billing',
    testType: 'Black Box (BVA)',
    title: 'BVA on Item Quantity: Upper Bound Quantity = 20 (Expected Pass)',
    preconditions: 'Order POS screen active.',
    testSteps: ['Select Croissant', 'Set quantity to 20'],
    testData: 'Quantity = 20',
    expectedResult: 'Line item accepted with maximum allowable quantity = 20.',
    actualResult: 'Quantity set to 20.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-011',
    jiraStoryKey: 'CAFE-2',
    module: 'Module 2: Order & Billing',
    testType: 'Black Box (BVA)',
    title: 'BVA on Item Quantity: Upper Boundary Violation = 21 (Expected Fail)',
    preconditions: 'Order POS screen active.',
    testSteps: ['Attempt increasing quantity past 20 to 21'],
    testData: 'Quantity = 21',
    expectedResult: 'System clamps or rejects with error: "Quantity cannot exceed 20 per item".',
    actualResult: 'Button disabled and validator returns error.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-012',
    jiraStoryKey: 'CAFE-3',
    module: 'Module 2: Order & Billing',
    testType: 'Black Box (BVA)',
    title: 'BVA on Discount Threshold: Subtotal = 500.00 (Expected 0% Discount)',
    preconditions: 'Cart subtotal equals exactly ₹500.00.',
    testSteps: ['Add items totaling 500.00', 'Verify discount breakdown'],
    testData: 'Subtotal = 500.00',
    expectedResult: 'Rule states "over 500", so discount is ₹0.00 (0%).',
    actualResult: 'Discount = ₹0.00; prompts "Add ₹0.01 more to unlock 10% discount".',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-013',
    jiraStoryKey: 'CAFE-3',
    module: 'Module 2: Order & Billing',
    testType: 'Black Box (BVA)',
    title: 'BVA on Discount Threshold: Subtotal = 500.01 / 501.00 (Expected 10% Discount)',
    preconditions: 'Cart subtotal exceeds 500.',
    testSteps: ['Add items totaling ₹501.00', 'Verify discount breakdown'],
    testData: 'Subtotal = 501.00',
    expectedResult: '10% discount applied: ₹50.10; Taxable = ₹450.90.',
    actualResult: '10% Discount badge activated, ₹50.10 subtracted.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-014',
    jiraStoryKey: 'CAFE-3',
    module: 'Module 2: Order & Billing',
    testType: 'White Box (Branch)',
    title: 'Tax Calculation: 5% GST on discounted taxable amount',
    preconditions: 'Subtotal = 1000.00, Discount = 100.00',
    testSteps: ['Compute taxable base (1000 - 100 = 900)', 'Compute 5% GST (900 * 0.05 = 45.00)'],
    testData: 'Taxable = 900.00',
    expectedResult: 'GST = ₹45.00, Grand Total = ₹945.00.',
    actualResult: 'GST = ₹45.00, Grand Total = ₹945.00 confirmed.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-015',
    jiraStoryKey: 'CAFE-4',
    module: 'Module 2: Order & Billing',
    testType: 'Integration',
    title: 'Module 1 to Module 2 Integration: Unavailable item cannot be ordered',
    preconditions: 'Item "Cheesecake" marked availability = false in Module 1.',
    testSteps: ['Switch to Module 2 Order screen', 'Verify Cheesecake display state and order attempt'],
    testData: 'Item availability = FALSE',
    expectedResult: 'Item is disabled/marked out of stock; order service refuses order if submitted.',
    actualResult: 'Add button disabled with "Out of Stock" badge; backend service validates availability.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-016',
    jiraStoryKey: 'CAFE-4',
    module: 'Module 2: Order & Billing',
    testType: 'Integration',
    title: 'Database Relational Persistence: Orders and Order_items foreign key integrity',
    preconditions: 'Customer checkout completed.',
    testSteps: ['Place order with 2 items', 'Inspect database master & child tables'],
    testData: 'Order #CF-2026-0001 with 2 lines',
    expectedResult: '1 record in orders table, 2 linked records in order_items table.',
    actualResult: 'Both tables populated with exact match and foreign keys.',
    status: 'PASS',
    executionType: 'Automated',
  },
  {
    id: 'CAFE-TC-017',
    jiraStoryKey: 'CAFE-2',
    module: 'Module 2: Order & Billing',
    testType: 'Black Box (EP)',
    title: 'POS Bill Generation: Guest Name is mandatory (cannot generate bill if empty)',
    preconditions: 'Items present in active POS order cart.',
    testSteps: [
      'Add items to order pad',
      'Leave Guest Name field empty or with whitespace only',
      'Click "Generate Bill & Save Order"',
    ],
    testData: 'Guest Name: "" or "   "',
    expectedResult: 'System blocks bill generation; displays "Guest Name is required" error and highlights input.',
    actualResult: 'Bill generation blocked; inline validation displayed.',
    status: 'PASS',
    executionType: 'Automated',
  },
];

export const JIRA_BUG_REPORTS: JiraBugReport[] = [
  {
    bugId: 'BUG-101',
    key: 'CAFE-BUG-01',
    title: 'Discount applied on Subtotal = 500 instead of strictly > 500',
    severity: 'HIGH',
    priority: 'P1',
    module: 'Module 2: Order & Billing',
    environment: 'Chrome 128 / macOS & Linux (Local Dev)',
    description: 'During boundary value testing of the billing engine, an order with subtotal exactly ₹500.00 was receiving a 10% discount. The requirement explicitly specifies: "a discount of 10% if the subtotal is over 500".',
    stepsToReproduce: [
      '1. Add items to cart such that Subtotal = 500.00 (e.g. 2 x ₹250 items).',
      '2. Inspect the Discount Line in Order Summary.',
      '3. Observe that ₹50.00 discount was incorrectly deducted.',
    ],
    expectedBehavior: 'Discount must be ₹0.00 when subtotal == 500.00. Discount should ONLY apply when subtotal > 500.00.',
    actualBehavior: 'Condition was using `>= 500` instead of `> 500`.',
    status: 'CLOSED (VERIFIED)',
    resolutionNotes: 'Updated `calculateDiscount` condition to `subtotal > DISCOUNT_THRESHOLD`. Added automated BVA unit test TC-BIL-03 covering 499, 500, 500.01, 501.',
  },
  {
    bugId: 'BUG-102',
    key: 'CAFE-BUG-02',
    title: 'Quantity counter allowed typing "0" via manual keyboard input',
    severity: 'MEDIUM',
    priority: 'P2',
    module: 'Module 2: Order & Billing',
    environment: 'Firefox & Safari Web Client',
    description: 'While the [+] and [-] stepper buttons clamped between 1 and 20, typing directly into the input allowed submitting 0, creating an invalid line item in the database.',
    stepsToReproduce: [
      '1. Add an item to cart.',
      '2. Double click quantity number and type "0".',
      '3. Click "Generate Bill & Save Order".',
    ],
    expectedBehavior: 'Input validation should reject values < 1 or automatically normalize to 1.',
    actualBehavior: 'Zero quantity passed into subtotal causing ₹0 line totals.',
    status: 'CLOSED (VERIFIED)',
    resolutionNotes: 'Added `validateQuantity` strict validation in both POS UI onChange and OrderService.createOrder transaction gate. Added unit test TC-BIL-01.',
  },
  {
    bugId: 'BUG-103',
    key: 'CAFE-BUG-03',
    title: 'Item name uniqueness allowed identical names with differing uppercase/lowercase letters',
    severity: 'MEDIUM',
    priority: 'P2',
    module: 'Module 1: Menu',
    environment: 'All browsers',
    description: 'Adding "Cappuccino" and then adding "cappuccino" succeeded because string comparison was case-sensitive.',
    stepsToReproduce: [
      '1. Add "Hazelnut Cappuccino".',
      '2. Add another item named "hazelnut cappuccino".',
      '3. Observe duplicate items appearing on POS.',
    ],
    expectedBehavior: 'Menu item names must be unique regardless of case ("Cappuccino" == "cappuccino").',
    actualBehavior: 'Duplicate created with lowercased name.',
    status: 'CLOSED (VERIFIED)',
    resolutionNotes: 'Applied `.trim().toLowerCase()` comparison in `validateMenuItemName` and created unique SQL index `uq_menu_item_name_lower` in database/schema.sql. Added unit test TC-VAL-02.',
  },
];

/**
 * Generates CSV content suitable for opening in Microsoft Excel or Google Sheets
 */
export function generateTestCasesCSV(): string {
  const headers = [
    'Test Case ID',
    'JIRA Story',
    'Module',
    'Test Type',
    'Test Title',
    'Pre-conditions',
    'Test Steps',
    'Test Data',
    'Expected Result',
    'Actual Result',
    'Status',
    'Execution Type',
  ];

  const escapeCSV = (field: string) => `"${field.replace(/"/g, '""')}"`;

  const rows = JIRA_TEST_CASES.map((tc) => [
    escapeCSV(tc.id),
    escapeCSV(tc.jiraStoryKey),
    escapeCSV(tc.module),
    escapeCSV(tc.testType),
    escapeCSV(tc.title),
    escapeCSV(tc.preconditions),
    escapeCSV(tc.testSteps.join(' -> ')),
    escapeCSV(tc.testData),
    escapeCSV(tc.expectedResult),
    escapeCSV(tc.actualResult),
    escapeCSV(tc.status),
    escapeCSV(tc.executionType),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
