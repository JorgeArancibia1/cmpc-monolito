import { Injectable } from '@nestjs/common';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import * as bcrypt from 'bcryptjs';

// Parámetros argon2id (baseline OWASP): 19 MiB de memoria, 2 iteraciones, paralelismo 1.
const ARGON2_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

/**
 * Hashing de contraseñas con **argon2id**. Verifica también hashes **heredados de bcrypt**
 * para permitir la migración progresiva (rehash-on-login).
 */
@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon2Hash(plain, ARGON2_OPTIONS);
  }

  async verify(storedHash: string, plain: string): Promise<boolean> {
    if (storedHash.startsWith('$argon2')) {
      try {
        return await argon2Verify(storedHash, plain);
      } catch {
        return false;
      }
    }
    // Hash heredado de bcrypt.
    return bcrypt.compare(plain, storedHash);
  }

  /** True si el hash debe regenerarse con el algoritmo actual (p. ej. un bcrypt heredado). */
  needsRehash(storedHash: string): boolean {
    return !storedHash.startsWith('$argon2');
  }
}
