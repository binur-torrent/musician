import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { YoutubeService } from '../youtube/youtube.service';
import { TracksController } from './tracks.controller';

@Module({
  controllers: [TracksController],
  providers: [YoutubeService, SupabaseAuthGuard],
})
export class TracksModule {}
