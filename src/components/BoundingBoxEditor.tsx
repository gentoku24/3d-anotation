import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useAnnotationStore } from '../hooks/useAnnotationStore';
import { BBox3D } from '../utils/BoundingBoxHelper';

interface BoundingBoxEditorProps {
  view?: 'perspective' | 'top' | 'front' | 'side';
  width?: number;
  height?: number;
}

const BoundingBoxEditor: React.FC<BoundingBoxEditorProps> = ({
  view = 'perspective',
  width = 300,
  height = 300,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boxRef = useRef<THREE.Object3D | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isDraggingRef = useRef(false);
  const selectedHandleRef = useRef<THREE.Object3D | null>(null);
  const [dragPlane, setDragPlane] = useState<THREE.Plane | null>(null);
  const selectedId = useAnnotationStore((state) => state.selectedAnnotationId);
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);
  const annotation = useAnnotationStore(
    (state) => state.annotations.find((a) => a.id === selectedId)
  );

  // シーンのセットアップ
  useEffect(() => {
    if (!mountRef.current) return;

    // シーンの作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // カメラの設定
    let camera: THREE.Camera;
    switch (view) {
      case 'top':
        camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
        camera.position.set(0, 10, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'front':
        camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
        camera.position.set(0, 0, 10);
        camera.lookAt(0, 0, 0);
        break;
      case 'side':
        camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
        camera.position.set(10, 0, 0);
        camera.lookAt(0, 0, 0);
        break;
      default:
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
    }
    cameraRef.current = camera;

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // コントロールの設定（パースペクティブビューのみ）
    if (view === 'perspective') {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controlsRef.current = controls;
    }

    // グリッドとヘルパーの追加
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // 照明の設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [view, width, height]);

  // マウスイベントハンドラー
  const handleMouseDown = (event: MouseEvent) => {
    if (!mountRef.current || !sceneRef.current || !cameraRef.current || !annotation) return;

    // マウス座標の正規化
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / height) * 2 + 1;

    // レイキャスティング
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // ハンドルとの交差判定
    const intersects = raycasterRef.current.intersectObjects(
      boxRef.current?.children || [],
      true
    );

    if (intersects.length > 0) {
      isDraggingRef.current = true;
      selectedHandleRef.current = intersects[0].object;

      // ドラッグ平面の作成
      if (view === 'top') {
        setDragPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
      } else if (view === 'front') {
        setDragPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
      } else if (view === 'side') {
        setDragPlane(new THREE.Plane(new THREE.Vector3(1, 0, 0), 0));
      }
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDraggingRef.current || !selectedHandleRef.current || !dragPlane || !annotation) return;

    // マウス座標の更新
    const rect = mountRef.current!.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / height) * 2 + 1;

    // レイとドラッグ平面の交点を計算
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);
    const intersectPoint = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(dragPlane, intersectPoint);

    // 新しい位置を計算
    const newCenter = [...annotation.bbox_3d.center];
    if (view === 'top') {
      newCenter[0] = intersectPoint.x;
      newCenter[2] = intersectPoint.z;
    } else if (view === 'front') {
      newCenter[0] = intersectPoint.x;
      newCenter[1] = intersectPoint.y;
    } else if (view === 'side') {
      newCenter[2] = intersectPoint.z;
      newCenter[1] = intersectPoint.y;
    }

    // アノテーションの更新
    updateAnnotation(annotation.id, {
      bbox_3d: {
        ...annotation.bbox_3d,
        center: newCenter
      }
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    selectedHandleRef.current = null;
    setDragPlane(null);
  };

  // マウスイベントのセットアップ
  useEffect(() => {
    const element = mountRef.current;
    if (element) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('mouseleave', handleMouseUp);

      return () => {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [view, annotation]);

  // バウンディングボックスの更新
  useEffect(() => {
    if (!sceneRef.current || !annotation) return;

    // 既存のボックスを削除
    if (boxRef.current) {
      sceneRef.current.remove(boxRef.current);
    }

    // ボックスの作成
    const { center, dimensions, rotation } = annotation.bbox_3d;
    const [width, height, depth] = dimensions;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ 
      color: selectedId === annotation.id ? 0x00ff00 : 0xff0000,
      linewidth: selectedId === annotation.id ? 2 : 1
    });
    const box = new THREE.LineSegments(edges, material);

    // 選択時のみハンドルを表示
    if (selectedId === annotation.id) {
      // 変形ハンドルの追加
      const handleSize = view === 'perspective' ? 0.1 : 0.2; // 直交ビューでは大きめに
      const handleGeometry = new THREE.BoxGeometry(handleSize, handleSize, handleSize);
      const handleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        opacity: 0.7,
        transparent: true
      });

      // ビューに応じてハンドルの位置を調整
      const handlePositions = [];
      if (view === 'top') {
        // 上面ビューでは4つの角にハンドルを配置
        handlePositions.push(
          [-width/2, 0, -depth/2],
          [-width/2, 0, depth/2],
          [width/2, 0, -depth/2],
          [width/2, 0, depth/2]
        );
      } else if (view === 'front') {
        // 正面ビューでは4つのコーナーにハンドルを配置
        handlePositions.push(
          [-width/2, -height/2, 0],
          [-width/2, height/2, 0],
          [width/2, -height/2, 0],
          [width/2, height/2, 0]
        );
      } else if (view === 'side') {
        // 側面ビューでは4つのコーナーにハンドルを配置
        handlePositions.push(
          [0, -height/2, -depth/2],
          [0, -height/2, depth/2],
          [0, height/2, -depth/2],
          [0, height/2, depth/2]
        );
      } else {
        // パースペクティブビューでは8つの頂点全てにハンドルを配置
        handlePositions.push(
          [-width/2, -height/2, -depth/2],
          [-width/2, -height/2, depth/2],
          [-width/2, height/2, -depth/2],
          [-width/2, height/2, depth/2],
          [width/2, -height/2, -depth/2],
          [width/2, -height/2, depth/2],
          [width/2, height/2, -depth/2],
          [width/2, height/2, depth/2]
        );
      }

      handlePositions.forEach((pos) => {
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(...pos);
        box.add(handle);
      });

      // 方向を示す矢印を追加
      const arrowLength = Math.max(width, depth) * 0.5;
      const arrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(Math.cos(rotation.yaw), 0, Math.sin(rotation.yaw)),
        new THREE.Vector3(0, height / 2, 0),
        arrowLength,
        0x00ff00,
        arrowLength * 0.2,
        arrowLength * 0.1
      );
      box.add(arrowHelper);
    }

    // 位置と回転を設定
    box.position.set(center[0], center[1], center[2]);
    box.rotation.y = rotation.yaw;

    sceneRef.current.add(box);
    boxRef.current = box;

  }, [annotation, selectedId, view]);

  return (
    <div>
      <div ref={mountRef} style={{ width, height }} />
      {view === 'perspective' && (
        <div className="p-2">
          <h3 className="text-sm font-semibold">編集モード</h3>
          {annotation && (
            <div className="space-y-2 mt-2">
              <div>
                <label className="block text-sm">位置 X</label>
                <input
                  type="number"
                  value={annotation.bbox_3d.center[0]}
                  onChange={(e) => {
                    const newCenter = [...annotation.bbox_3d.center];
                    newCenter[0] = parseFloat(e.target.value);
                    updateAnnotation(annotation.id, {
                      bbox_3d: { ...annotation.bbox_3d, center: newCenter }
                    });
                  }}
                  className="w-full border px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm">位置 Y</label>
                <input
                  type="number"
                  value={annotation.bbox_3d.center[1]}
                  onChange={(e) => {
                    const newCenter = [...annotation.bbox_3d.center];
                    newCenter[1] = parseFloat(e.target.value);
                    updateAnnotation(annotation.id, {
                      bbox_3d: { ...annotation.bbox_3d, center: newCenter }
                    });
                  }}
                  className="w-full border px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm">位置 Z</label>
                <input
                  type="number"
                  value={annotation.bbox_3d.center[2]}
                  onChange={(e) => {
                    const newCenter = [...annotation.bbox_3d.center];
                    newCenter[2] = parseFloat(e.target.value);
                    updateAnnotation(annotation.id, {
                      bbox_3d: { ...annotation.bbox_3d, center: newCenter }
                    });
                  }}
                  className="w-full border px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm">回転 (Yaw)</label>
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.01"
                  value={annotation.bbox_3d.rotation.yaw}
                  onChange={(e) => {
                    updateAnnotation(annotation.id, {
                      bbox_3d: {
                        ...annotation.bbox_3d,
                        rotation: { yaw: parseFloat(e.target.value) }
                      }
                    });
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BoundingBoxEditor;