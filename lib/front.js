const gK=(v,i)=>v._===1?v._1:i

// --- Atomic CSS ---
const C={},S=new CSSStyleSheet(), D=document
D.adoptedStyleSheets=[S]
S.insertRule('body{container-type:inline-size;container-name:root}',0)
if('scrollRestoration' in history) history.scrollRestoration='manual'

const connection=()=>{
  if(globalThis.ws?.readyState<2)return
  const ws=globalThis.ws=new WebSocket(location.origin.replace('http','ws')+'/ws')
  ws.onopen=()=>window.dispatchEvent(new CustomEvent('ws-status',{detail:false}))
  ws.onmessage=m=>{
    if(m.data==='reload') return location.reload()
    const data=JSON.parse(m.data)
    if(data?._type==='_payRedirect') return location.href=data.url
    globalThis.dispatch?.(data) }
  ws.onclose=()=>{
    window.dispatchEvent(new CustomEvent('ws-status',{detail:true}))
    setTimeout(connection,1000) } }
connection()
D.addEventListener('visibilitychange',()=>D.visibilityState==='visible'&&connection())

const AZ='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
let cnt=0
const b62=n=>{let s=AZ[n%52],r=n/52|0;while(r){r--;s+=AZ[r%62];r=r/62|0};return s}
const css=(p,v,ps='',md='')=>{
  const k=`${md}|${ps}|${p}:${v}`
  if(C[k])return C[k]
  C[k]=b62(cnt++)
  const r=`.${C[k]}${ps}{${p}:${v}}`
  S.insertRule(md?`${md}{${r}}`:r,S.cssRules.length)
  return C[k]}

// Keyframes registry — body is the inner @keyframes block content
const KF=new Map()
globalThis._kf=body=>{
  if(KF.has(body))return KF.get(body)
  const name='_kf'+b62(cnt++)
  S.insertRule(`@keyframes ${name}{${body}}`,S.cssRules.length)
  KF.set(body,name)
  return name}
// Build a keyframes block from a list of {at, attrs}. `at` is rescaled
// against the max so the CSS is always in %. Returns {name, max} — caller
// converts max to the played duration (max=ms for keyframes, max/fps*1000
// for keyframesFps).
globalThis._kfb=frames=>{
  const flat=(a,o)=>{if(!a||a._===0)return;if(a._===5){for(let i=0;i<a._1.length;i++)flat(a._1[i],o);return}if(a._===2)o.push(a._1+':'+a._2)}
  const max=Math.max(1,...frames.map(f=>f.at))
  const body=frames.map(f=>{const o=[];f.attrs.forEach(a=>flat(a,o));return (f.at/max*100)+'%{'+o.join(';')+'}'}).join('')
  return {name:globalThis._kf(body),max}}

// --- DOM helpers ---
const NS_HTML='http://www.w3.org/1999/xhtml'
const NS_SVG='http://www.w3.org/2000/svg'
const isSvg=el=>el.namespaceURI===NS_SVG
// attr._: 0=none 1=htmlAttr 2=style 3=pseudoStyle 4=mediaStyle 5=batch 6=pop 7=out
const attr=(a,el,d,cls,ps,md)=>{
  if(!a||a._===0)return
  if(a._===5){for(let i=0;i<a._1.length;i++)attr(a._1[i],el,d,cls,ps,md);return}
  if(a._===2){cls.push(css(a._1,a._2,ps,md));return}
  if(a._===1){
    if(a._1==='class')return cls.push(a._2)
    if(isSvg(el)){const s=String(a._2);if(el.getAttribute(a._1)!==s)el.setAttribute(a._1,s);return}
    if(el[a._1]!==a._2) el[a._1]=a._2
    return}
  if(a._===3){for(let i=0;i<a._2.length;i++)attr(a._2[i],el,d,cls,ps+a._1,md);return}
  if(a._===4){for(let i=0;i<a._2.length;i++)attr(a._2[i],el,d,cls,ps,a._1);return}
  if(a._===6){el._f=a._1;return}
  if(a._===7){el._t=a._1;return}
  for(const k in a)if(k.startsWith('on')){
    const e=k.slice(2).toLowerCase(),fn=typeof a[k]==='function'?v=>d(a[k](v)):()=>d(a[k])
    ;(el._e=el._e||{})[e]=fn;el.addEventListener(e,fn)}}

