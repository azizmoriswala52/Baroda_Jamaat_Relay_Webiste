import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
const NodeMediaServer = require('node-media-server');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: path.join(__dirname, '../media')
  }
};

const nms = new NodeMediaServer(config);

const activeFfmpegProcesses: { [streamPath: string]: any } = {};

nms.on('postPublish', (session: any) => {
  const StreamPath = session.streamPath;
  if (!StreamPath) return;

  console.log('[NodeEvent on postPublish]', `id=${session.id} StreamPath=${StreamPath}`);
  
  const streamKey = StreamPath.split('/').pop();
  if (!streamKey) return;

  const mediaPath = path.join(__dirname, '../media/live', streamKey);
  
  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath, { recursive: true });
  }

  // Clear old HLS files if any
  fs.readdirSync(mediaPath).forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
      fs.unlinkSync(path.join(mediaPath, file));
    }
  });

  const rtmpUrl = `rtmp://127.0.0.1:1935${StreamPath}`;
  const m3u8Path = path.join(mediaPath, 'index.m3u8');

  console.log('[FFmpeg] Starting HLS Transmuxing for', rtmpUrl);

  const ffmpegArgs = [
    '-i', rtmpUrl,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-g', '30', // Force keyframe every 1 second (assuming 30fps)
    '-sc_threshold', '0',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-f', 'hls',
    '-hls_time', '2', // 2 second chunks for stability
    '-hls_list_size', '3600', // Keep up to 2 hours of history for DVR scrub back
    '-hls_flags', 'delete_segments',
    m3u8Path
  ];

  const ffmpegProc = spawn(ffmpegInstaller.path, ffmpegArgs);

  ffmpegProc.stderr.on('data', (data) => {
    // FFmpeg logs to stderr even for normal progress, ignore unless debugging
  });

  ffmpegProc.on('close', (code) => {
    console.log(`[FFmpeg] Exited with code ${code} for ${StreamPath}`);
    delete activeFfmpegProcesses[StreamPath];
  });

  activeFfmpegProcesses[StreamPath] = ffmpegProc;
});

nms.on('donePublish', (session: any) => {
  const StreamPath = session.streamPath;
  if (!StreamPath) return;

  console.log('[NodeEvent on donePublish]', `id=${session.id} StreamPath=${StreamPath}`);
  if (activeFfmpegProcesses[StreamPath]) {
    activeFfmpegProcesses[StreamPath].kill('SIGKILL');
    delete activeFfmpegProcesses[StreamPath];
  }
});

export default nms;
