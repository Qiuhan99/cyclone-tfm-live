"""Published NMC facts and geometric coastal diagnostics, never invented warnings."""
from html.parser import HTMLParser
from datetime import datetime, timezone, timedelta
import math, re
import numpy as np
from .geometry import unit_vector, sphere_log, sphere_exp, to_lat_lon


class Text(HTMLParser):
    def __init__(self):super().__init__();self.parts=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.skip+=1
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.skip=max(0,self.skip-1)
    def handle_data(self,data):
        if not self.skip and data.strip():self.parts.append(data.strip())


def visible_text(html):
    p=Text();p.feed(html);return re.sub(r'\s+',' ', ' '.join(p.parts))


def hazard_facts(text,kind):
    """Rephrase numerical/geographical facts rather than republish the bulletin."""
    if not text:return None
    places=[x for x in ['黄海南部','东海','台湾海峡','台湾以东','长江口','杭州湾','江苏沿海','浙江沿海','福建北部沿海','台湾东部沿海','上海','浙江中东部','台湾中北部','浙江东北部'] if x in text]
    window=re.search(r'(\d+)日(\d+)时至(\d+)日(\d+)时',text)
    parts=[]
    if window:parts.append(f'公报时段：{window[1]}日{window[2]}时—{window[3]}日{window[4]}时（北京时间）')
    if places:parts.append('涉及区域：'+'、'.join(places))
    if kind=='wind':
        ranges=re.findall(r'(\d+)[-～](\d+)级(?:大风)?[、，]阵风(\d+)[-～](\d+)级',text)
        if ranges:parts.append('分区持续风/阵风：'+'；'.join(f'{a}–{b}级 / {c}–{d}级' for a,b,c,d in ranges))
        parts.append('各分区及台风核心附近的差别请查看官方原报')
    else:
        amount=re.search(r'(\d+)[～~—-](\d+)毫米',text)
        if amount:parts.append(f'局地预报雨量：{amount[1]}–{amount[2]}毫米')
    return '；'.join(parts)+'。'


def nmc_center(html, retrieved_at):
    text=visible_text(html)
    # Select the bulletin body, not a navigation link or unrelated cyclone.
    text=text[text.find('2026年总'):] if '2026年总' in text else text
    if not re.search(r'蔷琵.{0,20}CHAMPI',text):raise ValueError('NMC current bulletin is not CHAMPI')
    stamp=re.search(r'中央气象台\s*(\d+)月(\d+)日(\d+)时(?:(\d+)分)?',text)
    if not stamp:raise ValueError('missing NMC publication date')
    now=datetime.fromisoformat(retrieved_at);local=now.astimezone(timezone(timedelta(hours=8)))
    month,day,hour,minute=[int(v or 0) for v in stamp.groups()]
    issued=datetime(local.year,month,day,hour,minute,tzinfo=local.tzinfo)
    fix=re.search(r'时\s*间[：:]?\s*(\d+)\s*日\s*(\d+)\s*时',text)
    valid=issued.replace(day=int(fix[1]),hour=int(fix[2]),minute=0) if fix else issued.replace(minute=0)
    if issued>local+timedelta(minutes=5):raise ValueError('future-dated bulletin')
    pos=re.search(r'中心位置[：:]?\s*北纬([\d.]+)度[、，, ]+东经([\d.]+)度',text)
    wind=re.search(r'最大风力[：:]?\s*(\d+)级[，, ]+\s*([\d.]+)米/秒',text)
    pressure=re.search(r'中心气压[：:]?\s*([\d.]+)\s*hPa',text,re.I)
    intensity=re.search(r'强度等级[：:]?\s*([^\s]+)',text)
    movement=re.search(r'预报结论[：:]?\s*(.*?)(?:[（(]下次|$)',text)
    if not pos or not wind:raise ValueError('incomplete NMC center facts')
    lat,lon=map(float,pos.groups());assert -90<=lat<=90 and -180<=lon<=180
    compact=re.sub(r'\s+','',text);radii={}
    for level in ['七','十','十二']:
        match=re.search(level+r'级风圈半径.*?东北方向(\d+)公里[；;]?东南方向(\d+)公里[；;]?西南方向(\d+)公里[；;]?西北方向(\d+)公里',compact)
        if match:radii[level]=list(map(int,match.groups()))
    motion=re.search(r'每小时\s*(\d+)\s*[-—]\s*(\d+)\s*公里的速度向\s*(.+?)\s*方向移动',text)
    movement_fact=f'移动方向：{motion[3]}；速度：{motion[1]}–{motion[2]} km/h'+('；强度趋势：逐渐减弱' if '强度逐渐减弱' in text else '') if motion else None
    return dict(storm_id='CHAMPI_2026',agency='中央气象台',issued_at_utc=issued.astimezone(timezone.utc).isoformat(),
                valid_time_utc=valid.astimezone(timezone.utc).isoformat(),lat_deg=lat,lon_deg=lon,
                vmax_ms=float(wind[2]),wind_force=int(wind[1]),intensity=intensity[1] if intensity else None,
                mslp_hpa=float(pressure[1]) if pressure else None,movement=movement_fact,
                wind_radii_km_NE_SE_SW_NW=radii,
                wind_averaging_period='原快讯未明确标注，不与ATCF风速直接合并',stale_after_hours=3)


