/**
 * Module 1: Menu Management - Service Layer
 * 
 * Intermediary between UI and Database layer.
 * Enforces validation rules before persistence and provides structured errors.
 */

import { db } from '../database/db.ts';
import { MenuItem, MenuItemFormData, ValidationResult } from './types.ts';
import { validateMenuItemForm } from './validation.ts';
import { jiraSyncService } from '../services/jiraSyncService.ts';

export class MenuService {
  /**
   * Retrieves all menu items sorted by category and name
   */
  public static getAll(): MenuItem[] {
    const items = db.getMenuItems();
    return [...items].sort((a, b) => {
      if (a.category === b.category) {
        return a.name.localeCompare(b.name);
      }
      return a.category.localeCompare(b.category);
    });
  }

  /**
   * Retrieves only items currently marked as available (for Module 2 Order selection)
   */
  public static getAvailableOnly(): MenuItem[] {
    return this.getAll().filter((item) => item.availability === true);
  }

  /**
   * Finds a single menu item by ID
   */
  public static getById(id: string): MenuItem | undefined {
    return db.getMenuItems().find((item) => item.id === id);
  }

  /**
   * Creates a new menu item after validating business rules:
   * - Name required and unique (case-insensitive)
   * - Price > 0 and <= 10000
   * - Category from fixed list
   */
  public static create(formData: MenuItemFormData): { success: boolean; item?: MenuItem; validation: ValidationResult } {
    const currentItems = db.getMenuItems();
    const validation = validateMenuItemForm(formData, currentItems);

    if (!validation.isValid || !validation.sanitizedData) {
      return { success: false, validation };
    }

    const newItem: MenuItem = {
      id: `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: validation.sanitizedData.name,
      category: validation.sanitizedData.category,
      price: validation.sanitizedData.price,
      availability: validation.sanitizedData.availability,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveMenuItems([...currentItems, newItem]);

    // Dispatch event to Jira Cloud project SCRUM
    jiraSyncService.logEvent({
      type: 'menu_created',
      summary: `[Menu Added] ${newItem.name} (₹${newItem.price.toFixed(2)})`,
      details: `New menu item added to catalog:\nName: ${newItem.name}\nCategory: ${newItem.category}\nPrice: ₹${newItem.price.toFixed(2)}\nStatus: ${newItem.availability ? 'In Stock' : 'Out of Stock'}`,
      issueType: 'Task',
    });

    return { success: true, item: newItem, validation };
  }

  /**
   * Updates an existing menu item with validation
   */
  public static update(id: string, formData: MenuItemFormData): { success: boolean; item?: MenuItem; validation: ValidationResult } {
    const currentItems = db.getMenuItems();
    const existingIndex = currentItems.findIndex((item) => item.id === id);

    if (existingIndex === -1) {
      return {
        success: false,
        validation: {
          isValid: false,
          errors: { general: `Menu item with ID "${id}" was not found.` },
        },
      };
    }

    // Validate with currentItemId so it can keep its existing unique name
    const validation = validateMenuItemForm(formData, currentItems, id);

    if (!validation.isValid || !validation.sanitizedData) {
      return { success: false, validation };
    }

    const updatedItem: MenuItem = {
      ...currentItems[existingIndex],
      name: validation.sanitizedData.name,
      category: validation.sanitizedData.category,
      price: validation.sanitizedData.price,
      availability: validation.sanitizedData.availability,
      updatedAt: new Date().toISOString(),
    };

    const newItems = [...currentItems];
    newItems[existingIndex] = updatedItem;
    db.saveMenuItems(newItems);

    // Dispatch event to Jira Cloud project SCRUM
    jiraSyncService.logEvent({
      type: 'menu_updated',
      summary: `[Menu Updated] ${updatedItem.name} (₹${updatedItem.price.toFixed(2)})`,
      details: `Menu item details updated:\nName: ${updatedItem.name}\nCategory: ${updatedItem.category}\nPrice: ₹${updatedItem.price.toFixed(2)}\nStock: ${updatedItem.availability ? 'In Stock' : 'Out of Stock'}`,
      issueType: 'Task',
    });

    return { success: true, item: updatedItem, validation };
  }

  /**
   * Toggles the stock availability flag for an item
   */
  public static toggleAvailability(id: string): { success: boolean; newStatus?: boolean } {
    const currentItems = db.getMenuItems();
    const item = currentItems.find((i) => i.id === id);
    if (!item) return { success: false };

    const newStatus = !item.availability;
    const updated = currentItems.map((i) =>
      i.id === id ? { ...i, availability: newStatus, updatedAt: new Date().toISOString() } : i
    );

    db.saveMenuItems(updated);

    // Dispatch event to Jira Cloud project SCRUM
    jiraSyncService.logEvent({
      type: 'menu_stock',
      summary: `[Menu Stock] "${item.name}" marked ${newStatus ? 'IN STOCK' : 'OUT OF STOCK'}`,
      details: `Stock status toggled for item "${item.name}" (ID: ${item.id}). New status: ${newStatus ? 'Available for POS' : 'Disabled from POS'}.`,
      issueType: 'Task',
    });

    return { success: true, newStatus };
  }

  /**
   * Deletes a menu item from the database
   */
  public static delete(id: string): boolean {
    const currentItems = db.getMenuItems();
    const targetItem = currentItems.find((i) => i.id === id);
    const filtered = currentItems.filter((i) => i.id !== id);

    if (filtered.length === currentItems.length) {
      return false;
    }

    db.saveMenuItems(filtered);

    // Dispatch event to Jira Cloud project SCRUM
    jiraSyncService.logEvent({
      type: 'menu_deleted',
      summary: `[Menu Deleted] "${targetItem?.name || id}" removed from catalog`,
      details: `Menu item "${targetItem?.name || id}" was permanently removed by manager.`,
      issueType: 'Task',
    });

    return true;
  }
}
