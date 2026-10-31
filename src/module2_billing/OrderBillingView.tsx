import React, { useState, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Search,
  Sparkles,
  Percent,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Coffee,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MenuItem, MenuCategory, ALLOWED_CATEGORIES } from '../module1_menu/types.ts';
import {
  CartItem,
  CreateOrderPayload,
  Order,
  PaymentMethod,
  PAYMENT_METHODS,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
  DISCOUNT_THRESHOLD,
} from './types.ts';
import { calculateBill, validateQuantity } from './billingEngine.ts';
import { OrderService } from './orderService.ts';
import { BillReceiptModal } from './BillReceiptModal.tsx';

interface OrderBillingViewProps {
  menuItems: MenuItem[];
  onOrderSaved: () => void;
  onNavigateToMenu: () => void;
}

export const OrderBillingView: React.FC<OrderBillingViewProps> = ({
  menuItems,
  onOrderSaved,
  onNavigateToMenu,
}) => {
  // Order Pad State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [guestNameError, setGuestNameError] = useState<string | null>(null);
  const guestNameInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter menu items for catalog
  const filteredCatalog = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Real-time bill calculations
  const bill = useMemo(() => {
    return calculateBill(
      cart.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity }))
    );
  }, [cart]);

  // Add item to cart from catalog
  const handleAddToCart = (item: MenuItem) => {
    if (!item.availability) {
      showToast(`Cannot add "${item.name}" - Marked OUT OF STOCK in Module 1.`);
      return;
    }

    setOrderError(null);
    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.menuItemId === item.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty >= MAX_ITEM_QUANTITY) {
          showToast(`Maximum quantity of ${MAX_ITEM_QUANTITY} reached for "${item.name}"`);
          return prev;
        }
        const updated = [...prev];
        const newQty = currentQty + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          lineTotal: Math.round(item.price * newQty * 100) / 100,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          menuItemId: item.id,
          name: item.name,
          category: item.category,
          unitPrice: item.price,
          quantity: 1,
          lineTotal: item.price,
        };
        return [...prev, newItem];
      }
    });
  };

  // Adjust item quantity with bounds checking [1, 20]
  const handleUpdateQuantity = (menuItemId: string, targetQty: number) => {
    setOrderError(null);
    const qtyCheck = validateQuantity(targetQty);

    if (!qtyCheck.isValid) {
      showToast(qtyCheck.error || 'Invalid quantity');
      return;
    }

    setCart((prev) =>
      prev.map((ci) => {
        if (ci.menuItemId === menuItemId) {
          const validQty = qtyCheck.sanitizedQuantity;
          return {
            ...ci,
            quantity: validQty,
            lineTotal: Math.round(ci.unitPrice * validQty * 100) / 100,
          };
        }
        return ci;
      })
    );
  };

  // Remove single line item
  const handleRemoveItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItemId !== menuItemId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCart([]);
    setOrderError(null);
  };

  // Submit order & generate bill
  const handleGenerateBill = () => {
    if (cart.length === 0) {
      setOrderError('Cart is empty. Please select at least one item from the menu.');
      return;
    }

    const trimmedGuestName = customerName.trim();
    if (!trimmedGuestName) {
      setGuestNameError('Guest Name is required to generate the bill.');
      setOrderError('Cannot generate bill: Guest Name is required. Please enter a guest name before proceeding.');
      guestNameInputRef.current?.focus();
      return;
    }

    const payload: CreateOrderPayload = {
      customerName: trimmedGuestName,
      tableNumber: tableNumber.trim() || undefined,
      paymentMethod,
      items: cart.map((ci) => ({
        menuItemId: ci.menuItemId,
        quantity: ci.quantity,
      })),
    };

    const res = OrderService.createOrder(payload);

    if (res.success && res.order) {
      setCompletedOrder(res.order);
      setIsReceiptOpen(true);
      onOrderSaved();
      setOrderError(null);
      setGuestNameError(null);
    } else {
      setOrderError(res.error || 'Failed to place order.');
    }
  };

  // Reset cart for next order
  const handleNewOrder = () => {
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setPaymentMethod('CASH');
    setOrderError(null);
    setGuestNameError(null);
  };

  // Discount progress calculation
  const discountProgressPercent = Math.min(
    100,
    Math.round((bill.subtotal / DISCOUNT_THRESHOLD) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e140f] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#d97706]/40 flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <AlertCircle className="w-4 h-4 text-[#fbbf24]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module 2 Header Banner */}
      <div className="bg-gradient-to-r from-[#1e140f] via-[#2c1d14] to-[#1e140f] text-white rounded-2xl p-6 shadow-md border border-[#3d2a1d]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#10b981] text-white">
                Module 2
              </span>
              <span className="text-xs text-[#d6c7b9]">POS Order Pad &amp; Automated Billing</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-['Plus_Jakarta_Sans']">
              Order &amp; Billing Terminal
            </h1>
            <p className="text-xs text-[#a89282] max-w-2xl mt-1">
              Live reads from Module 1 catalog. Enforces quantity limits (1–20), computes subtotal,
              10% discount on orders strictly over ₹500, 5% GST, and generates atomic database records.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToMenu}
              className="px-4 py-2 rounded-xl bg-[#2c1d14] hover:bg-[#3d2a1d] text-[#fbbf24] text-xs font-bold border border-[#4a3424] transition-colors flex items-center space-x-1.5"
            >
              <span>Manage Menu (Module 1)</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split Screen Workspace: Catalog (Left) vs Order Pad (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Menu Catalog (Reads from Module 1) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e8dfd5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#523927] flex items-center space-x-1.5">
                <Coffee className="w-3.5 h-3.5 text-[#b45309]" />
                <span>Available Menu Catalog</span>
              </span>
              <span className="text-[11px] text-neutral-500">
                {menuItems.filter((i) => i.availability).length} of {menuItems.length} items available
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e0d6cb] text-xs focus:outline-none focus:border-[#d97706] bg-[#faf7f2]/50 text-[#2c1d14]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#2c1d14] text-white'
                    : 'bg-[#faf7f2] text-[#523927] hover:bg-[#eae2d7] border border-[#e8dfd5]'
                }`}
              >
                All
              </button>
              {ALLOWED_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#d97706] text-white'
                      : 'bg-[#faf7f2] text-[#523927] hover:bg-[#eae2d7] border border-[#e8dfd5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Item Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredCatalog.map((item) => {
              const inCart = cart.find((ci) => ci.menuItemId === item.id);
              const isAvailable = item.availability;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                    isAvailable
                      ? 'border-[#e8dfd5] hover:border-[#d97706]/60 hover:shadow-md'
                      : 'border-neutral-200 bg-neutral-50/70 opacity-65'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#faf7f2] border border-[#e8dfd5] text-[#78350f]">
                        {item.category}
                      </span>
                      {isAvailable ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>In Stock</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>Out of Stock</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-[#2c1d14] mt-2 line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-base font-extrabold text-[#78350f] mt-1 font-['Plus_Jakarta_Sans']">
                      ₹{item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f0e8de] flex items-center justify-between">
                    {inCart ? (
                      <span className="text-xs font-bold text-[#d97706]">
                        {inCart.quantity} in order (₹{inCart.lineTotal.toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400">Not added yet</span>
                    )}

                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!isAvailable}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all ${
                        isAvailable
                          ? 'bg-[#2c1d14] hover:bg-[#d97706] text-white shadow-xs active:scale-95'
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCart ? 'Add More' : 'Add to Order'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Order Pad & Live Billing Engine */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-md border border-[#e8dfd5] p-5 space-y-4 sticky top-20">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e8dfd5] pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#faf7f2] border border-[#e8dfd5] flex items-center justify-center text-[#d97706]">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#2c1d14] font-['Plus_Jakarta_Sans']">
                  Active POS Bill
                </h3>
                <p className="text-[10px] text-neutral-400">Order Lines &amp; Real-time GST</p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-1 hover:underline"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Customer Metadata Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-[#523927] uppercase tracking-wider flex items-center space-x-1">
                  <span>Guest Name</span>
                  <span className="text-red-500 font-black">*</span>
                </label>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    guestNameError
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Required
                </span>
              </div>
              <input
                ref={guestNameInputRef}
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (guestNameError && e.target.value.trim()) {
                    setGuestNameError(null);
                  }
                  if (orderError?.includes('Guest Name') && e.target.value.trim()) {
                    setOrderError(null);
                  }
                }}
                placeholder="Enter guest name (Required)"
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none transition-all ${
                  guestNameError
                    ? 'border-red-500 bg-red-50/50 text-red-900 placeholder:text-red-300 focus:ring-2 focus:ring-red-400/30'
                    : 'border-[#e0d6cb] bg-[#faf7f2]/40 text-[#2c1d14] focus:border-[#d97706] focus:bg-white'
                }`}
              />
              {guestNameError && (
                <p className="text-[10px] text-red-600 font-semibold mt-1 flex items-center space-x-1 animate-in fade-in duration-150">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{guestNameError}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#523927] uppercase tracking-wider mb-1">
                Table # (Optional)
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. Table 04"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#e0d6cb] text-xs bg-[#faf7f2]/40 text-[#2c1d14] outline-none focus:border-[#d97706] focus:bg-white"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="border border-[#e8dfd5] rounded-xl overflow-hidden bg-[#faf7f2]/40">
            {cart.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-[#523927]">Your order pad is empty</p>
                <p className="text-[11px] text-neutral-400">
                  Select available items from the left menu catalog to start billing.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8dfd5] max-h-60 overflow-y-auto scrollbar-thin">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="p-3 bg-white flex items-center justify-between text-xs gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-[#2c1d14] truncate">{item.name}</h5>
                      <span className="text-[10px] text-neutral-500">
                        ₹{item.unitPrice.toFixed(2)} each
                      </span>
                    </div>

                    {/* Quantity Stepper with [1, 20] boundary constraints */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(item.menuItemId, item.quantity - 1)}
                        disabled={item.quantity <= MIN_ITEM_QUANTITY}
                        title={`Decrease (min ${MIN_ITEM_QUANTITY})`}
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold border transition-colors ${
                          item.quantity <= MIN_ITEM_QUANTITY
                            ? 'border-neutral-200 text-neutral-300 bg-neutral-100 cursor-not-allowed'
                            : 'border-[#d6c7b9] text-[#523927] hover:bg-[#faf7f2] active:bg-[#e8dfd5]'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min={MIN_ITEM_QUANTITY}
                        max={MAX_ITEM_QUANTITY}
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.menuItemId, parseInt(e.target.value) || 1)}
                        className="w-9 text-center font-bold text-xs border border-[#d6c7b9] rounded-md py-0.5 outline-none focus:border-[#d97706]"
                      />

                      <button
                        onClick={() => handleUpdateQuantity(item.menuItemId, item.quantity + 1)}
                        disabled={item.quantity >= MAX_ITEM_QUANTITY}
                        title={`Increase (max ${MAX_ITEM_QUANTITY})`}
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold border transition-colors ${
                          item.quantity >= MAX_ITEM_QUANTITY
                            ? 'border-neutral-200 text-neutral-300 bg-neutral-100 cursor-not-allowed'
                            : 'border-[#d6c7b9] text-[#523927] hover:bg-[#faf7f2] active:bg-[#e8dfd5]'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="w-16 text-right font-black text-sm text-[#2c1d14]">
                      ₹{item.lineTotal.toFixed(2)}
                    </div>

                    {/* Delete Line */}
                    <button
                      onClick={() => handleRemoveItem(item.menuItemId)}
                      className="text-neutral-400 hover:text-red-600 transition-colors"
                      title="Remove line item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount Policy / Progress Card */}
          <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e8dfd5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#78350f] flex items-center space-x-1">
                <Percent className="w-3.5 h-3.5 text-[#d97706]" />
                <span>10% Discount Rule:</span>
              </span>
              {bill.discountEligible ? (
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  🎉 10% Discount Unlocked!
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-neutral-500">
                  Subtotal &gt; ₹500 required
                </span>
              )}
            </div>

            {/* Progress bar */}
            {!bill.discountEligible && cart.length > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-[#e8dfd5] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#d97706] h-full rounded-full transition-all duration-300"
                    style={{ width: `${discountProgressPercent}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Add <strong>₹{bill.amountNeededForDiscount.toFixed(2)}</strong> more to save 10% on the bill!
                </p>
              </div>
            )}
          </div>

          {/* Live Billing Breakdown */}
          <div className="space-y-1.5 text-xs border-t border-[#e8dfd5] pt-3">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal ({cart.reduce((acc, i) => acc + i.quantity, 0)} items):</span>
              <span className="font-semibold text-neutral-900">₹{bill.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-600">
                Discount (10% if Subtotal &gt; ₹500):
              </span>
              {bill.discountAmount > 0 ? (
                <span className="font-bold text-emerald-600">
                  -₹{bill.discountAmount.toFixed(2)}
                </span>
              ) : (
                <span className="text-neutral-400">₹0.00</span>
              )}
            </div>

            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-neutral-500 text-[11px]">
                <span>Net Taxable Amount:</span>
                <span>₹{bill.taxableAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-600">
              <span className="flex items-center space-x-1">
                <span>GST (5.00%):</span>
              </span>
              <span className="font-semibold text-neutral-900">+₹{bill.gstAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-[#e8dfd5]">
              <span className="text-sm font-black text-[#2c1d14]">Grand Total:</span>
              <span className="text-xl font-black text-[#b45309] font-['Plus_Jakarta_Sans']">
                ₹{bill.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#523927] uppercase tracking-wider mb-1.5">
              Select Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-[11px]">
              {(['CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                    paymentMethod === method
                      ? 'bg-[#1e140f] text-white border-[#1e140f] shadow-xs'
                      : 'bg-[#faf7f2] text-[#523927] border-[#e8dfd5] hover:bg-[#f0e8de]'
                  }`}
                >
                  {method === 'CASH' && 'Cash'}
                  {method === 'UPI' && 'UPI / QR'}
                  {method === 'CREDIT_CARD' && 'Credit'}
                  {method === 'DEBIT_CARD' && 'Debit'}
                </button>
              ))}
            </div>
          </div>

          {/* Order Error Alert */}
          {orderError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{orderError}</span>
            </div>
          )}

          {/* Missing Guest Name Warning banner if cart has items */}
          {cart.length > 0 && !customerName.trim() && (
            <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-800 flex items-center space-x-2 animate-in fade-in duration-150">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Guest name is required to generate the bill and receipt.</span>
            </div>
          )}

          {/* Generate Bill & Save Order Action */}
          <button
            onClick={handleGenerateBill}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
              cart.length > 0
                ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-white hover:brightness-105 active:scale-[0.99] cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Generate Bill &amp; Save Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      <BillReceiptModal
        order={completedOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onNewOrder={handleNewOrder}
      />
    </div>
  );
};
