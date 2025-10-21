import React from 'react';
import type { InvoiceWithDetails } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { PrintLayout } from './PrintLayout';

export const InvoiceDetailView: React.FC<{ invoice: InvoiceWithDetails }> = ({ invoice }) => {
  const party = invoice.customer || invoice.supplier;

  const handlePrint = () => {
    window.print();
  };
  
  const medicineCostAtPurchase = invoice.items.reduce((acc, item) => acc + ((item.purchaseUnitPrice ?? 0) * item.quantity), 0);

  const saleCostOfGoods = invoice.type === 'sale' ? invoice.items.reduce((acc, item) => acc + ((item.purchaseUnitPrice ?? 0) * item.quantity), 0) : 0;
  const saleProfit = invoice.subtotal - saleCostOfGoods;

  const regularBody = (
    <>
      <div className="border rounded-md mb-4">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr><th className="p-2 text-left font-medium">Product</th><th className="p-2 text-right font-medium">Quantity</th><th className="p-2 text-right font-medium">Unit Price</th><th className="p-2 text-right font-medium">Total</th></tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (<tr key={item.productId + '-' + index} className="border-b"><td className="p-2">{item.productName}</td><td className="p-2 text-right">{item.quantity.toFixed(2)}</td><td className="p-2 text-right">{item.unitPrice.toFixed(2)}</td><td className="p-2 text-right font-semibold">{item.total.toFixed(2)}</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end pt-4">
        <div className="w-full md:w-1/2 space-y-2">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span>Rs {invoice.subtotal.toFixed(2)}</span></div>
          {invoice.type === 'sale' && saleCostOfGoods > 0 && (
            <>
              <div className="flex justify-between text-blue-700"><span className="text-gray-600">Cost of Goods:</span><span>(Rs {saleCostOfGoods.toFixed(2)})</span></div>
              <div className="flex justify-between font-bold text-green-700"><span className="text-gray-800">Profit on Sale:</span><span>Rs {saleProfit.toFixed(2)}</span></div>
              <hr className="my-1"/>
            </>
          )}
          <div className="flex justify-between"><span className="text-gray-600">Discount:</span><span>- Rs {invoice.discount.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-2"><span className="text-gray-800">Total Amount:</span><span>Rs {invoice.totalAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Amount Paid:</span><span>Rs {invoice.amountPaid.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold"><span className="text-gray-700">Balance Due:</span><span>Rs {(invoice.totalAmount - invoice.amountPaid).toFixed(2)}</span></div>
        </div>
      </div>
    </>
  );
  
  const treatmentBody = (
    <>
      <h4 className="font-semibold mb-2 text-gray-700">Medicine Used</h4>
      <div className="border rounded-md mb-4">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr><th className="p-2 text-left font-medium">Product</th><th className="p-2 text-right font-medium">Dosage</th><th className="p-2 text-right font-medium">Rate Charged</th><th className="p-2 text-right font-medium">Total</th></tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (<tr key={item.productId + '-' + index} className="border-b"><td className="p-2">{item.productName}</td><td className="p-2 text-right">{item.quantity.toFixed(2)}</td><td className="p-2 text-right">{item.unitPrice.toFixed(2)}</td><td className="p-2 text-right font-semibold">{item.total.toFixed(2)}</td></tr>))}
          </tbody>
        </table>
      </div>
       <div className="flex justify-end pt-4">
        <div className="w-full md:w-2/3 lg:w-1/2 space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Total Medicine (Charged Rate):</span><span>Rs {invoice.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Other Expenses (Fuel, etc.):</span><span>Rs {(invoice.otherExpenses ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-blue-700"><span className="text-gray-600">Medicine Cost (Purchase Price):</span><span>(Rs {medicineCostAtPurchase.toFixed(2)})</span></div>
            <div className="flex justify-between font-bold text-green-700"><span className="text-gray-800">Vet's Fee:</span><span>Rs {(invoice.vetFee ?? 0).toFixed(2)}</span></div>
            <hr className="my-1"/>
            <div className="flex justify-between font-bold text-base"><span className="text-gray-800">Total Amount Charged:</span><span>Rs {invoice.totalAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Amount Paid:</span><span>Rs {invoice.amountPaid.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-gray-700">Balance Due:</span><span>Rs {(invoice.totalAmount - invoice.amountPaid).toFixed(2)}</span></div>
        </div>
      </div>
    </>
  );

  const invoiceBody = (
     <div className="text-sm">
        <div className="flex justify-between items-start mb-4">
            <div><p><strong>Type:</strong> <span className="capitalize">{invoice.type}</span></p></div>
            {party && (<div className="text-right"><p className="font-semibold">Billed To:</p><p>{party.name}</p><p>{party.address}</p><p>{party.phone}</p></div>)}
        </div>
        {invoice.type === 'treatment' ? treatmentBody : regularBody}
      </div>
  );

  return (
    <div>
      <div className="print-only"><PrintLayout title={`Invoice #${invoice.id}`}>{invoiceBody}</PrintLayout></div>
      <div className="no-print">
        <div className="max-h-[60vh] overflow-y-auto">{invoiceBody}</div>
         <div className="pt-4 mt-4 border-t flex justify-end">
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold flex items-center gap-2"><PrinterIcon className="h-5 w-5" />Print Invoice</button>
        </div>
      </div>
    </div>
  );
};