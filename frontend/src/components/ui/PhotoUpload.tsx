import React, { useRef, useState, useCallback } from 'react';
import { useConfirmDialog } from './ModalDialog';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoSelected: (file: File | null) => void;
  employeeId?: string;
  enableWebcam?: boolean; // Option to show/hide webcam
  employeeDbId?: number; // Database ID for deleting photo
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoSelected,
  employeeId,
  enableWebcam = false, // Default: hide webcam
  employeeDbId,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Confirmation dialog hook
  const confirmDialog = useConfirmDialog();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ទំហំឯកសារត្រូវតែតិចជាង 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('សូមជ្រើសរើសឯកសាររូបភាព');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onPhotoSelected(file);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamStream(stream);
        setShowWebcam(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('មិនអាចប្រើកាមេរ៉ាបានទេ សូមពិនិត្យការអនុញ្ញាត');
    }
  };

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setShowWebcam(false);
  }, [webcamStream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${employeeId || 'temp'}_${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            onPhotoSelected(file);
            stopWebcam();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const clearPhoto = async () => {
    // If there's a current photo URL (already uploaded), delete it from backend
    if (currentPhotoUrl && employeeDbId) {
      const confirmed = await confirmDialog.confirm({
        title: 'លុបរូបថត',
        message: 'តើអ្នកប្រាកដថាចង់លុបរូបថតនេះមែនទេ?',
        confirmText: 'លុប',
        cancelText: 'បោះបង់',
        variant: 'danger',
      });
      
      if (!confirmed) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/employees/${employeeDbId}/photo`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('Failed to delete photo from server');
          // Continue anyway to clear local state
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        // Continue anyway to clear local state
      }
    }
    
    setPreviewUrl(null);
    onPhotoSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        {'រូបថតបុគ្គលិក'}
      </label>

      {/* Preview */}
      {previewUrl && !showWebcam && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={'រូបភាពមើលជាមុនរបស់បុគ្គលិក'}
            className="w-32 h-32 object-cover rounded-lg border-2 border-border"
          />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Webcam */}
      {showWebcam && (
        <div className="space-y-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-md rounded-lg border-2 border-border"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              📸 {'ថតរូប'}
            </button>
            <button
              type="button"
              onClick={stopWebcam}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              {'បោះបង់'}
            </button>
          </div>
        </div>
      )}

      {/* Upload Options */}
      {!showWebcam && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            📁 {'ជ្រើសរើសឯកសារ'}
          </button>
          {enableWebcam && (
            <button
              type="button"
              onClick={startWebcam}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              📷 {'ប្រើកាមេរ៉ា'}
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <canvas ref={canvasRef} className="hidden" />

      <p className="text-xs text-muted-foreground">
        {'ទម្រង់ដែលទទួលយក៖ JPG, PNG, WEBP (អតិបរមា 5MB)'}
      </p>

      {/* Confirmation Dialog */}
      <confirmDialog.ConfirmDialog />
    </div>
  );
};
