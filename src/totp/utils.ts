import * as CryptoJS from 'crypto-js';
import {TOTPConfig, TOTPResult} from "../types";

export class TOTPGenerator {
    private config: Required<TOTPConfig>;

    constructor(config: TOTPConfig = {}) {
        this.config = {
            codeLength: config.codeLength || 8,
            intervalSeconds: config.intervalSeconds || 300, // 5 минут
            allowedDrift: config.allowedDrift || 1,
            secretSalt: config.secretSalt || 'totp_salt_2024'
        };
    }

    private getCurrentInterval(timestamp: number = Date.now()): number {
        return Math.floor(timestamp / 1000 / this.config.intervalSeconds);
    }

    private getIntervalStart(interval: number): number {
        return interval * this.config.intervalSeconds * 1000;
    }

    generateCode(uid: string, timestamp: number = Date.now()): TOTPResult {
        const interval = this.getCurrentInterval(timestamp);
        const intervalStart = this.getIntervalStart(interval);

        const data = `${uid}:${interval}:${this.config.secretSalt}`;

        const hash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);

        const code = hash.substring(0, this.config.codeLength).toUpperCase();

        return {
            code,
            timestamp,
            interval,
            expiresAt: intervalStart + (this.config.intervalSeconds * 1000)
        };
    }

    verifyCode(uid: string, code: string, timestamp: number = Date.now()): {
        valid: boolean;
        reason?: string;
        usedInterval?: number;
    } {
        const currentInterval = this.getCurrentInterval(timestamp);

        for (let drift = 0; drift <= this.config.allowedDrift; drift++) {
            const checkInterval = currentInterval - drift;
            const expectedCode = this.generateCodeForInterval(uid, checkInterval);

            if (expectedCode === code) {
                return {
                    valid: true,
                    usedInterval: checkInterval
                };
            }
        }

        return {
            valid: false,
            reason: 'Invalid code'
        };
    }

    private generateCodeForInterval(uid: string, interval: number): string {
        const data = `${uid}:${interval}:${this.config.secretSalt}`;
        const hash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
        return hash.substring(0, this.config.codeLength).toUpperCase();
    }

    getCodeStatus(uid: string, timestamp: number = Date.now()): {
        currentCode: string;
        nextCode: string;
        previousCode: string;
        expiresIn: number;
    } {
        const interval = this.getCurrentInterval(timestamp);
        const intervalStart = this.getIntervalStart(interval);

        return {
            currentCode: this.generateCodeForInterval(uid, interval),
            nextCode: this.generateCodeForInterval(uid, interval + 1),
            previousCode: this.generateCodeForInterval(uid, interval - 1),
            expiresIn: intervalStart - timestamp,
        };
    }
}
