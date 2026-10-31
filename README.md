# Cafe Management System (CafeMaster)

A robust, production-grade **Cafe Management System** architected with strict layer separation (Presentation, Domain Logic, and Relational Database persistence). Built with **TypeScript**, **React 19**, and **Tailwind CSS**, designed specifically for Software Engineering student demonstrations, white-box and black-box quality assurance, and JIRA project testing cycles.

---

## 📋 Problem Statement & Objectives

Modern food-and-beverage outlets require deterministic, auditable software to eliminate order inaccuracies, maintain catalog integrity, and accurately compute taxation and discounts. 

This system implements **exactly two core modules** with end-to-end integration:
1. **Module 1: Menu Management**: Full CRUD operations for menu items (`id`, `name`, `category`, `price`, `availability`) guarded by strict validation rules.
2. **Module 2: Order & Billing**: Point of Sale (POS) that reads live menu data from Module 1, enforces item quantity constraints (1–20), computes subtotals, evaluates a **10% discount threshold for subtotals strictly over ₹500**, applies **5% GST**, produces printable thermal receipts, and atomically persists relational orders and order lines.

---

## 🏛️ System Architecture & Layer Separation

```
CafeManagementSystem/
├── README.md                     # System documentation, setup, and testing guide
├── package.json                  # Dependencies & scripts
├── database/
│   └── schema.sql                # Relational SQL schema (DDL, constraints, FKs, indexes, seeds)
├── tests/
│   ├── validation.test.ts        # Unit tests for Module 1 (Name, Price, Category)
│   └── billing.test.ts           # Unit tests for Module 2 (Quantities, 10% Discount, 5% GST)
├── docs/
│   ├── test_cases.csv            # Formal Black-box/White-box Test Case Matrix (Excel ready)
│   └── bug_report.md             # JIRA Defect Lifecycle & Resolution documentation
└── src/
    ├── database/
    │   └── db.ts                 # Relational in-memory + LocalStorage engine & SQL dump generator
    ├── module1_menu/
    │   ├── types.ts              # Domain interfaces & fixed category enumeration
    │   ├── validation.ts         # Pure domain validation functions (no UI dependencies)
    │   ├── menuService.ts        # Service/repository layer for menu CRUD
    │   ├── MenuManagementView.tsx# Module 1 UI presentation component
    │   └── MenuItemFormModal.tsx # Accessible modal with live input feedback
    ├── module2_billing/
    │   ├── types.ts              # Cart, order lines, billing calculation interfaces
    │   ├── billingEngine.ts      # Pure mathematical engine (subtotal, 10% discount, 5% GST)
    │   ├── orderService.ts       # Atomic order transaction service reading Module 1
    │   ├── OrderBillingView.tsx  # Module 2 POS interface with quantity boundary controls
    │   ├── BillReceiptModal.tsx  # Printable thermal bill and .txt receipt exporter
    │   └── OrderHistoryView.tsx  # Relational order audit log & KPI dashboard
    ├── tests/
    │   ├── testRunner.ts         # In-browser test assertion harness
    │   └── TestRunnerView.tsx    # Live UI test execution runner
    ├── docs/
    │   ├── jiraMockData.ts       # JIRA user stories, acceptance criteria, and bug reports
    │   └── DocsModalOrTab.tsx    # JIRA QA center UI tab
    ├── components/
    │   └── Navbar.tsx            # Navigation header & database management
    ├── App.tsx                   # Top-level state coordinator
    ├── main.tsx                  # React entry point
    └── index.css                 # Tailwind CSS styling
```

---

## ⚙️ Module Specifications

### Module 1: Menu Management
- **Entity Fields**:
  - `id`: Unique identifier (string / UUID).
  - `name`: Required, non-empty, max 150 characters, **unique** across the catalog (case-insensitive check against existing items).
  - `category`: Must strictly be one of the 6 fixed categories:
    - *Hot Coffee*
    - *Cold Brew & Iced*
    - *Bakery & Pastries*
    - *Sandwiches & Mains*
    - *Artisanal Desserts*
    - *Specialty Teas*
  - `price`: Positive number strictly **> 0** and **≤ 10,000.00** (rounded to 2 decimal places).
  - `availability`: Boolean flag (`true` = In Stock, `false` = Out of Stock).
