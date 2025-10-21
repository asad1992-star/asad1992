
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { Product, User } from '../types';
import { Modal } from '../components/Modal';
import { ProductForm } from '../components/ProductForm';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { ProductHistoryView } from '../components/ProductHistoryView';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { eventBus } from '../services/eventBus';

interface InventoryScreenProps {
  user: User;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const fetchProducts = useCallback(async () => {
    const data = await db.getProducts();
    setProducts(data);
  }, []);

  useEffect(() => {
    fetchProducts();
    eventBus.on('data-changed', fetchProducts);
    return () => eventBus.off('data-changed', fetchProducts);
  }, [fetchProducts]);

  useEffect(() => {
    const results = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
    setFilteredProducts(results);
  }, [search, products]);

  const handleAddProduct = () => {
    setEditingProduct({});
    setIsModalOpen(true);
  };

  const handleEditProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleDeleteProduct = async (e: React.MouseEvent, product: Product) => {
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
          try {
            await db.deleteProduct(product.id);
            fetchProducts();
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
      }
  }

  const handleSaveProduct = async (productData: Product) => {
    const isEditing = !!editingProduct?.id;
    if (!isEditing && (!productData.id || !productData.id.startsWith('med') || productData.id.length <= 3) ) {
        alert('Product code cannot be empty.');
        return;
    }

    try {
        await db.saveProduct(productData, isEditing);
        fetchProducts();
        eventBus.dispatch('data-changed'); // Notify other screens
        setIsModalOpen(false);
        setEditingProduct(null);
    } catch (error: any) {
        alert(error.message);
    }
  };

  const handleViewHistory = (product: Product) => {
    setViewingProduct(product);
  };

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  const inventoryTableContent = (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Code</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Name</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Location</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Stock</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Packing</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Loose</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Latest Purchase Price</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Sale Price</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Expiry</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 no-print-col"></th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length > 0 ? filteredProducts.map(product => (
            <tr key={product.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleViewHistory(product)}>
              <td className="p-3 text-sm text-gray-700">{product.id}</td>
              <td className="p-3 text-sm text-gray-700 font-medium">{product.name}</td>
              <td className="p-3 text-sm text-gray-700">{product.location || 'N/A'}</td>
              <td className="p-3 text-sm text-gray-700">{product.stockVials}</td>
              <td className="p-3 text-sm text-gray-700">{product.packingUnit}</td>
              <td className="p-3 text-sm text-gray-700">{product.stockLoose} {product.looseUnit}</td>
              <td className="p-3 text-sm text-gray-700">Rs {product.latestPurchasePrice.toFixed(2)}</td>
              <td className="p-3 text-sm text-gray-700">Rs {product.salePrice.toFixed(2)}</td>
              <td className="p-3 text-sm text-gray-700">{new Date(product.expiryDate).toLocaleDateString()}</td>
              <td className="p-3 text-sm no-print-col">
                <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); handleViewHistory(product); }} title="Print History" className="text-gray-600 hover:text-gray-800">
                    <PrinterIcon className="h-5 w-5" />
                  </button>
                  <button onClick={(e) => handleEditProduct(e, product)} className="text-blue-600 hover:text-blue-800">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {user.role === 'admin' && (
                    <button onClick={(e) => handleDeleteProduct(e, product)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )) : (
              <tr>
                  <td colSpan={10} className="p-3 text-center text-gray-500">No products found.</td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );


  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
        <div className="flex items-center gap-2">
           <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Print List
          </button>
          <button
            onClick={handleAddProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="mb-4 no-print">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
        />
      </div>
      
      {inventoryTableContent}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct?.id ? 'Edit Product' : 'Add Product'}>
        {editingProduct && <ProductForm onSave={handleSaveProduct} onCancel={() => setIsModalOpen(false)} product={editingProduct} />}
      </Modal>

      <Modal isOpen={!!viewingProduct} onClose={() => setViewingProduct(null)} title={`History for ${viewingProduct?.name}`} size="4xl" wrapperClassName="product-history-modal">
        {viewingProduct && <ProductHistoryView product={viewingProduct} />}
      </Modal>
      
      <PrintPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Inventory Stock List"
      >
        {inventoryTableContent}
      </PrintPreviewModal>

    </div>
  );
};