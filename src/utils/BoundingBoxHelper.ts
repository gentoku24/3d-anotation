import * as THREE from 'three';

export interface BBox3D {
  center: [number, number, number];
  dimensions: [number, number, number];
  rotation: { yaw: number };
}

export class BoundingBoxHelper {
  static createBoundingBox(bbox: BBox3D, color: number = 0xff0000): THREE.Object3D {
    const { center, dimensions, rotation } = bbox;
    const [width, height, depth] = dimensions;
    
    // ワイヤーフレームのジオメトリを作成
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: color })
    );

    // 向きと位置を設定
    const box = new THREE.Object3D();
    box.add(line);
    box.position.set(center[0], center[1], center[2]);
    box.rotation.y = rotation.yaw;

    // 方向を示す矢印を追加
    const arrowLength = Math.max(width, depth) * 0.5;
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      arrowLength,
      color,
      arrowLength * 0.2,
      arrowLength * 0.1
    );
    arrowHelper.position.y = height * 0.5;
    box.add(arrowHelper);

    return box;
  }
}
