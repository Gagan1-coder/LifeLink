# backend/app/federated_learning/simulation.py
"""
Federated Learning Simulation for LifeLink AI
Task: Emergency Patient Triage & ICU Escalation Risk Prediction
Nodes: Hospital A (District Tertiary), Hospital B (Taluk Hospital), Hospital C (Rural Health Centre)
Algorithm: Federated Averaging (FedAvg)
Privacy Constraint: Raw clinical records remain strictly isolated on local hospital nodes.
"""

import math
import random
from typing import Dict, Any, List, Tuple

# Simple, highly performant Neural Network layer implemented in pure Python/NumPy for portability
# Compatible with PyTorch and Flower weight dictionary serialization

class NodeDataset:
    def __init__(self, node_id: str, name: str, sample_count: int, trauma_bias: float, cardiac_bias: float):
        self.node_id = node_id
        self.name = name
        self.sample_count = sample_count
        self.data: List[Tuple[List[float], int]] = []
        self._generate_local_dataset(trauma_bias, cardiac_bias)

    def _generate_local_dataset(self, trauma_bias: float, cardiac_bias: float):
        random.seed(42 + hash(self.node_id))
        for _ in range(self.sample_count):
            # Features:
            # 0: Age (0-100 / 100)
            # 1: Heart Rate (40-180 / 200)
            # 2: Systolic BP (60-220 / 250)
            # 3: Respiratory Rate (10-45 / 50)
            # 4: SpO2 (70-100 / 100)
            # 5: Trauma Score (1-5 / 5)
            # 6: GCS (3-15 / 15)
            age = random.uniform(0.1, 0.85)
            hr = random.uniform(0.3, 0.9)
            sbp = random.uniform(0.35, 0.85)
            rr = random.uniform(0.2, 0.8)
            spo2 = random.uniform(0.75, 0.99)
            trauma = min(1.0, max(0.1, random.uniform(0.1, 0.9) * trauma_bias))
            gcs = random.uniform(0.2, 1.0)

            # Clinical ICU / Resuscitation risk score
            risk_score = (
                0.25 * (1.0 - spo2) * 5.0 +
                0.25 * (1.0 - gcs) * 3.0 +
                0.20 * trauma * 2.5 +
                0.15 * (hr if hr > 0.65 else 0.2) +
                0.15 * (1.0 - sbp if sbp < 0.45 else 0.1) * cardiac_bias
            )
            label = 1 if risk_score > 0.72 else 0
            self.data.append(([age, hr, sbp, rr, spo2, trauma, gcs], label))

# Create 3 distinct non-IID hospital nodes
hospital_nodes = [
    NodeDataset("node_a", "Hospital A (Karwar District Tertiary)", sample_count=320, trauma_bias=1.4, cardiac_bias=1.2),
    NodeDataset("node_b", "Hospital B (Sirsi Taluk Hospital)", sample_count=240, trauma_bias=0.9, cardiac_bias=1.0),
    NodeDataset("node_c", "Hospital C (Kumta Community Health Centre)", sample_count=180, trauma_bias=0.6, cardiac_bias=0.8),
]

# Validation dataset (Hold-out evaluation set)
val_dataset = NodeDataset("val_global", "Central Validation Set", sample_count=150, trauma_bias=1.0, cardiac_bias=1.0)

def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, x))))

def evaluate_weights(weights: List[float], bias: float, dataset: List[Tuple[List[float], int]]) -> Tuple[float, float]:
    """Computes binary cross-entropy loss and accuracy on a given dataset"""
    if not dataset:
        return 0.0, 0.0
    total_loss = 0.0
    correct = 0

    for x, y in dataset:
        logit = sum(w * xi for w, xi in zip(weights, x)) + bias
        pred_prob = sigmoid(logit)
        pred_label = 1 if pred_prob >= 0.5 else 0
        if pred_label == y:
            correct += 1

        eps = 1e-7
        p = max(eps, min(1.0 - eps, pred_prob))
        loss = - (y * math.log(p) + (1 - y) * math.log(1 - p))
        total_loss += loss

    avg_loss = total_loss / len(dataset)
    accuracy = correct / len(dataset)
    return round(avg_loss, 4), round(accuracy, 4)

