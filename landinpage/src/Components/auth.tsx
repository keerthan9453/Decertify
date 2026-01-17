import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

const API_BASE = 'http://localhost:8000';

interface AuthPageProps {
    onAuth: (authData: any) => void;
    onNavigate: (view: 'landing' | 'auth' | 'dashboard') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuth, onNavigate }) => {
    const [authTab, setAuthTab] = useState('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (cardRef.current) {
            gsap.from(cardRef.current, {
                opacity: 10,
                scale: 0.9,
                y: 30,
                duration: 0.6,
                ease: 'power3.out'
            });
        }
    }, []);

    const apiCall = async (endpoint: string, method = 'GET', body: any = null) => {
        const headers: any = {
            'Content-Type': 'application/json'
        };

        const options: RequestInit = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);

            if (response.status === 401) {
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Request failed');
            }

            return response.json();
        } catch (error: any) {
            console.error('API Error:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(e.currentTarget);
        const data: any = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        if (authTab === 'signup') {
            data.username = formData.get('username');
            data.phone_number = formData.get('phone_number') || '';
        }

        try {
            const endpoint = `/auth/${authTab}`;
            const result = await apiCall(endpoint, 'POST', data);

            if (authTab === 'signup') {
                setSuccess('Account created! Please sign in.');
                setAuthTab('signin');
            } else {
                localStorage.setItem('token', result.access_token);
                localStorage.setItem('user', JSON.stringify({
                    email: data.email,
                    username: result.username
                }));

                console.log('Token stored:', result.access_token);
                console.log('Token type:', result.token_type);

                onAuth(result);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-root">
            {/* Back Button */}
            <button
                className="back-btn"
                onClick={() => onNavigate('landing')}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>

            <div className="fixed-card" ref={cardRef}>
                <div className="header">
                    <div className="logo">
                        <div className="logo-inner">⚡</div>
                    </div>
                    <h1 className="brand">HYPERTUNE</h1>
                    <p className="subtitle">Distributed ML Training</p>
                </div>

                <div className="card">
                    <div className="tabs">
                        <button
                            className={`tab ${authTab === 'signin' ? 'active' : ''}`}
                            onClick={() => {
                                setAuthTab('signin');
                                setError(null);
                                setSuccess(null);
                            }}
                        >
                            Sign In
                            {authTab === 'signin' && <div className="tab-underline" />}
                        </button>
                        <button
                            className={`tab ${authTab === 'signup' ? 'active' : ''}`}
                            onClick={() => {
                                setAuthTab('signup');
                                setError(null);
                                setSuccess(null);
                            }}
                        >
                            Sign Up
                            {authTab === 'signup' && <div className="tab-underline" />}
                        </button>
                    </div>

                    <div className="card-body">
                        {error && <div className="error-msg">{error}</div>}
                        {success && <div className="success-msg">{success}</div>}

                        <form className="form" onSubmit={handleSubmit}>
                            {authTab === 'signup' && (
                                <>
                                    <div className="field">
                                        <label className="label">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            className="input"
                                            placeholder="johndoe"
                                            required
                                        />
                                    </div>

                                    <div className="field">
                                        <label className="label">Phone Number (Optional)</label>
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            className="input"
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="field">
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="input"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="label">Password</label>
                                <div className="password-row">
                                    <input
                                        type="password"
                                        name="password"
                                        className="input"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="actions">
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? (
                                        <div className="spinner" />
                                    ) : (
                                        authTab === 'signin' ? 'Sign In →' : 'Create Account →'
                                    )}
                                    <div className="btn-overlay" />
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="card-footer">
                        <div className="meta">
                            <span>{authTab === 'signin' ? "Don't have an account?" : "Already have an account?"}</span>
                            <button
                                onClick={() => {
                                    setAuthTab(authTab === 'signin' ? 'signup' : 'signin');
                                    setError(null);
                                    setSuccess(null);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginLeft: '8px' }}
                            >
                                {authTab === 'signin' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};