import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export type UserRole = 'peer' | 'trainer';

interface RoleSelectionProps {
    onRoleSelect: (role: UserRole) => void;
    onLogout: () => void;
    user: { email: string; username: string } | null;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect, onLogout, user }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const peerCardRef = useRef<HTMLDivElement>(null);
    const coordCardRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Animate title
        if (titleRef.current) {
            gsap.from(titleRef.current, {

                y: -30,
                duration: 0.8,

            });
        }

        // Stagger animate the cards
        const cards = [peerCardRef.current, coordCardRef.current].filter(Boolean);
        gsap.from(cards, {
            opacity: 50,
            y: 50,
            scale: 0.95,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 0.3
        });
    }, []);

    return (
        <div className="role-selection-page" ref={containerRef}>
            {/* Navigation */}
            <nav className="role-nav">
                <div className="nav-content">
                    <div className="nav-brand">
                        <span className="bolt-icon">⚡</span>
                        <span className="brand-text">HYPERTUNE</span>
                    </div>
                    <div className="nav-right">
                        <div className="connection-status">
                            <span className="status-dot"></span>
                            <span className="status-text">NOT CONNECTED</span>
                        </div>
                        <span className="user-name">{user?.username || user?.email}</span>
                        <button className="logout-btn" onClick={onLogout}>LOGOUT</button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="role-main">
                <div className="role-content">
                    {/* Title Section */}
                    <div className="title-section" ref={titleRef}>
                        <h1 className="main-title">
                            Select Your <span className="gradient-text">Role</span>
                        </h1>
                        <p className="subtitle">CHOOSE YOUR CONTRIBUTION MODE</p>
                    </div>

                    {/* Role Cards Grid */}
                    <div className="role-cards-grid">
                        {/* Peer Card */}
                        <div
                            className="role-card"
                            ref={peerCardRef}
                            onClick={() => onRoleSelect('peer')}
                        >
                            <div className="card-content">
                                {/* Icon Section */}
                                <div className="icon-container">
                                    <div className="icon-glow peer-glow"></div>
                                    <div className="orbit-ring">
                                        <div className="orbit-dot"></div>
                                    </div>
                                    <div className="icon-circle">
                                        <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
                                            <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="card-title">Peer</h2>
                                <div className="title-divider"></div>

                                {/* Description */}
                                <p className="card-description">
                                    Contribute compute power to the distributed network. Earn credits by training model shards on your local hardware.
                                </p>

                                {/* Features List */}
                                <ul className="features-list">
                                    <li>
                                        <span className="check-icon">✓</span>
                                        Passive Income Generation
                                    </li>
                                    <li>
                                        <span className="check-icon">✓</span>
                                        Low Latency Execution
                                    </li>
                                    <li>
                                        <span className="check-icon">✓</span>
                                        Privacy-Preserving
                                    </li>
                                </ul>
                            </div>

                            {/* Action Button */}
                            <div className="card-action">
                                <button className="action-btn peer-btn">
                                    Initialize Node
                                    <span className="btn-arrow">→</span>
                                </button>
                            </div>
                        </div>

                        {/* Coordinator Card */}
                        <div
                            className="role-card"
                            ref={coordCardRef}
                            onClick={() => onRoleSelect('trainer')}
                        >
                            <div className="card-content">
                                {/* Icon Section */}
                                <div className="icon-container">
                                    <div className="icon-glow coord-glow"></div>
                                    <div className="hub-grid">
                                        <div className="hub-cell"></div>
                                        <div className="hub-cell"></div>
                                        <div className="hub-cell"></div>
                                        <div className="hub-cell"></div>
                                    </div>
                                    <div className="hub-center">
                                        <svg className="hub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="3" />
                                            <circle cx="12" cy="4" r="2" />
                                            <circle cx="12" cy="20" r="2" />
                                            <circle cx="4" cy="12" r="2" />
                                            <circle cx="20" cy="12" r="2" />
                                            <path d="M12 6v3M12 15v3M6 12h3M15 12h3" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="card-title">Trainer</h2>
                                <div className="title-divider"></div>

                                {/* Description */}
                                <p className="card-description">
                                    Orchestrate training sessions. Define model parameters, aggregate updates, and manage the distributed cluster.
                                </p>

                                {/* Features List */}
                                <ul className="features-list">
                                    <li>
                                        <span className="check-icon">✓</span>
                                        Full Control Plane Access
                                    </li>
                                    <li>
                                        <span className="check-icon">✓</span>
                                        Real-time Telemetry
                                    </li>
                                    <li>
                                        <span className="check-icon">✓</span>
                                        Model Aggregation
                                    </li>
                                </ul>
                            </div>

                            {/* Action Button */}
                            <div className="card-action">
                                <button className="action-btn coord-btn">
                                    Create Session
                                    <span className="btn-arrow">+</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Network Status Footer */}
                    <div className="network-status">
                        <p>
                            Current Network Status: <span className="status-online">● OFFLINE</span>
                        </p>
                    </div>
                </div>
            </main>

            <style>{`
                .role-selection-page {
                    min-height: 100vh;
                    background-color: #0a0a0a;
                    color: #f3f4f6;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    position: relative;
                    overflow-x: hidden;
                }

                .role-selection-page * {
                    box-sizing: border-box;
                }

                /* Navigation */
                .role-nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 50;
                    background: rgba(10, 10, 10, 0.9);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .nav-content {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 70px;
                }

                .nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .bolt-icon {
                    font-size: 1.5rem;
                    color: #f97316;
                }

                .brand-text {
                    font-weight: 700;
                    font-size: 1.125rem;
                    letter-spacing: 0.05em;
                    color: white;
                }

                .nav-right {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .connection-status {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #6b7280;
                }

                .status-text {
                    font-size: 0.7rem;
                    font-family: monospace;
                    color: #9ca3af;
                }

                .user-name {
                    color: #9ca3af;
                    font-size: 0.875rem;
                }

                .logout-btn {
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background: transparent;
                    color: white;
                    padding: 0.5rem 1.25rem;
                    border-radius: 9999px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .logout-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Main Content */
                .role-main {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 100px 1.5rem 3rem;
                }

                .role-content {
                    max-width: 1000px;
                    width: 100%;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                /* Title Section */
                .title-section {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .main-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin: 0 0 0.75rem 0;
                    color: white;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #ff9500 0%, #ff5500 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .subtitle {
                    color: #6b7280;
                    font-family: monospace;
                    font-size: 0.75rem;
                    letter-spacing: 0.2em;
                    margin: 0;
                }

                /* Role Cards Grid */
                .role-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 2rem;
                    width: 100%;
                }

                @media (max-width: 768px) {
                    .role-cards-grid {
                        grid-template-columns: 1fr;
                    }
                }

                /* Role Card */
                .role-card {
                    background: rgba(20, 20, 20, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 2.5rem 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    min-height: 520px;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }

                .role-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                }

                .role-card:hover {
                    border-color: rgba(249, 115, 22, 0.5);
                    background: rgba(30, 25, 25, 0.9);
                    transform: translateY(-8px);
                    box-shadow: 0 25px 50px -12px rgba(249, 115, 22, 0.2);
                }

                .card-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }

                /* Icon Container */
                .icon-container {
                    width: 140px;
                    height: 140px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                }

                .icon-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    filter: blur(25px);
                    opacity: 0.6;
                }

                .peer-glow {
                    background: rgba(249, 115, 22, 0.3);
                }

                .coord-glow {
                    background: rgba(139, 92, 246, 0.2);
                }

                .role-card:hover .coord-glow {
                    background: rgba(249, 115, 22, 0.3);
                }

                .orbit-ring {
                    position: absolute;
                    width: 120px;
                    height: 120px;
                    border: 1px dashed rgba(249, 115, 22, 0.4);
                    border-radius: 50%;
                    animation: spin 10s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .orbit-dot {
                    position: absolute;
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 10px;
                    height: 10px;
                    background: #f97316;
                    border-radius: 50%;
                    box-shadow: 0 0 15px #f97316;
                }

                .icon-circle {
                    position: relative;
                    background: rgba(0, 0, 0, 0.6);
                    padding: 1.25rem;
                    border-radius: 50%;
                    border: 1px solid rgba(249, 115, 22, 0.4);
                    transition: all 0.3s;
                    z-index: 2;
                }

                .role-card:hover .icon-circle {
                    border-color: #f97316;
                    box-shadow: 0 0 30px rgba(249, 115, 22, 0.4);
                }

                .role-icon {
                    width: 40px;
                    height: 40px;
                    color: #f97316;
                }

                /* Coordinator Icon */
                .hub-grid {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px;
                    transform: rotate(45deg);
                    transition: transform 0.7s ease-out;
                }

                .role-card:hover .hub-grid {
                    transform: rotate(90deg);
                }

                .hub-cell {
                    background: rgba(30, 30, 30, 0.8);
                    border-radius: 4px;
                    border: 1px solid rgba(100, 100, 100, 0.5);
                    transition: all 0.3s;
                }

                .role-card:hover .hub-cell {
                    border-color: #f97316;
                    background: rgba(249, 115, 22, 0.2);
                }

                .hub-center {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                }

                .hub-icon {
                    width: 36px;
                    height: 36px;
                    color: white;
                    transition: color 0.3s;
                }

                .role-card:hover .hub-icon {
                    color: #f97316;
                }

                /* Card Title */
                .card-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 1rem 0;
                    transition: color 0.3s;
                }

                .role-card:hover .card-title {
                    color: #f97316;
                }

                .title-divider {
                    height: 2px;
                    width: 40px;
                    background: rgba(255, 255, 255, 0.2);
                    margin-bottom: 1.25rem;
                    transition: background 0.3s;
                }

                .role-card:hover .title-divider {
                    background: rgba(249, 115, 22, 0.6);
                }

                /* Card Description */
                .card-description {
                    color: #9ca3af;
                    font-size: 0.9rem;
                    line-height: 1.6;
                    max-width: 280px;
                    margin: 0 0 1.5rem 0;
                }

                /* Features List */
                .features-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 1.5rem 0;
                    text-align: left;
                    width: 100%;
                    max-width: 240px;
                }

                .features-list li {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: #6b7280;
                    padding: 0.5rem 0;
                    transition: color 0.3s;
                }

                .role-card:hover .features-list li {
                    color: #d1d5db;
                }

                .check-icon {
                    color: #f97316;
                    font-weight: bold;
                }

                /* Card Action */
                .card-action {
                    width: 100%;
                    margin-top: auto;
                }

                .action-btn {
                    width: 100%;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white;
                    font-family: monospace;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.3s;
                }

                .peer-btn:hover {
                    background: #f97316;
                    border-color: #f97316;
                    box-shadow: 0 10px 30px -10px rgba(249, 115, 22, 0.6);
                }

                .coord-btn:hover {
                    background: white;
                    color: #0a0a0a;
                    border-color: white;
                }

                .btn-arrow {
                    font-size: 1rem;
                    transition: transform 0.3s;
                }

                .action-btn:hover .btn-arrow {
                    transform: translateX(4px);
                }

                /* Network Status */
                .network-status {
                    margin-top: 3rem;
                    text-align: center;
                    opacity: 0.7;
                }

                .network-status p {
                    font-size: 0.75rem;
                    color: #6b7280;
                    font-family: monospace;
                    letter-spacing: 0.05em;
                    margin: 0;
                }

                .status-online {
                    color: #10b981;
                }
            `}</style>
        </div>
    );
};