- **Features**: Real-time validation feedback, search by name, filter by category/stock, instant availability toggle, update modal, delete confirmation.

### Module 2: Order & Billing
- **Live Menu Dependency**: Reads live items directly from Module 1. Unavailable items cannot be added to an order.
- **Quantity Constraints**: Strictly enforced between **1 and 20** per line item (both UI steppers and service-level transaction validation reject `< 1` or `> 20`).
- **Mathematical Billing Engine**:
  - `Subtotal`: $\sum (\text{unit\_price} \times \text{quantity})$
  - `10% Discount Rule`: Applied **if and only if subtotal > ₹500.00**.
    - If Subtotal $\le 500.00 \implies \text{Discount} = ₹0.00$.
    - If Subtotal $> 500.00 \implies \text{Discount} = \text{Subtotal} \times 0.10$.
  - `Net Taxable Amount`: $\text{Subtotal} - \text{Discount}$
  - `5% GST`: $\text{Net Taxable Amount} \times 0.05$ (rounded to 2 decimal places).
  - `Grand Total`: $\text{Net Taxable Amount} + \text{GST Amount}$.
- **Receipt & Relational Persistence**:
  - Generates authentic printable receipt with bill number, customer name, date/time, itemized lines, and payment method.
  - Commits 1 row to `orders` and N rows to `order_items` linked by `order_id` foreign key.

---

## 🧪 Testing & JIRA Quality Assurance

The system is engineered for both **White-Box** and **Black-Box** test analysis:

### 1. Boundary Value Analysis (BVA)
| Target Parameter | Boundaries Tested | Expected Result |
| :--- | :--- | :--- |
| **Price** | -5.00, 0.00 | **REJECT** (Price must be > 0) |
| **Price** | 0.01 (min valid) | **PASS** |
| **Price** | 10000.00 (max valid) | **PASS** |
| **Price** | 10000.01 | **REJECT** (Price cannot exceed 10000) |
| **Quantity** | 0, -1 | **REJECT** (Min quantity is 1) |
| **Quantity** | 1 (min valid) | **PASS** |
| **Quantity** | 20 (max valid) | **PASS** |
| **Quantity** | 21 | **REJECT** (Max quantity is 20) |
| **Discount Subtotal** | 499.00 | **0% Discount** |
| **Discount Subtotal** | 500.00 | **0% Discount** (Rule: strictly *over* 500) |
| **Discount Subtotal** | 500.01 / 501.00 | **10% Discount Applied** |

### 2. Equivalence Partitioning (EP)
- **Names**: Empty string / whitespaces (Invalid) vs valid strings (Valid) vs duplicate string regardless of case (Invalid).
- **Categories**: Permitted 6 categories (Valid) vs unapproved string (Invalid).

### 3. JIRA Traceability Matrix
- `CAFE-1`: Menu Item Management (CRUD & Validation) -> Tests `TC-VAL-01` to `TC-VAL-07`
- `CAFE-2`: POS Item Selection & Quantity Limits -> Tests `TC-BIL-01`, `TC-BIL-02`
- `CAFE-3`: Billing Engine (10% Discount & 5% GST) -> Tests `TC-BIL-03` to `TC-BIL-07`
- `CAFE-4`: Relational Persistence & Receipt Printing -> Tests `TC-BIL-08`, Integration checks

All test cases are exportable via the UI as `test_cases.csv` (Microsoft Excel compatible).

---

## 🗄️ Relational Database Schema (`database/schema.sql`)

```sql
CREATE TABLE menu_items (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0.00 AND price <= 10000.00),
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_menu_item_name_lower ON menu_items (LOWER(name));

CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL DEFAULT 'Walk-in Guest',
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    gst_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL CHECK (grand_total >= 0.00),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(36) NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    item_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price > 0.00),
    quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 20),
    line_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Setup & Execution Steps

### Prerequisites
- Node.js (v18.0 or higher)
- npm (v9.0 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/YourUsername/CafeManagementSystem.git
cd CafeManagementSystem

# Install all dependencies
npm install
```

### Running the Application
```bash
# Run local development server
npm run dev

# Open browser at http://localhost:3000
```

### Deploying to Vercel

