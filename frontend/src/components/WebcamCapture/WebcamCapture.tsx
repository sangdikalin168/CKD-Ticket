import { useRef, useState, useEffect } from 'react';
import { AlertCircle, Camera, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';


interface WebcamCaptureProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCapture: (imageSrc: string) => void;
  customerId?: number;
}

export const WebcamCapture = ({ open, setOpen, onCapture }: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !imgSrc) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setHasPermission(true);
      setError(null);
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setError('មិនអាចចូលប្រើកាមេរ៉ាបានទេ។ សូមពិនិត្យមើលការអនុញ្ញាត។');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);

        const imageSrc = canvas.toDataURL('image/jpeg');
        setImgSrc(imageSrc);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setImgSrc(null);
    startCamera();
  };

  const handleSave = () => {
    if (imgSrc) {
      onCapture(imgSrc);
      setImgSrc(null);
      stopCamera();
      setOpen(false);
    }
  };

  const handleClose = () => {
    setImgSrc(null);
    stopCamera();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>ថតរូបសមាជិក</DialogTitle>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-lg border border-rule bg-wash">
          {!imgSrc ? (
            <>
              {!hasPermission && error ? (
                <div className="p-8 text-center" role="alert">
                  <p className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
                    <AlertCircle className="h-4 w-4 shrink-0 text-void" aria-hidden="true" />
                    {error}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    សូមធ្វើការអនុញ្ញាតឱ្យកម្មវិធីចូលប្រើកាមេរ៉ា ហើយព្យាយាមម្តងទៀត។
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="h-auto w-full"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}
            </>
          ) : (
            <img src={imgSrc} alt="captured" className="h-auto w-full" />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <DialogFooter className="sm:justify-center">
          {!imgSrc ? (
            <Button type="button" size="lg" onClick={capture} disabled={!hasPermission}>
              <Camera aria-hidden="true" />
              ថតរូប
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" size="lg" onClick={retake}>
                <RotateCcw aria-hidden="true" />
                ថតម្តងទៀត
              </Button>
              <Button type="button" size="lg" onClick={handleSave}>
                រក្សាទុក
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WebcamCapture;
