// Tobinu Café Kasir — App Logic (PWA-ready)
const fmt = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0);
const uid = () => Math.random().toString(36).slice(2,10);
const todayKey = () => new Date().toISOString().slice(0,10);
const LS = { get(k,d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d }}, set(k,v){ localStorage.setItem(k, JSON.stringify(v)) } };
const readFile = f => new Promise((res,rej)=>{ if(!f) return res(null); const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); });

const defaultProducts = [
  {id:uid(), name:"Americano", price:15000, cat:"Coffee", tag:"Hot/Ice", img:"assets/menu/americano.jpg"},
  {id:uid(), name:"Cappuccino", price:22000, cat:"Coffee", tag:"Hot/Ice", img:"assets/menu/latte.jpg"},
  {id:uid(), name:"Latte", price:24000, cat:"Coffee", tag:"Hot/Ice", img:"assets/menu/latte.jpg"},
  {id:uid(), name:"Es Kopi Susu", price:18000, cat:"Coffee", tag:"Signature", img:"assets/menu/latte.jpg"},
  {id:uid(), name:"Matcha Latte", price:23000, cat:"Tea & Latte", tag:"Popular", img:"assets/menu/matcha.jpg"},
  {id:uid(), name:"French Fries", price:16000, cat:"Snack", tag:"", img:"assets/menu/fries.jpg"},
  {id:uid(), name:"Mineral Water", price:7000, cat:"Others", tag:"", img:null}
];

const state = {
  products: LS.get('tb_products', defaultProducts),
  cart: []
};

function $(q){ return document.querySelector(q); }
const productsEl = $('#products'), cartEl=$('#cart'), searchEl=$('#search'), tabsEl=$('#category-tabs'), catSel=$('#sel-category');

function applyBrand(){
  const logo = LS.get('tb_logo', null) || 'assets/logo.png';
  $('#logoImg').src = logo;
  const prev = $('#logoPreview'); if(prev) prev.src = logo;
}
function applyBackground(){
  const bgImg = LS.get('tb_bg_image', null);
  const bgColor = LS.get('tb_bg_color', '');
  if(bgColor && !bgImg){ document.body.style.background = bgColor; }
  else{
    document.body.style.background = `#0f1115 url('${bgImg || 'assets/bg.jpg'}') center/cover fixed no-repeat`;
  }
  const prev = $('#bgPreview'); if(prev){ prev.style.backgroundImage = `url('${bgImg || 'assets/bg.jpg'}')`; }
  const bgColorInput = $('#bgColor'); if(bgColorInput) bgColorInput.value = bgColor || '';
}

function loadCategories(){
  const cats = ['all', ...new Set(state.products.map(p=>p.cat || 'Others'))];
  catSel.innerHTML = cats.map(c=>`<option value="${c}">${c==='all'?'Semua':c}</option>`).join('');
  tabsEl.innerHTML = cats.map((c,i)=>`<button class="tab ${i===0?'active':''}" data-cat="${c}">${c==='all'?'Semua':c}</button>`).join('');
  tabsEl.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
    tabsEl.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); renderProducts();
  }));
}

function renderProducts(){
  const q = searchEl.value.trim().toLowerCase();
  const activeCat = tabsEl.querySelector('.tab.active')?.dataset.cat || 'all';
  let list = state.products;
  if(activeCat!=='all') list = list.filter(p=>p.cat===activeCat);
  if(q){
    if(/^\d+$/.test(q)){
      productsEl.innerHTML = `<div class="prod" style="grid-column:1/-1;border-style:dashed" data-manual="${q}">
        <div class="name">Tambah Manual: ${fmt(Number(q))}</div>
        <div class="meta">Tekan untuk memasukkan item manual dgn harga tersebut</div>
      </div>` + list.map(P).join('');
      productsEl.querySelector('[data-manual]')?.addEventListener('click', ()=> addToCart({id:uid(), name:'Item Manual', price:Number(q)}));
    }else{
      list = list.filter(p=> p.name.toLowerCase().includes(q) || (p.cat||'').toLowerCase().includes(q));
      productsEl.innerHTML = list.map(P).join('');
    }
  }else productsEl.innerHTML = list.map(P).join('');

  productsEl.querySelectorAll('.prod').forEach(div=>div.addEventListener('click',()=>{
    const id = div.dataset.id; const prod = state.products.find(p=>p.id===id); if(prod) addToCart(prod);
  }));

  function P(p){
    return `<div class="prod" data-id="${p.id}">
      ${p.img?`<img class="thumb" src="${p.img}" alt="${p.name}">`:`<div class="thumb" style="display:grid;place-items:center;font-size:12px;color:#94a3b8">No Image</div>`}
      <div class="name">${p.name}</div>
      <div class="meta">${p.cat||'Others'} • <strong>${fmt(p.price)}</strong></div>
      ${p.tag?`<div class="tag">${p.tag}</div>`:''}
    </div>`;
  }
}

