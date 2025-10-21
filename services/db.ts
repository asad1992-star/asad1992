import {
    Product, Customer, Supplier, Invoice, Payment, Expense,
    LedgerEntry, ProductHistoryEntry, PartyHistory, InvoiceWithDetails, StockBatch, InvoiceItem,
    User, ClinicSettings, AccountTransaction, ProfitLossReportData, InventoryReportItem, PartyReportItem, PaymentWithParty, SyncOperation
} from '../types';

const DB_KEY = 'vetclinic_db';

interface DBData {
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    invoices: Invoice[];
    payments: Payment[];
    expenses: Expense[];
    users: User[];
    clinicSettings: ClinicSettings;
    accountTransactions: AccountTransaction[];
    sync_queue: SyncOperation[];
    counters: {
        customer: number;
        supplier: number;
        invoice: number;
        payment: number;
        expense: number;
        user: number;
        transaction: number;
        sync_operation: number;
    };
}

const isWithinDateRange = (dateStr: string, dateRange?: { startDate?: string, endDate?: string }): boolean => {
    if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) return true;
    const { startDate, endDate } = dateRange;
    const itemDate = new Date(dateStr);

    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
    }

    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
    }
    return true;
};


class DBService {
    private data: DBData = {
        products: [],
        customers: [],
        suppliers: [],
        invoices: [],
        payments: [],
        expenses: [],
        users: [],
        clinicSettings: { name: 'VetClinic', logo: null },
        accountTransactions: [],
        sync_queue: [],
        counters: {
            customer: 1, supplier: 1, invoice: 1, payment: 1, expense: 1, user: 1, transaction: 1, sync_operation: 1,
        }
    };

    async init() {
        const savedData = localStorage.getItem(DB_KEY);
        if (savedData) {
            this.data = JSON.parse(savedData);
        }
        // Always run seed/migration logic to handle schema updates
        this.seedData();
    }

    private save() {
        this._recalculateAccountBalances();
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }
    
    private seedData() {
        let needsSave = false;
        if (!this.data.users || this.data.users.length === 0) {
            this.data.users = [
                { id: `user${this.data.counters.user++}`, username: 'admin', password: 'admin', role: 'admin' },
                { id: `user${this.data.counters.user++}`, username: 'staff', password: 'staff', role: 'staff' },
            ];
            needsSave = true;
        }

        if (!this.data.clinicSettings) {
            this.data.clinicSettings = { name: 'VetClinic', logo: null };
            needsSave = true;
        }

        if (!this.data.accountTransactions) {
            this.data.accountTransactions = [];
            this.data.counters.transaction = 1;
            needsSave = true;
        }

        if (!this.data.sync_queue) {
            this.data.sync_queue = [];
            this.data.counters.sync_operation = 1;
            needsSave = true;
        }

        if(this.data.customers.length === 0) {
            this.data.customers.push({ id: 'cus1', name: 'John Doe', phone: '123-456-7890', address: '123 Main St', outstandingBalance: 0 });
            this.data.counters.customer = 2;
            needsSave = true;
        }
        if(this.data.suppliers.length === 0) {
            this.data.suppliers.push({ id: 'sup1', name: 'Pharma Inc.', phone: '987-654-3210', address: '456 Supplier Ave', outstandingBalance: 0 });
            this.data.counters.supplier = 2;
            needsSave = true;
        }
        if(this.data.products.length === 0) {
            this.data.products.push({ 
                id: 'med1', 
                name: 'Painkiller A', 
                location: 'A1', 
                packingUnit: '100ml Vial', 
                looseUnit: 'ml',
                stockVials: 0,
                stockLoose: 0, 
                latestPurchasePrice: 500, 
                salePrice: 800, 
                expiryDate: '2025-12-31', 
                lowStockAlert: 5,
                batches: [{
                    quantity: 10,
                    purchasePrice: 500,
                    invoiceId: 'seed',
                    date: '2023-01-01T00:00:00.000Z'
                }]
            });
            needsSave = true;
        }
        if (needsSave) this.save();
    }
    
    private parsePackingSize(product: Product): number {
        const match = product.packingUnit.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 1;
    }
    
    private calculateStockVials(product: Product): number {
        return product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    }
    
    private _recalculateAccountBalances() {
        // Sort transactions chronologically
        this.data.accountTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || parseInt(a.id.split('#')[1]) - parseInt(b.id.split('#')[1]));

