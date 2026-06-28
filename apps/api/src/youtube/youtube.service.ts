import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { YoutubeMetadata } from '@musician/shared';
import { execFile, spawn } from 'node:child_process';
import { createReadStream, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Readable } from 'node:stream';

const execFileAsync = promisify(execFile);

const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+/i;

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly ytDlpPath: string;
  private readonly tempDir: string;

  constructor(private readonly config: ConfigService) {
    this.ytDlpPath = config.get<string>('YTDLP_PATH', 'yt-dlp');
    this.tempDir = config.get<string>('TEMP_DIR', join(tmpdir(), 'musician-audio'));
  }

  validateUrl(url: string): void {
    if (!YOUTUBE_URL_PATTERN.test(url.trim())) {
      throw new BadRequestException('Invalid YouTube URL');
    }
  }

  async fetchMetadata(url: string): Promise<YoutubeMetadata> {
    this.validateUrl(url);

    try {
      const { stdout } = await execFileAsync(
        this.ytDlpPath,
        ['--dump-single-json', '--no-playlist', '--no-warnings', url.trim()],
        { maxBuffer: 10 * 1024 * 1024 },
      );

      const data = JSON.parse(stdout) as {
        id?: string;
        title?: string;
        thumbnail?: string;
        duration?: number;
      };

      if (!data.id || !data.title) {
        throw new BadRequestException('Could not read video metadata');
      }

      return {
        youtube_id: data.id,
        title: data.title,
        thumbnail_url:
          data.thumbnail ??
          `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg`,
        duration_seconds: data.duration ?? 0,
      };
    } catch (error) {
      this.logger.error('Metadata extraction failed', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch YouTube metadata. Is yt-dlp installed?',
      );
    }
  }

  async downloadAudioStream(url: string): Promise<{
    stream: Readable;
    cleanup: () => Promise<void>;
    contentType: string;
    filename: string;
  }> {
    this.validateUrl(url);
    await fs.mkdir(this.tempDir, { recursive: true });

    const outputTemplate = join(this.tempDir, '%(id)s.%(ext)s');

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        this.ytDlpPath,
        [
          '-x',
          '--audio-format',
          'm4a',
          '--audio-quality',
          '0',
          '--no-playlist',
          '--no-warnings',
          '-o',
          outputTemplate,
          url.trim(),
        ],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );

      let stderr = '';
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      });
    });

    const metadata = await this.fetchMetadata(url);
    const filePath = join(this.tempDir, `${metadata.youtube_id}.m4a`);

    try {
      await fs.access(filePath);
    } catch {
      throw new InternalServerErrorException('Downloaded audio file not found');
    }

    const cleanup = async () => {
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore missing temp files
      }
    };

    return {
      stream: createReadStream(filePath),
      cleanup,
      contentType: 'audio/mp4',
      filename: `${metadata.youtube_id}.m4a`,
    };
  }
}