def nmc_warning(html,retrieved_at):
    text=re.sub(r'\s+','',visible_text(html))
    stamp=re.search(r'(20\d{2})\s*年\s*(\d+)\s*月\s*(\d+)\s*日\s*(\d+)\s*时',text)
    if not stamp:raise ValueError('missing warning date')
    local=datetime(*map(int,stamp.groups()),tzinfo=timezone(timedelta(hours=8)))
    if local>datetime.fromisoformat(retrieved_at)+timedelta(minutes=5):raise ValueError('future-dated warning')
    warning=re.search(r'中央气象台\s*\d+月\d+日\d+时\s*(继续)?发布台风(蓝色|黄色|橙色|红色)预警',text)
    if not warning or '蔷琵' not in text:raise ValueError('no verified CHAMPI warning; unknown, not no-warning')
    # Concise factual extracts retain attribution. No derived alert color.
    trajectory=re.search(r'预计[，,]?(.*?)(?=大风预报)',text)
    wind=re.search(r'大风预报[：:](.*?)(?=降水预报)',text)
    rain=re.search(r'降水预报[：:](.*?)(?=防御指南|展开阅读全文|$)',text)
    outlook=[]
    if trajectory:
        raw=trajectory[1]
        if '浙江东部近海' in raw:outlook.append('预计接近浙江东部近海')
        if '转向东北' in raw:outlook.append('随后转向东北')
        if '日本西南部' in raw:outlook.append('后续关注日本西南部沿海')
        if '登陆' in raw:outlook.append('原报提及登陆可能，具体地区与条件须查原报')
        elif outlook:outlook.append('这份公报未确认具体登陆点')
    return dict(agency='中央气象台',jurisdiction='中国国家级台风预警；不等同各市县信号或香港风球',
                color=warning[2],issued_at_utc=local.astimezone(timezone.utc).isoformat(),stale_after_hours=12,
                trajectory='；'.join(outlook)+'。' if outlook else None,
                wind_forecast=hazard_facts(wind[1],'wind') if wind else None,rain_forecast=hazard_facts(rain[1],'rain') if rain else None,
                valid_window_note='风雨有效时段以原公报正文为准；警报解除状态须核查官方后续发布')


class Coast:
    def __init__(self,rings):
        self.rings=[]
        for raw in rings:
            a=np.asarray(raw,float)
            if len(a)<4:continue
            self.rings.append((a,(a[:,0].min(),a[:,1].min(),a[:,0].max(),a[:,1].max())))
    def land(self,lat,lon):
        for a,(x0,y0,x1,y1) in self.rings:
            if not (x0<=lon<=x1 and y0<=lat<=y1):continue
            x,y=a[:,0],a[:,1];xx,yy=np.roll(x,1),np.roll(y,1)
            edges=(y>lat)!=(yy>lat)
            den=yy-y;den=np.where(den==0,1.,den)
            if np.count_nonzero(edges & (lon<(xx-x)*(lat-y)/den+x))%2:return True
        return False
    def crossings(self,anchor,points):
        out=[];prev=anchor;was=self.land(prev['lat_deg'],prev['lon_deg'])
        for target in sorted(points,key=lambda p:p['lead_h']):
            p=unit_vector(prev['lat_deg'],prev['lon_deg']);q=unit_vector(target['lat_deg'],target['lon_deg']);v=sphere_log(p,q)
            n=max(1,math.ceil(np.linalg.norm(v)/3))
            start=datetime.fromisoformat(prev['valid_time_utc'].replace('Z','+00:00'));end=datetime.fromisoformat(target['valid_time_utc'].replace('Z','+00:00'))
            for j in range(1,n+1):
                lat,lon=to_lat_lon(sphere_exp(p,v*j/n));now=self.land(lat,lon)
                if now and not was:
                    out.append(dict(lat_deg=lat,lon_deg=lon,valid_time_utc=(start+(end-start)*j/n).isoformat(),region=coastal_region(lat,lon),resolution_km=3))
                was=now
            prev=target
        return out


def coastal_region(lat,lon):
    for label,(x0,y0,x1,y1) in [
        ('台湾附近',(119,21.5,122.5,25.6)),('浙江沿海附近',(119,27,123.6,31.5)),
        ('福建沿海附近',(116.5,23,121,28)),('上海/江苏沿海附近',(119,30.5,123.5,35.5)),
        ('日本九州附近',(128,30.5,132.5,34.5)),('日本四国附近',(132,32.4,135,34.7)),
        ('日本本州附近',(130.5,33,143,41.5)),('日本北海道附近',(139,41.5,146,46)),
        ('朝鲜半岛南部附近',(125,33.5,130,37)),('琉球群岛附近',(122.5,23.5,131,30.5))]:
        if x0<=lon<=x1 and y0<=lat<=y1:return label
    return '其他海岸（见交点坐标）'
