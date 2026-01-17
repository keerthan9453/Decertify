// SessionForm.tsx - Form for creating new training sessions

import React, { useState } from 'react';
import type { HyperParameters } from './Components/types';

interface SessionFormProps {
    onSubmit: (formData: FormData) => Promise<void>;
    loading: boolean;
}

const colors = ['#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export const SessionForm: React.FC<SessionFormProps> = ({ onSubmit, loading }) => {
    const [numPeers, setNumPeers] = useState(2);
    const [file, setFile] = useState<File | null>(null);
    const [hyperparameters, setHyperparameters] = useState<HyperParameters[]>([
        { learning_rate: 0.001, batch_size: 32, epochs: 10 },
        { learning_rate: 0.01, batch_size: 64, epochs: 10 }
    ]);

    const handleNumPeersChange = (newNum: number) => {
        if (newNum < 1 || newNum > 10 || !Number.isInteger(newNum)) return;
        setNumPeers(newNum);
        const newHyperparams: HyperParameters[] = [];
        for (let i = 0; i < newNum; i++) {
            newHyperparams.push({
                learning_rate: 0.001,
                batch_size: 32,
                epochs: 10
            });
        }
        setHyperparameters(newHyperparams);
    };

    const updateHyperparam = (index: number, key: string, value: any) => {
        const newParams = [...hyperparameters];
        newParams[index] = { ...newParams[index], [key]: value };
        setHyperparameters(newParams);
    };

    const handleSubmit = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('num_peers', numPeers.toString());

        const hyperparamsForBackend = hyperparameters.map(param => ({
            lr: param.learning_rate,
            batch_size: param.batch_size,
            epochs: param.epochs
        }));

        formData.append('hyperparameters', JSON.stringify(hyperparamsForBackend));
        await onSubmit(formData);
    };

    return (
        <div className="new-session-form">
            <h2 className="section-title">Start Training Session</h2>

            <div className="field">
                <label className="label">Number of Peers</label>
                <input
                    type="number"
                    value={numPeers}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) handleNumPeersChange(val);
                    }}
                    min="1"
                    max="10"
                    className="input"
                />
            </div>

            <div className="field">
                <label className="label">Dataset (CSV)</label>
                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="input file-input"
                />
            </div>

            <div className="field">
                <label className="label">Hyperparameters per Peer</label>
                {hyperparameters.map((params, idx) => (
                    <div
                        key={idx}
                        className="card"
                        style={{ padding: '1rem', marginBottom: '1rem' }}
                    >
                        <h4 style={{
                            marginBottom: '0.75rem',
                            color: colors[idx % colors.length],
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: colors[idx % colors.length]
                            }} />
                            Peer {idx + 1}
                        </h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '1rem'
                        }}>
                            <div className="field">
                                <label className="label">Learning Rate</label>
                                <input
                                    type="number"
                                    value={params.learning_rate}
                                    onChange={(e) => updateHyperparam(
                                        idx,
                                        'learning_rate',
                                        parseFloat(e.target.value)
                                    )}
                                    step="0.001"
                                    className="input"
                                />
                            </div>
                            <div className="field">
                                <label className="label">Batch Size</label>
                                <input
                                    type="number"
                                    value={params.batch_size}
                                    onChange={(e) => updateHyperparam(
                                        idx,
                                        'batch_size',
                                        parseInt(e.target.value)
                                    )}
                                    className="input"
                                />
                            </div>
                            <div className="field">
                                <label className="label">Epochs</label>
                                <input
                                    type="number"
                                    value={params.epochs}
                                    onChange={(e) => updateHyperparam(
                                        idx,
                                        'epochs',
                                        parseInt(e.target.value)
                                    )}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="primary-btn"
            >
                {loading ? <div className="spinner" /> : 'Start Training'}
                <div className="btn-overlay" />
            </button>
        </div>
    );
};