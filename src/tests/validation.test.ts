/**
 * Unit Tests: Module 1 Menu Management Validation
 * 
 * Target: src/module1_menu/validation.ts
 * Techniques: Boundary Value Analysis (BVA), Equivalence Partitioning (EP), White-box Branch Coverage.
 * Traceability: JIRA CAFE-101 (Item Name), CAFE-102 (Price Boundary), CAFE-103 (Category Enum).
 */

import { MenuItem } from '../module1_menu/types.ts';
import {
  validateMenuItemCategory,
  validateMenuItemForm,
  validateMenuItemName,
  validateMenuItemPrice,
} from '../module1_menu/validation.ts';
import { TestRegistry } from './testRunner.ts';

const MOCK_EXISTING_ITEMS: MenuItem[] = [
  {
    id: 'item-101',
    name: 'Espresso',
    category: 'Hot Coffee',
    price: 120.00,
    availability: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-102',
    name: 'Croissant',
    category: 'Bakery & Pastries',
    price: 150.00,
    availability: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Suite Registration
const SUITE_NAME = 'Module 1: Menu Validation Suite';

export function registerMenuValidationTests(): void {
  // --------------------------------------------------------------------------
  // TEST CASE 1: Name Required - Empty & Whitespace Validation
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-VAL-01: Name validation rejects empty string and whitespace-only names',
    (t) => {
      const emptyResult = validateMenuItemName('', MOCK_EXISTING_ITEMS);
      t.expect(emptyResult.isValid, 'Empty name must be rejected').toBeFalsy();
      t.expect(emptyResult.error, 'Should return error about required name').toContain('Item name is required');

      const whitespaceResult = validateMenuItemName('   ', MOCK_EXISTING_ITEMS);
      t.expect(whitespaceResult.isValid, 'Whitespace-only name must be rejected').toBeFalsy();

      const nullResult = validateMenuItemName(null as unknown as string, MOCK_EXISTING_ITEMS);
      t.expect(nullResult.isValid, 'Non-string name must be rejected').toBeFalsy();
    },
    'CAFE-101',
    'TC-VAL-01'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 2: Name Unique - Case-Insensitive Duplicate Detection
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-VAL-02: Name validation enforces case-insensitive uniqueness against existing items',
    (t) => {
      // Exact duplicate
      const exactDup = validateMenuItemName('Espresso', MOCK_EXISTING_ITEMS);
      t.expect(exactDup.isValid, 'Exact duplicate must be rejected').toBeFalsy();
      t.expect(exactDup.error, 'Error message mentions existing item').toContain('already exists');

      // Case-insensitive duplicate (lowercase)
      const lowerDup = validateMenuItemName('espresso', MOCK_EXISTING_ITEMS);
      t.expect(lowerDup.isValid, 'Lowercase duplicate "espresso" must be rejected').toBeFalsy();

      // Case-insensitive duplicate with leading/trailing spaces
      const spaceDup = validateMenuItemName('   ESPRESSO   ', MOCK_EXISTING_ITEMS);
      t.expect(spaceDup.isValid, 'Padded duplicate " ESPRESSO " must be rejected').toBeFalsy();

      // New unique name
      const uniqueName = validateMenuItemName('Affogato Vanilla', MOCK_EXISTING_ITEMS);
      t.expect(uniqueName.isValid, 'Unique name must pass validation').toBeTruthy();
      t.expect(uniqueName.sanitizedName, 'Sanitized name matches trimmed input').toBe('Affogato Vanilla');
    },
    'CAFE-101',
    'TC-VAL-02'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 3: Name Unique on Item Update (Self-update Allowed)
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-VAL-03: Updating existing item allows keeping its own name but rejects conflicting names',
    (t) => {
      // When item-101 updates its own price/availability but keeps its name "Espresso"
      const ownNameUpdate = validateMenuItemName('Espresso', MOCK_EXISTING_ITEMS, 'item-101');
      t.expect(ownNameUpdate.isValid, 'Item updating itself can keep its name').toBeTruthy();

      // When item-101 tries to rename to item-102's name ("Croissant")
      const conflictingUpdate = validateMenuItemName('Croissant', MOCK_EXISTING_ITEMS, 'item-101');
      t.expect(conflictingUpdate.isValid, 'Item cannot take another existing item name').toBeFalsy();
    },
    'CAFE-101',
    'TC-VAL-03'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 4: Price Boundary Value Analysis - Lower Boundary (> 0)
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-VAL-04: Price validation enforces lower boundary: strictly > 0 (BVA: -1, 0, 0.01)',
    (t) => {
      // Value: -5.00 (Equivalence Partition: Negative)
      const negResult = validateMenuItemPrice(-5.00);
      t.expect(negResult.isValid, 'Negative price must be rejected').toBeFalsy();

      // Value: 0.00 (Boundary Lower: Zero must fail as requirement says "price > 0")
      const zeroResult = validateMenuItemPrice(0);
      t.expect(zeroResult.isValid, 'Price of exactly 0 must be rejected').toBeFalsy();
      t.expect(zeroResult.error, 'Error message informs price must be > 0').toContain('greater than 0');

      // Value: 0.01 (Boundary Lower Minimum: > 0 should pass)
      const minValid = validateMenuItemPrice(0.01);
      t.expect(minValid.isValid, 'Price of 0.01 must be accepted').toBeTruthy();
      t.expect(minValid.sanitizedPrice, 'Sanitized price is 0.01').toBe(0.01);
    },
    'CAFE-102',
    'TC-VAL-04'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 5: Price Boundary Value Analysis - Upper Boundary (<= 10,000)
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-VAL-05: Price validation enforces upper boundary: <= 10000 (BVA: 9999.99, 10000, 10000.01)',
    (t) => {
      // Value: 9999.99 (Valid near upper bound)
      const nearMax = validateMenuItemPrice(9999.99);
      t.expect(nearMax.isValid, 'Price of 9999.99 must be accepted').toBeTruthy();

      // Value: 10000.00 (Exact upper boundary)
      const exactMax = validateMenuItemPrice(10000);
      t.expect(exactMax.isValid, 'Price of 10000.00 must be accepted').toBeTruthy();
      t.expect(exactMax.sanitizedPrice, 'Sanitized price is 10000').toBe(10000);

      // Value: 10000.01 (Boundary excess > 10000)
      const overMax = validateMenuItemPrice(10000.01);
      t.expect(overMax.isValid, 'Price of 10000.01 must be rejected').toBeFalsy();
      t.expect(overMax.error, 'Error states price cannot exceed 10,000').toContain('cannot exceed');

      // Value: Non-numeric string 'invalid-price'
      const nanResult = validateMenuItemPrice('abc');
      t.expect(nanResult.isValid, 'Non-numeric string must be rejected').toBeFalsy();
    },
    'CAFE-102',
    'TC-VAL-05'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 6: Category Fixed Enumeration Validation
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-VAL-06: Category validation accepts fixed list items and rejects unauthorized categories',
    (t) => {
      // Valid category
      const validCat = validateMenuItemCategory('Hot Coffee');
      t.expect(validCat.isValid, '"Hot Coffee" category accepted').toBeTruthy();
      t.expect(validCat.sanitizedCategory, 'Category preserved in sanitized output').toBe('Hot Coffee');

      // Disallowed category (e.g. Alcoholic Beverages or Fast Food)
      const invalidCat = validateMenuItemCategory('Beer & Cocktails');
      t.expect(invalidCat.isValid, 'Unapproved category must be rejected').toBeFalsy();
      t.expect(invalidCat.error, 'Error contains allowed list message').toContain('Must be one of');

      // Empty category
      const emptyCat = validateMenuItemCategory('');
      t.expect(emptyCat.isValid, 'Empty category must be rejected').toBeFalsy();
    },
    'CAFE-103',
    'TC-VAL-06'
  );

  // --------------------------------------------------------------------------
  // TEST CASE 7: Composite Form Validation
  // --------------------------------------------------------------------------
  TestRegistry.register(
    SUITE_NAME,
    'TC-VAL-07: Form validator aggregates multiple field errors and produces clean sanitized data',
    (t) => {
      // Completely valid payload
      const validForm = validateMenuItemForm(
        {
          name: 'Iced Matcha Oat Latte',
          category: 'Cold Brew & Iced',
          price: 245.50,
          availability: true,
        },
        MOCK_EXISTING_ITEMS
      );
      t.expect(validForm.isValid, 'Valid form returns isValid = true').toBeTruthy();
      t.expect(validForm.sanitizedData?.price, 'Price sanitized correctly').toBe(245.50);

      // Invalid form with multiple errors: duplicate name, negative price, invalid category
      const multiErrorForm = validateMenuItemForm(
        {
          name: 'Espresso', // duplicate
          category: 'Invalid Cat' as any,
          price: -50,
          availability: true,
        },
        MOCK_EXISTING_ITEMS
      );
      t.expect(multiErrorForm.isValid, 'Multi-error form returns isValid = false').toBeFalsy();
      t.expect(Boolean(multiErrorForm.errors.name), 'Name error captured').toBeTruthy();
      t.expect(Boolean(multiErrorForm.errors.price), 'Price error captured').toBeTruthy();
      t.expect(Boolean(multiErrorForm.errors.category), 'Category error captured').toBeTruthy();
    },
    'CAFE-104',
    'TC-VAL-07'
  );
}