function addToCart(p){
  const ex = state.cart.find(i=>i.id===p.id && !i.manual);
  if(ex) ex.qty += 1;
  else state.cart.push({id:p.id,name:p.name,price:p.price,qty:1,img:p.img||null,manual:!state.products.find(pp=>pp.id===p.id)});
  renderCart();
}
function renderCart(){
  cartEl.innerHTML = '';
  state.cart.forEach((it,idx)=>{
    const row = document.createElement('div'); row.className='cart-item';
    row.innerHTML = `
      ${it.img?`<img src="${it.img}" style="width:42px;height:42px;border-radius:8px;object-fit:cover;border:1px solid var(--border)">`:`<div style="width:42px;height:42px;border:1px solid var(--border);border-radius:8px;background:#0e1220"></div>`}
      <div>
        <div style="font-weight:700">${it.name}</div>
        <div class="fine">${fmt(it.price)} ${it.manual?'<span class="tag">manual</span>':''}</div>
      </div>
      <div class="qty">
        <button data-act="dec">-</button>
        <div style="min-width:28px;text-align:center">${it.qty}</div>
        <button data-act="inc">+</button>
      </div>
      <div style="text-align:right">
        <div><strong>${fmt(it.qty*it.price)}</strong></div>
        <button class="btn ghost" data-act="rm" style="font-size:12px">Hapus</button>
      </div>`;
    row.querySelector('[data-act=inc]').onclick=()=>{it.qty++; renderCart();};
    row.querySelector('[data-act=dec]').onclick=()=>{it.qty=Math.max(1,it.qty-1); renderCart();};
    row.querySelector('[data-act=rm]').onclick=()=>{state.cart.splice(idx,1); renderCart();};
    cartEl.appendChild(row);
  });
  recalc();
}
function recalc(){
  const subtotal = state.cart.reduce((a,b)=>a + b.qty*b.price, 0);
  const tax = $('#taxOn').checked ? Math.round(subtotal*0.10) : 0;
  const svc = $('#svcOn').checked ? Math.round(subtotal*0.05) : 0;
  const discVal = Number($('#discVal').value||0);
  const discType = $('#discType').value;
  const disc = discType==='percent' ? Math.round((subtotal+tax+svc) * (discVal/100)) : discVal;
  const total = Math.max(0, subtotal + tax + svc - disc);
  const payAmt = Number($('#payAmt').value||0);
  const change = Math.max(0, payAmt - total);
  $('#subtot').textContent=fmt(subtotal); $('#tax').textContent=fmt(tax); $('#svc').textContent=fmt(svc);
  $('#disc').textContent=fmt(disc); $('#total').textContent=fmt(total); $('#change').textContent=fmt(change);
  return {subtotal,tax,svc,disc,total,change};
}
function charge(){
  if(state.cart.length===0){ alert('Keranjang kosong'); return; }
  const sums = recalc();
  const payType = $('#paytype').value;
  const payAmt = Number($('#payAmt').value||0);
  if(payType==='Cash' && payAmt < sums.total){ if(!confirm('Uang cash kurang dari total. Lanjut?')) return; }
  const r = { id:uid(), time:new Date().toLocaleString('id-ID'), items: state.cart.map(({name,price,qty})=>({name,price,qty})), ...sums, payType };
  const key='tb_sales_'+todayKey(); const arr = LS.get(key,[]); arr.push(r); LS.set(key,arr);
  updateTodayStats(); showReceipt(r); state.cart=[]; renderCart(); $('#payAmt').value='';
}
function showReceipt(rc){
  const lines=[];
  lines.push('Tobinu Café'); lines.push('Jl. — — —'); lines.push('');
  lines.push(`Waktu : ${rc.time}`); lines.push('--------------------------');
  rc.items.forEach(it=>{ lines.push(`${it.qty} x ${it.name}`); lines.push(`    @${fmt(it.price)}  = ${fmt(it.qty*it.price)}`)});
  lines.push('--------------------------');
  lines.push(`Subtotal  : ${fmt(rc.subtotal)}`);
  if(rc.tax) lines.push(`Pajak 10% : ${fmt(rc.tax)}`);
  if(rc.svc) lines.push(`Service 5%: ${fmt(rc.svc)}`);
  if(rc.disc) lines.push(`Diskon    : ${fmt(rc.disc)}`);
  lines.push(`TOTAL     : ${fmt(rc.total)}`);
  lines.push(`Bayar (${rc.payType})`);
  if(rc.change) lines.push(`Kembalian : ${fmt(rc.change)}`);
  lines.push(''); lines.push('Terima kasih!');
  openModal('Struk', lines.join('\n'));
}
function openModal(title, body){ $('#modalTitle').textContent=title; $('#modalBody').textContent=body; $('#modal').showModal(); }

