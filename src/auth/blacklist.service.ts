import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBlacklist } from '../auth/entities/token-blacklist.entity';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly blacklistRepo: Repository<TokenBlacklist>,
  ) {}

  async add(jti: string, studentId: string, expiresAt: Date): Promise<void> {
    const exists = await this.blacklistRepo.findOne({ where: { jti } });
    if (exists) return;
    await this.blacklistRepo.save(
      this.blacklistRepo.create({ jti, studentId, expiresAt }),
    );
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const record = await this.blacklistRepo.findOne({ where: { jti } });
    return !!record;
  }
}
