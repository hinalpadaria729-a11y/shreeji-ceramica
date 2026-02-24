import { Send, MessageCircle, Download, Eye, Save } from 'lucide-react';
import type { CustomerDetails, ProductDetails } from '../types';
import { generatePDF } from '../utils/pdfGenerator';
import { formatCurrency, calculateQuoteTotals } from '../utils/calculations';

interface ActionPanelProps {
    customer: CustomerDetails;
    products: ProductDetails[];
    includeGST: boolean;
    gstPercentage?: number;
    discountMode: 'INDIVIDUAL' | 'COMMON' | 'GLOBAL';
    onDiscountModeChange: (mode: 'INDIVIDUAL' | 'COMMON' | 'GLOBAL') => void;
    commonDiscountPercentage: number;
    onCommonDiscountChange: (val: number) => void;
    globalDiscountAmount: number;
    onGlobalDiscountChange: (val: number) => void;
    onViewPDF: () => void;
    onSaveQuote: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
    customer,
    products,
    includeGST,
    gstPercentage = 18,
    discountMode,
    onDiscountModeChange,
    commonDiscountPercentage,
    onCommonDiscountChange,
    globalDiscountAmount,
    onGlobalDiscountChange,
    onViewPDF,
    onSaveQuote
}) => {

    const handleGeneratePDF = async () => {
        const discValue = discountMode === 'COMMON' ? commonDiscountPercentage : globalDiscountAmount;
        await generatePDF(customer, products, discountMode, discValue, includeGST, gstPercentage);
    };

    const generateMessageText = () => {
        if (!customer.customerName) return '';
        const discValue = discountMode === 'COMMON' ? commonDiscountPercentage : globalDiscountAmount;
        const totals = calculateQuoteTotals(products, discountMode, discValue, includeGST, gstPercentage);
        return `Hello ${customer.customerName},\n\nPlease find the quotation for your recent inquiry.\nTotal Amount: ${formatCurrency(totals.grandTotal)}\n\nThank you,\nShreeji Ceramica`;
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(generateMessageText());
        let url = `https://wa.me/?text=${text}`;
        if (customer.phone) {
            // Remove any non-numeric characters for WA link
            const phoneNum = customer.phone.replace(/\D/g, '');
            url = `https://wa.me/${phoneNum}?text=${text}`;
        }
        window.open(url, '_blank');
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Quotation from Shreeji Ceramica`);
        const body = encodeURIComponent(generateMessageText());
        window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="space-y-4">
            {/* Discount Control Section */}
            <div className="panel glass-panel mt-4 p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <Save size={16} className="text-secondary" /> Discount Configuration
                </h3>

                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-muted uppercase">Discount Method</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                            {(['INDIVIDUAL', 'COMMON', 'GLOBAL'] as const).map(mode => (
                                <button
                                    key={mode}
                                    className={`px-3 py-1 text-xs rounded-md transition-all ${discountMode === mode
                                        ? 'bg-white shadow-sm text-primary font-bold'
                                        : 'text-muted hover:text-primary'
                                        }`}
                                    onClick={() => onDiscountModeChange(mode)}
                                >
                                    {mode === 'INDIVIDUAL' ? 'Item Wise' : mode === 'COMMON' ? 'Common %' : 'On Total'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {discountMode === 'COMMON' && (
                        <div className="flex flex-col gap-1 animate-fade-in">
                            <label className="text-[10px] font-bold text-muted uppercase">Bulk Discount %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="input-field w-24 pr-6"
                                    value={commonDiscountPercentage}
                                    onChange={(e) => onCommonDiscountChange(Number(e.target.value))}
                                    placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>
                            </div>
                        </div>
                    )}

                    {discountMode === 'GLOBAL' && (
                        <div className="flex flex-col gap-1 animate-fade-in">
                            <label className="text-[10px] font-bold text-muted uppercase">Flat Discount Amount</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">₹</span>
                                <input
                                    type="number"
                                    className="input-field w-32 pl-5"
                                    value={globalDiscountAmount}
                                    onChange={(e) => onGlobalDiscountChange(Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-2 text-[10px] text-muted italic">
                    {discountMode === 'INDIVIDUAL' && 'Apply different discount percentages to each product in the table.'}
                    {discountMode === 'COMMON' && 'Applies the same discount percentage to every product in the list.'}
                    {discountMode === 'GLOBAL' && 'Deducts a single flat amount from the final quotation subtotal.'}
                </p>
            </div>

            {/* Desktop View */}
            <div className="action-panel desktop-action-panel flex gap-2 items-center flex-wrap">
                <button className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', backgroundColor: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0' }} onClick={onSaveQuote}>
                    <Save size={16} /> Save Quote
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', backgroundColor: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0' }} onClick={onViewPDF}>
                    <Eye size={16} /> View PDF
                </button>
                <button className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }} onClick={handleGeneratePDF}>
                    <Download size={16} /> Generate PDF
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem' }} onClick={handleEmail}>
                    <Send size={16} /> Email
                </button>
                <button className="btn btn-accent" style={{ padding: '0.6rem 1.2rem' }} onClick={handleWhatsApp}>
                    <MessageCircle size={16} /> WhatsApp
                </button>
            </div>

            {/* Mobile Sticky Bar */}
            <div className="mobile-action-bar">
                <button className="btn btn-secondary flex-grow" onClick={onSaveQuote}>
                    <Save size={18} /> <span className="text-xs">Save</span>
                </button>
                <button className="btn btn-secondary flex-grow" onClick={onViewPDF}>
                    <Eye size={18} /> <span className="text-xs">Preview</span>
                </button>
                <button className="btn btn-primary flex-grow" onClick={handleGeneratePDF}>
                    <Download size={18} /> <span className="text-xs">PDF</span>
                </button>
                <button className="btn btn-accent p-3" onClick={handleWhatsApp}>
                    <MessageCircle size={20} />
                </button>
            </div>
        </div>
    );
};
