import React from 'react';
import { Layers, Box, FileText, PlusCircle } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    activeBrand: 'KOHLER' | 'AQUANT';
    onBrandSelect: (brand: 'KOHLER' | 'AQUANT') => void;
    currentView: 'NEW_QUOTE' | 'SAVED_QUOTES';
    onViewChange: (view: 'NEW_QUOTE' | 'SAVED_QUOTES') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen, activeBrand, onBrandSelect, currentView, onViewChange
}) => {
    return (
        <>
            {/* Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={() => onBrandSelect(activeBrand)} /* Just to close */
            />

            <aside className={`sidebar-secondary ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="flex items-center gap-2">
                        <Layers size={20} className="text-primary" />
                        <span className="font-bold text-lg">Menu</span>
                    </div>
                </div>

                <div className="sidebar-content flex-grow overflow-y-auto">
                    {/* Views Section */}
                    <div className="mb-6">
                        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3 px-1">Navigation</div>
                        <div className="vertical-stack">
                            <button
                                className={`nav-btn ${currentView === 'NEW_QUOTE' ? 'active' : ''}`}
                                onClick={() => onViewChange('NEW_QUOTE')}
                            >
                                <PlusCircle size={18} />
                                <span>Create Quote</span>
                            </button>
                            <button
                                className={`nav-btn ${currentView === 'SAVED_QUOTES' ? 'active' : ''}`}
                                onClick={() => onViewChange('SAVED_QUOTES')}
                            >
                                <FileText size={18} />
                                <span>Saved Quotations</span>
                            </button>
                        </div>
                    </div>

                    <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3 px-1">Brands</div>
                    <div className="vertical-stack">
                        <button
                            className={`brand-btn ${activeBrand === 'KOHLER' ? 'active' : ''}`}
                            onClick={() => onBrandSelect('KOHLER')}
                        >
                            <div className="brand-icon kohler">K</div>
                            <div className="brand-info">
                                <span className="name">KOHLER</span>
                                <span className="desc">Premium Bath & Kitchen</span>
                            </div>
                        </button>

                        <button
                            className={`brand-btn ${activeBrand === 'AQUANT' ? 'active' : ''}`}
                            onClick={() => onBrandSelect('AQUANT')}
                        >
                            <div className="brand-icon aquant">A</div>
                            <div className="brand-info">
                                <span className="name">AQUANT</span>
                                <span className="desc">Designer Bathware</span>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
                            <Box size={14} /> Catalog Note
                        </div>
                        <p className="text-[10px] text-muted leading-relaxed">
                            Search results and categories will automatically update based on your selected brand.
                        </p>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <p className="text-[10px] text-center text-muted opacity-50">Shreeji Ceramica © 2026</p>
                </div>
            </aside>
        </>
    );
};
