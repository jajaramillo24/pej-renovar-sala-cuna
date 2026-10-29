const crypto=require('node:crypto');
function browserId(req,res,production){
 const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('pej_session='));
 const supplied=cookie?.slice(12);const id=/^[a-f0-9]{48}$/.test(supplied||'')?supplied:crypto.randomBytes(24).toString('hex');
 if(id!==supplied)res.setHeader('Set-Cookie',`pej_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${production?'; Secure':''}`);
 return id;
}
module.exports={browserId};
