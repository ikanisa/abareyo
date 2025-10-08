import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type StorageAsset = {
  key: string;
  url: string | null;
  alt?: string | null;
  contentType?: string | null;
};

interface StorageConfig {
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBaseUrl?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private readonly config: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<StorageConfig>('storage') ?? {};
  }

  isConfigured() {
    return Boolean(this.config.bucket);
  }

  async putObject(params: { key: string; body: Buffer | Uint8Array | string; contentType?: string }) {
    const client = this.getClient();
    if (!client) {
      this.logger.warn('Skipping S3 upload – storage not configured');
      return { success: false } as const;
    }

    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );

    return { success: true } as const;
  }

  async deleteObject(key: string) {
    const client = this.getClient();
    if (!client) {
      this.logger.warn('Skipping S3 delete – storage not configured');
      return { success: false } as const;
    }

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );

    return { success: true } as const;
  }

  async getSignedUrl(key: string, expiresInSeconds = 900) {
    const client = this.getClient();
    if (!client) {
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  getPublicUrl(key: string | null | undefined) {
    if (!key || !this.config.bucket) {
      return null;
    }

    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    if (this.config.endpoint) {
      try {
        const endpoint = new URL(this.config.endpoint);
        const base = endpoint.toString().replace(/\/$/, '');
        if (base.includes(this.config.bucket)) {
          return `${base}/${key}`;
        }
        return `${base}/${this.config.bucket}/${key}`;
      } catch (error) {
        this.logger.warn(`Could not parse storage endpoint '${this.config.endpoint}': ${String(error)}`);
      }
    }

    const region = this.config.region ?? 'us-east-1';
    return `https://${this.config.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  normaliseImages(payload: unknown): StorageAsset[] {
    if (!payload) {
      return [];
    }

    const entries: unknown[] = Array.isArray(payload) ? payload : [payload];
    const assets = entries
      .map((entry, index) => {
        if (!entry) {
          return null;
        }

        if (typeof entry === 'string') {
          return {
            key: entry,
            url: this.getPublicUrl(entry),
          } as StorageAsset;
        }

        if (typeof entry === 'object') {
          const record = entry as Record<string, unknown>;
          const key = typeof record.key === 'string' ? record.key : undefined;
          const alt = typeof record.alt === 'string' ? record.alt : null;
          const contentType = typeof record.contentType === 'string' ? record.contentType : null;
          if (!key) {
            return null;
          }
          return {
            key,
            alt,
            contentType,
            url: this.getPublicUrl(key),
          } as StorageAsset;
        }

        this.logger.debug(`Unsupported image payload at index ${index}`);
        return null;
      })
      .filter((value): value is StorageAsset => value !== null);

    return assets;
  }

  private getClient() {
    if (this.client || !this.isConfigured()) {
      return this.client;
    }

    const credentials =
      this.config.accessKeyId && this.config.secretAccessKey
        ? {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          }
        : undefined;

    this.client = new S3Client({
      region: this.config.region ?? 'auto',
      endpoint: this.config.endpoint,
      forcePathStyle: Boolean(this.config.endpoint),
      credentials,
    });

    return this.client;
  }
}
