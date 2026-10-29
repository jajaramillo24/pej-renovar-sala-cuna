const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Campaign}=require('./campaign.cjs');
const {browserId}=require('./remote-auth.cjs');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'contacts.json'),'utf8'));
const owners=[...new Set(data.map(c=>c.owner))],sessions=new Map();
const PORT=Number(process.env.PORT||3488),production=process.env.RENDER==='true'||process.env.NODE_ENV==='production'||!!process.env.RENDER_EXTERNAL_URL,origin=process.env.RENDER_EXTERNAL_URL||`http://127.0.0.1:${PORT}`,secret=crypto.randomBytes(32);
const HOST=process.env.HOST||(production||process.env.PORT?'0.0.0.0':'127.0.0.1');
if(!Number.isInteger(PORT)||PORT<1||PORT>65535)throw Error('PORT inválido');
const clientToken=id=>crypto.createHmac('sha256',secret).update(id).digest('hex');
function session(owner,clientId='local'){
 if(!owners.includes(owner))throw Error('Encargado inválido.');
 const key=clientId+'-'+owner;if(sessions.has(key))return sessions.get(key);
 const s={connection:{status:'idle',qr:'',account:'',error:''},client:null,connecting:false,plan:null};
 s.campaign=new Campaign({file:path.join(__dirname,'app-data',key,'history.json'),delay:5000,isReady:()=>s.connection.status==='ready',send:async item=>{
  const [result]=await s.client.onWhatsApp(item.telefono);
  if(!result?.exists){const e=Error('El número no está registrado en WhatsApp.');e.definitelyNotSent=true;throw e;}
  return s.client.sendMessage(result.jid,{text:item.text});
 }});sessions.set(key,s);return s;
}
async function connect(owner,clientId){
 const s=session(owner,clientId);if(s.connecting||['ready','qr','connecting'].includes(s.connection.status))return;
 if([...sessions.values()].filter(x=>x.client).length>=14)throw Error('El servidor está ocupado. Esperá a que termine otra sesión.');
 s.connecting=true;s.connection={status:'connecting',qr:'',account:'',error:''};
 try{
  const {default:makeWASocket,useMultiFileAuthState,fetchLatestBaileysVersion,DisconnectReason}=await import('@whiskeysockets/baileys');
  const QRCode=require('qrcode'),folder=path.join(__dirname,'app-data',clientId+'-'+owner,'auth');
  fs.mkdirSync(folder,{recursive:true,mode:0o700});
  const {state,saveCreds}=await useMultiFileAuthState(folder),{version}=await fetchLatestBaileysVersion();
  const logger=(await import('pino')).default({level:'silent'});
  const client=makeWASocket({logger,version,auth:state,browser:['PEJ','Chrome','1.0.0'],markOnlineOnConnect:false,syncFullHistory:false,shouldSyncHistoryMessage:()=>false,connectTimeoutMs:45000});s.client=client;
  client.ev.on('creds.update',()=>{void saveCreds().catch(()=>{s.campaign.stop();s.connection.error='No se pudo guardar la sesión.';});});
  client.ev.on('connection.update',update=>{void(async()=>{
   if(s.client!==client)return;
   if(update.qr){s.connecting=false;const qr=await QRCode.toDataURL(update.qr,{width:280,margin:2});if(s.client===client)s.connection={status:'qr',qr,account:'',error:''};}
   if(update.connection==='open'){s.connecting=false;s.connection={status:'ready',qr:'',account:client.user?.id?.split(':')[0]?.split('@')[0]||'',error:''};}
   if(update.connection==='close'){
    s.connecting=false;s.client=null;s.campaign.stop();
    const code=update.lastDisconnect?.error?.output?.statusCode;
    s.connection={status:'disconnected',qr:'',account:'',error:code===DisconnectReason.loggedOut?'WhatsApp desvinculado. Generá otro QR.':'Conexión interrumpida. Generá otro QR para reconectar.'};
    if(code===DisconnectReason.restartRequired){s.connection.status='idle';void connect(owner,clientId).catch(()=>{});}
   }
  })().catch(e=>{s.connecting=false;s.connection={status:'error',qr:'',account:'',error:e.message};});});
 }catch(e){s.connecting=false;s.connection={status:'error',qr:'',account:'',error:e.message};}
}

