export interface Point {
  position: [number, number, number];  // [x, y, z]
  color?: [number, number, number];    // [r, g, b]
  intensity?: number;                  // LiDARの強度値
}

export interface PointCloud {
  points: Point[];
  name?: string;
}
