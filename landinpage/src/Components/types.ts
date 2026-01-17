// types.ts - Centralized type definitions

export type UserRole = 'peer' | 'trainer';

export interface User {
    email: string;
    username: string;
}

export interface TrainingResult {
    epoch: number;
    loss: number;
    accuracy: number;
}

export interface Peer {
    uid: string;
    status: string;
    results: TrainingResult[];
    hyperparameters?: HyperParameters;
}

export interface Session {
    _id: string;
    owner_user_id: string;
    num_peers: number;
    status: string;
    created_at: string;
    peers: Peer[];
}

export interface EpochResult {
    epoch: number;
    loss: number;
    accuracy: number;
    timestamp: string;
}

export interface HyperParameters {
    lr?: number;
    learning_rate?: number;
    batch_size: number;
    epochs: number;
}

export interface PeerData {
    hyperparameters: HyperParameters;
    epochs: EpochResult[];
}

export interface FullResultsResponse {
    session_id: string;
    status: string;
    peers: Record<string, PeerData>;
}

export interface DashboardProps {
    user: User | null;
    onLogout: () => void;
    userRole: UserRole | null;
    onChangeRole?: () => void;
}