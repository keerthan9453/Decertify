// PeerCard.tsx - Display individual peer training data

import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { PeerData } from './types';

interface PeerCardProps {
    peerId: string;
    peer: PeerData;
    index: number;
    color: string;
    status: string;
}

export const PeerCard: React.FC<PeerCardProps> = ({
    peerId,
    peer,
    index,
    color,
    status
}) => {
    const latestEpoch = peer.epochs[peer.epochs.length - 1];
    const lr = peer.hyperparameters.lr || peer.hyperparameters.learning_rate || 0;

    return (
        <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h4 style={{
                    color: color,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`
                    }} />
                    Peer {index + 1}
                </h4>
                <span className={`status-badge ${peer.epochs.length > 0 ? 'status-training' : 'status-offline'
                    }`}>
                    {peer.epochs.length > 0 ? 'TRAINING' : 'WAITING'}
                </span>
            </div>

            <div className="session-id" style={{
                marginBottom: '0.5rem',
                fontSize: '0.75rem'
            }}>
                UID: {peerId}
            </div>

            <div style={{
                background: 'rgba(249,115,22,0.05)',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid rgba(249,115,22,0.1)'
            }}>
                <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--muted)',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <span>LR: <strong style={{ color: '#fff' }}>{lr}</strong></span>
                    <span>Batch: <strong style={{ color: '#fff' }}>{peer.hyperparameters.batch_size}</strong></span>
                    <span>Epochs: <strong style={{ color: '#fff' }}>{peer.hyperparameters.epochs}</strong></span>
                </div>
            </div>

            {peer.epochs.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        padding: '0.75rem'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                            marginBottom: '0.5rem'
                        }}>
                            Loss
                        </div>
                        <ResponsiveContainer width="100%" height={80}>
                            <AreaChart data={peer.epochs}>
                                <defs>
                                    <linearGradient id={`lossGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="loss"
                                    stroke={color}
                                    fill={`url(#lossGrad-${index})`}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
                            {latestEpoch?.loss.toFixed(4)}
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        padding: '0.75rem'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                            marginBottom: '0.5rem'
                        }}>
                            Accuracy
                        </div>
                        <ResponsiveContainer width="100%" height={80}>
                            <AreaChart data={peer.epochs}>
                                <defs>
                                    <linearGradient id={`accGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="accuracy"
                                    stroke="#10b981"
                                    fill={`url(#accGrad-${index})`}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                            {latestEpoch ? `${(latestEpoch.accuracy * 100).toFixed(1)}%` : '--'}
                        </div>
                    </div>
                </div>
            )}

            {!latestEpoch && (
                <div style={{
                    color: 'var(--muted)',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    padding: '1rem'
                }}>
                    {status === 'RUNNING' ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}>
                            <div className="spinner" style={{ width: '16px', height: '16px' }} />
                            Waiting for training data...
                        </div>
                    ) : 'No training data'}
                </div>
            )}
        </div>
    );
};