const attrs=(as,el,d)=>{
  const cls=[]
  for(let i=0;i<as.length;i++)attr(as[i],el,d,cls,'','')
  const s=new Set(cls),c=[...s].join(' ')
  if(isSvg(el)){const o=el.getAttribute('class')||'';if(o!==c)c?el.setAttribute('class',c):el.removeAttribute('class')}
  else if(el.className!==c) el.className=c}

const clr=el=>{
  if(el._e){for(const e in el._e)el.removeEventListener(e,el._e[e]);delete el._e}}

const inl=(as,el)=>{
  for(let i=0;i<as.length;i++){
    const a=as[i]
    if(!a||a._===0)continue
    if(a._===2)el.style.setProperty(a._1,a._2)
    if(a._===5)inl(a._1,el)}}

const exit=el=>{
  if(!el._t||el._out)return false
  el._out=true
  if(el.style.cssText)el.style.cssText=''
  requestAnimationFrame(()=>{
    inl(el._t,el)
    const a=el.getAnimations()
    a.length?Promise.all(a.map(x=>x.finished)).then(()=>el.parentNode?.removeChild(el)).catch(()=>{}):el.parentNode?.removeChild(el)})
  return true}

let fr=true
const mk=(n,d)=>{
  if(n._===0)return D.createTextNode(n._1)
  const tag=n._===1?'div':n._1
  const el=D.createElementNS(n._ns||NS_HTML,tag)
  attrs(n._2||[],el,d)
  ;(n._3||[]).forEach((c,i)=>{const k=mk(c,d);k._k=gK(c,i);el.appendChild(k)})
  if(el._f&&!fr){inl(el._f,el);requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!el._out)el.style.cssText=''}))}
  return el}

// Patch types: 1=CREATE 2=REMOVE 3=REPLACE 4=UPDATE
const pkc=(par,olds,news,d)=>{
  const vm=new Map((olds||[]).map((v,i)=>[gK(v,i),v])),em=new Map()
  for(let c=par.firstChild;c;c=c.nextSibling)if(c._k!==undefined&&!c._out)em.set(c._k,c)
  const nks=new Set(news.map((v,i)=>gK(v,i)))
  for(const[k,el]of em)if(!nks.has(k)&&!exit(el))par.removeChild(el)
  const iP=(pv,el)=>{
    let c=pv?pv.nextSibling:par.firstChild
    while(c&&c!==el&&c._out)c=c.nextSibling
    return c===el}
  let pv=null
  for(let i=0;i<news.length;i++){
    const nn=news[i],nk=gK(nn,i),oe=em.get(nk);let el
    if(!oe){el=mk(nn,d);el._k=nk}
    else{
      const p=df(vm.get(nk),nn)
      if(p?._===3){
        if(!exit(oe)&&oe.parentNode===par)par.removeChild(oe)
        el=mk(p.n,d);el._k=nk}
      else{
        if(p?._===4){clr(oe);attrs(p.props,oe,d);if(oe!==D.activeElement||!oe.isContentEditable)pkc(oe,p.old,p.new,d)}
        el=oe}}
    const ins=pv?pv.nextSibling:par.firstChild
    if(el.parentNode!==par||!iP(pv,el))par.insertBefore(el,ins)
    pv=el}}

const df=(a,b)=>{
  if(!a)return{_:1,n:b}
  if(!b)return 2
  if(a._!==b._||(a._===0&&a._1!==b._1)||(a._===2&&a._1!==b._1))return{_:3,n:b}
  if(b._!==0)return{_:4,props:b._2||[],old:a._3||[],new:b._3||[]}
  return null}

const pt=(par,p,i=0,d)=>{
  if(!p)return par.childNodes[i]
  const el=par.childNodes[i]
  if(p===2){if(!exit(el)&&!el?._out)par.removeChild(el);return null}
  if(p._===1){const n=mk(p.n,d);par.appendChild(n);return n}
  if(p._===3){
    if(el?._t&&!el._out){exit(el);const r=mk(p.n,d);par.insertBefore(r,el);return r}
    const r=mk(p.n,d);par.replaceChild(r,el);return r}
  if(p._===4){clr(el);attrs(p.props,el,d);pkc(el,p.old,p.new,d);return el}}

