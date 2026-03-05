export * from './totp';

export type OAuthProvider = 'google' | 'vk' | 'discord' | 'github' | 'max';
export type AccountType = 'free' | 'paid';
export type UserRole = 'user' | 'moderator' | 'admin';

export type SocialPlatform =
    | 'telegram'
    | 'whatsapp'
    | 'instagram'
    | 'youtube'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'github'
    | 'tiktok'
    | 'discord'
    | 'vk'
    | 'custom';

export type LinkTargetType = 'url' | 'card';

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: number;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
