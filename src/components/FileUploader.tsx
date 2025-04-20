// src/components/FileUploader.tsx
import React, { useCallback } from 'react';
import { PointCloudLoader } from '../utils/pointCloudLoader';
import { DataFolder } from '../types/files';
import { loadAnnotationsFromFile } from '../utils/fileIO';

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

        if (extension === 'pcd') {
          pointCloudFile = file;
          console.log('Found PCD file:', file.name);
        } else if (['bmp', 'jpg', 'jpeg', 'png'].includes(extension || '')) {
          imageFile = file;
          console.log('Found image file:', file.name);
        } else if (file.name === 'annotations.json') {
          annotationFile = file;
          console.log('Found annotation file:', file.name);
        }
      }

      // 点群データの読み込み
      const pointCloud = pointCloudFile ? await PointCloudLoader.loadPCD(pointCloudFile) : undefined;

      // 画像パスの設定
      let imagePath;
      if (imageFile) {
        imagePath = URL.createObjectURL(imageFile);
        console.log('Created image URL:', imagePath);
      }

      // アノテーションファイルの読み込み
      let annotations;
      if (annotationFile) {
        const annotationData = await loadAnnotationsFromFile(annotationFile);
        annotations = annotationData;
        console.log('Loaded annotations:', annotations);
      }

      // データを親コンポーネントに渡す
      onDataLoad({
        pointCloud,
        imagePath,
        annotations
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