// --- Element components: state + expansion ---
const ES=new Map()
const amapJS=(f,a)=>{
  if(!a||a._===0||a._===1||a._===2)return a
  if(a._===3)return{_:3,_1:a._1,_2:a._2.map(x=>amapJS(f,x))}
  if(a._===4)return{_:4,_1:a._1,_2:a._2.map(x=>amapJS(f,x))}
  if(a._===5)return{_:5,_1:a._1.map(x=>amapJS(f,x))}
  if(a._===6)return{_:6,_1:a._1.map(x=>amapJS(f,x))}
  if(a._===7)return{_:7,_1:a._1.map(x=>amapJS(f,x))}
  const r={};for(const k in a)r[k]=k.startsWith('on')?(typeof a[k]==='function'?v=>f(a[k](v)):f(a[k])):a[k];return r}
const hmapJS=(f,n)=>{
  if(!n||n._===0)return n
  if(n._===8){const o=n._2;return{_:8,_1:n._1,_2:{...o,emit:(m,a)=>{const r=o.emit?o.emit(m,a):null;return r&&r._===0?{_:0,_1:f(r._1)}:r}}}}
  return{_:n._,_1:n._1,_2:n._2?n._2.map(a=>amapJS(f,a)):n._2,_3:n._3?n._3.map(c=>hmapJS(f,c)):n._3,_ns:n._ns}}
const idW=x=>x
const expand=(n,wrap,path='')=>{
  if(!n)return n
  if(n._===0)return n
  if(n._===8){
    const key=n._1||path,fns=n._2
    let s=ES.get(key)
    if(!s){s={model:fns.init};ES.set(key,s)}
    s.fns=fns;s.parentWrap=wrap
    const thisWrap=msg=>wrap({_el:key,_m:msg})
    s.thisWrap=thisWrap
    return expand(hmapJS(thisWrap,fns.view(s.model)),thisWrap,key+'/')}
  return{_:n._,_1:n._1,_2:n._2,_3:n._3?n._3.map((c,i)=>expand(c,wrap,path+i+'.')):n._3,_ns:n._ns}}

export default ({init,update,view,cmds,subs})=>{
  const iSig=(globalThis.__BAZE_TYPE_SIG||'')+':'+JSON.stringify(init),stored=JSON.parse(localStorage.getItem('base')??'null')
  let v,m=stored&&localStorage.getItem('base_sig')===iSig?stored:init
  addEventListener('pagehide',()=>{localStorage.setItem('base',JSON.stringify(m));localStorage.setItem('base_sig',iSig);sessionStorage.setItem('base_scroll',String(window.scrollY))})
  const SS=new Map()

  const flatSubs=(s,out=[])=>{if(!s||s.id==='none')return out;if(Array.isArray(s._subs))s._subs.forEach(x=>flatSubs(x,out));else out.push(s);return out}
  const updSub=(m,d)=>{
    if(!subs)return
    const ns=flatSubs(subs(m)),nk=new Set()
    ns.forEach(s=>{
      const k=s.id
      nk.add(k)
      if(!SS.has(k)){SS.set(k,1);SS.set(k,s.run(d))} })
    for(const[k,off]of SS)if(!nk.has(k)){off();SS.delete(k)} }

  const rerender=d=>{const n=expand(view(m),idW);pt(D.body,df(v,n),0,d);v=n}

  let patching=false,q=[]
  const d=globalThis.dispatch=msg=>{
    if(patching){q.push(msg);return}
    patching=true
    let cur=msg,chain=[]
    while(cur&&typeof cur==='object'&&cur._el!==undefined){chain.push(cur._el);cur=cur._m}
    let toEmit=null
    if(chain.length===0){
      m=update(m,cur);console.log(msg,m)
      rerender(d);cmds(m,cur)(d);updSub(m,d)}
    else{
      const key=chain[chain.length-1],s=ES.get(key)
      if(s){
        s.model=s.fns.update(s.model,cur);console.log(msg,s.model)
        const emitted=s.fns.emit?s.fns.emit(s.model,cur):null
        if(s.fns.cmds)s.fns.cmds(s.model,cur)(m2=>d(s.thisWrap(m2)))
        rerender(d)
        if(emitted&&emitted._===0)toEmit=s.parentWrap(emitted._1)}}
    patching=false
    if(toEmit!==null)d(toEmit)
    while(q.length)d(q.shift())}

  v=expand(view(m),idW);D.body.innerHTML='';D.body.appendChild(mk(v,d));fr=false;updSub(m,d)
  const sy=+sessionStorage.getItem('base_scroll')||0
  if(sy)requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,sy))) }