const fs=require('node:fs');
const path=require('node:path');
class Campaign {
  constructor({file,send,isReady,delay=5000,onChange=()=>{}}) {
    this.file=file; this.send=send; this.isReady=isReady; this.delay=delay; this.onChange=onChange;
    this.active=false; this.stopRequested=false; this.items=[]; this.lastError=''; this.waitResolve=null;
    this.history=[];
    if (fs.existsSync(file)) {
      this.history=JSON.parse(fs.readFileSync(file,'utf8'));
      if (!Array.isArray(this.history) || this.history.some(h=>!h || typeof h.key!=='string')) throw Error('El historial no es válido. Revisá app-data/historial.json antes de iniciar.');
      for(const h of this.history) if(h.status==='sending') {h.status='uncertain'; h.error='El programa se cerró durante el envío. Revisá el chat antes de marcarlo o reintentar.';}
      this.persist();
    }
  }
  persist() {fs.mkdirSync(path.dirname(this.file),{recursive:true}); const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify(this.history,null,2),{mode:0o600});fs.renameSync(temp,this.file);}
  notify() {this.onChange();}
  state() {return {active:this.active,stopping:this.stopRequested,items:this.items,history:this.history,lastError:this.lastError};}
  reviewedItems(items) {
    return items.map(i=>({...i,blocked:this.history.some(h=>h.key===i.key&&['sent','sending','uncertain'].includes(h.status))}));
  }
  start(items) {
    if(this.active) throw Error('Ya hay un envío en curso.');
    if(!this.isReady()) throw Error('Primero vinculá WhatsApp y esperá a que esté conectado.');
    this.items=this.reviewedItems(items).map(i=>({...i,status:i.blocked?'skipped':'pending',error:''}));
    if(!this.items.some(i=>i.status==='pending')) throw Error('Todos estos mensajes ya se enviaron o necesitan revisión en el historial.');
    this.active=true;this.stopRequested=false;this.lastError='';this.notify();
    this.done=this.run().catch(error=>{
      this.lastError='La tanda se detuvo: '+error.message;
      for(const item of this.items) if(item.status==='pending') item.status='cancelled';
    }).finally(()=>{this.active=false;this.stopRequested=false;this.notify();});
  }
  async run() {
    for(const item of this.items) {
      if(item.status!=='pending') continue;
      if(this.stopRequested || !this.isReady()) {item.status='cancelled';continue;}
      // Persistir ANTES de la operación remota: ante un cierre no se reenvía a ciegas.
      const record={key:item.key,nombre:item.nombreCompleto,telefono:item.telefono,text:item.text,status:'sending',date:new Date().toISOString()};
      this.history.push(record);
      try {this.persist();} catch(error) {this.history.pop();throw error;}
      item.status='sending';this.notify();
      try {
        const result=await this.send(item);
        item.status='sent';record.status='sent';record.messageId=result?.id?._serialized||'';
      } catch(error) {
        // Un timeout no prueba que el mensaje no haya salido: no reintentar automáticamente.
        item.status=error.definitelyNotSent?'error':'uncertain';
        record.status=item.status;record.error=item.error=error.message;
        if(!error.definitelyNotSent) this.stopRequested=true;
      }
      this.persist();this.notify();
      if(this.items.some(i=>i.status==='pending') && !this.stopRequested) {
        await new Promise(resolve=>{const timer=setTimeout(()=>{this.waitResolve=null;resolve();},this.delay);this.waitResolve=()=>{clearTimeout(timer);this.waitResolve=null;resolve();};});
      }
    }
  }
  stop() {this.stopRequested=true;this.waitResolve?.();this.notify();}
  resolve(key,status) {
    if(this.active) throw Error('Esperá a que termine la tanda.');
    const item=[...this.history].reverse().find(h=>h.key===key&&h.status==='uncertain');
    if(!item || !['sent','not_sent'].includes(status)) throw Error('Revisión inválida.');
    const previous={...item};Object.assign(item,{status,reviewedAt:new Date().toISOString()});
    try{this.persist();}catch(error){Object.assign(item,previous);throw error;}
    this.notify();
  }
}
module.exports={Campaign};
