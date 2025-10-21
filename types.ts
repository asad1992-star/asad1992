// For "Offline App Packager" feature
export type Platform = 'windows' | 'macos' | 'linux';

export interface AppFiles {
  html: File | null;
  js: File | null;
  icon: File | null;
}


// For VetClinic App
export interface StockBatch {
    quantity: number;
    purchasePrice: number;
    invoiceId: string;
    date: string;
}

export interface Product {
    id: string; // e.g., med123
    name: string;
    location: string;
    packingUnit: string; // e.g., "100ml Vial", "10 tabs"
    looseUnit: string; // e.g., "ml", "tab"
    stockVials: number; // This is a calculated field for display, not stored
    stockLoose: number;
    latestPurchasePrice: number;
    salePrice: number;
    expiryDate: string;
    lowStockAlert: number;
    batches: StockBatch[];
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    outstandingBalance: number;
}

export interface Supplier {
    id: string;
    name: string;
    phone: string;
    address: string;
    outstandingBalance: number;
}

export interface InvoiceItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    purchaseUnitPrice?: number; // Cost of goods for this item
}

export type InvoiceType = 'treatment' | 'sale' | 'purchase';

export interface Invoice {
    id: string;
    type: InvoiceType;
    customerId?: string;
    supplierId?: string;
    date: string;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    otherExpenses?: number; // For treatments
    chargedAmount?: number; // For treatments
    totalAmount: number;
    amountPaid: number;
    paymentStatus: 'Fully Paid' | 'Partially Paid' | 'Credit';
}

export interface InvoiceWithDetails extends Invoice {
    customer?: Customer;
    supplier?: Supplier;
    vetFee?: number;
}

export interface Payment {
    id: string;
    type: 'receive' | 'pay';
    partyId: string; // customer or supplier id
    amount: number;
    date: string;
}

export interface Expense {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
}

export interface User {
    id: string;
    username: string;
    password?: string;
    role: 'admin' | 'staff';
}

export interface ClinicSettings {
    name: string;
    logo: string | null;
    address?: string;
    email?: string;
    phone?: string;
}

export interface LedgerEntry {
    id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

export interface ProductHistoryEntry {
    date: string;
    invoiceId: string;
    type: InvoiceType;
    partyName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface PartyHistory {
    invoices: Invoice[];
    payments: Payment[];
}

export interface AccountTransaction {
    id: string;
    date: string;
    description: string;
    clinicAmount: number;
    ownerAmount: number;
    clinicBalance: number;
    ownerBalance: number;
    referenceId?: string; // Link to invoice, expense etc.
    isManual: boolean;
}

// For GlobalSearch
export type SearchResult = (Product & { resultType: 'Product' }) |
    (Customer & { resultType: 'Customer' }) |
    (Supplier & { resultType: 'Supplier' }) |
    (InvoiceWithDetails & { resultType: 'Invoice' });

// --- Reporting Types ---
export interface ProfitLossReportData {
    sales: {
        invoiceId: string;
        date: string;
        total: number;
        cost: number;
        profit: number;
    }[];
    treatments: {
        invoiceId: string;
        date: string;
        charged: number;
        cost: number;
        profit: number; // Vet fee
    }[];
    totalSalesProfit: number;
    totalTreatmentProfit: number;
    grandTotalProfit: number;
}

export interface InventoryReportItem extends Product {
    isLowStock: boolean;
    isNearExpiry: boolean;
    isTopSeller: boolean;
    soldQty: number;
}

export interface PartyReportItem {
    id: string;
    name: string;
    phone: string;
    outstandingBalance: number;
    totalBusiness: number; // Total sales or purchases in period
}

export interface PaymentWithParty extends Payment {
    partyName: string;
}

// For Sync Service
export interface SyncOperation {
    id: string;
    timestamp: string;
    collection: string;
    action: 'create' | 'update' | 'delete';
    payload: any;
}