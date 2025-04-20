import React from 'react';
import PointCloudViewer from './PointCloudViewer';
import ImageViewer from './ImageViewer';
import BoundingBoxEditor from './BoundingBoxEditor';
import { useAnnotationStore } from '../hooks/useAnnotationStore';

interface MultiViewLayoutProps {
  pointCloud?: any;
  imagePath?: string;
}

const MultiViewLayout: React.FC<MultiViewLayoutProps> = ({ pointCloud, imagePath }) => {
  const selectedId = useAnnotationStore((state) => state.selectedAnnotationId);
  const annotations = useAnnotationStore((state) => state.annotations);

  return (
    <div className="grid grid-cols-2 gap-2 h-full p-2">
      {/* メインビュー */}
      <div className="row-span-2 col-span-1 space-y-2">
        <div className="h-3/4 border bg-white">
          <PointCloudViewer 
            pointCloud={pointCloud}
            annotations={annotations}
          />
        </div>
        <div className="h-1/4 border bg-white">
          <ImageViewer 
            imagePath={imagePath || ''}
            width={window.innerWidth * 0.35}
            height={window.innerHeight * 0.25}
          />
        </div>
      </div>

      {/* バウンディングボックスエディタ */}
      {selectedId ? (
        <div className="col-span-1 space-y-2">
          <div className="border bg-white p-2">
            <h3 className="text-sm font-semibold mb-2">上面ビュー</h3>
            <BoundingBoxEditor view="top" width={300} height={200} />
          </div>
          <div className="border bg-white p-2">
            <h3 className="text-sm font-semibold mb-2">正面ビュー</h3>
            <BoundingBoxEditor view="front" width={300} height={200} />
          </div>
          <div className="border bg-white p-2">
            <h3 className="text-sm font-semibold mb-2">側面ビュー</h3>
            <BoundingBoxEditor view="side" width={300} height={200} />
          </div>
        </div>
      ) : (
        <div className="col-span-1 flex items-center justify-center border bg-gray-50">
          <p className="text-gray-500">バウンディングボックスを選択してください</p>
        </div>
      )}
    </div>
  );
};

export default MultiViewLayout;