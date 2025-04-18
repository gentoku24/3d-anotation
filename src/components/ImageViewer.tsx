import React, { useEffect, useRef } from 'react';

interface ImageViewerProps {
  imagePath: string;
  width?: number;
  height?: number;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  imagePath,
  width = window.innerWidth * 0.25,  // 画面の25%の幅
  height = window.innerHeight
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = imagePath;

        img.onload = () => {
          // キャンバスのサイズを設定
          const aspectRatio = img.width / img.height;
          const canvasWidth = width;
          const canvasHeight = Math.min(height, width / aspectRatio);

          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          // 画像を描画
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        };

        img.onerror = (error) => {
          console.error('Error loading image:', error);
          // エラー時の表示
          ctx.fillStyle = '#333';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#fff';
          ctx.font = '16px Arial';
          ctx.fillText('Error loading image', 10, height / 2);
        };
      } catch (error) {
        console.error('Error in ImageViewer:', error);
      }
    };

    loadImage();
  }, [imagePath, width, height]);

  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ backgroundColor: '#1a1a1a' }}
      />
    </div>
  );
};

export default ImageViewer;
