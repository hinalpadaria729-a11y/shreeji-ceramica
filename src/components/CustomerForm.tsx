import React from 'react';
import { User, Percent, UserCheck } from 'lucide-react';
import type { CustomerDetails } from '../types';

const PREPARED_BY_OPTIONS = [
    { label: '— Select —', value: '' },
    { label: 'Harsh Bhai — +91 82385 21277', value: 'Harsh Bhai — +91 82385 21277' },
    { label: 'Karan Bhai — +91 82009 17069', value: 'Karan Bhai — +91 82009 17069' },
    { label: 'Kunal Bhai — +91 98987 13167', value: 'Kunal Bhai — +91 98987 13167' },
];

interface CustomerFormProps {
    customer: CustomerDetails;
    onChange: (field: keyof CustomerDetails, value: string) => void;
    includeGST: boolean;
    onIncludeGSTChange: (value: boolean) => void;
    gstPercentage: number;
    onGstPercentageChange: (value: number) => void;
    preparedBy: string;
    onPreparedByChange: (val: string) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
    customer,
    onChange,
    includeGST,
    onIncludeGSTChange,
    gstPercentage,
    onGstPercentageChange,
    preparedBy,
    onPreparedByChange,
}) => {
    return (
        <div className="liquid-glass-warm p-8 animate-reveal-up relative overflow-visible">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 className="panel-title flex-shrink-0" style={{ margin: 0 }}><User size={20} className="text-secondary" /> Client Information</h2>
                {/* Prepared By Dropdown */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                    <UserCheck size={16} className="text-secondary flex-shrink-0" />
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>Prepared By</label>
                    <select
                        className="input-field-warm flex-grow sm:flex-grow-0"
                        style={{ padding: '4px 12px', fontSize: '13px', fontWeight: 600, minWidth: '150px' }}
                        value={preparedBy}
                        onChange={(e) => onPreparedByChange(e.target.value)}
                    >
                        {PREPARED_BY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Client Name / Business</label>
                    <textarea
                        className="input-field-warm w-full resize-y"
                        rows={1}
                        placeholder="e.g. John Doe / Skyline Architects"
                        value={customer.customerName}
                        onChange={(e) => onChange('customerName', e.target.value)}
                    />
                </div>


                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Phone Number</label>
                    <textarea
                        className="input-field-warm w-full resize-y"
                        rows={1}
                        placeholder="+91 XXXXX XXXXX"
                        value={customer.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Email Address</label>
                    <textarea
                        className="input-field-warm w-full resize-y"
                        rows={1}
                        placeholder="client@example.com"
                        value={customer.email}
                        onChange={(e) => onChange('email', e.target.value)}
                    />
                </div>

                <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Project Site / Address</label>
                    <textarea
                        className="input-field-warm w-full resize-y"
                        rows={1}
                        placeholder="Enter full site address..."
                        value={customer.address}
                        onChange={(e) => onChange('address', e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5 flex flex-wrap items-center justify-between gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={includeGST}
                            onChange={(e) => onIncludeGSTChange(e.target.checked)}
                        />
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${includeGST ? 'bg-secondary' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${includeGST ? 'translate-x-6' : ''}`} />
                        </div>
                    </div>
                    <span className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">Apply GST Compliance</span>
                </label>

                {includeGST && (
                    <div className="flex items-center gap-6 animate-reveal-up ml-auto">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-muted uppercase">GST %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="input-field-warm py-1 px-3 w-24 pr-8 text-center font-bold text-primary"
                                    value={gstPercentage}
                                    onChange={(e) => onGstPercentageChange(Number(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                />
                                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