This repository is pre-configured for seamless 1-click deployment to [Vercel](https://vercel.com):

1. **Via GitHub / GitLab / Bitbucket**:
   - Push this repository to your Git provider.
   - Go to [vercel.com/new](https://vercel.com/new) and import the repository.
   - Vercel will automatically detect the **Vite** framework from `vercel.json`.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Click **Deploy**.

2. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI globally if not already installed
   npm install -g vercel

   # Deploy to preview
   vercel

   # Deploy to production
   vercel --prod
   ```

3. **Vercel Routing & Configuration (`vercel.json`)**:
   - Single Page Application (SPA) fallback rewrites `/(.*)` to `/index.html` so tab navigation and page reloads work smoothly.
   - Static assets under `/assets/` are automatically configured with long-term immutable cache headers.

---

## 🔗 Atlassian Jira Cloud Integration (Project `SCRUM`)

Website activities can be automatically synchronized in real-time to your Jira Software Cloud board:
- **Jira Instance**: [https://rbunagpur-team-rkyww9x4.atlassian.net](https://rbunagpur-team-rkyww9x4.atlassian.net)
- **Project Key**: `SCRUM`
- **Board URL**: [https://rbunagpur-team-rkyww9x4.atlassian.net/jira/software/projects/SCRUM/summary](https://rbunagpur-team-rkyww9x4.atlassian.net/jira/software/projects/SCRUM/summary)

### Integration Methods
1. **Option 1: Atlassian API Token**
   - Generate a free token at [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens).
   - Enter your email (`24kundus@rbunagpur.in`) and the API token into the **JIRA QA &gt; Jira Live Sync** tab in the app, or add `JIRA_API_TOKEN` to your environment variables.
   - Changes route through `/api/jira` (Vercel Serverless Function & Vite dev proxy) to bypass CORS and securely push tasks to `SCRUM`.

2. **Option 2: Jira Incoming Webhook (Zero Secret in Browser)**
   - In Jira project `SCRUM`: navigate to **Project Settings &gt; Automation &gt; Create Rule**.
   - Set Trigger: **Incoming Webhook** (copy the generated URL).
   - Set Action: **Create Issue** or **Add Comment**.
   - Paste the webhook URL into the app's **Jira Live Sync** settings.

### Events Synchronized
- **Menu Catalog**: Creating, updating, deleting items, or toggling stock status logs changes to Jira.
- **POS Billing**: Every order placed is recorded with transaction values, discounts, and item breakdowns.
- **QA & Unit Tests**: Automated test execution reports can be dispatched directly to your board.
- **Defect Reporting**: Bug reports can be pushed as formal `Bug` issues into Jira project `SCRUM` with 1 click.

---

## 👥 Student Demo Walkthrough Script

1. **Step 1: Module 1 Validation Demonstration**:
   - Open **Module 1: Menu**.
   - Attempt to add an item with price `0` or `10001` -> observe red constraint message.
   - Add item `"Hazelnut Cappuccino"` -> observe uniqueness error (case-insensitive detection).
   - Toggle availability of `"Lotus Biscoff Baked Cheesecake"` to *Out of Stock*.
2. **Step 2: Module 2 Ordering & POS Verification**:
   - Switch to **Module 2: Order & POS**.
   - Notice that the cheesecake is disabled and labeled *Out of Stock*.
   - Add a *Hazelnut Cappuccino* (₹185). Set quantity to `20` -> observe upper bound button lock.
   - Adjust subtotal to ₹490 -> observe progress bar prompting to cross ₹500.
   - Add 1 more item so subtotal becomes ₹675 -> observe **🎉 10% Discount Applied (-₹67.50)** and **5% GST (+₹30.38)** computed automatically.
3. **Step 3: Receipt Generation & Database Audit**:
   - Click **"Generate Bill & Save Order"**.
   - Inspect the thermal receipt breakdown and test **"Save .txt"** or **"Print Bill"**.
   - Open the **"Orders"** tab to verify relational storage in the database.
4. **Step 4: Quality Assurance Review**:
   - Switch to the **"Unit Tests"** tab and click **"Execute All Unit Tests"** to demonstrate 100% test pass rate with boundary coverage.
   - Switch to the **"JIRA QA"** tab to demonstrate the Test Cases Matrix, Bug Reports, and export `test_cases.csv`.
