import * as bcrypt from 'bcryptjs';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashea con argon2id y verifica correctamente', async () => {
    const hash = await service.hash('Secret123!');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await service.verify(hash, 'Secret123!')).toBe(true);
    expect(await service.verify(hash, 'incorrecta')).toBe(false);
    expect(service.needsRehash(hash)).toBe(false);
  });

  it('verifica hashes heredados de bcrypt y marca que necesitan rehash', async () => {
    const legacy = await bcrypt.hash('Secret123!', 10);
    expect(await service.verify(legacy, 'Secret123!')).toBe(true);
    expect(await service.verify(legacy, 'incorrecta')).toBe(false);
    expect(service.needsRehash(legacy)).toBe(true);
  });
});
