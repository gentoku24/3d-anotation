// src/components/FileUploader.tsx
import React, { useCallback } from 'react';
import { PointCloudLoader } from '../utils/pointCloudLoader';
import { DataFolder } from '../types/files';

interface FileUploaderProps {
  onDataLoad: (data: {
    pointCloud?: any;
    imagePath?: string;
    annotations?: any[];
  }) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoad }) => {
  const handleFolderSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      console.log('Loading folder contents...');
      
      // ファイルをフィルタリング
      let pointCloudFile: File | undefined;
      let imageFile: File | undefined;
      let annotationFile: File | undefined;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'pcd' && !pointCloudFile) {
          pointCloudFile = file;
        } else if (['bmp', 'jpg', 'jpeg', 'png'].includes(extension || '') && !imageFile) {
          imageFile = file;
        } else if (file.name === 'annotations.json') {
          annotationFile = file;
        }
      }

      // 各ファイルを読み込む
      const results = await Promise.all([
        pointCloudFile ? PointCloudLoader.loadPCD(pointCloudFile) : undefined,
        imageFile ? URL.createObjectURL(imageFile) : undefined,
        annotationFile ? new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(JSON.parse(e.target?.result as string));
          };
          reader.readAsText(annotationFile);
        }) : undefined
      ]);

      onDataLoad({
        pointCloud: results[0],
        imagePath: results[1],
        annotations: results[2]?.annotations
      });

    } catch (error) {
      console.error('Error loading folder contents:', error);
      alert('フォルダの読み込みに失敗しました');
    }
  }, [onDataLoad]);

  return (
    <div className="p-4">
      <input
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
    </div>
  );
};

export default FileUploader;