        let clinicBalance = 0;
        let ownerBalance = 0;

        for (const trans of this.data.accountTransactions) {
            clinicBalance += trans.clinicAmount;
            ownerBalance += trans.ownerAmount;
            trans.clinicBalance = clinicBalance;
            trans.ownerBalance = ownerBalance;
        }
    }

    private _logSyncOperation(collection: string, action: 'create' | 'update' | 'delete', payload: any) {
        const operation: SyncOperation = {
            id: `sync${this.data.counters.sync_operation++}`,
            timestamp: new Date().toISOString(),
            collection,
            action,
            payload
        };
        this.data.sync_queue.push(operation);
    }

    // --- GETTERS ---
    async getProducts(): Promise<Product[]> { 
        return this.data.products.map(p => ({
            ...p,
            stockVials: this.calculateStockVials(p)
        }));
    }
    async getCustomers(): Promise<Customer[]> { return [...this.data.customers]; }
    async getSuppliers(): Promise<Supplier[]> { return [...this.data.suppliers]; }
    async getInvoices(): Promise<Invoice[]> { return [...this.data.invoices]; }
    async getPayments(): Promise<Payment[]> { return [...this.data.payments]; }
    async getExpenses(): Promise<Expense[]> { return [...this.data.expenses]; }
    async getUsers(): Promise<User[]> { return [...this.data.users]; }
    async getClinicSettings(): Promise<ClinicSettings> { return {...this.data.clinicSettings}; }
    async getUserByUsername(username: string): Promise<User | undefined> {
        return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    }

    // --- SAVERS ---
    async saveProduct(productData: Product, isEditing: boolean): Promise<void> {
        const existing = this.data.products.find(p => p.id === productData.id);
        if (existing && !isEditing) throw new Error(`Product with code ${productData.id} already exists.`);
        if (!existing && isEditing) throw new Error(`Product with code ${productData.id} not found for editing.`);
        
        if (isEditing) {
            const index = this.data.products.findIndex(p => p.id === productData.id);
            this.data.products[index] = {
                ...this.data.products[index],
                name: productData.name,
                location: productData.location,
                packingUnit: productData.packingUnit,
                looseUnit: productData.looseUnit,
                salePrice: productData.salePrice,
                expiryDate: productData.expiryDate,
                lowStockAlert: productData.lowStockAlert,
                latestPurchasePrice: productData.latestPurchasePrice,
                stockLoose: productData.stockLoose
            };
            this._logSyncOperation('products', 'update', this.data.products[index]);
        } else {
            const newProduct = { ...productData };
            // If initial stock is provided, create a seed batch
            if (productData.stockVials && productData.stockVials > 0) {
                 newProduct.batches = [{
                    quantity: productData.stockVials,
                    purchasePrice: productData.latestPurchasePrice,
                    invoiceId: 'initial',
                    date: new Date().toISOString()
                }];
            } else {
                newProduct.batches = [];
            }
            delete (newProduct as Partial<Product>).stockVials;
            this.data.products.push(newProduct as Product);
            this._logSyncOperation('products', 'create', newProduct);
        }
        this.save();
    }

    async saveCustomer(customerData: Omit<Customer, 'outstandingBalance'> & { id?: string }): Promise<void> {
        if (customerData.id) {
            const index = this.data.customers.findIndex(c => c.id === customerData.id);
            if (index > -1) {
                this.data.customers[index] = { ...this.data.customers[index], ...customerData };
                this._logSyncOperation('customers', 'update', this.data.customers[index]);
            }
        } else {
            const newId = `cus${this.data.counters.customer++}`;
            const newCustomer = { ...customerData, id: newId, outstandingBalance: 0 };
            this.data.customers.push(newCustomer);
            this._logSyncOperation('customers', 'create', newCustomer);
        }
        this.save();
    }
    
    async saveSupplier(supplierData: Omit<Supplier, 'outstandingBalance'> & { id?: string }): Promise<void> {
        if (supplierData.id) {
            const index = this.data.suppliers.findIndex(s => s.id === supplierData.id);
            if (index > -1) {
                this.data.suppliers[index] = { ...this.data.suppliers[index], ...supplierData };
                this._logSyncOperation('suppliers', 'update', this.data.suppliers[index]);
            }
        } else {
            const newId = `sup${this.data.counters.supplier++}`;
            const newSupplier = { ...supplierData, id: newId, outstandingBalance: 0 };
            this.data.suppliers.push(newSupplier);
            this._logSyncOperation('suppliers', 'create', newSupplier);
        }
        this.save();
    }

    async saveInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<void> {
        const prefix = { treatment: 'trt#', sale: 'sl#', purchase: 'pur#' };
        const newId = `${prefix[invoiceData.type]}${this.data.counters.invoice++}`;
        const newInvoice = { ...invoiceData, id: newId };

        this.updateStockAndBalances(newInvoice, 'create', newId);
        
        this.data.invoices.push(newInvoice);
        this._logSyncOperation('invoices', 'create', newInvoice);

        // Create account transaction for payment made at time of invoice
        if (invoiceData.amountPaid > 0) {
            const party = invoiceData.customerId ? this.data.customers.find(c => c.id === invoiceData.customerId) : this.data.suppliers.find(s => s.id === invoiceData.supplierId);
            let clinicAmount = 0;
            let ownerAmount = 0;
            let description = '';

            if (invoiceData.type === 'treatment') {
                const medicineChargedAmount = invoiceData.subtotal;
                
                const paidToClinic = Math.min(invoiceData.amountPaid, medicineChargedAmount);
                const paidToOwner = invoiceData.amountPaid - paidToClinic;

                clinicAmount = paidToClinic;
                ownerAmount = paidToOwner;
                description = `Payment for Treatment #${newId} from ${party?.name || 'N/A'}`;
            } else if (invoiceData.type === 'sale') {
                clinicAmount = invoiceData.amountPaid;
                ownerAmount = 0;
                description = `Payment for Sale #${newId} from ${party?.name || 'N/A'}`;
            } else { // purchase
                clinicAmount = -invoiceData.amountPaid;
                ownerAmount = 0;
                description = `Payment for Purchase #${newId} to ${party?.name || 'N/A'}`;
            }
            
            if (clinicAmount !== 0 || ownerAmount !== 0) {
                this.data.accountTransactions.push({
                    id: `trans#${this.data.counters.transaction++}`,
                    date: invoiceData.date,
                    description,
                    clinicAmount,
                    ownerAmount,
                    clinicBalance: 0, 
                    ownerBalance: 0, 
                    referenceId: newId,
                    isManual: false,
                });
            }
        }
        
        this.save();
    }
    
    async savePayment(paymentData: Omit<Payment, 'id'>): Promise<void> {
        const newId = `pay${this.data.counters.payment++}`;
        const newPayment = { ...paymentData, id: newId };
        this.data.payments.push(newPayment);
        this._logSyncOperation('payments', 'create', newPayment);

        let partyName = 'N/A';
        const customer = this.data.customers.find(c => c.id === paymentData.partyId);
        if (customer) {
            customer.outstandingBalance -= paymentData.amount;
            partyName = customer.name;
        } else {
            const supplier = this.data.suppliers.find(s => s.id === paymentData.partyId);
            if (supplier) {
                supplier.outstandingBalance -= paymentData.amount;
                partyName = supplier.name;
            }
        }

        const description = paymentData.type === 'receive' 
            ? `Payment received from ${partyName}`
            : `Payment made to ${partyName}`;
        
        this.data.accountTransactions.push({
            id: `trans#${this.data.counters.transaction++}`,
            date: paymentData.date,
            description,
            clinicAmount: paymentData.type === 'receive' ? paymentData.amount : -paymentData.amount,
            ownerAmount: 0,
            clinicBalance: 0,
            ownerBalance: 0,
            referenceId: newId,
            isManual: false,
        });

        this.save();
    }
    
    async saveExpense(expenseData: Omit<Expense, 'id'> & { id?: string }): Promise<void> {
        let newId = expenseData.id;
        if(expenseData.id){
            const index = this.data.expenses.findIndex(e => e.id === expenseData.id);
            if(index > -1) {
                this.data.expenses[index] = { ...this.data.expenses[index], ...expenseData as Expense };
                this._logSyncOperation('expenses', 'update', this.data.expenses[index]);
            }
            // Also update the related transaction
            const transaction = this.data.accountTransactions.find(t => t.referenceId === expenseData.id);
            if (transaction) {
                transaction.clinicAmount = -expenseData.amount;
                transaction.description = `Expense: ${expenseData.category} - ${expenseData.description}`;
                transaction.date = expenseData.date;
            }
        } else {
            newId = `exp${this.data.counters.expense++}`;
            const newExpense = { ...expenseData, id: newId } as Expense;
            this.data.expenses.push(newExpense);
            this._logSyncOperation('expenses', 'create', newExpense);
            this.data.accountTransactions.push({
                id: `trans#${this.data.counters.transaction++}`,
                date: expenseData.date,
                description: `Expense: ${expenseData.category} - ${expenseData.description}`,
                clinicAmount: -expenseData.amount,
                ownerAmount: 0,
                clinicBalance: 0,
                ownerBalance: 0,
                referenceId: newId,
                isManual: false,
            });
        }
        this.save();
    }
    
    async saveClinicSettings(settings: ClinicSettings): Promise<void> {
        this.data.clinicSettings = settings;
        this._logSyncOperation('clinicSettings', 'update', settings);
        this.save();
    }

    async saveUser(userData: User): Promise<void> {
        const existingByUsername = this.data.users.find(u => u.username.toLowerCase() === userData.username.toLowerCase() && u.id !== userData.id);
        if (existingByUsername) throw new Error('Username is already taken.');

        const index = this.data.users.findIndex(u => u.id === userData.id);
        if (index > -1) {
            const existingUser = this.data.users[index];
            // Only update password if a new one is provided
            if (!userData.password) {
                userData.password = existingUser.password;
            }
            this.data.users[index] = userData;
            this._logSyncOperation('users', 'update', { ...userData, password: '***' });
        } else {
            const newId = `user${this.data.counters.user++}`;
            if (!userData.password) throw new Error('Password is required for new users.');
            const newUser = { ...userData, id: newId };
            this.data.users.push(newUser);
            this._logSyncOperation('users', 'create', { ...newUser, password: '***' });
        }
        this.save();
    }

    // --- DELETERS ---
    async deleteProduct(id: string): Promise<void> {
        const isProductInUse = this.data.invoices.some(invoice => 
            invoice.items.some(item => item.productId === id)
        );

        if (isProductInUse) {
            throw new Error("Cannot delete product because it is used in one or more invoices. Please delete the relevant invoices first.");
        }
        
        this._logSyncOperation('products', 'delete', { id });
        this.data.products = this.data.products.filter(p => p.id !== id);
        this.save();
    }
    async deleteCustomer(id: string): Promise<void> {
        const isCustomerInUse = this.data.invoices.some(invoice => invoice.customerId === id);
        if (isCustomerInUse) {
            throw new Error("Cannot delete customer with existing invoices. Please delete their invoices first.");
        }
        this._logSyncOperation('customers', 'delete', { id });
        this.data.customers = this.data.customers.filter(c => c.id !== id);
        this.save();
    }
    async deleteSupplier(id: string): Promise<void> {
        const isSupplierInUse = this.data.invoices.some(invoice => invoice.supplierId === id);
        if (isSupplierInUse) {
            throw new Error("Cannot delete supplier with existing invoices. Please delete their invoices first.");
        }
        this._logSyncOperation('suppliers', 'delete', { id });
        this.data.suppliers = this.data.suppliers.filter(s => s.id !== id);
        this.save();
    }
    async deleteInvoice(id: string): Promise<void> {
        const invoiceIndex = this.data.invoices.findIndex(i => i.id === id);
        if (invoiceIndex === -1) return;

        const invoice = this.data.invoices[invoiceIndex];
        this._logSyncOperation('invoices', 'delete', { id });
        this.updateStockAndBalances(invoice, 'delete', invoice.id);
        this.data.invoices.splice(invoiceIndex, 1);
        
        // Also delete associated account transaction
        this.data.accountTransactions = this.data.accountTransactions.filter(t => t.referenceId !== id);
        
        this.save();
    }
     async deleteExpense(id: string): Promise<void> {
        this._logSyncOperation('expenses', 'delete', { id });
        this.data.expenses = this.data.expenses.filter(e => e.id !== id);
        this.data.accountTransactions = this.data.accountTransactions.filter(t => t.referenceId !== id);
        this.save();
    }
    async deleteUser(id: string): Promise<void> {
        this._logSyncOperation('users', 'delete', { id });
        this.data.users = this.data.users.filter(u => u.id !== id);
        this.save();
    }

    // --- COMPLEX LOGIC ---
    private updateStockAndBalances(invoice: Omit<Invoice, 'id'> | Invoice, action: 'create' | 'delete', invoiceId: string) {
        const multiplier = action === 'create' ? 1 : -1;

        for (const item of invoice.items) {
            const product = this.data.products.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found.`);

            product.batches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (invoice.type === 'purchase') {
                if (action === 'create') {
                    product.batches.push({
                        quantity: item.quantity,
                        purchasePrice: item.unitPrice,
                        invoiceId: invoiceId,
                        date: invoice.date
                    });
                    product.latestPurchasePrice = item.unitPrice;
                } else { 
                    product.batches = product.batches.filter(b => b.invoiceId !== (invoice as Invoice).id);
                }
            } else if (invoice.type === 'sale') {
                if (action === 'create') {
                    let qtyToProcess = item.quantity;
                    let costOfGoodsSold = 0;
                    const remainingBatches: StockBatch[] = [];
            
                    for (const batch of product.batches) {
                        if (qtyToProcess <= 0) {
                            remainingBatches.push(batch);
                            continue;
                        }
            
                        const consumeQty = Math.min(qtyToProcess, batch.quantity);
                        costOfGoodsSold += consumeQty * batch.purchasePrice;
                        qtyToProcess -= consumeQty;
                        
                        if (batch.quantity > consumeQty) {
                            remainingBatches.push({ ...batch, quantity: batch.quantity - consumeQty });
                        }
                    }
                    product.batches = remainingBatches;
                    if (item.quantity > 0) {
                        (item as InvoiceItem).purchaseUnitPrice = costOfGoodsSold / item.quantity;
                    }

                } else { 
                     const avgPrice = item.purchaseUnitPrice ? item.purchaseUnitPrice : product.latestPurchasePrice;
                     product.batches.unshift({
                         quantity: item.quantity,
                         purchasePrice: avgPrice,
                         invoiceId: `revert-${(invoice as Invoice).id}`,
                         date: new Date().toISOString()
                     });
                }
            } else if (invoice.type === 'treatment') {
                if (action === 'create') {
                    product.stockLoose -= item.quantity;
                    const packingSize = this.parsePackingSize(product);
                    if (packingSize > 0 && product.stockLoose < 0) {
                        const looseNeeded = -product.stockLoose;
                        const vialsNeeded = Math.ceil(looseNeeded / packingSize);
                        
                        let totalCostOfVials = 0;
                        let vialsConsumed = 0;

                        const remainingBatches: StockBatch[] = [];
                        for(const batch of product.batches) {
                            if (vialsConsumed >= vialsNeeded) {
                                remainingBatches.push(batch);
                                continue;
                            }
                            const consumeQty = Math.min(vialsNeeded - vialsConsumed, batch.quantity);
                            totalCostOfVials += consumeQty * batch.purchasePrice;
                            vialsConsumed += consumeQty;
                            if (batch.quantity > consumeQty) {
                                remainingBatches.push({ ...batch, quantity: batch.quantity - consumeQty });
                            }
                        }
                        product.batches = remainingBatches;

                        const totalLooseOpened = vialsNeeded * packingSize;
                        const actualCostPerLooseUnit = totalLooseOpened > 0 ? totalCostOfVials / totalLooseOpened : 0;
                        (item as InvoiceItem).purchaseUnitPrice = actualCostPerLooseUnit;

                        product.stockLoose += totalLooseOpened;
                    }
                } else {
                    product.stockLoose += item.quantity;
                }
            }
        }
        
        const balanceChange = (invoice.totalAmount - invoice.amountPaid) * multiplier;
        if (invoice.customerId) {
            const customer = this.data.customers.find(c => c.id === invoice.customerId);
            if (customer) customer.outstandingBalance += balanceChange;
        } else if (invoice.supplierId) {
            const supplier = this.data.suppliers.find(s => s.id === invoice.supplierId);
            if (supplier) supplier.outstandingBalance += balanceChange;
        }
    }
    
    async getInvoiceDetails(invoiceId: string): Promise<InvoiceWithDetails | null> {
        const invoice = this.data.invoices.find(i => i.id === invoiceId);
        if (!invoice) return null;
        
        const details: InvoiceWithDetails = { ...invoice };
        if (invoice.customerId) details.customer = this.data.customers.find(c => c.id === invoice.customerId);
        if (invoice.supplierId) details.supplier = this.data.suppliers.find(s => s.id === invoice.supplierId);
        if (invoice.type === 'treatment') {
            const medicineCostAtPurchase = invoice.items.reduce((acc, item) => acc + ((item.purchaseUnitPrice ?? 0) * item.quantity), 0);
            details.vetFee = (invoice.chargedAmount ?? 0) - (medicineCostAtPurchase + (invoice.otherExpenses ?? 0));
        }
        return details;
    }

    async getProductHistory(productId: string): Promise<{ purchases: ProductHistoryEntry[], sales: ProductHistoryEntry[] }> {
        const relevantInvoices = this.data.invoices.filter(inv => inv.items.some(item => item.productId === productId));
        const history: { purchases: ProductHistoryEntry[], sales: ProductHistoryEntry[] } = { purchases: [], sales: [] };
        
        for (const inv of relevantInvoices) {
            const item = inv.items.find(i => i.productId === productId)!;
            const party = inv.customerId 
                ? this.data.customers.find(c => c.id === inv.customerId)
                : this.data.suppliers.find(s => s.id === inv.supplierId);
            
            const entry: ProductHistoryEntry = {
                date: inv.date,
                invoiceId: inv.id,
                type: inv.type,
                partyName: party?.name || 'N/A',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total
            };
            if (inv.type === 'purchase') history.purchases.push(entry);
            else history.sales.push(entry);
        }
        return history;
    }
    
    async getCustomerHistory(customerId: string, dateRange?: { startDate?: string; endDate?: string }): Promise<PartyHistory> {
        const invoices = this.data.invoices.filter(i => i.customerId === customerId && isWithinDateRange(i.date, dateRange));
        const payments = this.data.payments.filter(p => p.partyId === customerId && isWithinDateRange(p.date, dateRange));
        return { invoices, payments };
    }
    
    async getSupplierHistory(supplierId: string, dateRange?: { startDate?: string; endDate?: string }): Promise<PartyHistory> {
        const invoices = this.data.invoices.filter(i => i.supplierId === supplierId && isWithinDateRange(i.date, dateRange));
        const payments = this.data.payments.filter(p => p.partyId === supplierId && isWithinDateRange(p.date, dateRange));
        return { invoices, payments };
    }

    async getCustomerLedger(customer: Customer, dateRange?: { startDate?: string, endDate?: string }): Promise<LedgerEntry[]> {
        const invoices = this.data.invoices.filter(i => i.customerId === customer.id);
        const payments = this.data.payments.filter(p => p.partyId === customer.id);
        
        let transactions: (Invoice | Payment)[] = [...invoices, ...payments];
        transactions = transactions.filter(t => isWithinDateRange(t.date, dateRange));
        transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let balance = 0;
        const ledger: LedgerEntry[] = [];
        for (const trans of transactions) {
            let debit=0, credit=0, description='';
            if ('type' in trans && (trans.type === 'sale' || trans.type === 'treatment')) {
                debit = trans.totalAmount;
                credit = trans.amountPaid;
                description = `Invoice #${trans.id}`;
            } else if ('type' in trans && trans.type === 'receive') {
                credit = trans.amount;
                description = `Payment Received (ID: ${trans.id})`;
            }
            if (debit > 0) {
                balance += debit;
                ledger.push({id: trans.id, date: trans.date, description, debit, credit: 0, balance});
            }
            if(credit > 0) {
                balance -= credit;
                ledger.push({id: trans.id, date: trans.date, description, debit: 0, credit, balance});
            }
        }
        return ledger;
    }
    
    async getSupplierLedger(supplier: Supplier, dateRange?: { startDate?: string, endDate?: string }): Promise<LedgerEntry[]> {
        const invoices = this.data.invoices.filter(i => i.supplierId === supplier.id);
        const payments = this.data.payments.filter(p => p.partyId === supplier.id);
        
        let transactions: (Invoice | Payment)[] = [...invoices, ...payments];
        transactions = transactions.filter(t => isWithinDateRange(t.date, dateRange));
        transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let balance = 0;
        const ledger: LedgerEntry[] = [];
        for (const trans of transactions) {
            let debit=0, credit=0, description='';
            if ('type' in trans && trans.type === 'purchase') {
                credit = trans.totalAmount;
                debit = trans.amountPaid;
                description = `Invoice #${trans.id}`;
            } else if ('type' in trans && trans.type === 'pay') {
                debit = trans.amount;
                description = `Payment Made (ID: ${trans.id})`;
            }
            if (credit > 0) {
                balance += credit;
                ledger.push({id: trans.id, date: trans.date, description, debit: 0, credit, balance});
            }
            if(debit > 0) {
                balance -= debit;
                ledger.push({id: trans.id, date: trans.date, description, debit, credit: 0, balance});
            }
        }
        return ledger;
    }

    // --- REPORTING ---
    async getProfitLossReport(dateRange: { startDate?: string, endDate?: string }): Promise<ProfitLossReportData> {
        const invoices = this.data.invoices.filter(i => isWithinDateRange(i.date, dateRange));
        const report: ProfitLossReportData = {
            sales: [],
            treatments: [],
            totalSalesProfit: 0,
            totalTreatmentProfit: 0,
            grandTotalProfit: 0,
        };

        for (const inv of invoices) {
            if (inv.type === 'sale') {
                const cost = inv.items.reduce((acc, item) => acc + ((item.purchaseUnitPrice ?? 0) * item.quantity), 0);
                const total = inv.subtotal - inv.discount;
                const profit = total - cost;
                report.sales.push({ invoiceId: inv.id, date: inv.date, total, cost, profit });
                report.totalSalesProfit += profit;
            } else if (inv.type === 'treatment') {
                const cost = inv.items.reduce((acc, item) => acc + ((item.purchaseUnitPrice ?? 0) * item.quantity), 0) + (inv.otherExpenses ?? 0);
                const charged = inv.chargedAmount ?? 0;
                const profit = charged - cost;
                report.treatments.push({ invoiceId: inv.id, date: inv.date, charged, cost, profit });
                report.totalTreatmentProfit += profit;
            }
        }
        report.grandTotalProfit = report.totalSalesProfit + report.totalTreatmentProfit;
        return report;
    }
    
    async getInventoryReport(dateRange: { startDate?: string, endDate?: string }): Promise<InventoryReportItem[]> {
        const products = await this.getProducts();
        const saleInvoices = this.data.invoices.filter(i => i.type === 'sale' && isWithinDateRange(i.date, dateRange));

        const salesCount = new Map<string, number>();
        for (const inv of saleInvoices) {
            for (const item of inv.items) {
                salesCount.set(item.productId, (salesCount.get(item.productId) || 0) + item.quantity);
            }
        }

        const sortedSales = [...salesCount.entries()].sort((a, b) => b[1] - a[1]);
        const topSellerIds = new Set(sortedSales.slice(0, 5).map(x => x[0]));
        
        const twoMonthsFromNow = new Date();
        twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
        
        return products
            .filter(p => p.stockVials > 0 || p.stockLoose > 0)
            .map(p => ({
                ...p,
                isLowStock: p.stockVials <= p.lowStockAlert,
                isNearExpiry: new Date(p.expiryDate) < twoMonthsFromNow,
                isTopSeller: topSellerIds.has(p.id),
                soldQty: salesCount.get(p.id) || 0
            }));
    }
    
    async getCustomersReport(dateRange: { startDate?: string, endDate?: string }): Promise<PartyReportItem[]> {
        const customers = this.data.customers;
        const invoices = this.data.invoices.filter(i => i.customerId && isWithinDateRange(i.date, dateRange));
        
        const businessMap = new Map<string, number>();
        for (const inv of invoices) {
            businessMap.set(inv.customerId!, (businessMap.get(inv.customerId!) || 0) + inv.totalAmount);
        }

        return customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            outstandingBalance: c.outstandingBalance,
            totalBusiness: businessMap.get(c.id) || 0
        }));
    }

    async getSuppliersReport(dateRange: { startDate?: string, endDate?: string }): Promise<PartyReportItem[]> {
        const suppliers = this.data.suppliers;
        const invoices = this.data.invoices.filter(i => i.supplierId && isWithinDateRange(i.date, dateRange));
        
        const businessMap = new Map<string, number>();
        for (const inv of invoices) {
            businessMap.set(inv.supplierId!, (businessMap.get(inv.supplierId!) || 0) + inv.totalAmount);
        }

        return suppliers.map(s => ({
            id: s.id,
            name: s.name,
            phone: s.phone,
            outstandingBalance: s.outstandingBalance,
            totalBusiness: businessMap.get(s.id) || 0
        }));
    }
    
    async getPaymentsReport(dateRange: { startDate?: string, endDate?: string }): Promise<PaymentWithParty[]> {
        const payments = this.data.payments.filter(p => isWithinDateRange(p.date, dateRange));
        const customers = new Map(this.data.customers.map(c => [c.id, c.name]));
        const suppliers = new Map(this.data.suppliers.map(s => [s.id, s.name]));
        return payments.map(p => ({
            ...p,
            partyName: customers.get(p.partyId) || suppliers.get(p.partyId) || 'N/A'
        }));
    }


    // --- ACCOUNTING ---
    async getAccountTransactions(): Promise<AccountTransaction[]> {
        return [...this.data.accountTransactions];
    }

    async getLatestBalances(): Promise<{ clinicBalance: number, ownerBalance: number }> {
        if (this.data.accountTransactions.length === 0) {
            return { clinicBalance: 0, ownerBalance: 0 };
        }
        const lastTransaction = this.data.accountTransactions[this.data.accountTransactions.length - 1];
        return {
            clinicBalance: lastTransaction.clinicBalance,
            ownerBalance: lastTransaction.ownerBalance,
        };
    }
    
    async saveManualTransaction(data: Omit<AccountTransaction, 'id' | 'clinicBalance' | 'ownerBalance' | 'referenceId'> & { id?: string }): Promise<void> {
        if(data.id) { // Editing
             const index = this.data.accountTransactions.findIndex(t => t.id === data.id);
             if (index > -1) {
                 const original = this.data.accountTransactions[index];
                 this.data.accountTransactions[index] = { ...original, ...data };
                 this._logSyncOperation('accountTransactions', 'update', this.data.accountTransactions[index]);
             }
        } else { // Creating
            const newId = `trans#${this.data.counters.transaction++}`;
            const newTransaction = {
                ...data,
                id: newId,
                clinicBalance: 0, // Recalculated on save
                ownerBalance: 0, // Recalculated on save
            };
            this.data.accountTransactions.push(newTransaction);
            this._logSyncOperation('accountTransactions', 'create', newTransaction);
        }
        this.save();
    }

    async deleteManualTransaction(id: string): Promise<void> {
        this._logSyncOperation('accountTransactions', 'delete', { id });
        this.data.accountTransactions = this.data.accountTransactions.filter(t => t.id !== id);
        this.save();
    }
    
    // --- SYNC QUEUE METHODS ---
    async getSyncQueue(): Promise<SyncOperation[]> {
        return [...this.data.sync_queue];
    }

    async clearSyncOperations(ids: string[]): Promise<void> {
        const idSet = new Set(ids);
        this.data.sync_queue = this.data.sync_queue.filter(op => !idSet.has(op.id));
        this.save();
    }

    // --- DATA MANAGEMENT ---
    async exportData(): Promise<string> {
        return JSON.stringify(this.data, null, 2);
    }

    async importData(jsonData: string): Promise<void> {
        try {
            const parsedData = JSON.parse(jsonData);
            
            // Stricter validation to ensure it's a valid-looking object from this app
            if (typeof parsedData !== 'object' || parsedData === null || !parsedData.counters || !Array.isArray(parsedData.products)) {
                throw new Error("Invalid backup file format. Core data structure is incorrect.");
            }
            
            // Create a default structure to merge against. This ensures any missing keys from older backups are initialized.
            const defaultData: DBData = {
                products: [], customers: [], suppliers: [], invoices: [], payments: [], expenses: [], users: [],
                clinicSettings: { name: 'VetClinic', logo: null },
                accountTransactions: [],
                sync_queue: [],
                counters: {
                    customer: 1, supplier: 1, invoice: 1, payment: 1, expense: 1, user: 1, transaction: 1, sync_operation: 1,
                }
            };
            
            // Merge parsed data over the default structure. This adds any missing keys from older backups.
            const mergedData: DBData = {
                ...defaultData,
                ...parsedData,
                // Explicitly merge nested objects to ensure all their keys are present
                counters: {
                    ...defaultData.counters,
                    ...(parsedData.counters || {}),
                },
                clinicSettings: {
                    ...defaultData.clinicSettings,
                    ...(parsedData.clinicSettings || {}),
                }
            };
            
            // Replace the data in localStorage with the sanitized, merged data.
            localStorage.setItem(DB_KEY, JSON.stringify(mergedData));
            
            return Promise.resolve();

        } catch (error) {
            console.error("Failed to parse or validate backup file:", error);
            if (error instanceof SyntaxError) {
                 throw new Error("The selected file is not a valid JSON backup file.");
            }
            // Re-throw our custom error or any other error
            throw error;
        }
    }
}

export const db = new DBService();