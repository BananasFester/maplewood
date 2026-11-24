// ================= SMOOTH ART: WebGL edge-smoothing upscaler (xBR lv2 style, after Hyllian) =================
// The world is still drawn as pixel art into R.buf. This pass scales it to the screen, rounding stair-step
// edges into smooth curves and diagonals, then applies the light map and additive glow layer.
const GLS={ok:false,gl:null,cv:null,prog:null,loc:{},tex:[],k:1,lost:false,
 VS:'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}',
 FS:`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uW,uL,uG;uniform vec2 uWS,uLS,uGS,uOff,uFl;uniform float uZ,uH,uX;
struct Q{vec4 y;vec4 u;vec4 v;};
vec3 yuv(vec3 c){float y=dot(c,vec3(.299,.587,.114));return vec3(y,(c.b-y)*.564,(c.r-y)*.713);}
Q q4(vec3 a,vec3 b,vec3 c,vec3 d){return Q(vec4(a.x,b.x,c.x,d.x),vec4(a.y,b.y,c.y,d.y),vec4(a.z,b.z,c.z,d.z));}
Q r1(Q p){return Q(p.y.yzwx,p.u.yzwx,p.v.yzwx);}
Q r3(Q p){return Q(p.y.wxyz,p.u.wxyz,p.v.wxyz);}
Q r2(Q p){return Q(p.y.zwxy,p.u.zwxy,p.v.zwxy);}
vec4 df(Q a,Q b){return 48.*(abs(a.y-b.y)+abs(a.u-b.u)+abs(a.v-b.v));}
vec4 EQ(Q a,Q b){return 1.-step(15.,df(a,b));}
vec4 NE(Q a,Q b){return step(.02,df(a,b));}
vec4 WD(Q a,Q b,Q c,Q d,Q e,Q f,Q g,Q h){return df(a,b)+df(a,c)+df(d,e)+df(d,f)+4.*df(g,h);}
float cdf(vec3 a,vec3 b){vec3 d=abs(a-b);return d.r+d.g+d.b;}
void main(){
 vec2 fr=vec2(gl_FragCoord.x,uH-gl_FragCoord.y);vec2 pos=(fr-uOff)/uZ;vec2 tc=floor(pos);vec2 fp=pos-tc;
 vec2 px=1./uWS;vec2 c0=(tc+.5)*px;
 vec3 E=texture2D(uW,c0).rgb;vec3 col=E;
 if(uX>.5){
 vec3 A1=texture2D(uW,c0+vec2(-1.,-2.)*px).rgb,B1=texture2D(uW,c0+vec2(0.,-2.)*px).rgb,C1=texture2D(uW,c0+vec2(1.,-2.)*px).rgb;
 vec3 A=texture2D(uW,c0+vec2(-1.,-1.)*px).rgb,B=texture2D(uW,c0+vec2(0.,-1.)*px).rgb,C=texture2D(uW,c0+vec2(1.,-1.)*px).rgb;
 vec3 D=texture2D(uW,c0+vec2(-1.,0.)*px).rgb,F=texture2D(uW,c0+vec2(1.,0.)*px).rgb;
 vec3 G=texture2D(uW,c0+vec2(-1.,1.)*px).rgb,H=texture2D(uW,c0+vec2(0.,1.)*px).rgb,I=texture2D(uW,c0+vec2(1.,1.)*px).rgb;
 vec3 G5=texture2D(uW,c0+vec2(-1.,2.)*px).rgb,H5=texture2D(uW,c0+vec2(0.,2.)*px).rgb,I5=texture2D(uW,c0+vec2(1.,2.)*px).rgb;
 vec3 A0=texture2D(uW,c0+vec2(-2.,-1.)*px).rgb,D0=texture2D(uW,c0+vec2(-2.,0.)*px).rgb,G0=texture2D(uW,c0+vec2(-2.,1.)*px).rgb;
 vec3 C4=texture2D(uW,c0+vec2(2.,-1.)*px).rgb,F4=texture2D(uW,c0+vec2(2.,0.)*px).rgb,I4=texture2D(uW,c0+vec2(2.,1.)*px).rgb;
 Q b=q4(yuv(B),yuv(D),yuv(H),yuv(F)),c=q4(yuv(C),yuv(A),yuv(G),yuv(I));vec3 ey=yuv(E);Q e=q4(ey,ey,ey,ey);
 Q d=r1(b),f=r3(b),g=r2(c),h=r2(b),i=r3(c);
 Q i4=q4(yuv(I4),yuv(C1),yuv(A0),yuv(G5)),i5=q4(yuv(I5),yuv(C4),yuv(A1),yuv(G0)),h5=q4(yuv(H5),yuv(F4),yuv(B1),yuv(D0));Q f4=r1(h5);
 vec4 Ao=vec4(1.,-1.,-1.,1.),Bo=vec4(1.,1.,-1.,-1.),Co=vec4(1.5,.5,-.5,.5),Bx=vec4(.5,2.,-.5,-2.),Cx=vec4(1.,1.,-.5,0.),By=vec4(2.,.5,-2.,-.5),Cy=vec4(2.,0.,-1.,.5);
 float dl=clamp(1./uZ,.08,.5);vec4 de=vec4(dl),deL=vec4(dl*.5,dl,dl*.5,dl),deU=deL.yxwz;
 vec4 fx=Ao*fp.y+Bo*fp.x,fxl=Ao*fp.y+Bx*fp.x,fxu=Ao*fp.y+By*fp.x;
 vec4 r0=NE(e,f)*NE(e,h);
 vec4 rl1=r0*clamp((1.-EQ(f,b))*(1.-EQ(f,c))+(1.-EQ(h,d))*(1.-EQ(h,g))+EQ(e,i)*((1.-EQ(f,f4))*(1.-EQ(f,i4))+(1.-EQ(h,h5))*(1.-EQ(h,i5)))+EQ(e,g)+EQ(e,c),0.,1.);
 vec4 r2l=NE(e,g)*NE(d,g),r2u=NE(e,c)*NE(b,c);
 vec4 f45i=clamp((fx+de-Co-vec4(.25))/(2.*de),0.,1.),f45=clamp((fx+de-Co)/(2.*de),0.,1.),f30=clamp((fxl+deL-Cx)/(2.*deL),0.,1.),f60=clamp((fxu+deU-Cy)/(2.*deU),0.,1.);
 vec4 w1=WD(e,c,g,i,h5,f4,h,f),w2=WD(h,d,i5,f,i4,b,e,i);
 vec4 edri=step(w1,w2)*r0,edr=(1.-step(w2,w1))*rl1;
 vec4 edl=step(2.*df(f,g),df(h,c))*r2l*edr,edu=step(2.*df(h,c),df(f,g))*r2u*edr;
 f45*=edr;f30*=edl;f60*=edu;f45i*=edri;
 vec4 pk=step(df(e,f),df(e,h));vec4 mx=max(max(f30,f60),max(f45,f45i));
 vec3 s1=E;s1=mix(s1,mix(H,F,pk.x),mx.x);s1=mix(s1,mix(B,D,pk.z),mx.z);
 vec3 s2=E;s2=mix(s2,mix(F,B,pk.y),mx.y);s2=mix(s2,mix(D,H,pk.w),mx.w);
 col=mix(s1,s2,step(cdf(E,s1),cdf(E,s2)));}
 if(uFl.x>.5)col*=texture2D(uL,pos*.5/uLS).rgb;
 if(uFl.y>.5)col+=texture2D(uG,pos/uGS).rgb;
 gl_FragColor=vec4(col,1.);}`,
 init(cv){this.cv=cv;try{const o={alpha:false,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false};
   const gl=cv.getContext('webgl',o)||cv.getContext('experimental-webgl',o);if(!gl)return false;this.gl=gl;
   cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ok=false;this.lost=true;});
   cv.addEventListener('webglcontextrestored',()=>{this.lost=false;this.setup();});
   return this.setup();}catch(e){console.warn('smooth art unavailable',e);this.ok=false;return false;}},
 setup(){const gl=this.gl;try{
   const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
   const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,this.VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,this.FS));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);
   if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));this.prog=p;gl.useProgram(p);
   for(const n of['uW','uL','uG','uWS','uLS','uGS','uOff','uFl','uZ','uH','uX'])this.loc[n]=gl.getUniformLocation(p,n);
   const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   this.tex=[0,1,2].map(u=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);const f=u===0?gl.NEAREST:gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));return t;});
   gl.uniform1i(this.loc.uW,0);gl.uniform1i(this.loc.uL,1);gl.uniform1i(this.loc.uG,2);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
   this.ok=true;return true;}catch(e){console.warn('smooth art shader failed',e);this.ok=false;return false;}},
 size(W,H){if(!this.cv)return;const k=Math.min(1,Math.sqrt(2.6e6/Math.max(1,W*H)));this.k=k;const w=Math.max(1,Math.round(W*k)),h=Math.max(1,Math.round(H*k));if(this.cv.width!==w||this.cv.height!==h){this.cv.width=w;this.cv.height=h;}},
 up(u,src){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,this.tex[u]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);},
 // world buffer, light map (half res, may be null) and glow layer (may be null); ox/oy/Z in device px
 draw(buf,light,glow,ox,oy,Z,smooth){if(!this.ok)return false;const gl=this.gl,L=this.loc,k=this.k,w=this.cv.width,h=this.cv.height;
  gl.viewport(0,0,w,h);gl.useProgram(this.prog);this.up(0,buf);if(light)this.up(1,light);if(glow)this.up(2,glow);
  gl.uniform2f(L.uWS,buf.width,buf.height);if(light)gl.uniform2f(L.uLS,light.width,light.height);if(glow)gl.uniform2f(L.uGS,glow.width,glow.height);
  gl.uniform2f(L.uOff,ox*k,oy*k);gl.uniform1f(L.uZ,Z*k);gl.uniform1f(L.uH,h);gl.uniform2f(L.uFl,light?1:0,glow?1:0);gl.uniform1f(L.uX,smooth===false?0:1);
  gl.drawArrays(gl.TRIANGLES,0,3);return true;}
};
