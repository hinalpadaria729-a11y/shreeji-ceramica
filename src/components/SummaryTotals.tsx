import React from 'react';
import type { QuoteCalculations } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Calculator } from 'lucide-react';

interface SummaryTotalsProps {
    totals: QuoteCalculations;
    includeGST: boolean;
    gstPercentage: number;
}

export const SummaryTotals: React.FC<SummaryTotalsProps> = ({
    totals,
    includeGST,
    gstPercentage
}) => {
    return (
        <div className="panel summary-card animate-fade-in" style={{ animationDelay: '0.2s', padding: '1rem' }}>
            <h2 className="panel-title text-white mb-3 border-b border-white/20 pb-2" style={{ fontSize: '1rem' }}>
                <Calculator size={18} /> Quotation Summary
            </h2>

            <div className="summary-row" style={{ fontSize: '0.9rem' }}>
                <span>Gross Subtotal</span>
                <span className="font-bold">{formatCurrency(totals.grossSubtotal)}</span>
            </div>

            <div className="summary-row items-center mt-2" style={{ fontSize: '0.9rem' }}>
                <span className="flex items-center gap-2">
                    Total Savings
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                        {totals.effectiveDiscountPercentage.toFixed(1)}% OFF
                    </span>
                </span>
                <span className="font-bold">
                    -{formatCurrency(totals.totalItemDiscountAmount + totals.globalDiscountAmount)}
                </span>
            </div>

            <div className="summary-row mt-1" style={{ fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                <span>Net Taxable</span>
                <span className="font-bold">{formatCurrency(totals.taxableAmount)}</span>
            </div>

            <div className="summary-row items-center mt-3 mb-2" style={{ fontSize: '0.85rem' }}>
                <span className="font-semibold opacity-90">Include GST</span>
                <span className="font-bold">{includeGST ? `Yes (${gstPercentage}%)` : 'No'}</span>
            </div>

            {includeGST && (
                <>
                    <div className="summary-row mt-1" style={{ fontSize: '0.85rem' }}>
                        <span>CGST ({gstPercentage / 2}%)</span>
                        <span>{formatCurrency(totals.cgstAmount)}</span>
                    </div>
                    <div className="summary-row" style={{ fontSize: '0.85rem' }}>
                        <span>SGST ({gstPercentage / 2}%)</span>
                        <span>{formatCurrency(totals.sgstAmount)}</span>
                    </div>
                </>
            )}

            <div className="summary-total" style={{ fontSize: '1.2rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
                <span>TOTAL</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
        </div>
    );
};
