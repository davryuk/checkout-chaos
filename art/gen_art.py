# Check-Out Chaos pixel art generator (PIL, fixed palette). Run: python3 gen_art.py
from PIL import Image, ImageDraw, ImageFont
import os
OUT=os.path.dirname(os.path.abspath(__file__))
PAL=[ # name, hex, role
('OL','1a1020','outline'),
('SK1','ffd9b5','skin light L'),('SK2','f0a878','skin light M'),('SK3','b8684a','skin light D'),
('SD2','a8653a','skin tan M'),('SD3','6e3a1f','skin tan D'),
('HR1','4a3020','hair brown L'),('HR2','2a1a12','hair dark'),
('BL1','ffe46a','blonde/gold L'),('BL2','d89a28','blonde/gold D'),
('NV1','5a7cf0','navy L'),('NV2','2e44a8','navy M'),('NV3','1a2260','navy D'),
('RD1','ff6a52','red L'),('RD2','d42a3a','red M'),('RD3','7e1830','red D'),
('WH1','ffffff','white L'),('WH2','c8d0e4','white M'),('WH3','7e86a4','white D/gray'),
('GR1','5ae878','green L'),('GR2','1f8a4a','green D'),
('MG1','ff6ad8','magenta L'),('MG2','a42ca8','magenta D'),
('OR1','ffa53a','orange accent'),
('BR1','c27a42','brown L'),('BR2','74431f','brown D'),
('CH1','4a4e64','charcoal L'),('CH2','262838','charcoal D'),
('CY1','7ae8ff','cyan accent/glass'),
('PU1','8a5ae0','purple L'),('PU2','4e2a90','purple D'),
]
IDX={n:i+1 for i,(n,_,_) in enumerate(PAL)}  # 0 = transparent
RGB=[None]+[tuple(int(h[i:i+2],16) for i in (0,2,4)) for _,h,_ in PAL]

class C:
    def __init__(s,w=32,h=32): s.w,s.h=w,h; s.a=[[0]*w for _ in range(h)]
    def p(s,x,y,c):
        if 0<=x<s.w and 0<=y<s.h: s.a[y][x]=IDX[c] if c else 0
    def r(s,x,y,w,h,c):
        for j in range(h):
            for i in range(w): s.p(x+i,y+j,c)
    def outline(s):
        o=IDX['OL']; add=[]
        for y in range(s.h):
            for x in range(s.w):
                if s.a[y][x]==0 and any(0<=x+dx<s.w and 0<=y+dy<s.h and s.a[y+dy][x+dx] not in (0,o) for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): add.append((x,y))
        for x,y in add: s.a[y][x]=o
    def img(s):
        im=Image.new('RGBA',(s.w,s.h),(0,0,0,0))
        for y in range(s.h):
            for x in range(s.w):
                if s.a[y][x]: im.putpixel((x,y),RGB[s.a[y][x]]+(255,))
        return im

OVR={}
# frame params: idle0, idle1, walk0..3 -> (bob, legphase, armswing)
FR=[(0,0,0),(1,0,0),(0,1,1),(-1,0,0),(0,2,-1),(-1,0,0)]

def human(c,f,sp):
    sp=dict(sp); sp.update(OVR)
    bob,leg,arm=FR[f]; ox=sp.get('ox',0); y0=bob+sp.get('dy',0)
    sk=sp.get('skin',('SK1','SK2','SK3')); w=sp.get('wide',0)
    # legs / shoes
    pl,pd=sp['pants']; sh=sp.get('shoes','HR2')
    for side,lx in ((0,12+ox),(1,17+ox)):
        up = (leg==1 and side==0) or (leg==2 and side==1)
        ln=4 if not up else 2; ly=24
        if leg and not up: lx2=lx+(-1 if side==0 else 1) if leg else lx
        else: lx2=lx
        c.r(lx2,ly,3,ln,pl); c.r(lx2+2,ly,1,ln,pd)
        c.r(lx2,ly+ln,3,2,sh)
    # body
    bl,bm,bd=sp['body']; bx=11-w+ox; bw=10+2*w
    c.r(bx,15+y0,bw,10,bm); c.r(bx,15+y0,2,9,bl); c.r(bx+bw-2,15+y0,2,10,bd); c.r(bx,23+y0,bw,2,bd)
    if sp.get('belt'): c.r(bx,22+y0,bw,1,sp['belt'])
    if sp.get('extra_body'): sp['extra_body'](c,bx,15+y0,bw)
    # arms
    for side,ax in ((0,bx-2),(1,bx+bw)):
        ay=16+y0+(arm if side==0 else -arm)
        c.r(ax,ay,2,6,bm if side==0 else bd); c.r(ax,ay+6,2,2,sk[1])
    hand=(bx+bw,16+y0-arm+6)
    # head (big chibi)
    hx=10+ox; hy=4+y0
    c.r(hx,hy,12,11,sk[0]); c.r(hx+9,hy,3,11,sk[1]); c.r(hx,hy+10,12,1,sk[2])
    c.r(hx+3,hy+5,2,3,'OL'); c.r(hx+8,hy+5,2,3,'OL'); c.p(hx+3,hy+5,'WH1'); c.p(hx+8,hy+5,'WH1')
    c.r(hx+2,hy+8,2,1,'MG1') if sp.get('blush') else None
    if sp.get('angry'): c.r(hx+2,hy+4,3,1,'OL'); c.r(hx+8,hy+4,3,1,'OL'); c.p(hx+4,hy+3,'OL'); c.p(hx+8,hy+3,'OL'); c.r(hx+5,hy+9,3,1,'RD3')
    else: c.r(hx+5,hy+9,2,1,sk[2])
    sp['hair'](c,hx,hy)
    if sp.get('prop'): sp['prop'](c,hand[0],hand[1],f,y0)

def hair_short(a,b):
    def h(c,x,y): c.r(x-1,y-1,14,4,a); c.r(x-1,y+3,2,4,a); c.r(x+11,y+3,2,4,b); c.r(x+8,y-1,5,4,b); c.r(x+2,y,3,1,'WH3' if a=='WH2' else a)
    return h
def hair_bun(a,b):
    def h(c,x,y): hair_short(a,b)(c,x,y); c.r(x+3,y-4,6,3,a); c.r(x+7,y-4,2,3,b)
    return h

