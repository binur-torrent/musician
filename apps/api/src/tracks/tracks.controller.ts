import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { CreateTrackRequest } from '@musician/shared';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { YoutubeService } from '../youtube/youtube.service';

@Controller('tracks')
@UseGuards(SupabaseAuthGuard)
export class TracksController {
  constructor(private readonly youtube: YoutubeService) {}

  @Post('metadata')
  async metadata(@Body() body: CreateTrackRequest) {
    const metadata = await this.youtube.fetchMetadata(body.youtube_url);
    return { metadata };
  }

  @Get('audio')
  async audio(
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    if (!url) {
      return res.status(400).json({ message: 'url query param is required' });
    }

    const { stream, cleanup, contentType, filename } =
      await this.youtube.downloadAudioStream(url);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.on('close', () => {
      void cleanup();
    });
    stream.on('error', () => {
      void cleanup();
    });

    stream.pipe(res);
  }
}
