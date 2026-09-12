import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { triggerHaptic } from '../utils/soundEffects';

interface SelfieCaptureModalProps {
  playerName: string | null;
  onCapture: (photo: string) => void;
  onClose: () => void;
}

export const SelfieCaptureModal: React.FC<SelfieCaptureModalProps> = ({ playerName, onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const [cameraState, setCameraState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const stopCamera = () => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startCamera = async () => {
    stopCamera();
    const requestId = requestIdRef.current;
    setCameraState('loading');
    setErrorMessage('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setErrorMessage('This browser cannot open an in-app camera. Try Cipher in a current mobile browser over HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }
      });
      if (requestId !== requestIdRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('ready');
    } catch {
      stopCamera();
      setCameraState('error');
      setErrorMessage('Camera access was blocked. Allow camera permission in your browser, then try again.');
    }
  };

  useEffect(() => {
    if (!playerName) return;
    startCamera();
    return stopCamera;
  }, [playerName]);

  if (!playerName) return null;

  const takeSelfie = () => {
    const video = videoRef.current;
    if (!video || cameraState !== 'ready' || !video.videoWidth) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sourceX = (video.videoWidth - size) / 2;
    const sourceY = (video.videoHeight - size) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, sourceX, sourceY, size, size, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL('image/jpeg', 0.82);
    stopCamera();
    triggerHaptic([30, 20, 45]);
    onCapture(photo);
  };

  const close = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg animate-fadeIn">
      <section role="dialog" aria-modal="true" aria-labelledby="selfie-title" className="cipher-panel w-full max-w-sm overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="cipher-kicker">Temporary player photo</p>
            <h2 id="selfie-title" className="mt-1 font-display text-2xl font-black text-stone-50">{playerName}'s selfie</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close camera" className="cipher-nav-button flex h-8 w-8 items-center justify-center rounded-lg"><X className="h-4 w-4" /></button>
        </div>

        <div className="relative mt-5 aspect-square overflow-hidden rounded-[28px] border border-white/10 bg-black">
          <video ref={videoRef} muted playsInline className={`h-full w-full scale-x-[-1] object-cover ${cameraState === 'ready' ? 'opacity-100' : 'opacity-0'}`} />
          {cameraState !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {cameraState === 'loading' ? <RefreshCw className="h-7 w-7 animate-spin text-stone-500" /> : <CameraOff className="h-8 w-8 text-rose-400" />}
              <p className="mt-4 text-xs leading-5 text-stone-400">{cameraState === 'loading' ? 'Starting the front camera...' : errorMessage}</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-5 rounded-full border border-white/35 shadow-[0_0_0_999px_rgba(0,0,0,0.12)]" />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-lime-300/15 bg-lime-300/[0.04] p-3 text-[10px] leading-4 text-stone-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />
          <span>This image stays inside the active game only. It is not saved to your gallery or browser storage and is erased when the match ends.</span>
        </div>

        {cameraState === 'error' ? (
          <button type="button" onClick={startCamera} className="cipher-button-secondary mt-4 w-full"><RefreshCw className="h-4 w-4" /> Try camera again</button>
        ) : (
          <button type="button" disabled={cameraState !== 'ready'} onClick={takeSelfie} className="cipher-button-primary mt-4 w-full disabled:opacity-30"><Camera className="h-4 w-4" /> Take selfie</button>
        )}
      </section>
    </div>
  );
};
