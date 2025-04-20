import React, { useState } from 'react';
import { useAnnotationStore } from './hooks/useAnnotationStore';
import FileUploader from './components/FileUploader';
import { PointCloud } from './types/pointcloud';
import MultiViewLayout from './components/MultiViewLayout';

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
      const folderMatch = pointCloud.name?.match(/([^/\\]+)[/\\][^/\\]+$/);
      setFolderName(folderMatch ? folderMatch[1] : undefined);
    }
    if (imagePath) {
      setImagePath(imagePath);
    }
    if (loadedAnnotations) {
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

      {/* メインコンテンツエリア */}
      <div className="flex-1">
        <MultiViewLayout 
          pointCloud={pointCloud}
          imagePath={imagePath}
        />
      </div>
    </div>
  );
};

export default App;
