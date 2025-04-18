// src/components/PointCloudViewer.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Point, PointCloud } from '../types/pointcloud';
import { BoundingBoxHelper, BBox3D } from '../utils/BoundingBoxHelper';

interface PointCloudViewerProps {
  pointCloud?: PointCloud;
  annotations?: Array<{
    id: number;
    class: string;
    bbox_3d: BBox3D;
  }>;
  width?: number;
  height?: number;
}

const PointCloudViewer: React.FC<PointCloudViewerProps> = ({
  pointCloud,
  annotations = [],
  width = window.innerWidth * 0.75,
  height = window.innerHeight
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const boxesRef = useRef<THREE.Object3D[]>([]);

  // シーンの初期化
  useEffect(() => {
    if (!mountRef.current) return;

    // シーンの作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // 暗めの背景
    sceneRef.current = scene;

    // カメラの設定
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControlsの設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // グリッドヘルパーの追加
    const gridHelper = new THREE.GridHelper(20, 20, 0x404040, 0x404040);
    scene.add(gridHelper);

    // 座標軸ヘルパーの追加
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  // 点群の更新
  useEffect(() => {
    if (!sceneRef.current || !pointCloud || !cameraRef.current) return;

    try {
      // 既存の点群を削除
      if (pointsRef.current) {
        sceneRef.current.remove(pointsRef.current);
        pointsRef.current.geometry.dispose();
        if (pointsRef.current.material instanceof THREE.Material) {
          pointsRef.current.material.dispose();
        }
      }

      // 異常値を除外してバウンディングボックスを計算
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      pointCloud.points.forEach(point => {
        // 明らかな異常値を除外
        if (Math.abs(point.position[1]) > 1e10) return;

        minX = Math.min(minX, point.position[0]);
        minY = Math.min(minY, point.position[1]);
        minZ = Math.min(minZ, point.position[2]);
        maxX = Math.max(maxX, point.position[0]);
        maxY = Math.max(maxY, point.position[1]);
        maxZ = Math.max(maxZ, point.position[2]);
      });

      console.log('Bounding box:', {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ]
      });

      // 点群の中心を計算
      const center = new THREE.Vector3(
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2
      );

      // スケールを計算
      const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
      const scale = 10 / size; // シーンサイズを10単位に正規化

      // 点群データの作成
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(pointCloud.points.length * 3);
      const colors = new Float32Array(pointCloud.points.length * 3);

      let validPointCount = 0;
      pointCloud.points.forEach((point, i) => {
        // 異常値をスキップ
        if (Math.abs(point.position[1]) > 1e10) return;

        const i3 = validPointCount * 3;
        // スケールを適用して中心を原点に移動
        positions[i3] = (point.position[0] - center.x) * scale;
        positions[i3 + 1] = (point.position[1] - center.y) * scale;
        positions[i3 + 2] = (point.position[2] - center.z) * scale;

        // 高さに基づいて色を設定
        const normalizedHeight = (point.position[1] - minY) / (maxY - minY);
        colors[i3] = 1 - normalizedHeight; // 赤
        colors[i3 + 1] = normalizedHeight; // 緑
        colors[i3 + 2] = 0.5; // 青（固定）

        validPointCount++;
      });

      // 有効な点のデータのみを使用
      const validPositions = new Float32Array(positions.buffer, 0, validPointCount * 3);
      const validColors = new Float32Array(colors.buffer, 0, validPointCount * 3);

      geometry.setAttribute('position', new THREE.BufferAttribute(validPositions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(validColors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        sizeAttenuation: true
      });

      const points = new THREE.Points(geometry, material);
      sceneRef.current.add(points);
      pointsRef.current = points;

      // カメラの位置を調整
      const cameraDistance = 15;
      cameraRef.current.position.set(
        cameraDistance,
        cameraDistance,
        cameraDistance
      );
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      console.log('Point cloud update completed with', validPointCount, 'valid points');

    } catch (error) {
      console.error('Error in point cloud update:', error);
    }
  }, [pointCloud]);

  // バウンディングボックスの更新
  useEffect(() => {
    if (!sceneRef.current) return;

    // 既存のボックスを削除
    boxesRef.current.forEach(box => {
      sceneRef.current?.remove(box);
    });
    boxesRef.current = [];

    // 新しいボックスを追加
    annotations.forEach((annotation, index) => {
      const color = annotation.class === 'car' ? 0xff0000 : 0x00ff00;
      const box = BoundingBoxHelper.createBoundingBox(annotation.bbox_3d, color);
      sceneRef.current?.add(box);
      boxesRef.current.push(box);
    });
  }, [annotations]);

  return <div ref={mountRef} style={{ width, height }} />;
};

export default PointCloudViewer;