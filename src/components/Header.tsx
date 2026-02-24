import { Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
    activeBrand?: 'KOHLER' | 'AQUANT' | null;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, activeBrand }) => {
    return (
        <header className="app-header">
            <div className="flex items-center gap-4">
                <button
                    className="menu-btn p-2 hover:bg-gray-100 rounded-lg text-primary transition-colors"
                    onClick={onMenuClick}
                    title="Switch Brand"
                >
                    <Menu size={24} />
                </button>
                <div className="brand flex items-center gap-3">
                    <img src="/logo.png" alt="Shreeji Ceramica" className="hidden sm:block" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} />
                    <h1 className="flex items-center gap-3">
                        <span>Shreeji <span className="brand-accent">Ceramica</span></span>

                        {activeBrand && (
                            <>
                                <span className="text-gray-300 text-3xl font-light leading-none">|</span>
                                <span className={`px-4 py-1.5 rounded-lg border-2 text-xl font-bold tracking-wider shadow-sm
                                    ${activeBrand === 'KOHLER'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-[#3498DB] text-white border-[#3498DB]'}`}>
                                    {activeBrand}
                                </span>
                            </>
                        )}
                    </h1>
                </div>
                <div className="header-meta text-muted text-sm text-right">
                    <div>Quotation Portal</div>
                    <div>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
            </div>
        </header>
    );
};
