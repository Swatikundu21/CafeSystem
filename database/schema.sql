-- ============================================================================
-- Cafe Management System - Relational Database Schema
-- Modules: Module 1 (Menu Management) & Module 2 (Order & Billing)
-- Target DBMS: PostgreSQL / SQLite3 / MySQL compatible ANSI SQL DDL
-- ============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;

-- ----------------------------------------------------------------------------
-- MODULE 1: Menu Items Table
-- Enforces:
-- 1. name: REQUIRED (NOT NULL) and UNIQUE (case-insensitive via unique index)
-- 2. price: > 0 AND <= 10000.00 (CHECK constraint)
-- 3. category: Fixed enumerated categories (CHECK constraint)
-- 4. availability: BOOLEAN flag
-- ----------------------------------------------------------------------------
CREATE TABLE menu_items (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Business Rule Validations
    CONSTRAINT chk_menu_item_price CHECK (price > 0.00 AND price <= 10000.00),
    CONSTRAINT chk_menu_item_category CHECK (
        category IN (
            'Hot Coffee',
            'Cold Brew & Iced',
            'Bakery & Pastries',
            'Sandwiches & Mains',
            'Artisanal Desserts',
            'Specialty Teas'
        )
    )
);

-- Unique index ensuring case-insensitive name uniqueness
CREATE UNIQUE INDEX uq_menu_item_name_lower ON menu_items (LOWER(name));
CREATE INDEX idx_menu_category ON menu_items (category);
CREATE INDEX idx_menu_availability ON menu_items (availability);

-- ----------------------------------------------------------------------------
-- MODULE 2: Orders Master Table
-- Stores customer checkout header, billing calculations:
-- Subtotal, 10% Discount (applied if subtotal > 500), 5% GST, Grand Total
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL DEFAULT 'Walk-in Guest',
    customer_phone VARCHAR(20),
    table_number VARCHAR(10),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    gst_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL CHECK (grand_total >= 0.00),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    order_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_orders_payment_method CHECK (
        payment_method IN ('CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE')
    )
);

CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_orders_payment_method ON orders (payment_method);

-- ----------------------------------------------------------------------------
-- MODULE 2: Order Lines / Order Items Table
-- Stores individual line items for an order, referencing Module 1's menu items
-- Enforces:
-- 1. Quantity strictly between 1 and 20 per item (CHECK constraint)
-- 2. Line total = unit_price * quantity
-- ----------------------------------------------------------------------------
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    menu_item_id VARCHAR(36) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price > 0.00),
    quantity INTEGER NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
        REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_item_id) 
        REFERENCES menu_items (id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_item_quantity CHECK (quantity >= 1 AND quantity <= 20)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_menu_id ON order_items (menu_item_id);

-- ----------------------------------------------------------------------------
-- SAMPLE SEED DATA
-- Authentic baseline menu across fixed categories
-- ----------------------------------------------------------------------------
INSERT INTO menu_items (id, name, category, price, availability) VALUES
('m-1', 'Hazelnut Cappuccino', 'Hot Coffee', 185.00, TRUE),
('m-2', 'Classic Espresso Macchiato', 'Hot Coffee', 140.00, TRUE),
('m-3', 'Spanish Latte (Condensed Milk)', 'Hot Coffee', 220.00, TRUE),
('m-4', 'Vanilla Sweet Cream Cold Brew', 'Cold Brew & Iced', 240.00, TRUE),
('m-5', 'Iced Caramel Cloud Frappe', 'Cold Brew & Iced', 270.00, TRUE),
('m-6', 'Butter Croissant (French Style)', 'Bakery & Pastries', 160.00, TRUE),
('m-7', 'Almond Pain Au Chocolat', 'Bakery & Pastries', 210.00, TRUE),
('m-8', 'Smoked Paneer & Basil Panini', 'Sandwiches & Mains', 320.00, TRUE),
('m-9', 'Grilled Chicken Pesto Focaccia', 'Sandwiches & Mains', 380.00, TRUE),
('m-10', 'Belgian Dark Chocolate Tart', 'Artisanal Desserts', 250.00, TRUE),
('m-11', 'Lotus Biscoff Baked Cheesecake', 'Artisanal Desserts', 290.00, FALSE),
('m-12', 'Kashmiri Saffron Kahwa', 'Specialty Teas', 175.00, TRUE);
