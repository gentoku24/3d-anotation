import React from 'react';
import PointCloudViewer from './PointCloudViewer';
import ImageViewer from './ImageViewer';

const MultiViewLayout: React.FC = () => {
  return (
    <div className="grid grid-cols-2 grid-rows-3 gap-2 h-full p-2">
      <div className="row-span-2 border bg-white">
        <PointCloudViewer /> {/* 左上: 自由視点 3D ビュー */}
      </div>
      <div className="row-span-1 border bg-white">
        <ImageViewer /> {/* 左下: 画像ビュー */}
      </div>
      <div className="col-span-1 border bg-white">
        {/* 右上: 上面ビュー（後ほど実装） */}
        <PointCloudViewer view="top" />
      </div>
      <div className="col-span-1 border bg-white">
        {/* 右中: 正面ビュー（後ほど実装） */}
        <PointCloudViewer view="front" />
      </div>
      <div className="col-span-1 border bg-white">
        {/* 右下: 側面ビュー（後ほど実装） */}
        <PointCloudViewer view="side" />
      </div>
    </div>
  );
};

export default MultiViewLayout;