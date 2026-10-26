"""Deterministic geographic interpretation of genuine forecast coordinates.

Position-region/coast intersections are geometric diagnostics, never landfall
probabilities, wind footprints or official warnings.
"""
import math
import numpy as np
from .geometry import unit_vector, to_lat_lon
from .official import coastal_region
from .publication import stamp

NAMES={'台湾附近':'Taiwan','浙江沿海附近':'Zhejiang coast','福建沿海附近':'Fujian coast','上海/江苏沿海附近':'Shanghai / Jiangsu coast',
       '日本九州附近':'Kyushu','日本四国附近':'Shikoku','日本本州附近':'Honshu','日本北海道附近':'Hokkaido','朝鲜半岛南部附近':'Southern Korea','琉球群岛附近':'Ryukyu Islands'}
R=6371.0088

def cap_area(radius):
    return 4*math.pi*R*R*math.sin(min(math.pi,radius/R)/2)**2 if radius is not None and math.isfinite(radius) and radius>=0 else None

def segment_distance(point,a,b):
    """Minimum spherical distance to short minor arcs, vectorized over segments."""
    cross=np.cross(a,b);length=np.linalg.norm(cross,axis=1);normal=cross/np.maximum(length[:,None],1e-15)
    dot=normal@point;projection=point-dot[:,None]*normal;norm=np.linalg.norm(projection,axis=1)
    w=projection/np.maximum(norm[:,None],1e-15)
    on=(length>1e-12)&(norm>1e-12)&(np.einsum('ij,ij->i',np.cross(a,w),normal)>=-1e-12)&(np.einsum('ij,ij->i',np.cross(w,b),normal)>=-1e-12)
    da=np.arccos(np.clip(a@point,-1,1));db=np.arccos(np.clip(b@point,-1,1))
    distances=np.where(on,np.arcsin(np.clip(np.abs(dot),0,1)),np.minimum(da,db))*R
    locations=np.where(on[:,None],w,np.where((da<db)[:,None],a,b))
    index=int(np.argmin(distances));return float(distances[index]),locations[index]

class CoastalSectors:
    def __init__(self,coast):
        self.coast=coast;groups={}
        for ring,bounds in coast.rings:
            if bounds[2]<110 or bounds[0]>155 or bounds[3]<18 or bounds[1]>48:continue
            # Identify major islands by their actual polygon. Overlapping
            # rectangular labels otherwise misname western Shikoku as Kyushu.
            island=None
            for name,lat,lon in [('Kyushu',32.8,130.7),('Shikoku',33.8,133.4),('Honshu',36,138),('Hokkaido',43.5,142.5),('Taiwan',23.8,120.9)]:
                if bounds[0]<=lon<=bounds[2] and bounds[1]<=lat<=bounds[3]:
                    from .official import Coast
                    if Coast([ring.tolist()]).land(lat,lon):island=name;break
            for (lo,la),(lo2,la2) in zip(ring,np.roll(ring,-1,axis=0)):
                if abs(lo-lo2)>10 or abs(la-la2)>10:continue
                name=island or NAMES.get(coastal_region((la+la2)/2,(lo+lo2)/2))
                if name:groups.setdefault(name,[]).append((unit_vector(la,lo),unit_vector(la2,lo2)))
        self.groups={name:(np.array(v)[:,0],np.array(v)[:,1]) for name,v in groups.items()}
    def describe(self,lat,lon,radius=None):
        p=unit_vector(lat,lon);rows=[]
        for name,(a,b) in self.groups.items():
            distance,location=segment_distance(p,a,b);la,lo=to_lat_lon(location)
            rows.append(dict(sector=name,distance_km=distance,nearest_coast_lat_deg=la,nearest_coast_lon_deg=lo))
        rows.sort(key=lambda r:r['distance_km'])
        return dict(centre_on_land=bool(self.coast.land(lat,lon)),nearest_coast=rows[0] if rows else None,
                    position_region_coastal_sectors=[r for r in rows if radius is not None and r['distance_km']<=radius])

def build_analysis(payload,coast):
    geography=CoastalSectors(coast);paths=[]
    base=next((p for p in payload['model']['paths'] if p['model_id']=='TabPFN CV-F2'),None)
    for path in payload['model']['paths']:
        rows=[];previous=path.get('anchor')
        for q in sorted(path['points'],key=lambda q:q['lead_h']):
            row={k:q[k] for k in ['valid_time_utc','lead_h','lat_deg','lon_deg']};radius=q.get('radius_90_km')
            row.update(geography.describe(q['lat_deg'],q['lon_deg'],radius));row.update(radius_90_km=radius,issued_area_90_km2=cap_area(radius))
            if previous:
                hours=(stamp(q['valid_time_utc'])-stamp(previous['valid_time_utc'])).total_seconds()/3600
                if hours>0:row['translation_speed_kmh']=float(np.arccos(np.clip(unit_vector(previous['lat_deg'],previous['lon_deg'])@unit_vector(q['lat_deg'],q['lon_deg']),-1,1))*R/hours)
            if base and stamp(path['issue_time_utc'])==stamp(base['issue_time_utc']):
                b=next((p for p in base['points'] if p['lead_h']==q['lead_h'] and stamp(p['valid_time_utc'])==stamp(q['valid_time_utc'])),None)
                if b:
                    row['displacement_from_baseline_km']=float(np.arccos(np.clip(unit_vector(b['lat_deg'],b['lon_deg'])@unit_vector(q['lat_deg'],q['lon_deg']),-1,1))*R)
                    ba=cap_area(b.get('radius_90_km'))
                    if ba and row['issued_area_90_km2'] is not None:row['issued_area_ratio_vs_baseline']=row['issued_area_90_km2']/ba
            rows.append(row);previous=q
        crossings=[]
        for crossing in path.get('landfall_candidates',[]):
            nearest=geography.describe(crossing['lat_deg'],crossing['lon_deg'])['nearest_coast']
            crossings.append(dict(crossing,sector=nearest['sector'] if nearest else NAMES.get(crossing.get('region'),'Other coast')))
        paths.append(dict(model_id=path['model_id'],issue_time_utc=path['issue_time_utc'],generated_at_utc=path.get('generated_at_utc'),points=rows,coastal_crossings=crossings))
    # A derived version clock must be stable for an identical public snapshot;
    # a wall-clock timestamp would create a new Git commit on every no-op save.
    clock=max([stamp(payload['last_checked_at_utc'])]+[stamp(p.get('generated_at_utc')) for p in payload['model']['paths']])
    return dict(schema=1,as_of_utc=clock.isoformat(),method='Shortest spherical distance to Natural Earth 1:50m coastal segments; approximate named sectors',
                interpretation='Endpoint position-region/coast overlap is not a landfall probability or a wind/rain impact forecast. Translation speed is not wind speed.',paths=paths)
