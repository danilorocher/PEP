import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY');
    // Deriva uma chave exata de 32 bytes de forma determinística a partir do secret
    this.key = crypto.scryptSync(secret, 'salt', 32); 
  }

  encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(16); // Vetor de inicialização único por registro
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex'); // Garante que o dado não foi adulterado
    
    // Armazena: IV + AuthTag + Texto Criptografado
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Formato de dado criptografado inválido');

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}