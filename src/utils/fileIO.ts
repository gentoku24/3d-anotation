import { Annotation } from '../hooks/useAnnotationStore';

export const saveAnnotationsToFile = (frameId: number, trackingId: string, annotations: Annotation[]) => {
  const data = {
    frame_id: frameId,
    tracking_id: trackingId,
    annotations: annotations.map((a) => ({
      id: a.id,
      class: a.class,
      bbox_2d: a.bbox_2d,
      bbox_3d: a.bbox_3d,
      tracking_id: a.tracking_id,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `result_${frameId}.json`;
  link.click();
};

export const loadAnnotationsFromFile = (file: File): Promise<Annotation[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        resolve(json.annotations);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};