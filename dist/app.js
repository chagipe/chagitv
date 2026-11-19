const el=id=>document.getElementById(id);
const catalog=window.catalog;
let category='',limit=48,current,attempt=0;
function show(item){
 el('video').hidden=true;current=item;el('title').textContent=item.name;el('episode').replaceChildren();
 for(const [season,episode,id] of item.episodes){
  el('episode').add(new Option(season?'Temporada '+season+' · Episodio '+episode:'Versión '+(el('episode').length+1),id));
 }
 el('episode').hidden=item.episodes.length===1;el('status').textContent='';el('detail').showModal();
}
function stop(){el('source-label')?.remove();el('status').textContent='';el('episode-frame')?.remove();attempt++;el('video').hidden=true;el('video').pause();el('video').removeAttribute('src');el('video').load()}
el('detail').onclose=stop;el('episode').onchange=stop;
el('close').onclick=()=>el('detail').close();
el('play').onclick=async()=>{
 const token=++attempt,id=el('episode').value;el('status').textContent='Abriendo video…';
 try{
  const selected = current.episodes.find(entry => String(entry[2]) === id);
  if (/vida te da mandarinas/i.test(current.name) && selected && selected[0] > 0 && selected[1] > 0) {
    el('source-label')?.remove();
    el('episode-frame')?.remove();
    const frame = document.createElement('iframe');
    frame.id = 'episode-frame';
    frame.title = current.name + ' · T' + selected[0] + ' E' + selected[1];
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;border:0;margin-top:12px;background:#000';
    const label = document.createElement('label');
    label.id = 'source-label';
    label.textContent = 'Fuente del episodio ';
    const select = document.createElement('select');
    const episodePath = '/tv/219246/' + selected[0] + '/' + selected[1];
    select.add(new Option('Instaplay', 'https://media.instantplay.click/embed' + episodePath));
    select.add(new Option('VidLink', 'https://vidlink.pro' + episodePath));
    label.append(select);
    const loadSource = () => {
      frame.src = select.value;
      el('status').textContent = 'Si el video no carga, prueba la otra fuente.';
    };
    select.onchange = loadSource;
    loadSource();
    el('video').hidden = true;
    el('video').after(label, frame);
    return;
  }
  let url=window.localSources?.[id];
  if(!url){
   if(location.protocol==='file:')throw Error('Esta copia requiere el sitio configurado en Vercel.');
   const request=()=>fetch('/api/play?id='+encodeURIComponent(id),{headers:{'x-family-pin':sessionStorage.familyPin||''}});
   let r=await request();
   if(r.status===401){const pin=prompt('Ingresa el PIN familiar');if(!pin)throw Error('Se necesita el PIN familiar.');sessionStorage.familyPin=pin;r=await request()}
   if(!r.ok)throw Error(r.status===401?'PIN incorrecto.':'Falta configurar una fuente HTTPS disponible en Vercel.');
   url=(await r.json()).url;
  }
  if(token!==attempt)return;el('video').hidden=false;el('video').src=url;await el('video').play();
  if(token===attempt)el('status').textContent='';
 }catch(e){if(token===attempt)el('status').textContent=e.name==='Error'?e.message:mediaMessage()}
};
function render(){
 const q=el('search').value.trim().toLocaleLowerCase();
 const items=catalog.filter(i=>(!category||i.type===category)&&i.name.toLocaleLowerCase().includes(q));
 el('count').textContent=(q?'Resultados':'Catálogo')+' · '+items.length.toLocaleString('es-PE');
 el('grid').replaceChildren();for(const item of items.slice(0,limit)){
 const button=document.createElement('button');button.className='card';const label=document.createElement('small');label.textContent=item.type==='series'?'SERIE':'PELÍCULA';button.append(label,document.createTextNode(item.name));button.onclick=()=>show(item);el('grid').append(button)}
 el('more').hidden=items.length<=limit;
 document.querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===category)));
}
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{category=b.dataset.type;limit=48;render()});
el('search').oninput=()=>{limit=48;render()};el('more').onclick=()=>{limit+=48;render()};
el('featured').onclick=()=>show(catalog.find(i=>/vida te da mandarinas/i.test(i.name)));render();

function mediaMessage(){
 const code=el('video').error?.code;
 if(code===2)return 'Se interrumpió la conexión con el servidor del episodio.';
 if(code===3)return 'El dispositivo recibió el archivo pero no pudo decodificar su video o audio.';
 return 'La fuente del catálogo no entregó un video compatible. El episodio sigue pendiente de una fuente disponible.';
}
el('video').addEventListener('error',()=>{if(el('video').getAttribute('src'))el('status').textContent=mediaMessage()});
for(const [name,url] of Object.entries(window.artwork)){
 const item=catalog.find(i=>i.name===name);if(!item)continue;
 const button=document.createElement('button'),image=document.createElement('img'),caption=document.createElement('span');
 image.src=url;image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';image.onerror=()=>image.hidden=true;
 caption.textContent=name;button.append(image,caption);button.onclick=()=>show(item);el('picks').append(button);
}
