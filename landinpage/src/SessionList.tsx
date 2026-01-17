// SessionList.tsx - Display list of sessions

import React from 'react';
import type { Session, UserRole } from './Components/types';

interface SessionListProps {
    ownedSessions: Session[];
    joinedSessions: Session[];
    userRole: UserRole | null;
    onViewSession: (session: Session) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
    ownedSessions,
    joinedSessions,
    userRole,
    onViewSession
}) => {
    const isPeer = userRole === 'peer';
    const isTrainer = userRole === 'trainer';

    if (ownedSessions.length === 0 && joinedSessions.length === 0) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)' }}>
                    {isPeer
                        ? 'No sessions joined yet. Wait for trainers to create sessions you can join.'
                        : 'No sessions yet. Create your first training session!'}
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Peer Mode Info Banner */}
            {isPeer && (
                <div className="card" style={{
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    background: 'rgba(249, 115, 22, 0.05)',
                    border: '1px solid rgba(249, 115, 22, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(249, 115, 22, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="1.5"
                            >
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
                                <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                            </svg>
                        </div>
                        <div>
                            <h3 style={{
                                color: '#f97316',
                                marginBottom: '0.25rem',
                                fontSize: '1rem'
                            }}>
                                Peer Mode Active
                            </h3>
                            <p style={{
                                color: 'var(--muted)',
                                fontSize: '0.875rem',
                                margin: 0
                            }}>
                                You're contributing compute power to the network. Join sessions to participate in distributed training.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Owned Sessions (Trainers) */}
            {isTrainer && ownedSessions.length > 0 && (
                <>
                    <h3 style={{
                        fontSize: '1.2rem',
                        marginBottom: '1rem',
                        color: 'var(--accent)'
                    }}>
                        Owned Sessions
                    </h3>
                    <div className="session-grid" style={{ marginBottom: '2rem' }}>
                        {ownedSessions.map((session) => (
                            <SessionCard
                                key={session._id}
                                session={session}
                                onClick={() => onViewSession(session)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Joined Sessions */}
            {joinedSessions.length > 0 && (
                <>
                    <h3 style={{
                        fontSize: '1.2rem',
                        marginBottom: '1rem',
                        color: 'var(--accent)'
                    }}>
                        {isPeer ? 'Active Sessions' : 'Joined Sessions'}
                    </h3>
                    <div className="session-grid">
                        {joinedSessions.map((session) => (
                            <SessionCard
                                key={session._id}
                                session={session}
                                onClick={() => onViewSession(session)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Previously Owned Sessions (Peers) */}
            {isPeer && ownedSessions.length > 0 && (
                <>
                    <h3 style={{
                        fontSize: '1.2rem',
                        marginBottom: '1rem',
                        color: 'var(--accent)',
                        marginTop: '2rem'
                    }}>
                        Previously Owned Sessions
                    </h3>
                    <div className="session-grid">
                        {ownedSessions.map((session) => (
                            <SessionCard
                                key={session._id}
                                session={session}
                                onClick={() => onViewSession(session)}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
};

// Session Card Component
interface SessionCardProps {
    session: Session;
    onClick: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
    const getStatusClass = (status: string) => {
        if (status === 'RUNNING') return 'status-training';
        if (status === 'COMPLETED') return 'status-online';
        return 'status-offline';
    };

    return (
        <div
            className="session-card"
            style={{ cursor: 'pointer' }}
            onClick={onClick}
        >
            <div className="session-id">
                ID: {session._id.slice(-8)}
            </div>
            <div className="session-info">
                <strong>Peers:</strong> {session.num_peers}
            </div>
            <div className="session-info">
                <strong>Created:</strong> {new Date(session.created_at).toLocaleString()}
            </div>
            <span className={`status-badge ${getStatusClass(session.status)}`}>
                {session.status}
            </span>
        </div>
    );
};