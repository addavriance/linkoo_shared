export interface TOTPConfig {
    codeLength?: number;
    intervalSeconds?: number;
    allowedDrift?: number;
    secretSalt?: string;
}

export interface TOTPResult {
    code: string;
    timestamp: number;
    interval: number;
    expiresAt: number;
}

export interface ValidationRequest {
    uid: string;
    code: string;
    timestamp?: number;
}

export interface ValidationResult {
    isValid: boolean;
    userId?: string;
    reason?: string;
    serverTime?: number;
}
