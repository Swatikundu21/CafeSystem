import React from 'react';
import { X, Printer, Download, CheckCircle, Coffee, FileText, QrCode } from 'lucide-react';
import { Order } from './types.ts';

interface BillReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: () => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onNewOrder,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    let txt = `=================================================\n`;
    txt += `              CAFEMASTER ESPRESSO BAR             \n`;
    txt += `          104 Artisan Boulevard, Floor 1          \n`;
    txt += `                GSTIN: 27AABCT3518Q1Z5             \n`;
    txt += `=================================================\n`;
    txt += `Order No  : ${order.orderNumber}\n`;
    txt += `Date/Time : ${new Date(order.createdAt).toLocaleString()}\n`;
    txt += `Customer  : ${order.customerName}\n`;
    if (order.tableNumber) txt += `Table No  : ${order.tableNumber}\n`;
    txt += `Payment   : ${order.paymentMethod} (PAID)\n`;
    txt += `-------------------------------------------------\n`;
    txt += `Item                      Rate   Qty    Total\n`;
    txt += `-------------------------------------------------\n`;

    order.items.forEach((item) => {
      const name = item.itemName.padEnd(24, ' ').substring(0, 24);
      const rate = item.unitPrice.toFixed(2).padStart(7, ' ');
      const qty = item.quantity.toString().padStart(4, ' ');
      const total = item.lineTotal.toFixed(2).padStart(8, ' ');
      txt += `${name} ${rate} ${qty} ${total}\n`;
    });

    txt += `-------------------------------------------------\n`;
    txt += `Subtotal                           : Rs. ${order.subtotal.toFixed(2)}\n`;
    if (order.discountAmount > 0) {
      txt += `Discount (10% on >500)             : -Rs. ${order.discountAmount.toFixed(2)}\n`;
      txt += `Taxable Amount                     : Rs. ${(order.subtotal - order.discountAmount).toFixed(2)}\n`;
    }
    txt += `GST (5.00%)                        : Rs. ${order.gstAmount.toFixed(2)}\n`;
    txt += `=================================================\n`;
    txt += `GRAND TOTAL                        : Rs. ${order.grandTotal.toFixed(2)}\n`;
    txt += `=================================================\n`;
    txt += `            Thank you for dining with us!        \n`;
    txt += `       Please retain this bill for your records. \n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${order.orderNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-300 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Controls (Hidden in Print) */}
        <div className="bg-[#1e140f] text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Order Saved &amp; Bill Generated
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-6 bg-[#faf9f5] font-mono text-neutral-800 selection:bg-neutral-200" id="printable-receipt">
          {/* Header */}
          <div className="text-center border-b border-dashed border-neutral-400 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1e140f] text-[#fbbf24] flex items-center justify-center mx-auto mb-2">
              <Coffee className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-base tracking-widest uppercase font-['Plus_Jakarta_Sans'] text-neutral-900">
              CAFEMASTER
            </h2>
            <p className="text-[11px] text-neutral-600">Specialty Coffee &amp; Artisan Bakery</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">104 Artisan Blvd, Level 1, Metro Plaza</p>
            <p className="text-[10px] text-neutral-500 font-sans">GSTIN: 27AABCT3518Q1Z5</p>
          </div>

          {/* Meta Information */}
          <div className="text-[11px] space-y-1 border-b border-dashed border-neutral-400 pb-3 mb-3">
            <div className="flex justify-between">
              <span className="text-neutral-500">Bill No:</span>
              <span className="font-bold text-neutral-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Date/Time:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Customer:</span>
              <span className="font-semibold">{order.customerName}</span>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Table:</span>
                <span>{order.tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500">Payment:</span>
              <span className="font-bold text-emerald-700">{order.paymentMethod} (PAID)</span>
            </div>
          </div>

          {/* Itemized Lines */}
          <div className="mb-4">
            <div className="text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-300 pb-1 mb-2 flex justify-between">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-right">Rate</span>
              <span className="w-1/6 text-right">Qty</span>
              <span className="w-1/6 text-right">Total</span>
            </div>
            <div className="space-y-1.5 text-xs divide-y divide-dashed divide-neutral-200">
              {order.items.map((item) => (
                <div key={item.id} className="pt-1 flex items-start justify-between">
                  <div className="w-1/2 font-medium truncate pr-1">
                    {item.itemName}
                  </div>
                  <div className="w-1/6 text-right text-neutral-600">
                    ₹{item.unitPrice.toFixed(2)}
                  </div>
                  <div className="w-1/6 text-right font-bold">
                    x{item.quantity}
                  </div>
                  <div className="w-1/6 text-right font-bold text-neutral-900">
                    ₹{item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="border-t-2 border-dashed border-neutral-400 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount (10% off &gt; ₹500):</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-neutral-400 text-[10px]">
                <span>Discount (&le; ₹500):</span>
                <span>₹0.00</span>
              </div>
            )}

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-neutral-600 text-[11px]">
                <span>Net Taxable Base:</span>
                <span>₹{(order.subtotal - order.discountAmount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-600">
              <span>GST (5.00%):</span>
              <span>+₹{order.gstAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-400 text-base font-black text-neutral-900">
              <span>GRAND TOTAL:</span>
              <span className="text-lg font-['Plus_Jakarta_Sans']">₹{order.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Note & Barcode Simulation */}
          <div className="mt-6 pt-4 border-t border-dashed border-neutral-400 text-center space-y-2">
            <div className="flex justify-center text-neutral-400">
              <span className="text-[10px] tracking-widest font-mono">
                ||| | ||||| || |||| ||| ||||||| |||
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Thank you for visiting!
            </p>
            <p className="text-[9px] text-neutral-400">
              Module 2 Relational Order Record Stored in DB
            </p>
          </div>
        </div>

        {/* Modal Actions (Hidden in Print) */}
        <div className="bg-[#f0ece4] p-4 border-t border-[#e0d6cb] flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold border border-neutral-300 flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold border border-neutral-300 flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save .txt</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onNewOrder();
            }}
            className="px-4 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
          >
            <span>Start Next Order</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
