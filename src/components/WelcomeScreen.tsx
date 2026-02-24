import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
    onBrandSelect: (brand: 'KOHLER' | 'AQUANT') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onBrandSelect }) => {
    return (
        <div className="welcome-screen">
            <div className="welcome-bg-ornament top-right" />
            <div className="welcome-bg-ornament bottom-left" />

            <div className="welcome-container">
                <header className="welcome-header animate-slide-down">
                    <div className="welcome-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
                        <img src="/logo.png" alt="Shreeji Ceramica" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <h1>SHREEJI CERAMICA</h1>
                    <p className="welcome-tagline">Premium Bath & Kitchen Solutions • Established 2024</p>
                </header>

                <main className="welcome-content">
                    <div className="selection-prompt animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <h2>Select a Brand to Begin</h2>
                        <p>Access our complete product catalog and create professional quotations</p>
                    </div>

                    <div className="brand-cards-grid">
                        <button
                            className="welcome-brand-card kohler animate-slide-up"
                            style={{ animationDelay: '0.4s' }}
                            onClick={() => onBrandSelect('KOHLER')}
                        >
                            <div className="brand-card-overlay" />
                            <div className="brand-card-content">
                                <div className="brand-card-icon">K</div>
                                <div className="brand-card-text">
                                    <h3>KOHLER</h3>
                                    <p>Premium Bath, Kitchen & Lighting</p>
                                </div>
                                <ArrowRight className="brand-card-arrow" />
                            </div>
                        </button>

                        <button
                            className="welcome-brand-card aquant animate-slide-up"
                            style={{ animationDelay: '0.5s' }}
                            onClick={() => onBrandSelect('AQUANT')}
                        >
                            <div className="brand-card-overlay" />
                            <div className="brand-card-content">
                                <div className="brand-card-icon">A</div>
                                <div className="brand-card-text">
                                    <h3>AQUANT</h3>
                                    <p>Designer Sanitarywear & Bathware</p>
                                </div>
                                <ArrowRight className="brand-card-arrow" />
                            </div>
                        </button>
                    </div>
                </main>

                <footer className="welcome-footer animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    <div className="footer-line" />
                    <p>© 2026 Shreeji Ceramica • All Rights Reserved</p>
                </footer>
            </div>
        </div>
    );
};
