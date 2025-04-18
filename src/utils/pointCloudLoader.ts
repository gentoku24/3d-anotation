// src/utils/pointCloudLoader.ts
import { Point, PointCloud } from '../types/pointcloud';

export class PointCloudLoader {
  // PLYファイルの読み込み処理は変更なし...

  // PCDファイルの読み込み
  static async loadPCD(file: File): Promise<PointCloud> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const view = new DataView(buffer);
          const decoder = new TextDecoder();
          
          let headerStr = '';
          let headerLength = 0;
          let vertexCount = 0;
          let fields: string[] = [];
          let sizes: number[] = [];
          let types: string[] = [];
          
          // ヘッダーを読み取り
          for (let i = 0; i < Math.min(2048, buffer.byteLength); i++) {
            const byte = view.getUint8(i);
            headerStr += String.fromCharCode(byte);
            
            if (headerStr.includes('DATA')) {
              const headerLines = headerStr.split('\n');
              console.log('Header lines:', headerLines);

              // ヘッダー終端位置の調整
              headerLength = headerStr.indexOf('DATA');
              headerLength += headerStr.slice(headerLength).indexOf('\n') + 1;
              
              headerLines.forEach(line => {
                const parts = line.trim().split(' ');
                switch(parts[0]) {
                  case 'FIELDS':
                    fields = parts.slice(1);
                    break;
                  case 'SIZE':
                    sizes = parts.slice(1).map(Number);
                    break;
                  case 'TYPE':
                    types = parts.slice(1);
                    break;
                  case 'POINTS':
                    vertexCount = parseInt(parts[1]);
                    break;
                }
              });
              break;
            }
          }

          console.log('PCD Header Info:', {
            fields, sizes, types, vertexCount, headerLength
          });

          const points: Point[] = [];
          let offset = headerLength;

          // バイナリデータの読み取り
          for (let i = 0; i < vertexCount; i++) {
            const point: Point = {
              position: [0, 0, 0]
            };

            // x, y, z座標の読み取り
            for (let j = 0; j < 3; j++) {
              point.position[j] = view.getFloat32(offset + j * 4, true);
            }

            // デバッグ出力（最初の5点と最後の5点）
            if (i < 5 || i > vertexCount - 5) {
              console.log(`Point ${i}:`, {
                x: point.position[0],
                y: point.position[1],
                z: point.position[2]
              });
            }

            points.push(point);
            offset += 12; // 3 * 4 bytes (float32 * 3)
          }

          console.log(`Loaded ${points.length} points`);
          resolve({ points, name: file.name });

        } catch (error) {
          console.error('PCD parsing error:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }
}