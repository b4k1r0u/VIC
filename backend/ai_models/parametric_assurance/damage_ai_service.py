"""
damage_ai_service.py
Service de damage assessment mis à jour pour MobileNetV3-Small
(le modèle généré par train_damage_ai_metadata_only.py)
"""

import io
import uuid
import os
import numpy as np
from PIL import Image

import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
import torchvision.transforms as T


# ─────────────────────────────────────────────────────────────
# MODÈLE — doit matcher exactement ce qui a été entraîné
# ─────────────────────────────────────────────────────────────
def build_model() -> nn.Module:
    model = mobilenet_v3_small(weights=None)  # pas de download, on charge nos poids
    in_f  = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_f, 4)
    return model


# ─────────────────────────────────────────────────────────────
# SERVICE PRINCIPAL
# ─────────────────────────────────────────────────────────────
class DamageAIService:

    DAMAGE_CLASSES   = {0: "No Damage", 1: "Minor Damage", 2: "Major Damage", 3: "Destroyed"}
    LOSS_MULTIPLIERS = {0: 0.00, 1: 0.10, 2: 0.45, 3: 0.85}
    DAMAGE_COLORS    = {
        0: [0,   255, 0  ],   # Vert   — No damage
        1: [255, 255, 0  ],   # Jaune  — Minor
        2: [255, 128, 0  ],   # Orange — Major
        3: [255, 0,   0  ],   # Rouge  — Destroyed
    }

    def __init__(self):
        self.model  = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = T.Compose([
            T.Resize((64, 64)),          # même taille que l'entraînement
            T.ToTensor(),
            T.Normalize([0.485, 0.456, 0.406],
                        [0.229, 0.224, 0.225])
        ])

    # ── Charger le modèle ────────────────────────────────────
    def load_model(self, model_path: str = "ml_models/damage_cnn.pt"):
        self.model = build_model()
        state_dict = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()
        print(f"✅ damage_cnn.pt chargé sur {self.device}")

    # ── Point d'entrée principal ─────────────────────────────
    def estimate_damage(
        self,
        image_bytes: bytes,
        image_type: str       = "satellite",
        area_km2: float       = 1.0,
        construction_type: str = "Béton armé",
        zone_sismique: str    = "IIb",
    ) -> dict:

        # Charger l'image
        image    = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(image)

        if self.model is not None:
            breakdown, damage_map = self._run_model(image, img_array)
            confidence = 0.70
            is_mock    = False
        else:
            breakdown, damage_map = self._mock_estimate(zone_sismique, construction_type)
            confidence = 0.0
            is_mock    = True

        # Classe dominante
        dominant = max(range(4), key=lambda i: list(breakdown.values())[i])

        # Calcul des pertes
        loss_pct     = sum(
            breakdown.get(cls, 0) * self.LOSS_MULTIPLIERS[i]
            for i, cls in self.DAMAGE_CLASSES.items()
        )
        avg_value    = self._avg_value_per_km2(construction_type)
        loss_per_km2 = loss_pct * avg_value
        total_loss   = loss_per_km2 * area_km2

        # Heatmap
        heatmap_url = self._generate_heatmap(img_array, damage_map)

        return {
            "damage_class":      dominant,
            "damage_label":      self.DAMAGE_CLASSES[dominant],
            "loss_percentage":   round(loss_pct, 4),
            "loss_per_km2_dzd":  round(loss_per_km2, 0),
            "total_loss_dzd":    round(total_loss, 0),
            "confidence":        confidence,
            "is_mock":           is_mock,
            "heatmap_url":       heatmap_url,
            "affected_area_km2": area_km2,
            "breakdown":         {cls: round(v, 3) for cls, v in breakdown.items()},
        }

    # ── Inférence CNN ────────────────────────────────────────
    def _run_model(self, image: Image.Image, img_array: np.ndarray):
        """
        Découpe l'image en patches 64×64, prédit chaque patch,
        réassemble une damage_map.
        """
        W, H     = image.size
        patch_sz = 64
        stride   = 32

        patches = []
        coords  = []

        for y in range(0, max(1, H - patch_sz + 1), stride):
            for x in range(0, max(1, W - patch_sz + 1), stride):
                crop = image.crop((x, y, x + patch_sz, y + patch_sz))
                patches.append(self.transform(crop))
                coords.append((y, x))

        # Si l'image est plus petite qu'un patch → 1 seul patch
        if not patches:
            patches.append(self.transform(image.resize((patch_sz, patch_sz))))
            coords.append((0, 0))

        # Batch inference
        batch = torch.stack(patches).to(self.device)
        with torch.no_grad():
            logits = self.model(batch)
            preds  = logits.argmax(dim=1).cpu().numpy()

        # Réassembler damage_map
        damage_map = np.zeros((H, W), dtype=np.float32)
        count_map  = np.zeros((H, W), dtype=np.float32)
        for pred, (y, x) in zip(preds, coords):
            y2 = min(H, y + patch_sz)
            x2 = min(W, x + patch_sz)
            damage_map[y:y2, x:x2] += pred
            count_map [y:y2, x:x2] += 1

        count_map  = np.where(count_map == 0, 1, count_map)
        damage_map = damage_map / count_map

        # Breakdown
        total     = len(preds)
        breakdown = {
            cls: int((preds == i).sum()) / total
            for i, cls in self.DAMAGE_CLASSES.items()
        }

        return breakdown, damage_map

    # ── Mock (si pas de modèle chargé) ──────────────────────
    def _mock_estimate(self, zone: str, construction_type: str):
        zone_sev  = {"0": 0, "I": 1, "IIa": 2, "IIb": 3, "III": 4}
        sev       = zone_sev.get(zone, 1) / 4.0
        vuln_map  = {
            "Maçonnerie creuse":   0.85,
            "Maçonnerie chaînée":  0.55,
            "Béton armé":          0.35,
            "Structure métallique":0.20,
        }
        vuln     = vuln_map.get(construction_type, 0.60)
        combined = sev * 0.6 + vuln * 0.4

        breakdown = {
            "No Damage":    max(0.0, 1.0 - combined * 1.2),
            "Minor Damage": min(0.40, combined * 0.5),
            "Major Damage": min(0.35, combined * 0.5 - 0.1),
            "Destroyed":    max(0.0, combined * 0.3 - 0.1),
        }
        # Normaliser
        total = sum(breakdown.values())
        breakdown = {k: v / total for k, v in breakdown.items()}

        # Damage map synthétique
        H, W   = 512, 512
        y, x   = np.mgrid[-H//2:H//2, -W//2:W//2]
        dist   = np.sqrt(x**2 + y**2) / (H // 2)
        damage_map = np.clip(combined * (1 - dist) * 3, 0, 3)

        return breakdown, damage_map

    # ── Heatmap ──────────────────────────────────────────────
    def _generate_heatmap(self, original: np.ndarray, damage_map: np.ndarray) -> str:
        try:
            import cv2
        except ImportError:
            return "/uploads/heatmaps/unavailable.jpg"

        H_orig, W_orig = original.shape[:2]
        damage_resized  = cv2.resize(
            damage_map.astype(np.float32), (W_orig, H_orig)
        )

        color_map = np.zeros((H_orig, W_orig, 3), dtype=np.uint8)
        for cls_idx, color in self.DAMAGE_COLORS.items():
            mask = (damage_resized >= cls_idx - 0.5) & (damage_resized < cls_idx + 0.5)
            color_map[mask] = color

        overlay  = original.copy()
        alpha    = 0.45
        heatmap  = cv2.addWeighted(overlay, 1 - alpha, color_map, alpha, 0)

        os.makedirs("uploads/heatmaps", exist_ok=True)
        filename = f"uploads/heatmaps/{uuid.uuid4().hex}.jpg"
        cv2.imwrite(filename, cv2.cvtColor(heatmap, cv2.COLOR_RGB2BGR))
        return f"/{filename}"

    @staticmethod
    def _avg_value_per_km2(construction_type: str) -> float:
        return {
            "Maçonnerie creuse":    150_000_000,
            "Maçonnerie chaînée":   200_000_000,
            "Béton armé":           350_000_000,
            "Structure métallique": 500_000_000,
        }.get(construction_type, 200_000_000)