# ---- props
def tie(col):
    return lambda c,x,y,w: (c.r(x+w//2-1,y,2,6,col), c.r(x+w//2-2,y,4,1,'WH1'))
def p_bell(c,x,y,f,b): c.r(x-1,y-2,4,1,'BL2'); c.r(x,y-4,2,2,'BL1'); c.p(x+1,y-5,'BL2')
def p_duster(c,x,y,f,b):
    c.r(x,y-6,1,7,'BR2'); s=f%2
    c.r(x-2+s,y-11,5,5,'MG1'); c.r(x-1+s,y-12,3,1,'MG1'); c.r(x+1+s,y-9,2,3,'MG2'); c.r(x-1,y-8,1,1,'OR1')
def p_cart(c,x,y,f,b):
    c.r(x,y-1,1,9,'WH3'); c.r(x+1,y+2,6,1,'BL2'); c.r(x+1,y+3,5,4,'RD2'); c.r(x+1,y+3,5,1,'RD1'); c.r(x+3,y+3,1,4,'BL1')
    c.r(x+1,y+8,6,1,'BL2'); c.p(x+1,y+9,'CH2'); c.p(x+6,y+9,'CH2')
def p_ladle(c,x,y,f,b):
    c.r(x+1,y-9,1,10,'WH3'); c.r(x,y-11,3,3,'WH2'); c.r(x,y-11,3,1,'WH1'); c.p(x+2,y-10,'WH3')
    if f%2: c.p(x+1,y-13,'WH2'); c.p(x+3,y-14,'WH2')
def p_wrench(c,x,y,f,b): c.r(x,y-7,2,8,'WH3'); c.r(x-1,y-10,4,3,'WH2'); c.r(x,y-10,2,1,0); c.p(x+2,y-9,'WH3')
def p_lantern(c,x,y,f,b):
    c.r(x,y-1,1,2,'CH1'); c.r(x-1,y+1,3,4,'BL2'); c.r(x,y+2,1,2,'BL1' if f%2==0 else 'OR1'); c.r(x-1,y+5,3,1,'CH1')
def p_suitcase(c,x,y,f,b):
    c.r(x,y-1,6,8,'BR1'); c.r(x+4,y-1,2,8,'BR2'); c.r(x,y+2,6,1,'BL1'); c.r(x+2,y-3,2,2,'BR2'); c.r(x+1,y,1,1,'MG1'); c.r(x+3,y+4,1,1,'CY1')
def p_point(c,x,y,f,b): c.r(x,y-6,2,5,'PU1'); c.r(x+1,y-9,3,3,'SK2'); c.r(x+3,y-12,1,4,'SK1'); c.r(x+2,y-9,1,1,'SK1')  # raised arm pointing
def p_clip(c,x,y,f,b):
    c.r(x-1,y-4,6,8,'BR1'); c.r(x,y-3,4,6,'WH1'); c.r(x+1,y-5,2,1,'WH3')
    for i in range(3): c.p(x,y-2+i*2,'RD2'); c.r(x+1,y-2+i*2,3,1,'CH1')

R=lambda: ('RD1','RD2','RD3'); N=lambda: ('NV1','NV2','NV3'); Wt=lambda: ('WH1','WH2','WH3')
UNITS={}
def unit(name,size=32):
    def d(fn): UNITS[name]=(fn,size); return fn
    return d

@unit('player_recepcionista')
def _(c,f):
    def eb(c,x,y,w): tie('RD2')(c,x,y,w); c.r(x+1,y+1,2,1,'BL1')  # name badge
    human(c,f,dict(body=N(),pants=('CH1','CH2'),hair=hair_bun('HR1','HR2'),extra_body=eb,prop=p_bell,blush=1))
@unit('player_housekeeping')
def _(c,f):
    def eb(c,x,y,w): c.r(x+2,y+3,w-4,7,'WH1'); c.r(x+w-4,y+3,2,7,'WH2'); c.r(x+3,y+2,w-6,1,'WH1')
    def hair(c,x,y): hair_short('HR2','HR2')(c,x,y); c.r(x-1,y-1,14,2,'WH1'); c.r(x+5,y-2,2,1,'WH1')
    human(c,f,dict(body=('GR1','GR2','GR2'),pants=('GR2','CH2'),hair=hair,extra_body=eb,prop=p_duster,skin=('SK2','SD2','SD3'),blush=1))
@unit('player_botones')
def _(c,f):
    def eb(c,x,y,w):
        for i in range(3): c.p(x+3,y+2+i*2,'BL1'); c.p(x+w-4,y+2+i*2,'BL1')
        c.r(x,y,w,1,'BL2')
    def hair(c,x,y): hair_short('HR1','HR2')(c,x,y); c.r(x+2,y-4,8,4,'RD2'); c.r(x+2,y-4,2,4,'RD1'); c.r(x+8,y-4,2,4,'RD3'); c.r(x+2,y-1,8,1,'BL1')
    human(c,f,dict(body=R(),pants=('RD3','CH2'),hair=hair,extra_body=eb,prop=p_cart))
@unit('player_cocinero')
def _(c,f):
    def eb(c,x,y,w):
        for i in range(2): c.p(x+3,y+2+i*3,'CH1'); c.p(x+w-4,y+2+i*3,'CH1')
        c.r(x+3,y,w-6,1,'RD2')
    def hair(c,x,y):
        c.r(x,y-1,12,2,'WH2'); c.r(x-1,y-6,14,5,'WH1'); c.r(x+1,y-8,10,2,'WH1'); c.r(x+9,y-7,3,6,'WH2'); c.r(x+4,y-7,1,5,'WH2')
        c.r(x+2,y+8,8,1,'HR2')  # mustache
    human(c,f,dict(body=Wt(),pants=('CH1','CH2'),hair=hair,extra_body=eb,prop=p_ladle,wide=1))
@unit('player_mantenimiento')
def _(c,f):
    def eb(c,x,y,w): c.r(x+2,y,2,8,'OR1'); c.r(x+w-4,y,2,8,'OR1'); c.r(x+2,y+4,w-4,1,'OR1')
    def hair(c,x,y): c.r(x-1,y-2,14,5,'BL1'); c.r(x+8,y-2,5,5,'BL2'); c.r(x-2,y+2,16,1,'BL2'); c.r(x+1,y+8,10,2,'BR2')
    human(c,f,dict(body=('NV1','NV2','NV3'),pants=('NV2','NV3'),hair=hair,extra_body=eb,prop=p_wrench,skin=('SK2','SD2','SD3'),belt='BR2'))
@unit('player_conserje_nocturno')
def _(c,f):
    def eb(c,x,y,w): c.r(x+w//2-1,y,2,9,'BL1'); c.r(x+1,y+1,2,2,'BL1')  # gold key pin
    def hair(c,x,y): hair_short('WH2','WH3')(c,x,y); c.r(x+2,y+5,3,1,'CH2'); c.r(x+7,y+5,3,1,'CH2')
    human(c,f,dict(body=('PU1','PU2','CH2'),pants=('CH2','CH2'),hair=hair,extra_body=eb,prop=p_lantern))
# ---- enemies
@unit('enemy_huesped_apurado')
def _(c,f):
    def eb(c,x,y,w): tie('BL1')(c,x,y,w)
    def prop(c,x,y,f,b): c.r(x,y-1,3,4,'CH2'); c.r(x,y,3,1,'CY1')   # phone
    def hair(c,x,y):
        hair_short('HR2','HR2')(c,x,y)
        if f%2: c.p(x+13,y+1,'CY1'); c.p(x+14,y+3,'CY1')  # sweat
    human(c,f,dict(body=('CH1','CH2','CH2'),pants=('CH2','CH2'),hair=hair,extra_body=eb,prop=prop,angry=1,ox=-1))
@unit('enemy_turista_valija')
def _(c,f):
    def eb(c,x,y,w):
        for (i,j) in ((2,1),(6,3),(3,6),(8,7),(9,1)): c.r(x+i,y+j,2,2,'MG1'); c.p(x+i+1,y+j,'GR1')
        c.r(x+w//2-2,y+3,4,3,'CH2'); c.p(x+w//2-1,y+4,'CY1'); c.r(x+w//2-3,y,1,3,'CH2'); c.r(x+w//2+2,y,1,3,'CH2')
    def hair(c,x,y): c.r(x-3,y-1,18,2,'BL1'); c.r(x+1,y-4,10,4,'BL1'); c.r(x+8,y-4,3,4,'BL2'); c.r(x+1,y-2,10,1,'RD2'); c.r(x+2,y+4,8,2,'CH2'); c.p(x+5,y+4,'CY1')
    human(c,f,dict(body=('OR1','OR1','BR1'),pants=('BL1','BL2'),hair=hair,extra_body=eb,prop=p_suitcase,skin=('SK2','SK3','SD3'),wide=1,ox=-2,shoes='WH2'))
@unit('enemy_karen')
def _(c,f):
    def hair(c,x,y):
        c.r(x-2,y-2,16,5,'BL1'); c.r(x-2,y+3,3,8,'BL1'); c.r(x+11,y+3,3,8,'BL2'); c.r(x+7,y-2,7,3,'BL2'); c.r(x-1,y-3,12,1,'BL1')
        c.r(x+1,y+2,6,1,'BL2')  # asymmetrical bob bang
    def eb(c,x,y,w): c.r(x,y,w,1,'MG2'); c.r(x+w//2-1,y+1,2,1,'BL1')
    human(c,f,dict(body=('PU1','PU1','PU2'),pants=('PU2','CH2'),hair=hair,extra_body=eb,prop=p_point,angry=1,shoes='RD2'))
@unit('enemy_queja_voladora')
def _(c,f):
    bob=[0,1,0,-1,-2,-1][f]; wu=f%2==0
    y=6+bob
    c.r(8,y,16,13,'WH1'); c.r(7,y+1,18,11,'WH1'); c.r(20,y+1,5,11,'WH2'); c.r(8,y+12,16,1,'WH2')
    c.r(10,y+13,4,2,'WH2'); c.r(9,y+15,2,2,'WH2')  # tail
    c.r(15,y+2,2,6,'RD2'); c.r(15,y+9,2,2,'RD2')   # !
    c.r(10,y+3,3,1,'OL'); c.r(19,y+3,3,1,'OL'); c.r(10,y+5,2,2,'OL'); c.r(20,y+5,2,2,'OL'); c.r(11,y+9,3,1,'RD3'); c.r(19,y+9,3,1,'RD3')
    for s,x in ((-1,5),(1,26)):
        if wu: c.r(x-(2 if s<0 else 0),y-2,3,4,'CY1'); c.r(x-(4 if s<0 else -2),y-4,3,3,'CY1'); c.p(x,y,'WH1')
        else: c.r(x-(2 if s<0 else 0),y+3,3,4,'CY1'); c.r(x-(4 if s<0 else -2),y+6,3,3,'CY1')
    c.r(12,28,9,1,'CH2') if False else None
@unit('enemy_grupo_despedida')
def _(c,f):
    for k,(x0,col,hat) in enumerate(((1,('MG1','MG1','MG2'),'BL1'),(11,('CY1','CY1','NV2'),'MG1'),(21,('OR1','OR1','RD2'),'GR1'))):
        ph=(f+k)%4 if f>=2 else 0; b=[0,1][f%2] if f<2 else (-1 if ph%2 else 0)
        y=9+b+(k%2)*2
        c.r(x0+1,y,8,7,'SK1'); c.r(x0+6,y,3,7,'SK2'); c.r(x0+2,y+3,1,2,'OL'); c.r(x0+5,y+3,1,2,'OL'); c.r(x0+3,y+5,2,1,'RD2')
        c.r(x0+3,y-4,4,4,hat); c.r(x0+4,y-6,2,2,hat); c.p(x0+5,y-7,'WH1')
        c.r(x0+1,y+7,8,7,col[1]); c.r(x0+7,y+7,2,7,col[2])
        for i in range(6): c.p(x0+1+i+(1 if i>3 else 0),y+8+i,'WH1')  # sash
        lu=ph in (1,) ; ru=ph in (3,)
        c.r(x0+2,y+14,2,3 if lu else 5,'CH2'); c.r(x0+6,y+14,2,3 if ru else 5,'CH2')
        c.r(x0,y+8-(f%2),1,4,col[1]); c.r(x0+9,y+7,1,3,'SK2')
@unit('boss_inspeccion',64)
def _(C64,f):
    c=C(32,32)
    def eb(c,x,y,w): tie('RD2')(c,x,y,w); c.r(x,y,3,4,'CH1'); c.r(x+w-3,y,3,4,'CH1')
    def hair(c,x,y):
        c.r(x-1,y-2,14,3,'CH2'); c.r(x-3,y,18,1,'CH2'); c.r(x+1,y-4,10,2,'CH2'); c.r(x+1,y-1,10,1,'RD2')
        c.r(x+1,y+4,5,4,'CY1'); c.r(x+1,y+4,5,1,'OL'); c.r(x+3,y+5,2,2,'OL')  # monocle left
        c.r(x+2,y+8,8,1,'WH3')
    human(c,f,dict(body=('CH1','CH2','CH2'),pants=('CH2','CH2'),hair=hair,extra_body=eb,prop=p_clip,angry=1,wide=1,shoes='OL'))
    # magnifier in left hand
    bob=FR[f][0]
    c.r(3,15+bob,4,4,'CY1'); c.p(4,16+bob,'WH1'); c.r(6,19+bob,2,2,'BR2')
    c.outline()
    for y in range(32):
        for x in range(32):
            v=c.a[y][x]
            for j in (0,1):
                for i in (0,1): C64.a[y*2+j][x*2+i]=v
    C64.no_outline=1

def build():
    sheets={}
    for name,(fn,size) in UNITS.items():
        sheet=Image.new('RGBA',(size*6,size),(0,0,0,0))
        for f in range(6):
            c=C(size,size); fn(c,f)
            if size==32: c.outline()
            sheet.paste(c.img(),(f*size,0))
        sheet.save(f'{OUT}/{name}.png'); sheets[name]=sheet
    # palette
    pi=Image.new('RGB',(len(PAL)*16,16))
    for k in range(len(PAL)): pi.paste(RGB[k+1],(k*16,0,k*16+16,16))
    pi.save(f'{OUT}/palette.png')
    with open(f'{OUT}/PALETTE.md','w') as fh:
        fh.write('# Check-Out Chaos palette (%d colors + transparent)\n\n| # | name | hex | role |\n|---|---|---|---|\n'%len(PAL))
        for k,(n,h,r) in enumerate(PAL): fh.write(f'| {k} | {n} | #{h.upper()} | {r} |\n')
    # preview x4 on floor checker
    S=4; lab=18; rows=list(sheets.items()); W=max(sh.width for _,sh in rows)*S+20
    H=sum(sh.height*S+lab+8 for _,sh in rows)+10
    pv=Image.new('RGB',(W,H)); d=ImageDraw.Draw(pv)
    for y in range(0,H,64):
        for x in range(0,W,64): d.rectangle([x,y,x+63,y+63],fill=(0x3b,0x2f,0x45) if (x//64+y//64)%2 else (0x46,0x38,0x52))
    try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14)
    except Exception: font=None
    y=8
    for n,sh in rows:
        d.text((11,y+1),n+'   [idle0 idle1 | walk0-3]  %dpx'%sh.height,fill=(0,0,0),font=font); d.text((10,y),n+'   [idle0 idle1 | walk0-3]  %dpx'%sh.height,fill=(255,230,120),font=font)
        y+=lab; big=sh.resize((sh.width*S,sh.height*S),Image.NEAREST); pv.paste(big,(10,y),big); y+=sh.height*S+8
    pv.save(f'{OUT}/preview_x4.png')


# ===================== V2 =====================
def sheet(fn,size,n,outline=True):
    im=Image.new('RGBA',(size*n,size),(0,0,0,0))
    for f in range(n):
        c=C(size,size); fn(c,f)
        if outline and not getattr(c,'done',0): c.outline()
        im.paste(c.img(),(f*size,0))
    return im
def up2(fn):  # draw at 32, outline, scale to 64
    def g(C64,f):
        c=C(32,32); fn(c,f); c.outline()
        for y in range(32):
            for x in range(32):
                for j in (0,1):
                    for i in (0,1): C64.a[y*2+j][x*2+i]=c.a[y][x]
        C64.done=1
    return g
V2={}  # name -> (fn,size,frames,label)
def v2(name,size,n):
    def d(fn): V2[name]=(fn,size,n); return fn
    return d
# ---- food 16x16
@v2('food_caramelo',16,1)
def _(c,f): c.r(5,5,6,6,'RD1'); c.r(4,6,8,4,'RD1'); c.r(9,6,3,4,'RD2'); c.r(6,6,2,2,'WH1'); c.r(1,6,3,4,'RD2'); c.r(12,6,3,4,'RD2'); c.p(2,7,'RD1'); c.p(13,7,'RD1'); c.r(7,5,1,6,'WH1')
@v2('food_medialuna',16,1)
def _(c,f):
    for x,y,h in ((2,8,3),(4,6,5),(6,5,6),(8,5,6),(10,6,5),(12,8,3)): c.r(x,y,2,h,'BL1' if x in (6,8) else 'BL2')
    c.r(6,5,4,1,'WH1'); c.p(4,6,'BL1'); c.r(5,9,1,2,'BR1'); c.r(10,9,1,2,'BR1')
@v2('food_club_sandwich',16,1)
def _(c,f):
    for y,col in ((4,'BL1'),(6,'GR1'),(7,'RD1'),(8,'BL1'),(10,'MG1'),(11,'BL1')): c.r(2,y,12,2 if col=='BL1' else 1,col)
    c.r(2,4,12,1,'WH1'); c.r(7,1,1,4,'BR1'); c.r(6,1,3,1,'RD2'); c.r(11,5,3,7,'BL2')
@v2('food_pizza',16,1)
def _(c,f):
    for j in range(11): c.r(3+j//2,3+j,11-j,1,'BL1')
    c.r(2,2,12,2,'BR1'); c.r(2,2,12,1,'OR1')
    for x,y in ((5,5),(9,5),(7,8),(8,11)): c.r(x,y,2,2,'RD2')
    c.p(6,7,'GR2'); c.p(10,8,'GR2')
@v2('food_buffet',16,1)
def _(c,f):
    c.r(1,11,14,3,'WH3'); c.r(1,11,14,1,'WH2'); c.r(3,5,10,6,'WH2'); c.r(4,4,8,1,'WH2'); c.r(4,5,3,4,'WH1'); c.r(10,5,3,6,'WH3'); c.r(7,2,2,2,'BL1'); c.p(5,4,'WH1')
# ---- projectiles 16x16 (2-frame spin) / puddle 32
@v2('proj_billete',16,2)
def _(c,f):
    if f==0: c.r(2,5,12,7,'GR1'); c.r(2,10,12,2,'GR2'); c.r(6,7,4,3,'GR2'); c.p(7,8,'BL1'); c.p(8,8,'BL1')
    else: c.r(5,2,6,12,'GR1'); c.r(9,2,2,12,'GR2'); c.r(6,6,3,4,'GR2')
@v2('proj_charco_aceite',32,2)
def _(c,f):
    w=f
    c.r(5-w,14,22+2*w,8,'CH2'); c.r(8,12,15,2,'CH2'); c.r(3-w,17,3,3,'CH2'); c.r(26+w,16,3,4,'CH2')
    c.r(9,14,6,2,'BL2'); c.r(10,14,3,1,'BL1'); c.r(19+w,18,4,1,'PU1'); c.r(16,15,3,1,'CY1')
@v2('proj_cuchillo',16,2)
def _(c,f):
    if f==0: c.r(2,7,4,3,'BR2'); c.r(6,6,1,5,'WH3'); c.r(7,7,7,2,'WH2'); c.r(7,7,7,1,'WH1'); c.p(14,8,'WH2')
    else:
        for i in range(7): c.p(5+i,10-i,'WH1'); c.p(6+i,10-i,'WH2')
        c.r(2,11,3,3,'BR2')
@v2('proj_memo',16,2)
def _(c,f):
    if f==0:
        c.r(3,2,10,12,'WH1'); c.r(11,2,2,12,'WH2'); c.r(3,2,10,2,'RD2')
        for y in (6,8,10): c.r(5,y,6,1,'CH1')
    else: c.r(2,4,12,9,'WH1'); c.r(2,4,2,9,'RD2'); c.r(12,4,2,9,'WH2'); c.r(6,7,5,1,'CH1'); c.r(6,9,4,1,'CH1')
# ---- weapon evolutions 32x32
@v2('evo_campana_grande',32,1)
def _(c,f):
    c.r(14,3,4,3,'BL2'); c.r(10,6,12,4,'BL1'); c.r(8,10,16,8,'BL1'); c.r(6,18,20,4,'BL1'); c.r(18,6,4,16,'BL2'); c.r(4,22,24,3,'BL2')
    c.r(11,8,2,9,'WH1'); c.r(14,25,4,3,'BR2'); c.p(3,10,'BL1'); c.p(28,10,'BL1'); c.r(1,14,2,1,'BL1'); c.r(29,14,2,1,'BL1')
@v2('evo_carrito_turbo',32,1)
def _(c,f):
    c.r(8,10,20,10,'RD2'); c.r(8,10,20,2,'RD1'); c.r(10,12,7,6,'BL1'); c.r(19,12,7,6,'CY1'); c.r(27,4,2,8,'WH3'); c.r(4,12,3,6,'OR1'); c.r(1,13,3,4,'BL1'); c.r(0,14,1,2,'RD1')
    for x in (10,22): c.r(x,20,5,5,'CH2'); c.r(x+1,21,3,3,'WH3')
    c.r(2,22,5,1,'WH2'); c.r(0,25,6,1,'WH2')
@v2('evo_valija_dorada',32,1)
def _(c,f):
    c.r(5,9,22,17,'BL1'); c.r(21,9,6,17,'BL2'); c.r(12,5,8,4,'BR2'); c.r(14,6,4,2,0); c.r(5,16,22,2,'BR2'); c.r(14,15,4,4,'WH1')
    c.r(7,11,2,4,'WH1'); c.r(4,3,1,3,'WH1'); c.r(3,4,3,1,'WH1'); c.r(27,26,1,3,'WH1'); c.r(26,27,3,1,'WH1')
@v2('evo_olla',32,1)
def _(c,f):
    c.r(5,12,22,14,'WH3'); c.r(5,12,6,14,'WH2'); c.r(4,10,24,3,'CH1'); c.r(1,14,4,3,'CH2'); c.r(27,14,4,3,'CH2'); c.r(14,8,4,2,'CH2')
    c.r(7,11,18,1,'OR1'); c.r(9,2,2,5,'WH2'); c.r(15,1,2,5,'WH2'); c.r(21,3,2,5,'WH2'); c.r(7,26,18,1,'CH2')
@v2('evo_nube_verde',32,1)
def _(c,f):
    for x,y,w,h in ((4,12,10,10),(10,7,12,14),(18,10,10,12),(6,16,22,8)): c.r(x,y,w,h,'GR1')
    c.r(6,21,22,3,'GR2'); c.r(22,11,5,10,'GR2'); c.r(12,8,4,2,'WH1'); c.r(10,14,2,3,'OL'); c.r(18,14,2,3,'OL'); c.r(12,18,6,1,'OL'); c.r(9,26,2,2,'GR1'); c.r(20,27,2,2,'GR1'); c.r(15,29,2,2,'GR2')
@v2('evo_llave_maestra',32,1)
def _(c,f):
    c.r(3,8,12,12,'BL1'); c.r(6,11,6,6,0); c.r(11,8,4,12,'BL2'); c.r(15,12,14,4,'BL1'); c.r(15,15,14,1,'BL2'); c.r(24,16,2,5,'BL1'); c.r(20,16,2,4,'BL1'); c.r(4,9,3,2,'WH1')
    c.r(7,13,4,2,'RD2'); c.p(28,4,'WH1'); c.r(27,5,3,1,'WH1'); c.p(28,6,'WH1')
# ---- new humans (idle2+walk4)
def tophat(col,band):
    def h(c,x,y): hair_short('HR2','HR2')(c,x,y); c.r(x-2,y-1,16,2,col); c.r(x+1,y-8,10,7,col); c.r(x+1,y-3,10,1,band); c.r(x+8,y-8,3,7,'CH2'); c.r(x+2,y+8,8,1,'WH3')
    return h
def p_cane(c,x,y,f,b): c.r(x,y-3,1,11,'BR2'); c.r(x-1,y-4,3,2,'BL1')
def p_tablet(c,x,y,f,b): c.r(x-1,y-2,5,6,'CH2'); c.r(x,y-1,3,4,'CY1')
def p_brief(c,x,y,f,b): c.r(x-1,y+1,7,6,'BR2'); c.r(x-1,y+1,7,1,'BR1'); c.r(x+1,y-1,3,2,'OL'); c.r(x+2,y+3,1,1,'BL1')
def p_cleaver(c,x,y,f,b): c.r(x,y-2,2,4,'OL'); c.r(x-1,y-8,4,6,'WH2'); c.r(x-1,y-8,4,1,'WH1')
@v2('player_chef_ejecutivo',32,6)
def _(c,f):
    def eb(c,x,y,w):
        for i in range(3): c.p(x+3,y+1+i*3,'BL1'); c.p(x+w-4,y+1+i*3,'BL1')
        c.r(x+3,y,w-6,1,'RD2')
    def hair(c,x,y): c.r(x,y-1,12,2,'WH2'); c.r(x,y-9,12,8,'WH1'); c.r(x+9,y-9,3,8,'WH2'); c.r(x+3,y-9,1,7,'WH2'); c.r(x+6,y-9,1,7,'WH2'); c.r(x+3,y+8,6,1,'HR2')
    human(c,f,dict(body=('CH1','CH2','CH2'),pants=('CH1','CH2'),hair=hair,extra_body=eb,prop=p_cleaver,skin=('SK2','SD2','SD3'),wide=1))
@v2('player_gerente_general',32,6)
def _(c,f):
    def eb(c,x,y,w): tie('NV1')(c,x,y,w); c.r(x+1,y+2,2,1,'BL1')
    def hair(c,x,y): hair_short('WH3','CH2')(c,x,y); c.r(x+2,y+4,4,3,'CY1'); c.r(x+7,y+4,4,3,'CY1'); c.r(x+2,y+4,9,1,'OL'); c.r(x+3,y+5,2,2,'OL'); c.r(x+8,y+5,2,2,'OL')
    human(c,f,dict(body=('WH3','CH1','CH2'),pants=('CH1','CH2'),hair=hair,extra_body=eb,prop=p_tablet))
def dueno_eb(c,x,y,w): c.r(x+w//2-1,y,2,9,'WH1'); c.r(x+w//2-1,y+1,2,2,'RD2'); c.r(x+1,y+4,w-2,1,'BL1')
@v2('player_dueno_hotel',32,6)
def _(c,f): human(c,f,dict(body=('PU1','PU2','PU2'),pants=('PU2','CH2'),hair=tophat('CH2','BL1'),extra_body=dueno_eb,prop=p_cane,wide=1,blush=1))
@v2('elite_abogado',32,6)
def _(c,f):
    def eb(c,x,y,w):
        for i in range(2,w,3): c.r(x+i,y,1,10,'NV1')
        c.r(x+w//2-2,y,4,3,'WH1'); c.r(x+w//2-1,y+1,2,6,'RD2'); c.r(x+1,y+2,1,1,'BL1')
    def hair(c,x,y): c.r(x-1,y-2,14,4,'HR2'); c.r(x+8,y-3,5,2,'HR2'); c.r(x+2,y-1,6,1,'WH3'); c.r(x+1,y+4,10,3,'OL'); c.r(x+2,y+5,3,1,'CY1'); c.r(x+7,y+5,3,1,'CY1')
    human(c,f,dict(body=('NV2','NV3','NV3'),pants=('NV3','OL'),hair=hair,extra_body=eb,prop=p_brief,angry=1,wide=1))
@v2('enemy_mucama_fantasma',32,6)
def _(c,f):
    b=[0,1,0,-1,-2,-1][f]; y=b
    c.r(10,4+y,12,11,'WH1'); c.r(19,4+y,3,11,'WH2'); c.r(8,15+y,16,10,'CY1'); c.r(20,15+y,4,10,'NV1'); c.r(11,15+y,10,7,'WH1')
    for i in range(4): c.r(8+i*4+(f%2)*2,25+y,2,2+(i+f)%2*2,'CY1')
    c.r(8,1+y,16,3,'WH1'); c.r(9,0+y,2,1,'WH1'); c.r(21,0+y,2,1,'WH1'); c.r(8,3+y,16,1,'RD1')
    c.r(13,8+y,2,3,'OL'); c.r(18,8+y,2,3,'OL'); c.r(15,12+y,2,2,'OL')
    c.r(5,16+y,3,5,'CY1'); c.r(24,16+y,3,5,'NV1'); c.r(26,9+y,1,9,'BR2'); c.r(25,6+y,4,4,'PU1')
# ---- final boss 64: one row 7 frames: idle0 idle1 atk0 atk1 atk2 dash0 dash1
def boss_fn(c,f):
    sub=[0,1,0,0,0,2,4][f]
    def prop(c,x,y,ff,b):
        if f in (2,3,4):
            k=f-2; bx,by=[(x-2,y-12),(x+2,y-8),(x+4,y)][k]
            c.r(bx,by,7,7,'GR2'); c.r(bx,by,7,2,'GR1'); c.r(bx+2,by-2,3,2,'BR2'); c.r(bx+2,by+3,3,2,'BL1')
            if k==2: c.r(x+3,y+8,2,2,'BL1'); c.r(x+8,y+5,2,2,'GR1')
        else: p_cane(c,x,y,ff,b)
    human(c,sub,dict(body=('PU1','PU2','PU2'),pants=('PU2','CH2'),hair=tophat('OL','RD2'),extra_body=dueno_eb,prop=prop,angry=1,wide=1,ox=(2 if f>=5 else 0)))
    if f>=5:
        for yy in (12,18,24): c.r(0,yy+(f%2),5,1,'WH2')
V2['boss_dueno_hotel']=(up2(boss_fn),64,7)
# ---- costumes: override dicts applied to existing v1 units
def gala_eb(c,x,y,w): c.r(x+w//2-2,y,4,4,'WH1'); c.r(x+w//2-1,y,2,1,'OL'); c.r(x+w//2,y+2,1,6,'BL1')
def golden_apron(c,x,y,w): c.r(x+2,y+3,w-4,7,'BL1'); c.r(x+w-4,y+3,2,7,'BL2'); c.r(x+3,y+2,w-6,1,'BL1')
def cap_red(c,x,y): hair_short('HR1','HR2')(c,x,y); c.r(x-1,y-3,13,3,'RD2'); c.r(x-1,y-3,4,3,'RD1'); c.r(x+9,y-1,6,2,'RD3'); c.r(x+4,y-2,2,1,'BL1')
def tall_toque(c,x,y):
    c.r(x,y-1,12,2,'RD2'); c.r(x+1,y-4,10,3,'WH1'); c.r(x-3,y-8,18,5,'WH1'); c.r(x+10,y-8,5,5,'WH2'); c.r(x-1,y-9,14,1,'WH1')
    for i in (1,5,9): c.r(x+i,y-4,1,3,'WH2')
    c.r(x+2,y+8,8,1,'HR2')
def orange_ov(c,x,y,w): c.r(x+2,y,2,10,'BR2'); c.r(x+w-4,y,2,10,'BR2'); c.r(x+3,y+4,w-6,3,'OR1')
def coat_eb(c,x,y,w): c.r(x+w//2-1,y,1,10,'OL'); c.r(x+1,y+3,1,1,'BL1'); c.r(x+w-2,y+3,1,1,'BL1')
def coat_long(c,x,y,f,b): pass
COST=[('player_recepcionista_gala','player_recepcionista',dict(body=('CH1','CH2','OL'),extra_body=gala_eb,pants=('CH2','OL'))),
('player_housekeeping_delantal_dorado','player_housekeeping',dict(extra_body=golden_apron)),
('player_botones_gorra_roja','player_botones',dict(hair=cap_red,body=('NV1','NV2','NV3'),pants=('NV3','CH2'))),
('player_cocinero_gorro_alto','player_cocinero',dict(hair=tall_toque)),
('player_mantenimiento_mameluco_naranja','player_mantenimiento',dict(body=('OR1','OR1','BR1'),pants=('OR1','BR1'),extra_body=orange_ov)),
('player_conserje_sobretodo_largo','player_conserje_nocturno',dict(body=('BR1','BR2','BR2'),pants=('CH2','CH2'),extra_body=coat_eb,coat=1))]
_orig_human=human
def human(c,f,sp):
    _orig_human(c,f,sp)
    s2=dict(sp); s2.update(OVR)
    if s2.get('coat'):  # long overcoat skirt over legs
        bob=FR[f][0]; c.r(10,24+bob,12,4,'BR2'); c.r(10,24+bob,2,4,'BR1'); c.r(20,24+bob,2,4,'OL') if False else None
def costume_fn(base,ovr):
    def g(c,f):
        global OVR
        OVR=ovr; UNITS[base][0](c,f); OVR={}
    return g
for n,b,o in COST: V2[n]=(costume_fn(b,o),32,6)

def build_v2():
    out=[]
    for n,(fn,size,k) in V2.items():
        im=sheet(fn,size,k); im.save(f'{OUT}/{n}.png'); out.append((n,im))
    S=4; lab=18; W=max(max(im.width for _,im in out)*S+20,900)
    H=sum(im.height*S+lab+8 for _,im in out)+10
    # pack small (16px) items two-per-row? keep simple: one per row
    pv=Image.new('RGB',(W,H)); d=ImageDraw.Draw(pv)
    for y in range(0,H,64):
        for x in range(0,W,64): d.rectangle([x,y,x+63,y+63],fill=(0x3b,0x2f,0x45) if (x//64+y//64)%2 else (0x46,0x38,0x52))
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14)
    y=8
    for n,im in out:
        t=f'{n}  {im.height}px x{im.width//im.height}'
        d.text((11,y+1),t,fill=(0,0,0),font=font); d.text((10,y),t,fill=(255,230,120),font=font)
        y+=lab; big=im.resize((im.width*S,im.height*S),Image.NEAREST); pv.paste(big,(10,y),big); y+=im.height*S+8
    pv.save(f'{OUT}/preview_v2_x4.png')

# ===================== V3 =====================
V3={}  # name -> (fn,w,h,n)
def v3(name,w,h,n):
    def d(fn): V3[name]=(fn,w,h,n); return fn
    return d
def p_shaker(c,x,y,f,b): c.r(x,y-3,3,6,'WH2'); c.r(x,y-3,1,6,'WH1'); c.r(x,y-5,3,2,'WH3')
def p_ring(c,x,y,f,b):
    c.r(x-1,y-2,7,7,'RD2'); c.r(x+1,y,3,3,0); c.r(x-1,y,1,3,'WH1'); c.r(x+5,y,1,3,'WH1'); c.r(x+1,y-2,3,1,'WH1'); c.r(x+1,y+4,3,1,'WH1')
def p_towel(c,x,y,f,b): c.r(x,y-1,3,6,'CY1'); c.r(x,y-1,3,1,'WH1')
def p_radio(c,x,y,f,b): c.r(x,y-1,2,4,'CH2'); c.r(x+1,y-4,1,3,'OL'); c.p(x,y,'RD1' if f%2 else 'GR1')
def p_keys(c,x,y,f,b): c.r(x,y,3,3,'BL1'); c.p(x+1,y+1,0); c.r(x+1,y+3,1,3,'BL2'); c.r(x+3,y+2,1,1,'RD2')
@v3('player_bartender',32,32,6)
def _(c,f):
    def eb(c,x,y,w): c.r(x+3,y+1,w-6,8,'WH1'); c.r(x+w//2-2,y,4,2,'RD2'); c.p(x+w//2-1,y,'RD1'); c.r(x+w//2,y+3,1,6,'BL1')
    def hair(c,x,y): hair_short('HR2','HR2')(c,x,y); c.r(x+3,y+8,6,1,'HR2'); c.r(x+2,y,8,1,'WH3')
    human(c,f,dict(body=('BR1','BR2','BR2'),pants=('CH2','OL'),hair=hair,extra_body=eb,prop=p_shaker,skin=('SK2','SD2','SD3')))
@v3('player_salvavidas',32,32,6)
def _(c,f):
    def eb(c,x,y,w): c.r(x+w//2-1,y,1,6,'OL'); c.r(x+w//2-1,y+6,2,2,'BL1'); c.r(x+2,y,1,2,'SK3')
    def hair(c,x,y): c.r(x-1,y-1,14,4,'BL1'); c.r(x+8,y-1,5,4,'BL2'); c.r(x-1,y+3,2,2,'BL1'); c.r(x+2,y+4,8,2,'OL'); c.r(x+3,y+4,2,1,'CY1')
    human(c,f,dict(body=('SK1','SK2','SK3'),pants=('RD1','RD2'),hair=hair,extra_body=eb,prop=p_ring,skin=('SK1','SK2','SK3'),shoes='SK2',belt='RD2'))
@v3('player_masajista',32,32,6)
def _(c,f):
    def eb(c,x,y,w):
        for i in range(5): c.p(x+3+i,y+i,'WH3')
        c.r(x,y+6,w,1,'WH3'); c.r(x+1,y,2,3,'CY1')
    def hair(c,x,y): hair_short('HR1','HR2')(c,x,y); c.r(x-1,y-1,14,2,'CY1'); c.r(x+12,y,2,4,'CY1')
    human(c,f,dict(body=('WH1','WH1','WH2'),pants=('WH2','WH3'),hair=hair,extra_body=eb,prop=p_towel,shoes='WH3',blush=1))
@v3('player_seguridad',32,32,6)
def _(c,f):
    def eb(c,x,y,w): tie('OL')(c,x,y,w); c.r(x+w-2,y-2,1,3,'CY1')
    def hair(c,x,y): c.r(x-1,y-1,14,3,'HR2'); c.r(x+1,y+4,10,3,'OL'); c.r(x+12,y+5,2,2,'CY1'); c.r(x+13,y+7,1,4,'CY1')
    human(c,f,dict(body=('CH1','CH2','OL'),pants=('CH2','OL'),hair=hair,extra_body=eb,prop=p_radio,wide=1,skin=('SD2','SD3','SD3')))
@v3('player_valet',32,32,6)
def _(c,f):
    def eb(c,x,y,w): c.r(x+3,y,w-6,10,'WH1'); c.r(x+w//2-1,y,2,3,'OL'); c.p(x+2,y+3,'BL1'); c.p(x+w-3,y+3,'BL1')
    def hair(c,x,y): hair_short('HR1','HR2')(c,x,y); c.r(x-1,y-3,13,3,'RD2'); c.r(x,y-3,3,3,'RD1'); c.r(x+9,y-1,6,2,'OL'); c.r(x+4,y-2,3,1,'BL1')
    human(c,f,dict(body=('RD1','RD2','RD3'),pants=('OL','OL'),hair=hair,extra_body=eb,prop=p_keys))
@v3('proj_botella',16,16,2)
def _(c,f):
    if f==0: c.r(6,6,4,8,'GR2'); c.r(6,6,1,8,'GR1'); c.r(7,2,2,4,'GR2'); c.r(7,1,2,1,'BL2'); c.r(6,9,4,2,'WH1')
    else: c.r(2,6,8,4,'GR2'); c.r(2,6,8,1,'GR1'); c.r(10,7,4,2,'GR2'); c.r(14,7,1,2,'BL2'); c.r(5,6,2,4,'WH1')
@v3('fx_llama_piso',32,32,2)
def _(c,f):
    c.r(5,25,22,3,'BR2')
    for i,(x,h) in enumerate(((7,9),(12,15),(17,12),(22,8))):
        hh=h+(2 if (i+f)%2 else -1)
        c.r(x,26-hh,4,hh,'RD2'); c.r(x+1,27-hh+2,2,hh-3,'OR1'); c.r(x+1,24-hh//3,2,hh//3,'BL1'); c.p(x+1+(f+i)%2,25-hh,'RD2')
@v3('fx_onda_silbato',32,32,2)
def _(c,f):
    import math
    rs=(7,10) if f==0 else (11,14)
    for r,col in ((rs[1],'CY1'),(rs[0],'WH1')):
        for a in range(0,360,4):
            c.p(round(16+r*math.cos(math.radians(a))),round(16+r*math.sin(math.radians(a))),col)
    c.done=1 if f else 0
@v3('proj_piedra_caliente',16,16,2)
def _(c,f):
    if f: c.r(2,3,12,10,'RD1'); c.r(3,2,10,12,'RD1')
    c.r(4,5,8,6,'CH1'); c.r(5,4,6,8,'CH1'); c.r(9,5,3,6,'CH2'); c.r(5,5,2,1,'WH3'); c.r(6,8,4,1,'OR1'); c.p(8,7,'OR1' if f else 'RD2')
@v3('fx_arco_baston',32,32,2)
def _(c,f):
    import math
    a0,a1=(200,290) if f==0 else (260,380)
    for r,col in ((13,'WH1'),(12,'WH2'),(11,'WH3')):
        for a in range(a0,a1,3): c.p(round(16+r*math.cos(math.radians(a))),round(16+r*math.sin(math.radians(a))),col)
    a=math.radians(a1-3); ex,ey=16+12*math.cos(a),16+12*math.sin(a)
    c.r(round(ex)-1,round(ey)-1,3,3,'BL1')
    c.done=1
@v3('proj_auto',48,24,2)
def _(c,f):
    c.r(6,4,36,16,'RD2'); c.r(6,4,36,3,'RD1'); c.r(6,17,36,3,'RD3'); c.r(4,6,2,12,'RD2'); c.r(42,6,3,12,'RD2')
    c.r(26,6,8,12,'CY1'); c.r(27,7,2,10,'WH1'); c.r(12,6,6,12,'CY1'); c.r(18,6,8,12,'RD1')
    c.r(44,6,1,3,'BL1'); c.r(44,15,1,3,'BL1'); c.r(4,6,1,2,'RD3'); c.r(4,16,1,2,'RD3')
    for x in (10,34):
        c.r(x,1,6,3,'CH2'); c.r(x,20,6,3,'CH2'); c.r(x+1+(f%2)*2,2,2,1,'WH3'); c.r(x+1+(f%2)*2,21,2,1,'WH3')
    if f: c.r(0,9,3,3,'WH2'); c.r(1,13,2,2,'WH3')
    else: c.r(1,10,2,2,'WH3')
def build_v3():
    out=[]
    for n,(fn,w,h,k) in V3.items():
        im=Image.new('RGBA',(w*k,h),(0,0,0,0))
        for f in range(k):
            c=C(w,h); fn(c,f)
            if not getattr(c,'done',0): c.outline()
            im.paste(c.img(),(f*w,0))
        im.save(f'{OUT}/{n}.png'); out.append((n,im,w,h,k))
    S=4; lab=18; W=900; H=sum(im.height*S+lab+8 for _,im,*_ in out)+10
    pv=Image.new('RGB',(W,H)); d=ImageDraw.Draw(pv)
    for y in range(0,H,64):
        for x in range(0,W,64): d.rectangle([x,y,x+63,y+63],fill=(0x3b,0x2f,0x45) if (x//64+y//64)%2 else (0x46,0x38,0x52))
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14); y=8
    for n,im,w,h,k in out:
        t=f'{n}  {w}x{h} x{k}'; d.text((11,y+1),t,fill=(0,0,0),font=font); d.text((10,y),t,fill=(255,230,120),font=font)
        y+=lab; big=im.resize((im.width*S,im.height*S),Image.NEAREST); pv.paste(big,(10,y),big); y+=im.height*S+8
    pv.save(f'{OUT}/preview_v3_x4.png')
if __name__=='__main__':
    build(); build_v2(); build_v3()
