import React, { useState, useEffect, useMemo } from 'react';
import type { Customer, Supplier, Product, Invoice, InvoiceItem, InvoiceType } from '../types';
import { AutocompleteSearch } from './AutocompleteSearch';

type EnhancedInvoiceItem = InvoiceItem & { purchaseUnitPrice: number };

interface InvoiceFormProps {
  onSave: (invoice: Omit<Invoice, 'id'>) => void;
  onCancel: () => void;
  invoiceType: InvoiceType;
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
}

const parsePackingSize = (product: Product): number => {
    const match = product.packingUnit.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 1;
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onCancel, invoiceType, customers, suppliers, products }) => {
  // Common state
  const [party, setParty] = useState<Customer | Supplier | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<EnhancedInvoiceItem[]>([]);
  const [amountPaid, setAmountPaid] = useState(0);
  
  // Sale/Purchase state
  const [discount, setDiscount] = useState(0);

  // Treatment state
  const [otherExpenses, setOtherExpenses] = useState(0);
  const [chargedAmount, setChargedAmount] = useState(0);

  // Current item entry state
  const [currentItem, setCurrentItem] = useState<Product | null>(null);
  const [currentQty, setCurrentQty] = useState(1);
  const [currentManualRate, setCurrentManualRate] = useState(0);
  const [currentPurchaseRate, setCurrentPurchaseRate] = useState(0);
  const [searchKey, setSearchKey] = useState(Date.now());


  const purchaseCostPerLooseUnit = useMemo(() => {
    if (!currentItem) return 0;
    // For FIFO, use the price of the oldest batch
    const oldestBatch = currentItem.batches.slice().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    const purchasePrice = oldestBatch ? oldestBatch.purchasePrice : currentItem.latestPurchasePrice;
    const packingSize = parsePackingSize(currentItem);
    return packingSize > 0 ? purchasePrice / packingSize : 0;
  }, [currentItem]);

  useEffect(() => {
    if (currentItem) {
      if (invoiceType === 'treatment') {
        setCurrentManualRate(purchaseCostPerLooseUnit);
      } else if (invoiceType === 'purchase') {
        setCurrentPurchaseRate(currentItem.latestPurchasePrice);
      }
    }
  }, [currentItem, purchaseCostPerLooseUnit, invoiceType]);

  // Calculations
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.total, 0), [items]);
  
  const { totalAmount, paymentStatus } = useMemo(() => {
    let finalTotal = 0;
    if (invoiceType === 'treatment') {
      finalTotal = chargedAmount;
    } else {
      finalTotal = subtotal - discount;
    }

    let status: Invoice['paymentStatus'] = 'Credit';
    if (finalTotal <= 0 && items.length > 0) status = 'Fully Paid';
    else if (amountPaid >= finalTotal) status = 'Fully Paid';
    else if (amountPaid > 0) status = 'Partially Paid';
    
    return { totalAmount: finalTotal, paymentStatus: status };
  }, [subtotal, discount, chargedAmount, amountPaid, items, invoiceType]);

  const { medicineCostAtPurchase, vetFee } = useMemo(() => {
    if (invoiceType !== 'treatment') return { medicineCostAtPurchase: 0, vetFee: 0 };
    const cost = items.reduce((acc, item) => acc + item.purchaseUnitPrice * item.quantity, 0);
    const fee = chargedAmount - (cost + otherExpenses);
    return { medicineCostAtPurchase: cost, vetFee: fee };
  }, [items, chargedAmount, otherExpenses, invoiceType]);

  const handleAddItem = () => {
    if (!currentItem || currentQty <= 0) {
      alert("Please select a product and enter a valid quantity.");
      return;
    }

    let unitPrice: number;
    let purchaseUnitPrice = 0;

    if (invoiceType === 'treatment') {
        unitPrice = currentManualRate;
        purchaseUnitPrice = purchaseCostPerLooseUnit * currentQty; // Store total cost for the item quantity
    } else if (invoiceType === 'purchase') {
        unitPrice = currentPurchaseRate;
    } else { // sale
        unitPrice = currentItem.salePrice;
    }
    
    setItems([...items, {
      productId: currentItem.id,
      productName: currentItem.name,
      quantity: currentQty,
      unitPrice,
      purchaseUnitPrice, // For treatment, this is an estimate until saved
      total: unitPrice * currentQty,
    }]);

    setCurrentItem(null);
    setCurrentQty(1);
    setCurrentManualRate(0);
    setCurrentPurchaseRate(0);
    setSearchKey(Date.now());
  };
  
  const handleRemoveItem = (productId: string) => {
      setItems(items.filter(item => item.productId !== productId));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!party) {
      alert(`Please select a ${invoiceType === 'purchase' ? 'Supplier' : 'Customer'}.`);
      return;
    }
    if (items.length === 0 && invoiceType !== 'treatment') {
      alert("Please add at least one item.");
      return;
    }
     if (invoiceType === 'treatment' && items.length === 0 && chargedAmount === 0) {
        alert("Please add items or enter a charged amount.");
        return;
    }
    
    onSave({
      type: invoiceType,
      customerId: invoiceType !== 'purchase' ? party.id : undefined,
      supplierId: invoiceType === 'purchase' ? party.id : undefined,
      date,
      items,
      subtotal,
      otherExpenses: invoiceType === 'treatment' ? otherExpenses : undefined,
      chargedAmount: invoiceType === 'treatment' ? chargedAmount : undefined,
      discount: invoiceType !== 'treatment' ? discount : 0,
      totalAmount,
      amountPaid,
      paymentStatus,
    });
  };

  const isPurchase = invoiceType === 'purchase';
  const partyLabel = isPurchase ? 'Supplier' : 'Customer';
  const dosageUnit = currentItem?.looseUnit ? ` (${currentItem.looseUnit})` : '';

  const salePurchaseItemEntry = () => (
    isPurchase ? (
        // Purchase form layout
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <AutocompleteSearch<Product> key={searchKey} placeholder="Search Products..." items={products} filterFn={(p, query) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())} displayFn={(p) => `${p.name} (${p.id}) - Stock: ${p.stockVials}`} onSelect={setCurrentItem} />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Qty (Vials)</label>
                <input type="number" value={currentQty} min="1" step="1" onChange={e => setCurrentQty(parseInt(e.target.value) || 1)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900"/>
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Rate (Rs)</label>
                <input type="number" value={currentPurchaseRate} min="0" step="any" onChange={e => setCurrentPurchaseRate(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
            </div>
            <div className="md:col-span-2">
                <button type="button" onClick={handleAddItem} className="w-full mt-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Add</button>
            </div>
        </div>
    ) : (
        // Sale form layout
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-8">
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <AutocompleteSearch<Product> key={searchKey} placeholder="Search Products..." items={products} filterFn={(p, query) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())} displayFn={(p) => `${p.name} (${p.id}) - Stock: ${p.stockVials}`} onSelect={setCurrentItem} />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Qty (Vials)</label>
                <input type="number" value={currentQty} min="1" step="1" onChange={e => setCurrentQty(parseInt(e.target.value) || 1)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900"/>
            </div>
            <div className="md:col-span-2">
                <button type="button" onClick={handleAddItem} className="w-full mt-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Add</button>
            </div>
        </div>
    )
  );

  // Render different forms based on type
  const renderSalePurchaseForm = () => (
    <>
       <div className="p-4 border rounded-lg space-y-2 bg-slate-50">
        <h3 className="font-semibold text-gray-800">Add Items</h3>
        {salePurchaseItemEntry()}
      </div>
      
      <div className="max-h-56 overflow-y-auto border rounded-md text-gray-900">
        <table className="w-full text-sm"><thead className="bg-gray-100 sticky top-0"><tr><th className="p-3 text-left font-semibold text-gray-600">Product</th><th className="p-3 text-left font-semibold text-gray-600">Qty</th><th className="p-3 text-left font-semibold text-gray-600">Price</th><th className="p-3 text-left font-semibold text-gray-600">Total</th><th></th></tr></thead>
            <tbody>{items.length > 0 ? items.map(item => (<tr key={item.productId} className="border-b"><td className="p-3">{item.productName}</td><td className="p-3">{item.quantity}</td><td className="p-3">{item.unitPrice.toFixed(2)}</td><td className="p-3">{item.total.toFixed(2)}</td><td><button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 px-2">&times;</button></td></tr>)) : (<tr><td colSpan={5} className="p-4 text-center text-gray-500">No items added.</td></tr>)}</tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t">
          <div className="md:col-start-2 space-y-4 text-sm bg-slate-50 p-4 rounded-lg border text-gray-700">
              <div className="flex justify-between items-center"><span>Subtotal</span><span className="font-medium">Rs {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><label htmlFor="discount">Discount</label><input id="discount" type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-right text-gray-900" /></div>
              <div className="flex justify-between items-center font-bold text-lg border-t pt-3 mt-3"><span>Total</span><span>Rs {totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between items-center pt-3 border-t mt-3"><label htmlFor="amountPaid">Amount Paid</label><input id="amountPaid" type="number" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-right text-gray-900" /></div>
              <div className="flex justify-between items-center"><span>Status</span><span className="font-semibold">{paymentStatus}</span></div>
          </div>
      </div>
    </>
  );

  const renderTreatmentForm = () => (
    <>
        <div className="p-4 border rounded-lg space-y-2 bg-slate-50">
            <h3 className="font-semibold text-gray-800">Add Medicine Used</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <AutocompleteSearch<Product> key={searchKey} placeholder="Search Products..." items={products} filterFn={(p, query) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())} displayFn={(p) => `${p.name} (${p.id})`} onSelect={setCurrentItem}/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Dosage{dosageUnit}</label>
                    <input type="number" value={currentQty} min="0" step="any" onChange={e => setCurrentQty(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Rate</label>
                    <input type="number" value={currentManualRate} min="0" step="any" onChange={e => setCurrentManualRate(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                </div>
                <div className="md:col-span-2">
                    <button type="button" onClick={handleAddItem} className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Add</button>
                </div>
            </div>
            {currentItem && <div className="mt-2 text-sm p-2 rounded-md text-center bg-blue-100 text-blue-800"><strong>Estimated Cost Price (FIFO):</strong> Rs {purchaseCostPerLooseUnit.toFixed(2)} per {currentItem.looseUnit}</div>}
        </div>
        
        <div className="max-h-48 overflow-y-auto border rounded-md text-gray-900">
            <table className="w-full text-sm"><thead className="bg-gray-100 sticky top-0"><tr><th className="p-3 text-left font-semibold text-gray-600">Product</th><th className="p-3 text-left font-semibold text-gray-600">Dosage</th><th className="p-3 text-left font-semibold text-gray-600">Rate</th><th className="p-3 text-left font-semibold text-gray-600">Total</th><th></th></tr></thead>
                <tbody>{items.length > 0 ? items.map(item => (<tr key={item.productId} className="border-b"><td className="p-3">{item.productName}</td><td className="p-3">{item.quantity}</td><td className="p-3">{item.unitPrice.toFixed(2)}</td><td className="p-3">{item.total.toFixed(2)}</td><td><button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 px-2">&times;</button></td></tr>)) : (<tr><td colSpan={5} className="p-4 text-center text-gray-500">No medicine added.</td></tr>)}</tbody>
            </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4 border-t">
            <div className="space-y-4">
                <div className="flex justify-between items-center"><label htmlFor="otherExpenses" className="text-sm font-medium text-gray-700">Other Expenses (Fuel, etc.)</label><input id="otherExpenses" type="number" value={otherExpenses} onChange={e => setOtherExpenses(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-right text-gray-900" /></div>
                <div className="flex justify-between items-center"><label htmlFor="chargedAmount" className="text-sm font-medium text-gray-700">Total Amount Charged</label><input id="chargedAmount" type="number" value={chargedAmount} onChange={e => setChargedAmount(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-right text-gray-900" /></div>
            </div>
            <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-lg border text-gray-700">
                <div className="flex justify-between"><span>Total Medicine (Charged Rate)</span><span>Rs {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-blue-700"><span>Est. Medicine Cost (Purchase)</span><span>Rs {medicineCostAtPurchase.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Other Expenses</span><span>Rs {otherExpenses.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-green-700 border-t pt-3 mt-3"><span>Vet's Fee (Calculated)</span><span>Rs {vetFee.toFixed(2)}</span></div>
                <hr className="my-1"/>
                <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3"><span>Grand Total</span><span>Rs {totalAmount.toFixed(2)}</span></div>
                 <div className="flex justify-between items-center pt-3 border-t mt-3"><label htmlFor="amountPaid">Amount Paid</label><input id="amountPaid" type="number" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-right text-gray-900" /></div>
                 <div className="flex justify-between items-center"><span>Status</span><span className="font-semibold">{paymentStatus}</span></div>
            </div>
        </div>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700">{partyLabel}</label><AutocompleteSearch<Customer | Supplier> placeholder={`Search ${partyLabel}...`} items={isPurchase ? suppliers : customers} filterFn={(p, query) => p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query) || p.id.toLowerCase().includes(query.toLowerCase())} displayFn={(p) => `${p.name} (${p.id})`} onSelect={(p) => setParty(p)}/></div>
        <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" /></div>
      </div>
      
      {invoiceType === 'treatment' ? renderTreatmentForm() : renderSalePurchaseForm()}
      
      <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Invoice</button></div>
    </form>
  );
};