function showHistory(){
  const keys = Object.keys(localStorage).filter(k=>k.startsWith('tb_sales_')).sort().reverse();
  if(keys.length===0){ openModal('Riwayat', 'Belum ada transaksi.'); return; }
  const parts = [];
  keys.forEach(k=>{
    const date = k.replace('tb_sales_',''); const arr = LS.get(k,[]); const total = arr.reduce((s,r)=>s+r.total,0);
    parts.push(`${date} — ${arr.length} transaksi — ${fmt(total)}`);
    arr.forEach(r=>{ parts.push(`  • ${r.time}  ${r.items.map(i=>i.qty+'x '+i.name).join(', ')}  → ${fmt(r.total)}`); });
  }); openModal('Riwayat Penjualan', parts.join('\n'));
}
function updateTodayStats(){ const arr=LS.get('tb_sales_'+todayKey(),[]); const total=arr.reduce((s,r)=>s+r.total,0); $('#today-stats').textContent=`Hari ini: ${arr.length} transaksi • ${fmt(total)}`; }
function exportCSV(){
  const keys = Object.keys(localStorage).filter(k=>k.startsWith('tb_sales_'));
  let rows = [['date','time','id','item_name','qty','price','subtotal','tax','service','discount','total','pay_type']];
  keys.forEach(k=> LS.get(k,[]).forEach(r=> r.items.forEach(it=> rows.push([k.replace('tb_sales_',''), r.time, r.id, it.name, it.qty, it.price, r.subtotal, r.tax, r.svc, r.disc, r.total, r.payType]))));
  const csv = rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='tobinu-cafe-sales.csv'; a.click(); URL.revokeObjectURL(url);
}
function clearToday(){ if(confirm('Hapus transaksi HARI INI?')){ localStorage.removeItem('tb_sales_'+todayKey()); updateTodayStats(); } }

function openSettings(){ applyBrand(); applyBackground(); $('#dlgSettings').showModal(); }
async function saveSettings(){
  const lf=$('#logoFile').files[0], bf=$('#bgFile').files[0];
  const logoData = await readFile(lf); const bgData = await readFile(bf);
  const bgColor = $('#bgColor').value.trim();
  if(logoData){ LS.set('tb_logo', logoData); }
  if(bgData){ LS.set('tb_bg_image', bgData); }
  LS.set('tb_bg_color', bgColor || '');
  applyBrand(); applyBackground(); $('#dlgSettings').close();
}
function delLogo(){ localStorage.removeItem('tb_logo'); applyBrand(); }
function delBg(){ localStorage.removeItem('tb_bg_image'); localStorage.removeItem('tb_bg_color'); applyBackground(); }

function openProductForm(){ $('#prodHead').textContent='Produk Baru'; $('#prodForm').reset(); $('#dlgProduct').showModal(); }
async function saveProduct(){
  const name=$('#pname').value.trim(), price=Number($('#pprice').value||0), cat=$('#pcat').value.trim()||'Others', tag=$('#ptag').value.trim();
  const imgFile = $('#pimg').files[0]; if(!name||!price){ alert('Nama/harga wajib diisi'); return; }
  const imgData = await readFile(imgFile);
  const p = {id:uid(), name, price, cat, tag, img: imgData||null};
  state.products.push(p); LS.set('tb_products', state.products);
  loadCategories(); renderProducts(); $('#dlgProduct').close();
}

// events
$('#btn-charge').onclick = charge;
$('#btn-print').onclick = ()=>window.print();
$('#btn-receipts').onclick = showHistory;
$('#btn-export').onclick = exportCSV;
$('#btn-clear-day').onclick = clearToday;
$('#btn-add-manual').onclick = ()=>{ const name = prompt('Nama item manual?','Item Manual'); const price = Number(prompt('Harga (angka saja)?','10000')||0); if(!price){ alert('Harga tidak valid'); return;} addToCart({id:uid(), name, price}); };
$('#btn-add-product').onclick = openProductForm;
$('#modalClose').onclick = ()=>$('#modal').close();
$('#modalPrintNow').onclick = ()=>window.print();
['discVal','discType','taxOn','svcOn','payAmt'].forEach(id=> (document.getElementById(id).oninput = recalc));
$('#btn-settings').onclick = openSettings;
$('#btnCloseSettings').onclick = ()=>$('#dlgSettings').close();
$('#btnSaveSettings').onclick = saveSettings;
$('#btnDelLogo').onclick = delLogo;
$('#btnDelBg').onclick = delBg;
$('#btnCancelProd').onclick = ()=>$('#dlgProduct').close();
$('#btnSaveProd').onclick = saveProduct;
$('#year').textContent = new Date().getFullYear();

applyBrand(); applyBackground(); loadCategories(); renderProducts(); renderCart(); updateTodayStats();

// PWA Service Worker
if('serviceWorker' in navigator){ window.addEventListener('load', ()=>{ navigator.serviceWorker.register('./service-worker.js'); }); }
