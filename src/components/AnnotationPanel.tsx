import React from 'react';
import { useAnnotationStore } from '../hooks/useAnnotationStore';

const AnnotationPanel: React.FC = () => {
  const selectedId = useAnnotationStore((state) => state.selectedAnnotationId);
  const annotation = useAnnotationStore((state) =>
    state.annotations.find((a) => a.id === selectedId)
  );
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);

  if (!annotation) return <div className="text-gray-500">アノテーションを選択してください</div>;

  const handleChange = (field: string, value: any) => {
    updateAnnotation(annotation.id, {
      ...annotation,
      [field]: value,
    });
  };

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">BBox 編集</h2>
      <label className="block">クラス名
        <input
          className="w-full border px-2 py-1"
          value={annotation.class}
          onChange={(e) => handleChange('class', e.target.value)}
        />
      </label>
      <label className="block">追跡ID
        <input
          className="w-full border px-2 py-1"
          value={annotation.tracking_id}
          onChange={(e) => handleChange('tracking_id', e.target.value)}
        />
      </label>
      {/* 他にも center や dimensions など必要なら入力項目を追加可能 */}
    </div>
  );
};

export default AnnotationPanel;