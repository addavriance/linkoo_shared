import { TOTPGenerator } from './utils';
import {TOTPConfig, ValidationRequest, ValidationResult} from "../types";

export class ServerTOTPValidator {
    private generator: TOTPGenerator;
    private usedCodes: Map<string, Set<string>> = new Map();
    private maxCodeAge: number;

    constructor(config?: TOTPConfig & { maxCodeAge?: number }) {
        this.generator = new TOTPGenerator(config);
        this.maxCodeAge = config?.maxCodeAge || 300000; // 5 минут по умолчанию

        setInterval(() => this.cleanupUsedCodes(), 600000);
    }

    validateCode(request: ValidationRequest): ValidationResult {
        const {
            uid,
            code,
            timestamp = Date.now()
        } = request;

        if (!code || code.length < 6) {
            return {
                isValid: false,
                reason: 'Invalid code format',
                serverTime: Date.now()
            };
        }

        if (timestamp && Date.now() - timestamp > this.maxCodeAge) {
            return {
                isValid: false,
                reason: 'Request too old',
                serverTime: Date.now()
            };
        }

        // if (this.isCodeUsed(uid, code)) {
        //     return {
        //         isValid: false,
        //         reason: 'Code already used',
        //         serverTime: Date.now()
        //     };
        // }

        const verification = this.generator.verifyCode(uid, code, timestamp);

        if (!verification.valid) {
            return {
                isValid: false,
                reason: verification.reason || 'Invalid code',
                serverTime: Date.now()
            };
        }

        this.markCodeAsUsed(uid, code, verification.usedInterval!);

        return {
            isValid: true,
            userId: uid,
            serverTime: Date.now()
        };
    }

    validateMultipleCodes(requests: ValidationRequest[]): Map<string, ValidationResult> {
        const results = new Map<string, ValidationResult>();

        for (const request of requests) {
            results.set(request.uid, this.validateCode(request));
        }

        return results;
    }

    private isCodeUsed(uid: string, code: string): boolean {
        const userCodes = this.usedCodes.get(uid);
        return userCodes ? userCodes.has(code) : false;
    }

    private markCodeAsUsed(uid: string, code: string, interval: number): void {
        if (!this.usedCodes.has(uid)) {
            this.usedCodes.set(uid, new Set());
        }

        const userCodes = this.usedCodes.get(uid)!;
        userCodes.add(code);

        const intervalKey = `interval_${interval}`;
        userCodes.add(intervalKey);
    }

    private cleanupUsedCodes(): void {
        const currentInterval = Math.floor(Date.now() / 1000 / 300); // 5-min intervals
        const maxAgeIntervals = 10; // Храним коды за последние 10 интервалов (50 минут)

        for (const [uid, codes] of this.usedCodes.entries()) {
            const intervalKeys = Array.from(codes)
                .filter(key => key.startsWith('interval_'))
                .map(key => parseInt(key.replace('interval_', '')));

            for (const interval of intervalKeys) {
                if (currentInterval - interval > maxAgeIntervals) {
                    codes.delete(`interval_${interval}`);
                    for (const code of Array.from(codes)) {
                        if (!code.startsWith('interval_')) {
                            codes.delete(code);
                        }
                    }
                }
            }

            if (codes.size === 0) {
                this.usedCodes.delete(uid);
            }
        }
    }
}
