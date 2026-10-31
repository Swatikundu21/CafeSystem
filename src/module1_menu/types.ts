/**
 * Module 1: Menu Management - Types & Constants
 * 
 * Strict typing for menu entities, categories, and validation results.
 * Comments included for student software engineering demo.
 */

// Fixed category list as specified in requirements
export const ALLOWED_CATEGORIES = [
  'Hot Coffee',
  'Cold Brew & Iced',
  'Bakery & Pastries',
  'Sandwiches & Mains',
  'Artisanal Desserts',
  'Specialty Teas',
] as const;

export type MenuCategory = typeof ALLOWED_CATEGORIES[number];

/**
 * Menu Item Entity matching the database schema
 */
export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  availability: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form payload for creating or updating a menu item
 */
export interface MenuItemFormData {
  name: string;
  category: MenuCategory | '';
  price: number | string;
  availability: boolean;
}

/**
 * Structured validation errors for every input field
 */
export interface MenuItemValidationErrors {
  name?: string;
  category?: string;
  price?: string;
  availability?: string;
  general?: string;
}

/**
 * Result returned by the validation layer
 */
export interface ValidationResult {
  isValid: boolean;
  errors: MenuItemValidationErrors;
  sanitizedData?: {
    name: string;
    category: MenuCategory;
    price: number;
    availability: boolean;
  };
}
