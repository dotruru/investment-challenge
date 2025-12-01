import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);

    this.client.on('connect', () => {
      console.log('📡 Redis client connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
    await this.subscriber?.quit();
    await this.publisher?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  // Live State Methods
  async setLiveState(eventId: string, state: Record<string, any>): Promise<void> {
    const key = `live:event:${eventId}:state`;
    await this.client.hmset(key, this.flattenObject(state));
  }

  async getLiveState(eventId: string): Promise<Record<string, any>> {
    const key = `live:event:${eventId}:state`;
    return await this.client.hgetall(key);
  }

  async updateLiveStateField(eventId: string, field: string, value: string): Promise<void> {
    const key = `live:event:${eventId}:state`;
    await this.client.hset(key, field, value);
  }

  // Timer Methods
  async setTimerState(eventId: string, timerState: Record<string, any>): Promise<void> {
    const key = `live:event:${eventId}:timer`;
    await this.client.hmset(key, this.flattenObject(timerState));
  }

  async getTimerState(eventId: string): Promise<Record<string, any>> {
    const key = `live:event:${eventId}:timer`;
    return await this.client.hgetall(key);
  }

  // Jury Scoring Status
  async addJuryScore(eventId: string, teamId: string, juryId: string): Promise<void> {
    const key = `live:event:${eventId}:scores:team:${teamId}`;
    await this.client.sadd(key, juryId);
  }

  async getJuryScoresForTeam(eventId: string, teamId: string): Promise<string[]> {
    const key = `live:event:${eventId}:scores:team:${teamId}`;
    return await this.client.smembers(key);
  }

  // Pub/Sub Methods
  async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(pattern: string, callback: (channel: string, message: string) => void): Promise<void> {
    await this.subscriber.psubscribe(pattern);
    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      callback(channel, message);
    });
  }

  // Utility Methods
  private flattenObject(obj: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      result[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
    return result;
  }
}

