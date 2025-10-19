
import React, { useState, useEffect } from 'react';
import type { Product } from '../types';

interface ProductFormProps {
  product: Partial<Product>;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
    const [code, setCode] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        packingUnit: '',
        location: '',
        stockVials: 0,
        stockLoose: 0,
        looseUnit: '',
        latestPurchasePrice: 0,
        salePrice: 0,
        expiryDate: '',
        lowStockAlert: 0
    });
    
  const isEditing = !!product.id;
  
  useEffect(() => {
    setCode(product.id ? product.id.replace('med', '') : '');
    setFormData({
        name: product.name || '',
        packingUnit: product.packingUnit || 'Vial',
        location: product.location || '',
        stockVials: product.stockVials || 0, // Will be read-only for edits
        stockLoose: product.stockLoose || 0,
        looseUnit: product.looseUnit || 'ml',
        latestPurchasePrice: product.latestPurchasePrice || 0,
        salePrice: product.salePrice || 0,
        expiryDate: product.expiryDate || '',
        lowStockAlert: product.lowStockAlert || 0,
    })
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expiryDate || (!isEditing && !code)) {
      alert('Product Code, Name, and Expiry Date are required.');
      return;
    }
    onSave({ 
        id: product.id || `med${code}`,
        ...formData,
        batches: product.batches || [], // Pass existing batches along
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Product Code</label>
            <div className="flex mt-1">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">med</span>
                <input 
                    type="text" 
                    name="code" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-none rounded-r-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                    readOnly={isEditing}
                    required
                />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
         <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Shelf B-3" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Packing Unit</label>
            <input type="text" name="packingUnit" value={formData.packingUnit} onChange={handleChange} placeholder="e.g., 50ml Vial, 1kg Bag" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{isEditing ? 'Calculated Stock (Vials/Units)' : 'Initial Stock'}</label>
          <input type="number" name="stockVials" value={formData.stockVials} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" readOnly={isEditing} />
          {isEditing && <p className="text-xs text-gray-500 mt-1">Stock is managed via Purchase/Sale invoices.</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Loose Unit</label>
            <input type="text" name="looseUnit" value={formData.looseUnit} onChange={handleChange} placeholder="e.g., ml, g" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
         <div>
            <label className="block text-sm font-medium text-gray-700">Stock (Loose)</label>
            <input type="number" name="stockLoose" value={formData.stockLoose} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{isEditing ? 'Latest Purchase Price (Rs)' : 'Initial Purchase Price (Rs)'}</label>
          <input type="number" step="0.01" name="latestPurchasePrice" value={formData.latestPurchasePrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" readOnly={isEditing} />
          {isEditing && <p className="text-xs text-gray-500 mt-1">Price is updated from Purchase invoices.</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Sale Price (Rs)</label>
            <input type="number" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Low Stock Alert Level</label>
            <input type="number" name="lowStockAlert" value={formData.lowStockAlert} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Product
        </button>
      </div>
    </form>
  );
};