function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
async function body(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>256000)throw Error('Solicitud demasiado grande.');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
function planFor(s,owner,input){
 if(typeof input.sender!=='string'||!input.sender.trim())throw Error('Completá el nombre del remitente.');
 if(typeof input.template!=='string'||!input.template.includes('{nombre}')||!input.template.includes('{remitente}'))throw Error('El mensaje base debe incluir {nombre} y {remitente}.');
 const ids=input.ids;if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Seleccioná contactos para enviar.');
 const phoneSet=new Set(),items=[];let excluded=[];
 for(const id of ids){const base=data.find(c=>c.id===id&&c.owner===owner);if(!base)throw Error('Un contacto no corresponde a este encargado.');const patch=input.overrides?.[id]||{};
 const c={...base,phone:typeof patch.phone==='string'?patch.phone:base.phone,greeting:typeof patch.greeting==='string'?patch.greeting:base.greeting};let phone=c.phone.replace(/\D/g,'');if(phone.length===10)phone='549'+phone;
 if(!/^549\d{10}$/.test(phone)){excluded.push({id,name:c.name,reason:'Teléfono inválido'});continue;}
 if(phoneSet.has(phone)){excluded.push({id,name:c.name,reason:'Teléfono repetido en esta tanda'});continue;}phoneSet.add(phone);
 const previous=s.campaign.history.some(h=>h.telefono===phone&&['sent','sending','uncertain'].includes(h.status));
 if(previous){excluded.push({id,name:c.name,reason:'Ya enviado o pendiente de revisión'});continue;}
 const text=input.template.replace(/\{nombre\}/g,()=>c.greeting.trim()).replace(/\{remitente\}/g,()=>input.sender.trim());
 if(!text.trim()||text.length>4000||/[{}]/.test(text))throw Error('El mensaje tiene variables sin completar o supera los 4000 caracteres.');
 items.push({...c,nombreCompleto:c.name,nombre:c.greeting,telefono:phone,text,key:crypto.createHash('sha256').update(phone+'\n'+text).digest('hex')});
 }
 if(!items.length)throw Error('No quedan destinatarios válidos sin enviar en esta tanda.');
 return {id:crypto.randomUUID(),items:s.campaign.reviewedItems(items),excluded,expires:Date.now()+15*60*1000};
}
const assets={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/core.js':['core.js','text/javascript'],'/bulk.js':['bulk.js','text/javascript'],'/styles.css':['styles.css','text/css'],'/contacts.json':['contacts.json','application/json'],'/online.json':['online.json','application/json']};
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
 if(req.method==='GET'&&req.url==='/healthz')return json(res,200,{ok:true});
 if(req.headers.host!==new URL(origin).host)return json(res,403,{error:'Abrí el panel desde '+origin});
 const clientId=browserId(req,res,production),token=clientToken(clientId);
 try{const url=new URL(req.url,origin);
  if(req.method==='GET'&&url.pathname==='/healthz')return json(res,200,{ok:true});
  if(req.method==='GET'&&url.pathname==='/api/state'){const s=session(url.searchParams.get('owner'),clientId);return json(res,200,{token,connection:s.connection,campaign:s.campaign.state()});}
  if(req.method==='POST'&&url.pathname.startsWith('/api/')){
   if(req.headers.origin!==origin||req.headers['x-app-token']!==token)return json(res,403,{error:'Recargá el panel para validar tu sesión.'});
   const input=await body(req),s=session(input.owner,clientId);
   if(url.pathname==='/api/connect'){void connect(input.owner,clientId).catch(e=>{s.connection={status:'error',qr:'',account:'',error:e.message};});return json(res,200,{ok:true});}
   if(url.pathname==='/api/preview'){if(s.campaign.active)throw Error('Ya hay una tanda en curso.');s.plan=planFor(s,input.owner,input);return json(res,200,s.plan);}
   if(url.pathname==='/api/send'){if(!s.plan||s.plan.id!==input.planId||s.plan.expires<Date.now())throw Error('Prepará la tanda nuevamente.');if(input.confirmed!==true)throw Error('Revisá la tanda antes de enviar.');s.campaign.start(s.plan.items);s.plan=null;return json(res,200,{ok:true});}
   if(url.pathname==='/api/stop'){s.campaign.stop();return json(res,200,{ok:true});}
   if(url.pathname==='/api/resolve'){s.campaign.resolve(input.key,input.status);return json(res,200,{ok:true});}
   if(url.pathname==='/api/disconnect'){if(s.campaign.active)throw Error('Detené la tanda antes de desvincular.');if(s.connecting)throw Error('Esperá a que termine la conexión.');const c=s.client;s.client=null;if(c){await c.logout().catch(()=>{});c.end?.(undefined);}s.connection={status:'idle',qr:'',account:'',error:''};s.plan=null;return json(res,200,{ok:true});}
   return json(res,404,{error:'Ruta inexistente.'});
  }
  const asset=assets[url.pathname];if(req.method==='GET'&&asset){res.writeHead(200,{'Content-Type':asset[1]+'; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,asset[0])));}
  json(res,404,{error:'Ruta inexistente.'});
 }catch(e){json(res,400,{error:e.message});}
});
if(require.main===module){server.listen(PORT,HOST,()=>console.log(`PEJ escuchando en ${HOST}:${PORT} · ${origin}`));process.once('SIGINT',()=>{for(const s of sessions.values())s.campaign.stop();void Promise.all([...sessions.values()].map(s=>Promise.resolve(s.client?.end?.(undefined)))).finally(()=>server.close());});}
module.exports={planFor,session,server};
