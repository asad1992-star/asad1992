
import React, { useState, useEffect, useMemo } from 'react';
import type { User, ProfitLossReportData, InventoryReportItem, Expense, PartyReportItem, AccountTransaction, PaymentWithParty } from '../types';
import { db } from '../services/db';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { PrinterIcon } from '../components/icons/PrinterIcon';

type ReportType = 'profit_loss' | 'inventory' | 'expenses' | 'customers' | 'suppliers' | 'accounts' | 'payments';

const reportTypes: { id: ReportType; label: string }[] = [
    { id: 'profit_loss', label: 'Profit & Loss' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'customers', label: 'Customers' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'payments', label: 'Payments' },
];

const getISODateString = (date: Date) => date.toISOString().split('T')[0];

const getDateRanges = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    return {
        today: { startDate: getISODateString(today), endDate: getISODateString(today) },
        week: { startDate: getISODateString(weekStart), endDate: getISODateString(today) },
        month: { startDate: getISODateString(monthStart), endDate: getISODateString(today) },
        year: { startDate: getISODateString(yearStart), endDate: getISODateString(today) },
    };
};

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

const ReportHeader: React.FC<{
    onDateChange: (start: string, end: string) => void;
    startDate: string;
    endDate: string;
}> = ({ onDateChange, startDate, endDate }) => {
    const ranges = getDateRanges();
    return (
        <div className="mb-4 p-4 bg-gray-50 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => onDateChange(ranges.today.startDate, ranges.today.endDate)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300">Today</button>
                <button onClick={() => onDateChange(ranges.week.startDate, ranges.week.endDate)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300">This Week</button>
                <button onClick={() => onDateChange(ranges.month.startDate, ranges.month.endDate)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300">This Month</button>
                <button onClick={() => onDateChange(ranges.year.startDate, ranges.year.endDate)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300">This Year</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                <label className="text-sm font-medium text-gray-700">Start Date:
                    <input type="date" value={startDate} onChange={e => onDateChange(e.target.value, endDate)} className="w-full px-4 py-1.5 border border-gray-300 rounded-md text-gray-900" />
                </label>
                <label className="text-sm font-medium text-gray-700">End Date:
                    <input type="date" value={endDate} onChange={e => onDateChange(startDate, e.target.value)} className="w-full px-4 py-1.5 border border-gray-300 rounded-md text-gray-900" />
                </label>
            </div>
        </div>
    );
};

// Individual Report Components
const ProfitLossReport: React.FC<{ dateRange: { startDate: string, endDate: string } }> = ({ dateRange }) => {
    const [data, setData] = useState<ProfitLossReportData | null>(null);
    useEffect(() => { db.getProfitLossReport(dateRange).then(setData); }, [dateRange]);
    if (!data) return <p>Loading...</p>;
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-100 rounded-lg"><h3 className="font-semibold">Sale Profit</h3><p className="text-2xl">Rs {data.totalSalesProfit.toFixed(2)}</p></div>
                <div className="p-4 bg-blue-100 rounded-lg"><h3 className="font-semibold">Treatment Profit</h3><p className="text-2xl">Rs {data.totalTreatmentProfit.toFixed(2)}</p></div>
                <div className="p-4 bg-gray-200 rounded-lg"><h3 className="font-semibold">Grand Total Profit</h3><p className="text-2xl">Rs {data.grandTotalProfit.toFixed(2)}</p></div>
            </div>
        </div>
    );
};
const InventoryReport: React.FC<{ dateRange: { startDate: string, endDate: string } }> = ({ dateRange }) => {
    const [data, setData] = useState<InventoryReportItem[]>([]);
    useEffect(() => { db.getInventoryReport(dateRange).then(setData); }, [dateRange]);
    return (
        <div>
            <div className="flex flex-wrap gap-2 text-xs mb-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Near Expiry</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Top Seller</span>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-left">Packing Stock</th>
                        <th className="p-2 text-left">Loose Stock</th>
                        <th className="p-2 text-left">Sold Qty</th>
                        <th className="p-2 text-left">Expiry</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2">
                                {item.name}
                                <div className="flex gap-1 mt-1">
                                    {item.isLowStock && <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>}
                                    {item.isNearExpiry && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full">Near Expiry</span>}
                                    {item.isTopSeller && <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">Top Seller</span>}
                                </div>
                            </td>
                            <td className="p-2">{item.stockVials} {item.packingUnit}</td>
                            <td className="p-2">{item.stockLoose > 0 ? `${item.stockLoose.toFixed(2)} ${item.looseUnit}` : '-'}</td>
                            <td className="p-2">{item.soldQty}</td>
                            <td className="p-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ExpensesReport: React.FC<{ dateRange: { startDate: string, endDate: string } }> = ({ dateRange }) => {
    const [data, setData] = useState<Expense[]>([]);
    useEffect(() => { 
        db.getExpenses().then(expenses => {
            const filtered = expenses.filter(e => isWithinDateRange(e.date, dateRange));
            setData(filtered);
        });
    }, [dateRange]);
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    return (
        <div>
            <div className="p-4 bg-red-100 rounded-lg mb-4">
                <h3 className="font-semibold">Total Expenses</h3>
                <p className="text-2xl">Rs {total.toFixed(2)}</p>
            </div>
            <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Description</th><th className="p-2 text-right">Amount</th></tr></thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id} className="border-b"><td className="p-2">{new Date(item.date).toLocaleDateString()}</td><td className="p-2">{item.category}</td><td className="p-2">{item.description}</td><td className="p-2 text-right">{item.amount.toFixed(2)}</td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CustomersReport: React.FC<{ dateRange: { startDate: string, endDate: string } }> = ({ dateRange }) => {
    const [data, setData] = useState<PartyReportItem[]>([]);
    useEffect(() => { db.getCustomersReport(dateRange).then(setData); }, [dateRange]);
    return (
        <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Phone</th><th className="p-2 text-right">Total Business</th><th className="p-2 text-right">Outstanding Balance</th></tr></thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.id} className="border-b"><td className="p-2">{item.name}</td><td className="p-2">{item.phone}</td><td className="p-2 text-right">{item.totalBusiness.toFixed(2)}</td><td className="p-2 text-right">{item.outstandingBalance.toFixed(2)}</td></tr>
                ))}
            </tbody>
        </table>
    );
};
const SuppliersReport: React.FC<{ dateRange: { startDate: string, endDate: string } }> = ({ dateRange }) => {
    const [data, setData] = useState<PartyReportItem[]>([]);
    useEffect(() => { db.getSuppliersReport(dateRange).then(setData); }, [dateRange]);
    return (
        <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="p-2 text-left">Supplier</th><th className="p-2 text-left">Phone</th><th className="p-2 text-right">Total Business</th><th className="p-2 text-right">Outstanding Balance</th></tr></thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.id} className="border-b"><td className="p-2">{item.name}</td><td className="p-2">{item.phone}</td><td className="p-2 text-right">{item.totalBusiness.toFixed(2)}</td><td className="p-2 text-right">{item.outstandingBalance.toFixed(2)}</td></tr>
                ))}
            </tbody>
        </table>
    );
};

