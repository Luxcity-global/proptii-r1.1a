import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppError } from '../middleware/error-handling';
import { validateEnv } from '../config/environment';

interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    ivLength: number;
}

export class EncryptionService {
    private readonly config: EncryptionConfig;
    private readonly encryptionKey: Buffer;

    constructor() {
        const envConfig = validateEnv();
        this.config = {
            algorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 16
        };

        // Get encryption key from environment or generate a new one
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            throw new AppError(500, 'Encryption key not found in environment', 'ENCRYPTION_KEY_MISSING');
        }
        this.encryptionKey = Buffer.from(key, 'base64');
    }

    async encrypt(data: any): Promise<string> {
        try {
            const iv = randomBytes(this.config.ivLength);
            const cipher = createCipheriv(this.config.algorithm, this.encryptionKey, iv);

            const jsonData = JSON.stringify(data);
            const encrypted = Buffer.concat([
                cipher.update(jsonData, 'utf8'),
                cipher.final()
            ]);

            const authTag = cipher.getAuthTag();

            // Combine IV, encrypted data, and auth tag
            const result = Buffer.concat([
                iv,
                authTag,
                encrypted
            ]);

            return result.toString('base64');
        } catch (error) {
            throw new AppError(500, 'Encryption failed', 'ENCRYPTION_ERROR');
        }
    }

    async decrypt(encryptedData: string): Promise<any> {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');

            // Extract IV, auth tag, and encrypted data
            const iv = buffer.slice(0, this.config.ivLength);
            const authTag = buffer.slice(this.config.ivLength, this.config.ivLength + 16);
            const encrypted = buffer.slice(this.config.ivLength + 16);

            const decipher = createDecipheriv(this.config.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);

            return JSON.parse(decrypted.toString('utf8'));
        } catch (error) {
            throw new AppError(500, 'Decryption failed', 'DECRYPTION_ERROR');
        }
    }

    async encryptField(value: string): Promise<string> {
        return this.encrypt(value);
    }

    async decryptField(encryptedValue: string): Promise<string> {
        return this.decrypt(encryptedValue);
    }

    async encryptObject(obj: Record<string, any>, fieldsToEncrypt: string[]): Promise<Record<string, any>> {
        const result = { ...obj };
        for (const field of fieldsToEncrypt) {
            if (field in result) {
                result[field] = await this.encrypt(result[field]);
            }
        }
        return result;
    }

    async decryptObject(obj: Record<string, any>, fieldsToDecrypt: string[]): Promise<Record<string, any>> {
        const result = { ...obj };
        for (const field of fieldsToDecrypt) {
            if (field in result) {
                result[field] = await this.decrypt(result[field]);
            }
        }
        return result;
    }

    // Decorator for encrypting method results
    static encryptResult(fieldsToEncrypt: string[]) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            const encryptionService = new EncryptionService();

            descriptor.value = async function (...args: any[]) {
                const result = await originalMethod.apply(this, args);
                return encryptionService.encryptObject(result, fieldsToEncrypt);
            };

            return descriptor;
        };
    }

    // Decorator for decrypting method parameters
    static decryptParams(fieldsToDecrypt: string[]) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            const encryptionService = new EncryptionService();

            descriptor.value = async function (...args: any[]) {
                const decryptedArgs = await Promise.all(
                    args.map(arg => 
                        typeof arg === 'object' && arg !== null
                            ? encryptionService.decryptObject(arg, fieldsToDecrypt)
                            : arg
                    )
                );
                return originalMethod.apply(this, decryptedArgs);
            };

            return descriptor;
        };
    }
} 