def local_train_step(
    weights: List[float],
    bias: float,
    node: NodeDataset,
    epochs: int = 3,
    lr: float = 0.08
) -> Tuple[List[float], float, float, float]:
    """Simulates local hospital model training using isolated local records"""
    current_w = list(weights)
    current_b = bias

    for _ in range(epochs):
        for x, y in node.data:
            logit = sum(w * xi for w, xi in zip(current_w, x)) + current_b
            pred = sigmoid(logit)
            err = pred - y

            # Stochastic gradient descent updates
            for j in range(len(current_w)):
                current_w[j] -= lr * err * x[j]
            current_b -= lr * err

    local_loss, local_acc = evaluate_weights(current_w, current_b, node.data)
    return current_w, current_b, local_loss, local_acc

def run_federated_training_rounds(total_rounds: int = 5) -> Dict[str, Any]:
    """
    Executes real Federated Averaging (FedAvg) aggregation over multiple rounds.
    Returns complete round-by-round convergence metrics.
    """
    num_features = 7
    # Initial global model weights
    random.seed(101)
    global_weights = [random.uniform(-0.2, 0.2) for _ in range(num_features)]
    global_bias = 0.0

    round_history: List[Dict[str, Any]] = []
    total_samples = sum(node.sample_count for node in hospital_nodes)

    for r in range(1, total_rounds + 1):
        client_updates: List[Tuple[List[float], float, int]] = []
        node_metrics: List[Dict[str, Any]] = []

        # Local training phase on each hospital node
        for node in hospital_nodes:
            loc_w, loc_b, loc_loss, loc_acc = local_train_step(
                global_weights, global_bias, node, epochs=3, lr=0.07 / (1.0 + 0.1 * r)
            )
            client_updates.append((loc_w, loc_b, node.sample_count))
            node_metrics.append({
                "node_id": node.node_id,
                "node_name": node.name,
                "local_samples": node.sample_count,
                "weight_contribution": round(node.sample_count / total_samples, 3),
                "local_loss": loc_loss,
                "local_accuracy": loc_acc,
            })

        # Federated Averaging (FedAvg) aggregation: w_global = sum((n_k / N) * w_k)
        new_global_w = [0.0] * num_features
        new_global_b = 0.0

        for loc_w, loc_b, n_k in client_updates:
            weight_factor = n_k / total_samples
            for j in range(num_features):
                new_global_w[j] += loc_w[j] * weight_factor
            new_global_b += loc_b * weight_factor

        global_weights = new_global_w
        global_bias = new_global_b

        # Global evaluation on validation set
        val_loss, val_acc = evaluate_weights(global_weights, global_bias, val_dataset.data)

        round_history.append({
            "round": r,
            "global_validation_loss": val_loss,
            "global_validation_accuracy": val_acc,
            "participating_nodes": len(hospital_nodes),
            "client_reports": node_metrics,
        })

    return {
        "status": "completed",
        "task": "Emergency ICU Risk & Triage Severity Classification",
        "algorithm": "Federated Averaging (FedAvg)",
        "total_rounds": total_rounds,
        "features": [
            "Age", "Heart Rate (BPM)", "Systolic BP", "Respiratory Rate",
            "Oxygen Saturation (SpO2)", "Trauma Severity Index", "Glasgow Coma Scale"
        ],
        "nodes": [
            {"id": n.node_id, "name": n.name, "records": n.sample_count}
            for n in hospital_nodes
        ],
        "round_history": round_history,
        "final_model": {
            "validation_accuracy": round_history[-1]["global_validation_accuracy"],
            "validation_loss": round_history[-1]["global_validation_loss"],
            "weights": [round(w, 4) for w in global_weights],
            "bias": round(global_bias, 4),
        },
        "privacy_guarantee": (
            "Zero Patient Data Transfer: Raw health records never left Hospital A, B, or C. "
            "Only gradient parameters were synchronized. Note: For enterprise deployment, "
            "Differential Privacy (DP) and Secure Multi-Party Computation (SMPC) should be added "
            "to mitigate potential model inversion leakage."
        )
    }
