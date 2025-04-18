import create from 'zustand';

interface BBox2D {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface BBox3D {
  center: [number, number, number];
  dimensions: [number, number, number];
  rotation: { yaw: number };
}

interface Annotation {
  id: number;
  class: string;
  bbox_2d: BBox2D;
  bbox_3d: BBox3D;
  tracking_id: string;
}

interface AnnotationStore {
  annotations: Annotation[];
  selectedAnnotationId: number | null;
  selectAnnotation: (id: number) => void;
  updateAnnotation: (id: number, annotation: Partial<Annotation>) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: number) => void;
}

export const useAnnotationStore = create<AnnotationStore>((set) => ({
  annotations: [],
  selectedAnnotationId: null,
  selectAnnotation: (id) => set({ selectedAnnotationId: id }),
  updateAnnotation: (id, updated) => set((state) => ({
    annotations: state.annotations.map((ann) =>
      ann.id === id ? { ...ann, ...updated } : ann
    ),
  })),
  addAnnotation: (annotation) => set((state) => ({
    annotations: [...state.annotations, annotation],
  })),
  removeAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter((ann) => ann.id !== id),
  })),
}));
