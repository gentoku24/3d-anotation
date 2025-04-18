import numpy as np
import open3d as o3d
from sklearn.cluster import DBSCAN
import json

def load_pointcloud(file_path):
    pcd = o3d.io.read_point_cloud(file_path)
    return np.asarray(pcd.points)

def cluster_and_generate_bboxes(points, eps=0.5, min_samples=10):
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(points)
    labels = clustering.labels_
    unique_labels = set(labels)
    bboxes = []

    for label in unique_labels:
        if label == -1:
            continue  # noise
        cluster_points = points[labels == label]
        min_pt = np.min(cluster_points, axis=0)
        max_pt = np.max(cluster_points, axis=0)
        center = ((min_pt + max_pt) / 2).tolist()
        size = (max_pt - min_pt).tolist()
        bbox = {
            "center": center,
            "dimensions": size,
            "rotation": {"yaw": 0.0}  # 簡略化のため yaw = 0
        }
        bboxes.append(bbox)

    return bboxes

def save_bboxes_to_json(bboxes, output_path):
    with open(output_path, 'w') as f:
        json.dump(bboxes, f, indent=2)

if __name__ == '__main__':
    import sys
    pcd_path = sys.argv[1]  # 例: data/0001/lidar.pcd
    out_path = sys.argv[2]  # 例: data/0001/auto_bboxes.json

    pts = load_pointcloud(pcd_path)
    bboxes = cluster_and_generate_bboxes(pts)
    save_bboxes_to_json(bboxes, out_path)
