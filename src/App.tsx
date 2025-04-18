import React, { useState } from 'react';
import { useAnnotationStore } from './hooks/useAnnotationStore';
import PointCloudViewer from './components/PointCloudViewer';
import ImageViewer from './components/ImageViewer';
import FileUploader from './components/FileUploader';
import { PointCloud } from './types/pointcloud';

const App: React.FC = () => {
  const annotations = useAnnotationStore((state) => state.annotations);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const [pointCloud, setPointCloud] = useState<PointCloud | undefined>();
  const [imagePath, setImagePath] = useState<string | undefined>();
  const [folderName, setFolderName] = useState<string | undefined>();

  const handleDataLoad = ({ pointCloud, imagePath, annotations: loadedAnnotations }: {
    pointCloud?: PointCloud;
    imagePath?: string;
    annotations?: any[];
  }) => {
    if (pointCloud) {
      setPointCloud(pointCloud);
      // フォルダ名を抽出（例: "data/0001/file.pcd" から "0001"を取得）
      const folderMatch = pointCloud.name?.match(/([^/\\]+)[/\\][^/\\]+$/);
      setFolderName(folderMatch ? folderMatch[1] : undefined);
    }
    if (imagePath) {
      setImagePath(imagePath);
    }
    if (loadedAnnotations) {
      // 既存のアノテーションをクリアしてから新しいアノテーションを追加
      loadedAnnotations.forEach(annotation => {
        addAnnotation(annotation);
      });
      console.log('Loaded annotations:', loadedAnnotations);
    }
  };

  return (
    <div className="flex h-screen">
      {/* サイドバー */}
      <div className="w-1/4 bg-gray-100 p-4 space-y-4">
        <h1 className="text-xl font-bold mb-4">3D Annotation Tool</h1>
        <FileUploader onDataLoad={handleDataLoad} />
        {folderName && (
          <div className="bg-blue-50 p-2 rounded">
            <h2 className="text-md font-semibold text-blue-700">
              Current Folder: {folderName}
            </h2>
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold">Annotations</h2>
          <pre className="text-sm">{JSON.stringify(annotations, null, 2)}</pre>
        </div>
        {pointCloud && (
          <div>
            <h2 className="text-lg font-semibold">Point Cloud Info</h2>
            <p>File: {pointCloud.name}</p>
            <p>Points: {pointCloud.points.length}</p>
          </div>
        )}
      </div>

      {/* メインビューエリア */}
      <div className="flex flex-1">
        {/* 点群ビューア */}
        <div className="w-3/4 bg-gray-50">
          <PointCloudViewer 
            pointCloud={pointCloud}
            annotations={annotations}
          />
        </div>
        
        {/* 画像ビューア */}
        <div className="w-1/4 bg-gray-800 flex flex-col">
          <div className="p-2 bg-gray-700 text-white">
            <h3 className="text-sm font-semibold">Camera Image</h3>
          </div>
          {imagePath ? (
            <ImageViewer 
              imagePath={imagePath}
              width={window.innerWidth * 0.25}
              height={window.innerHeight - 40}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
