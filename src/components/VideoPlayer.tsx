import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  startSeconds?: number;
  onEnded?: () => void;
  onProgress?: (state: { playedSeconds: number; played: number }) => void;
}

export default function VideoPlayer({ url, startSeconds = 0, onEnded, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [availableQualities, setAvailableQualities] = useState<Array<{ value: number; label: string }>>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const seekAppliedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const normalizedUrl = String(url || '').toLowerCase();
    const isHls =
      normalizedUrl.includes('.m3u8') ||
      normalizedUrl.includes('m3u8?') ||
      normalizedUrl.includes('format=m3u8');
    setIsReady(false);
    setError(null);
    setAvailableQualities([]);
    setSelectedQuality(-1);
    seekAppliedRef.current = false;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const loadVideo = async () => {
      const applyResumePosition = () => {
        if (seekAppliedRef.current) return;
        const resumeAt = Number(startSeconds || 0);
        if (!Number.isFinite(resumeAt) || resumeAt <= 0) {
          seekAppliedRef.current = true;
          return;
        }
        try {
          video.currentTime = resumeAt;
        } catch (error) {
          console.warn('Failed to seek to resume position', error);
        } finally {
          seekAppliedRef.current = true;
        }
      };

      if (isHls) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, async () => {
            applyResumePosition();
            const levels = hls.levels || [];
            const uniqueLevels = levels
              .map((level, index) => ({
                value: index,
                height: level.height || 0,
                bitrate: level.bitrate || 0,
              }))
              .filter((level, idx, arr) => idx === arr.findIndex((x) => x.height === level.height && x.bitrate === level.bitrate))
              .sort((a, b) => b.height - a.height);

            if (uniqueLevels.length > 0) {
              const qualityOptions = [
                { value: -1, label: 'Auto' },
                ...uniqueLevels.map((level) => ({
                  value: level.value,
                  label: level.height > 0 ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps`,
                })),
              ];
              setAvailableQualities(qualityOptions);
              setSelectedQuality(-1);
            }

            try {
              await video.play();
              setIsReady(true);
            } catch (err) {
              console.log("Play HLS gagal:", err);
            }
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              console.error('HLS Fatal Error:', data);
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
                return;
              }
              if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
                return;
              }
              setError('Gagal memuat stream HLS.');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = url;
          video.addEventListener('loadedmetadata', async () => {
            applyResumePosition();
            try {
              await video.play();
              setIsReady(true);
            } catch (err) {
              console.log("Play Native HLS gagal:", err);
            }
          });
        }
      } else {
        // Native MP4 - User's suggested logic
        video.pause();
        video.src = url;
        video.load();
        video.addEventListener(
          'loadedmetadata',
          () => {
            applyResumePosition();
          },
          { once: true }
        );
        try {
          await video.play();
          setIsReady(true);
        } catch (err) {
          console.log("Play gagal:", err);
          // Often happens due to autoplay policy, user will click play
        }
      }
    };

    loadVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url, startSeconds]);

  const handleQualityChange = (qualityValue: number) => {
    setSelectedQuality(qualityValue);
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = qualityValue;
  };

  // Handle progress and ended events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (onProgress) {
        onProgress({
          playedSeconds: video.currentTime,
          played: video.currentTime / video.duration || 0,
        });
      }
    };

    const handleEnded = () => {
      if (onEnded) onEnded();
    };

    const handleCanPlay = () => setIsReady(true);
    const handleError = () => setError('Gagal memutar video. Link mungkin kadaluarsa atau diblokir.');

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [onProgress, onEnded]);

  return (
    <div className="relative w-full h-full bg-black aspect-video group">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload"
        playsInline
        autoPlay
      />
      
      {!isReady && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 pointer-events-none">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-sm font-medium">Memuat video...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-6 text-center">
          <p className="text-xl font-bold text-red-500 mb-4">Playback Error</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {availableQualities.length > 1 && !error && (
        <div className="absolute top-4 right-4 z-20">
          <select
            value={selectedQuality}
            onChange={(e) => handleQualityChange(Number(e.target.value))}
            className="bg-black/70 border border-gray-600 text-white text-xs rounded px-2 py-1"
          >
            {availableQualities.map((quality) => (
              <option key={quality.value} value={quality.value}>
                {quality.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
