import "../styles/HeroSection.scss";

interface HeroSectionProps {
    onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
    return (
        <div className="hero-section">
            <div className="hero-content">
                <span className="badge">New: Universal Data Translator</span>
                <h1>Super fast data translation <br />for every IoT device</h1>
                <p>
                    UDT makes it easy to translate, test, and proxy your IoT data. 
                    Simple, powerful, and built for modern engineering teams.
                </p>
                <div className="hero-actions">
                    <button className="btn-primary" onClick={onGetStarted}>Get Started</button>
                    <button className="btn-secondary">View Documentation</button>
                </div>
            </div>
            <div className="hero-preview">
                <div className="preview-card">
                    <div className="preview-header">
                        <div className="dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                    <div className="preview-body">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line short"></div>
                        <div className="skeleton-grid">
                            <div className="skeleton-box"></div>
                            <div className="skeleton-box"></div>
                            <div className="skeleton-box"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

