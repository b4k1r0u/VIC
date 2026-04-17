"""
CatBoost Risk Classification package for RASED.

Exposes ml_service as the primary interface.
"""

from .ml_service import ml_service

__all__ = ["ml_service"]
