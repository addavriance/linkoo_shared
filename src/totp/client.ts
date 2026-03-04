import { TOTPGenerator } from './utils';
import {TOTPConfig, TOTPResult} from "../types";

export class ClientTOTP {
    private generator: TOTPGenerator;
    private uid: string;
    private lastGeneratedCode?: string;
    private codeExpiryTimer?: number;

    constructor(uid: string, config?: TOTPConfig) {
        this.uid = uid;
        this.generator = new TOTPGenerator(config);
    }

    generateCurrentCode(): TOTPResult {
        const result = this.generator.generateCode(this.uid);
        this.lastGeneratedCode = result.code;

        if (this.codeExpiryTimer) {
            clearTimeout(this.codeExpiryTimer);
        }

        this.codeExpiryTimer = window.setTimeout(() => {
            this.lastGeneratedCode = undefined;
        }, this.generator['config'].intervalSeconds * 1000);

        return result;
    }

    async getCodeForRequest(): Promise<string> {
        if (this.lastGeneratedCode) {
            const status = this.generator.getCodeStatus(this.uid);
            if (status.currentCode === this.lastGeneratedCode) {
                return this.lastGeneratedCode;
            }
        }

        const result = this.generateCurrentCode();
        return result.code;
    }

    getRequestData(): {
        uid: string;
        code: string;
        timestamp: number;
    } {
        return {
            uid: this.uid,
            code: this.lastGeneratedCode || this.generateCurrentCode().code,
            timestamp: Date.now()
        };
    }

    destroy(): void {
        if (this.codeExpiryTimer) {
            clearTimeout(this.codeExpiryTimer);
        }
    }
}
