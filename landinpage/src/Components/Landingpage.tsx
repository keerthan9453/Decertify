import React, { useEffect, useRef, useState } from 'react';

interface LandingPageProps {
    onNavigate: (view: 'landing' | 'auth' | 'dashboard') => void;
}


export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
    const heroRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Simple fade-in animation on mount
        if (heroRef.current) {
            heroRef.current.style.opacity = '0';
            setTimeout(() => {
                if (heroRef.current) {
                    heroRef.current.style.transition = 'opacity 0.8s ease-out';
                    heroRef.current.style.opacity = '1';
                }
            }, 100);
        }

        // Mouse move handler for glow effect
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="page-root">
            {/* Mouse Glow Effect */}
            <div
                style={{
                    position: 'fixed',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 85, 0, 0.15), transparent 70%)',
                    pointerEvents: 'none',
                    transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                    transition: 'transform 0.2s ease-out',
                    zIndex: 1,
                    filter: 'blur(40px)',
                }}
            />

            {/* Navigation Bar */}
            <nav style={{
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 50,
                background: 'rgba(15, 15, 15, 0.4)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0 16px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '80px'
                    }}>
                        {/* Logo */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    fontSize: '30px',
                                    color: 'var(--primary)',
                                    position: 'relative',
                                    zIndex: 10
                                }}>⚡</span>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'var(--primary)',
                                    filter: 'blur(12px)',
                                    opacity: 0.5
                                }}></div>
                            </div>
                            <span style={{
                                fontWeight: 700,
                                fontSize: '20px',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: 'white'
                            }}>
                                HyperTune
                            </span>
                        </div>

                        {/* Navigation Links */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '32px',
                            fontSize: '14px',
                            fontWeight: 500
                        }}>
                            <a
                                href="#"
                                style={{
                                    color: '#9ca3af',
                                    textDecoration: 'none',
                                    transition: 'color 0.3s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                Manifesto
                            </a>
                            <a
                                href="#"
                                style={{
                                    color: '#9ca3af',
                                    textDecoration: 'none',
                                    transition: 'color 0.3s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                Technology
                            </a>
                            <button
                                onClick={() => onNavigate('auth')}
                                style={{
                                    color: '#9ca3af',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    transition: 'color 0.3s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                Log In
                            </button>
                            <a
                                href="#"
                                style={{
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    padding: '8px 20px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s',
                                    background: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Specs
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Background Effects */}
            <div className="grid-pattern-overlay"></div>
            <div className="ambient-glow-top"></div>
            <div className="ambient-glow-bottom"></div>
            <div className="scanline"></div>

            {/* Main Landing Section */}
            <section className="landing" ref={heroRef}>
                <div className="tech-grid-overlay" style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 10, maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Hero Title */}
                    <h1 className="hero-title" style={{ textAlign: 'center' }}>
                        A New Era of<br />
                        <span className="orange-gradient-text text-glow-orange" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 85, 0, 0.3))' }}>
                            Model Training
                        </span>
                    </h1>

                    {/* Hero Subtitle */}
                    <p className="hero-subtitle" style={{ textAlign: 'center' }}>
                        The world's most advanced distributed ML clinic. Train faster, scale infinitely,
                        and reclaim your compute sovereignty in the post-cloud era.
                    </p>

                    {/* CTA Button */}
                    <div style={{ marginBottom: '64px', position: 'relative', zIndex: 20 }}>
                        <button
                            className="cta-btn cta-primary"
                            onClick={() => onNavigate('auth')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center',
                                fontSize: '16px',
                                padding: '18px 48px'
                            }}
                        >
                            Let's Begin
                            <span style={{ fontSize: '16px' }}>→</span>
                        </button>
                    </div>

                    {/* Hero Image */}
                    <div className="hero-image-container">
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '120%',
                            height: '120%',
                            background: 'radial-gradient(circle, rgba(255, 85, 0, 0.3), transparent)',
                            filter: 'blur(80px)',
                            zIndex: -1
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '80%',
                            height: '80%',
                            background: 'rgba(255, 85, 0, 0.2)',
                            filter: 'blur(100px)',
                            animation: 'pulse-slow 4s ease-in-out infinite',
                            zIndex: -1
                        }}></div>

                        <div className="hero-image-wrapper">
                            <div className="hero-image-aspect">
                                {/* Primary Image */}
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGkwrrRFTJGx4C2k5cFcBmRGaam_hD74ObnvmpOdSTXQ75bd54s8UacvriUnvDijxvNIPTiUNpCcPZLbSb9WGfdYWgpxcBKJjMRHyJijYWKTz1wXncr_TKnxZYObrtwTg8VKkd0ob2Yv1EJwCsmHKtBaxrTS3LVT5PFFO7P5ZymbhcgoiizIIScX20TD4Fhs6NakGCTt4ztod7OxOH4HQnxrRiKzeS3WF_Kqe9b0nCucs9jwti0Wm1nCg5g79gS7CQ3_bilElg3Ys"
                                    alt="Abstract amber silhouette of technology"
                                    className="hero-image"
                                    style={{
                                        mixBlendMode: 'screen',
                                        opacity: 0.8,
                                        transform: 'scale(1.1)'
                                    }}
                                />
                                {/* Overlay Image */}
                                <img
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDY0HkeobB_g7Xjp-Mo6cp9w_X8ApV-5R_0EofqN3ZvG78okTi271yTqeEK3a7GlrLclnmF0Pz6ZSEU6w__NjsqEKs4gBL5s544uB0j2THYLgsa0j5j-g4IDxTvgrt0lrYCDP9UEk9ESyjNGv8nPNmlLSjlj_t3MOolvSbo10cbW4EVLEj4QE9L9iV5h8J8-1R0FBUXZjbbVWv4PESTi_ee8-eEkujXwP0CA3tFWNzVq_xHnBMg613MCgDGak5jU634G8BlbRkaxA"
                                    alt="Server room hardware detail"
                                    className="hero-image"
                                    style={{
                                        opacity: 0.4,
                                        mixBlendMode: 'overlay'
                                    }}
                                />
                                {/* Gradient Overlays */}
                                <div className="hero-image-overlay"></div>

                                {/* Stats Panel */}
                                <div className="hero-image-stats">
                                    <div className="hero-image-badge" style={{ display: 'none' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            fontSize: '12px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            color: 'rgba(255, 136, 0, 0.8)'
                                        }}>
                                            <span style={{
                                                border: '1px solid rgba(255, 85, 0, 0.3)',
                                                padding: '4px 8px',
                                                background: 'rgba(0, 0, 0, 0.4)',
                                                borderRadius: '4px'
                                            }}>
                                                SYS_READY
                                            </span>
                                            <span style={{ animation: 'pulse 2s ease-in-out infinite' }}>● LIVE FEED</span>
                                        </div>
                                    </div>

                                    <div className="hero-stats-panel">
                                        <div className="stats-panel-header">
                                            <span className="stats-label">Optimization</span>
                                            <span className="stats-value">98.4%</span>
                                        </div>
                                        <div className="stats-progress-bar">
                                            <div className="stats-progress-fill"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trusted Companies */}
                    <div className="trusted-companies">
                        <div className="company-logos">
                            <div className="company-logo-placeholder"></div>
                            <div className="company-logo-placeholder"></div>
                            <div className="company-logo-placeholder"></div>
                            <div className="company-logo-placeholder"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-value">10x</div>
                        <div className="stat-label">Training Speed</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">Zero</div>
                        <div className="stat-label">Infra Overhead</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">99.9%</div>
                        <div className="stat-label">Uptime SLA</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">Local</div>
                        <div className="stat-label">Privacy First</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{
                padding: '96px 20px',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--background-dark)'
            }}>
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '25%',
                    width: '500px',
                    height: '500px',
                    background: 'rgba(255, 85, 0, 0.05)',
                    borderRadius: '50%',
                    filter: 'blur(120px)',
                    pointerEvents: 'none'
                }}></div>

                <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    {/* Section Header */}
                    <div style={{
                        marginBottom: '80px',
                        textAlign: 'center',
                        maxWidth: '768px',
                        margin: '0 auto 80px'
                    }}>
                        <span style={{
                            color: 'var(--primary)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '12px',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginBottom: '16px',
                            display: 'block'
                        }}>
                            System Architecture
                        </span>
                        <h2 style={{
                            fontSize: 'clamp(32px, 5vw, 48px)',
                            fontWeight: 700,
                            color: 'white',
                            marginBottom: '24px',
                            lineHeight: 1.2
                        }}>
                            Designed for the <span style={{
                                fontStyle: 'italic',
                                background: 'linear-gradient(to right, var(--primary), var(--primary-light))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>Post-Cloud</span> Era.
                        </h2>
                        <p style={{
                            color: '#9ca3af',
                            fontSize: '18px',
                            fontWeight: 300
                        }}>
                            HyperTune moves the heavy lifting to the edge. Our distributed kernel manages
                            resources dynamically, ensuring your models train efficiently without the massive cloud bill.
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="features">
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3 className="feature-title">Lightning Fast</h3>
                            <p className="feature-desc">
                                Distribute training across multiple peers for faster convergence and real-time optimization.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3 className="feature-title">Secure & Private</h3>
                            <p className="feature-desc">
                                Your data stays encrypted with enterprise-grade security. End-to-end encryption enabled by default.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3 className="feature-title">Real-time Analytics</h3>
                            <p className="feature-desc">
                                Monitor training progress and results in real-time with granular telemetry and visual compute graphs.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA Section */}
            <section style={{
                padding: '80px 20px',
                position: 'relative',
                background: 'rgba(10, 10, 10, 0.5)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <h2 style={{
                        fontSize: 'clamp(32px, 5vw, 48px)',
                        fontWeight: 700,
                        color: 'white',
                        marginBottom: '16px',
                        lineHeight: 1.2
                    }}>
                        Ready to scale?
                    </h2>
                    <p style={{
                        color: '#9ca3af',
                        fontSize: '18px',
                        maxWidth: '600px',
                        marginBottom: '40px',
                        fontWeight: 300
                    }}>
                        Join thousands of engineers building the future on HyperTune. The waitlist is moving fast.
                    </p>

                    <div className="cta-group">
                        <button
                            className="cta-btn cta-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                        >
                            Join Waitlist
                            <span style={{ fontSize: '14px' }}>→</span>
                        </button>
                        <button
                            className="cta-btn cta-secondary"
                        >
                            Read Manifesto
                        </button>
                    </div>
                </div>

                {/* Decorative Glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(255, 85, 0, 0.1), transparent 70%)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                    zIndex: 0
                }}></div>
            </section>

            {/* Footer Glow */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '256px',
                background: 'linear-gradient(to top, rgba(255, 85, 0, 0.1), transparent)',
                pointerEvents: 'none',
                zIndex: 0
            }}></div>
        </div>
    );
};