const AccountsReport: React.FC<{ dateRange: { startDate: string, endDate: string } }> = ({ dateRange }) => {
    const [data, setData] = useState<AccountTransaction[]>([]);
    useEffect(() => { 
        db.getAccountTransactions().then(transactions => {
            const filtered = transactions.filter(t => isWithinDateRange(t.date, dateRange));
            setData(filtered);
        });
    }, [dateRange]);
    
    const clinicIncome = data.reduce((sum, t) => t.clinicAmount > 0 ? sum + t.clinicAmount : sum, 0);
    const clinicExpense = data.reduce((sum, t) => t.clinicAmount < 0 ? sum + t.clinicAmount : sum, 0);
    
    const totalWithdrawn = data.reduce((sum, t) => {
        if (t.isManual && t.clinicAmount < 0 && t.ownerAmount > 0) {
            return sum + t.ownerAmount;
        }
        return sum;
    }, 0);

    const totalInvested = data.reduce((sum, t) => {
        if (t.isManual && t.clinicAmount > 0 && t.ownerAmount < 0) {
            return sum + t.clinicAmount;
        }
        return sum;
    }, 0);

    const totalPersonalSpending = data.reduce((sum, t) => {
        if (t.isManual && t.clinicAmount === 0 && t.ownerAmount < 0) {
            return sum + Math.abs(t.ownerAmount);
        }
        return sum;
    }, 0);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-100 rounded-lg"><h3 className="font-semibold">Clinic Income</h3><p className="text-2xl">Rs {clinicIncome.toFixed(2)}</p></div>
                <div className="p-4 bg-red-100 rounded-lg"><h3 className="font-semibold">Clinic Expense</h3><p className="text-2xl">Rs {Math.abs(clinicExpense).toFixed(2)}</p></div>
                <div className="p-4 bg-blue-100 rounded-lg"><h3 className="font-semibold">Net</h3><p className="text-2xl">Rs {(clinicIncome + clinicExpense).toFixed(2)}</p></div>
                <div className="p-4 bg-purple-100 rounded-lg"><h3 className="font-semibold">Total Invested (Pocket to Clinic)</h3><p className="text-2xl">Rs {totalInvested.toFixed(2)}</p></div>
                <div className="p-4 bg-yellow-100 rounded-lg"><h3 className="font-semibold">Total Withdrawn (Clinic to Pocket)</h3><p className="text-2xl">Rs {totalWithdrawn.toFixed(2)}</p></div>
                <div className="p-4 bg-orange-100 rounded-lg"><h3 className="font-semibold">Total Personal Spending (from Pocket)</h3><p className="text-2xl">Rs {totalPersonalSpending.toFixed(2)}</p></div>
            </div>
             <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Description</th><th className="p-2 text-right">Clinic Amount</th><th className="p-2 text-right">Owner Amount</th></tr></thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id} className="border-b"><td className="p-2">{new Date(item.date).toLocaleDateString()}</td><td className="p-2">{item.description}</td><td className="p-2 text-right">{item.clinicAmount.toFixed(2)}</td><td className="p-2 text-right">{item.ownerAmount.toFixed(2)}</td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PaymentsReport: React.FC<{ dateRange: { startDate: string, endDate: string } }> = ({ dateRange }) => {
    const [data, setData] = useState<PaymentWithParty[]>([]);
    useEffect(() => { db.getPaymentsReport(dateRange).then(setData); }, [dateRange]);
    const received = data.filter(p => p.type === 'receive').reduce((sum, item) => sum + item.amount, 0);
    const paid = data.filter(p => p.type === 'pay').reduce((sum, item) => sum + item.amount, 0);
    return (
         <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-green-100 rounded-lg"><h3 className="font-semibold">Total Received</h3><p className="text-2xl">Rs {received.toFixed(2)}</p></div>
                <div className="p-4 bg-red-100 rounded-lg"><h3 className="font-semibold">Total Paid</h3><p className="text-2xl">Rs {paid.toFixed(2)}</p></div>
            </div>
            <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Party</th><th className="p-2 text-right">Amount</th></tr></thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id} className="border-b"><td className="p-2">{new Date(item.date).toLocaleDateString()}</td><td className="p-2 capitalize">{item.type}</td><td className="p-2">{item.partyName}</td><td className="p-2 text-right">{item.amount.toFixed(2)}</td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export const ReportsScreen: React.FC<{ user: User }> = ({ user }) => {
    const [activeReport, setActiveReport] = useState<ReportType>('profit_loss');
    const [dateRange, setDateRange] = useState(() => {
        const ranges = getDateRanges();
        return { startDate: ranges.month.startDate, endDate: ranges.month.endDate };
    });
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleDateChange = (start: string, end: string) => {
        setDateRange({ startDate: start, endDate: end });
    };

    const renderActiveReport = () => {
        switch (activeReport) {
            case 'profit_loss': return <ProfitLossReport dateRange={dateRange} />;
            case 'inventory': return <InventoryReport dateRange={dateRange} />;
            case 'expenses': return <ExpensesReport dateRange={dateRange} />;
            case 'customers': return <CustomersReport dateRange={dateRange} />;
            case 'suppliers': return <SuppliersReport dateRange={dateRange} />;
            case 'accounts': return <AccountsReport dateRange={dateRange} />;
            case 'payments': return <PaymentsReport dateRange={dateRange} />;
            default: return null;
        }
    };

    const activeReportLabel = useMemo(() => 
        reportTypes.find(r => r.id === activeReport)?.label || 'Report',
        [activeReport]
    );

    if (user.role !== 'admin') {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Access Denied: </strong>
                <span className="block sm:inline">You do not have permission to view this page.</span>
            </div>
        );
    }

    const reportContent = (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 print-only">{activeReportLabel}</h2>
            {renderActiveReport()}
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold flex items-center gap-2"
                >
                    <PrinterIcon className="h-5 w-5" />
                    Print Report
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 no-print">
                {reportTypes.map(report => (
                    <button
                        key={report.id}
                        onClick={() => setActiveReport(report.id)}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                            activeReport === report.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border'
                        }`}
                    >
                        {report.label}
                    </button>
                ))}
            </div>

            <ReportHeader
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={handleDateChange}
            />

            {reportContent}

            <PrintPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title={activeReportLabel}
            >
                {reportContent}
            </PrintPreviewModal>
        </div>
    );
};
