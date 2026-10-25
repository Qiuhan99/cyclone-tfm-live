"""Spherical geometry primitives for tropical-cyclone trajectory residuals.

All internal angles are radians; distances and tangent-vector components
are kilometres. Longitude is normalised to [-180, 180). Latitude to
[-90, 90].

Design notes (master prompt §2.3):
- Log/Exp maps use the local East-North tangent frame of the ANCHOR point.
- The antipodal ambiguity is guarded explicitly: Log raises
  AntipodalError when the pair is closer to antipodal than
  ``ANTIPODAL_TOL_RAD``; callers must count and report such cases.
- Great-circle continuation (constant angular speed) is implemented with an
  exact axis rotation (Rodrigues), not repeated bearing stepping, so it is
  a true geodesic extrapolation of the last two fixes.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

R_EARTH_KM = 6371.0088
ANTIPODAL_TOL_RAD = 1e-9
EPS = 1e-12


class AntipodalError(ValueError):
    """Raised when sphere Log is evaluated at (near-)antipodal points."""


# ---------------------------------------------------------------- conversion


def normalize_lon(lon: float) -> float:
    """Normalise longitude to [-180, 180)."""
    lon = math.fmod(lon + 180.0, 360.0)
    if lon < 0:
        lon += 360.0
    return lon - 180.0


def normalize_lat(lat: float) -> float:
    return max(-90.0, min(90.0, float(lat)))


def unit_vector(lat_deg: float, lon_deg: float) -> np.ndarray:
    """Latitude/longitude (degrees) -> unit vector on S^2 (ECEF)."""
    lat = math.radians(normalize_lat(lat_deg))
    lon = math.radians(normalize_lon(lon_deg))
    return np.array(
        [
            math.cos(lat) * math.cos(lon),
            math.cos(lat) * math.sin(lon),
            math.sin(lat),
        ]
    )


def to_lat_lon(v: np.ndarray) -> tuple[float, float]:
    """Unit vector -> (lat_deg, lon_deg) with lon in [-180, 180)."""
    n = np.linalg.norm(v)
    if n < EPS:
        raise ValueError("zero vector has no spherical coordinates")
    v = v / n
    lat = math.degrees(math.asin(max(-1.0, min(1.0, float(v[2])))))
    lon = math.degrees(math.atan2(float(v[1]), float(v[0])))
    return lat, normalize_lon(lon)


def angular_distance(p: np.ndarray, q: np.ndarray) -> float:
    """Central angle in radians between two unit vectors, in [0, pi].

    Uses atan2(|p x q|, p.q): numerically stable at both small angles and
    near pi (acos of a dot product loses ~8 orders of magnitude near 0).
    """
    c = float(np.dot(p, q))
    s = float(np.linalg.norm(np.cross(p, q)))
    return math.atan2(s, c)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km (input degrees, dateline-safe)."""
    p = unit_vector(lat1, lon1)
    q = unit_vector(lat2, lon2)
    return R_EARTH_KM * angular_distance(p, q)


# ------------------------------------------------------------------- frames


def enu_frame(p: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Orthonormal (east, north) tangent basis at unit vector ``p``."""
    lat, lon = to_lat_lon(p)
    la, lo = math.radians(lat), math.radians(lon)
    east = np.array([-math.sin(lo), math.cos(lo), 0.0])
    north = np.array(
        [-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)]
    )
    return east, north


def initial_bearing_rad(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Initial great-circle bearing from point 1 to point 2 (radians, [0, 2pi))."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlon = math.radians(normalize_lon(lon2 - lon1))
    x = math.sin(dlon) * math.cos(phi2)
    y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlon)
    return math.atan2(x, y) % (2.0 * math.pi)


# ---------------------------------------------------------------- Log / Exp


def sphere_log(p: np.ndarray, q: np.ndarray) -> np.ndarray:
    """Tangent vector at ``p`` pointing to ``q``; returns (east_km, north_km).

    Uses the direct projection of the tangent component (better conditioned
    than a bearing round-trip). Raises AntipodalError within
    ANTIPODAL_TOL_RAD of pi (the tangent component degenerates there).
    """
    delta = angular_distance(p, q)
    if abs(delta - math.pi) < ANTIPODAL_TOL_RAD:
        raise AntipodalError("sphere_log undefined at antipodal points")
    v = q - float(np.dot(p, q)) * p  # tangent component: sin(delta) * unit direction
    v_norm = float(np.linalg.norm(v))
    if v_norm < 1e-15:
        return np.zeros(2)  # coincident points
    east, north = enu_frame(p)
    r = R_EARTH_KM * delta
    u = v / v_norm
    return np.array([r * float(u @ east), r * float(u @ north)])


def sphere_exp(p: np.ndarray, tangent_km: np.ndarray) -> np.ndarray:
    """Exp map: unit vector ``p`` transported along tangent (east_km, north_km)."""
    de, dn = float(tangent_km[0]), float(tangent_km[1])
    r = math.hypot(de, dn)
    if r < EPS:
        return p / np.linalg.norm(p)
    beta = math.atan2(de, dn)
    delta = r / R_EARTH_KM
    lat1, lon1 = to_lat_lon(p)
    phi1, lam1 = math.radians(lat1), math.radians(lon1)
    sph, cph = math.sin(delta), math.cos(delta)
    phi2 = math.asin(max(-1.0, min(1.0, math.sin(phi1) * cph + math.cos(phi1) * sph * math.cos(beta))))
    lam2 = lam1 + math.atan2(
        math.sin(beta) * sph * math.cos(phi1),
        cph - math.sin(phi1) * math.sin(phi2),
    )
    return unit_vector(math.degrees(phi2), math.degrees(lam2))


def log_exp_roundtrip_error_km(p: np.ndarray, q: np.ndarray) -> float:
    """||q - Exp_p(Log_p(q))|| in km; ~0 within numerical tolerance."""
    v = sphere_log(p, q)
    q2 = sphere_exp(p, v)
    return R_EARTH_KM * angular_distance(q, q2)


# ------------------------------------------------- constant-velocity baseline


@dataclass(frozen=True)
class GreatCircleContinuation:
    """Constant angular-speed great-circle motion through the last two fixes."""

    axis: np.ndarray  # unit rotation axis
    theta: float  # angular step per forecast interval (radians)
    anchor: np.ndarray  # last observed position (unit vector)

    @classmethod
    def from_two_fixes(cls, p_prev: np.ndarray, p_last: np.ndarray) -> "GreatCircleContinuation | None":
        axis = np.cross(p_prev, p_last)
        n = np.linalg.norm(axis)
        theta = angular_distance(p_prev, p_last)
        if n < 1e-12 or theta < 1e-12:
            return None  # stationary or antipodal -> fall back to persistence
        return cls(axis=axis / n, theta=theta, anchor=p_last)

    def position_at(self, h: int) -> np.ndarray:
        """Forecast position h forecast-steps (6 h) ahead of the anchor."""
        return _rotate_rodriques(self.anchor, self.axis, h * self.theta)


def _rotate_rodriques(v: np.ndarray, axis: np.ndarray, angle: float) -> np.ndarray:
    c, s = math.cos(angle), math.sin(angle)
    return v * c + np.cross(axis, v) * s + axis * np.dot(axis, v) * (1.0 - c)
