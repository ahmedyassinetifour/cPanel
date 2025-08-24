import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import { LazyMotion, m, domAnimation, AnimatePresence } from 'https://esm.sh/framer-motion@11.2.10';
import htm from 'https://esm.sh/htm@3.1.1';
const html = htm.bind(React.createElement);

// Storage helpers (compatible with existing backend/localStorage contract)
const read = (k, fb) => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const SETTINGS_KEY = 'cpanel.settings';
const PRODUCTS_KEY = 'cpanel.products';
const ORDERS_KEY = 'shop.orders';
const CLIENTS_KEY = 'cpanel.clients';
const TX_KEY = 'cpanel.transactions';

function useCurrency(){
  const settings = read(SETTINGS_KEY, {});
  const currency = settings.currency || 'USD';
  const fmt = useMemo(()=>{
    try { return new Intl.NumberFormat(undefined,{ style:'currency', currency }); }
    catch { return { format: (v)=>`$${(+v||0).toFixed(2)}` }; }
  }, [currency]);
  return (v)=> fmt.format(+v||0);
}

function useProducts(){
  const fallback = [
    { id: 1, name: 'Custom Cup', price: 18, image: 'https://picsum.photos/seed/cup01/600/400', description: 'Blush-toned ceramic cup with your name.' },
    { id: 2, name: 'Notebook', price: 22, image: 'https://picsum.photos/seed/notebook01/600/400', description: 'Lavender hardcover with custom initials.' },
    { id: 3, name: 'Sticker Pack', price: 8, image: 'https://picsum.photos/seed/stickers01/600/400', description: 'Cute pastel sticker sheets.' },
  ];
  const raw = read(PRODUCTS_KEY, fallback);
  return raw.map(p=>{ const first = p.image || `https://picsum.photos/seed/prod${p.id}/600/400`; const images = Array.isArray(p.images)&&p.images.length?p.images:[first]; return { ...p, image: images[0], images }; });
}

function Header({ cartCount, onToggleTheme, onOpenCart }){
  return html`
    <div class="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/70 backdrop-blur">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#/" class="flex items-center gap-2">
          <div class="h-10 w-10 rounded-xl bg-brand-600 text-white grid place-items-center shadow">👑</div>
          <div class="font-extrabold">Shop</div>
        </a>
        <div class="flex items-center gap-3">
          <button onClick=${onToggleTheme} class="h-10 w-10 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">🌓</button>
          <button onClick=${onOpenCart} class="relative h-10 px-3 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">🛒${cartCount>0 && html`<span class="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white">${cartCount}</span>`}</button>
        </div>
      </div>
    </div>
  `;
}

function SkeletonCard(){
  return html`
    <div class="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
      <div class="h-40 bg-slate-200 dark:bg-slate-800"></div>
      <div class="p-3 space-y-2">
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
        <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    </div>
  `;
}

function ProductCard({ p, onView, onAdd, format }){
  return html`
    ${React.createElement(m.div, { layout:true, initial:{ opacity:0, y:8 }, animate:{ opacity:1, y:0 }, transition:{ duration:0.25 }, className:"group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden" },
      html`<div class="relative">
        <img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-[1.03]"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
      </div>`,
      html`<div class="p-4 space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">${p.name}</h3>
          <div class="text-sm text-slate-600 dark:text-slate-300">${format(p.price)}</div>
        </div>
        <p class="text-xs text-slate-500 line-clamp-2" dir="auto">${p.description || ''}</p>
        <div class="flex gap-2 pt-2">
          <button onClick=${()=> onView(p)} class="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">View</button>
          <button onClick=${()=> onAdd(p,1)} class="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white shadow">Add to Cart</button>
        </div>
      </div>`
    )}
  `;
}

function Lightbox({ open, onClose, product, format, onAdd }){
  const [idx,setIdx] = useState(0);
  useEffect(()=>{ setIdx(0); }, [product?.id]);
  if (!open || !product) return null;
  const imgs = product.images || [product.image];
  return html`
    ${React.createElement(AnimatePresence, null,
      React.createElement(m.div, { key:'lb', initial:{ opacity:0 }, animate:{ opacity:1 }, exit:{ opacity:0 }, className:'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4' },
        React.createElement(m.div, { initial:{ scale:0.96, opacity:0 }, animate:{ scale:1, opacity:1 }, exit:{ scale:0.98, opacity:0 }, transition:{ type:'spring', stiffness:260, damping:24 }, className:'w-full max-w-3xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700' },
          html`<div class="grid md:grid-cols-2 gap-0">
            <div class="relative">
              <img src="${imgs[idx]}" alt="${product.name}" class="w-full h-80 object-cover"/>
              ${imgs.length>1 && [
                html`<button onClick=${()=> setIdx((idx-1+imgs.length)%imgs.length)} class="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">‹</button>`,
                html`<button onClick=${()=> setIdx((idx+1)%imgs.length)} class="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">›</button>`
              ]}
              ${imgs.length>1 && html`<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                ${imgs.map((src,i)=> html`<button key=${i} onClick=${()=> setIdx(i)} class=${'h-2 w-2 rounded-full ' + (i===idx ? 'bg-white' : 'bg-white/50')}></button>`)}
              </div>`}
            </div>
            <div class="p-5 space-y-4">
              <div class="flex items-start justify-between gap-4">
                <h3 class="text-xl font-bold">${product.name}</h3>
                <button onClick=${onClose} class="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700">✕</button>
              </div>
              <div class="text-lg font-semibold">${format(product.price)}</div>
              ${product.description && html`<p class="text-sm text-slate-600 dark:text-slate-300" dir="auto">${product.description}</p>`}
              <div class="pt-2">
                <button onClick=${()=> onAdd(product,1)} class="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white shadow">Add to Cart</button>
              </div>
            </div>
          </div>`
        )
      )
    )}
  `;
}

function Drawer({ open, onClose, children }){
  return html`
    ${React.createElement(AnimatePresence, null,
      open && [
        React.createElement(m.div, { onClick:onClose, initial:{ opacity:0 }, animate:{ opacity:1 }, exit:{ opacity:0 }, className:'fixed inset-0 z-40 bg-black/40' }),
        React.createElement(m.aside, { initial:{ x:'100%' }, animate:{ x:0 }, exit:{ x:'100%' }, transition:{ type:'spring', stiffness:240, damping:26 }, className:'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col' }, children)
      ]
    )}
  `;
}

function CartView({ items, format, onInc, onDec, onRemove, onCheckout }){
  const total = items.reduce((s,i)=> s + i.price*i.qty, 0);
  return html`
    <div class="flex-1 flex flex-col">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 class="font-semibold">Your Cart</h3>
        <div class="text-sm text-slate-500">${items.length} items</div>
      </div>
      <div class="flex-1 overflow-auto p-5 space-y-3">
        ${items.length===0 ? html`<div class="text-slate-500 text-sm">Cart is empty</div>` : items.map(it=> (
          React.createElement(m.div, { key:it.id, layout:true, className:'flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800' },
            React.createElement('div', { className:'h-12 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden' },
              React.createElement('img', { src: it.image || ('https://picsum.photos/seed/p' + it.id + '/160/120'), alt: it.name, className:'w-full h-full object-cover' })
            ),
            React.createElement('div', { className:'flex-1 min-w-0' },
              React.createElement('div', { className:'font-medium truncate' }, it.name),
              React.createElement('div', { className:'text-xs text-slate-500' }, format(it.price))
            ),
            React.createElement('div', { className:'flex items-center gap-2' },
              React.createElement('button', { onClick:()=> onDec(it.id), className:'h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700' }, '−'),
              React.createElement('div', { className:'w-6 text-center' }, String(it.qty)),
              React.createElement('button', { onClick:()=> onInc(it.id), className:'h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700' }, '＋')
            ),
            React.createElement('div', { className:'w-20 text-right font-semibold' }, format(it.price*it.qty)),
            React.createElement('button', { onClick:()=> onRemove(it.id), className:'h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700' }, '✕')
          )
        ))}
      </div>
      <div class="p-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div class="flex items-center justify-between font-semibold"><span>Total</span><span>${format(total)}</span></div>
        <button onClick=${onCheckout} class="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white shadow">Checkout</button>
      </div>
    </div>
  `;
}

function Checkout({ items, onBack, onPlaced, format }){
  const total = items.reduce((s,i)=> s + i.price*i.qty, 0);
  function handleSubmit(e){
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    if (!data.name || !data.phone || !data.address) return alert('Please fill required fields');
    if (data.birthday){ const bd=new Date(data.birthday); const today=new Date(); if (isNaN(bd.getTime()) || bd>today) return alert('Invalid birthday'); }
    const orders = read(ORDERS_KEY, []);
    const order = { id: Date.now(), items: items.map(({id,name,price,qty})=>({id,name,price,qty})), total, customer: { name: data.name, phone: data.phone, address: data.address, notes: data.notes||'', birthday: data.birthday||'' }, date: new Date().toISOString(), status: 'pending' };
    orders.push(order); write(ORDERS_KEY, orders);
    try { syncToAdmin(order); } catch {}
    onPlaced();
  }
  return html`
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid md:grid-cols-2 gap-6">
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h3 class="font-semibold mb-3">Order Summary</h3>
        <div class="space-y-3 text-sm">
          ${items.map(it=> html`<div key=${it.id} class="flex items-center justify-between">
            <div>
              <div class="font-medium">${it.name}</div>
              <div class="text-xs text-slate-500">${format(it.price)} × ${it.qty}</div>
            </div>
            <span class="font-semibold">${format(it.price*it.qty)}</span>
          </div>`)}
        </div>
        <div class="mt-3 flex items-center justify-between"><span class="text-slate-500">Total</span><span class="font-extrabold">${format(total)}</span></div>
      </div>
      <form onSubmit=${handleSubmit} class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div>
          <label class="block text-xs text-slate-500 mb-1">Name</label>
          <input name="name" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" required />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Phone</label>
          <input name="phone" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" required />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Birthday (optional)</label>
          <input type="date" name="birthday" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Address</label>
          <textarea name="address" rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" required></textarea>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Notes</label>
          <textarea name="notes" rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"></textarea>
        </div>
        <div class="pt-2">
          <button class="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white shadow">Place Order</button>
        </div>
        <button type="button" onClick=${onBack} class="w-full mt-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">Back</button>
      </form>
    </div>
  `;
}

function syncToAdmin(order){
  const clients = read(CLIENTS_KEY, []);
  const txs = read(TX_KEY, []);
  let client = clients.find(c => c.phone === order.customer.phone);
  if (!client){
    const nextId = Math.max(0, ...clients.map(c=> c.id||0)) + 1;
    client = { id: nextId, name: order.customer.name, phone: order.customer.phone, email: '', birthday: '', notes: order.customer.notes||'', avatar: null };
    clients.push(client);
  } else {
    client.name = order.customer.name || client.name;
    client.notes = order.customer.notes || client.notes;
  }
  let nextTxId = Math.max(0, ...txs.map(t=> t.id||0)) + 1;
  const today = new Date().toISOString().slice(0,10);
  for (const item of order.items){
    txs.push({ id: nextTxId++, clientId: client.id, productId: item.id, qty: item.qty, priceAtPurchase: item.price, date: today });
  }
  write(CLIENTS_KEY, clients);
  write(TX_KEY, txs);
}

function App(){
  const products = useProducts();
  const format = useCurrency();
  const [theme,setTheme] = useState(()=> localStorage.getItem('theme')||'light');
  const [cart,setCart] = useState(()=> read('shop.cart', []));
  const [view,setView] = useState('list');
  const [active,setActive] = useState(null);
  useEffect(()=>{ document.documentElement.classList.toggle('dark', theme==='dark'); localStorage.setItem('theme', theme); }, [theme]);
  useEffect(()=>{ write('shop.cart', cart); }, [cart]);
  const cartCount = cart.reduce((s,i)=> s+i.qty, 0);

  function addToCart(p, qty){
    setCart((c)=>{
      const existing = c.find(x=> x.id===p.id);
      if (existing) return c.map(x=> x.id===p.id ? { ...x, qty: x.qty + qty } : x);
      return [...c, { id: p.id, name: p.name, price: p.price, qty, image: (p.images?.[0]||p.image) }];
    });
  }
  function inc(id){ setCart(c=> c.map(x=> x.id===id? { ...x, qty: x.qty+1 } : x)); }
  function dec(id){ setCart(c=> c.map(x=> x.id===id? { ...x, qty: Math.max(1, x.qty-1) } : x)); }
  function remove(id){ setCart(c=> c.filter(x=> x.id!==id)); }

  return html`
      ${React.createElement(LazyMotion, { features: domAnimation },
        html`<${Header} cartCount=${cartCount} onToggleTheme=${()=> setTheme(t=> t==='dark'?'light':'dark')} onOpenCart=${()=> setView('drawer')} />
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          ${view==='list' && [
            html`<div class="mb-6">
              <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Our Products</h1>
              <p class="text-slate-500 dark:text-slate-400">Minimal, modern, and premium — pick your favorites.</p>
            </div>`,
            (products.length===0 ? html`<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${Array.from({length:6}).map((_,i)=> html`<${SkeletonCard} key=${i} />`)}</div>` :
              React.createElement(m.div, { layout:true, className:'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' },
                ...products.map(p=> html`<${ProductCard} key=${p.id} p=${p} onView=${(pp)=> { setActive(pp); }} onAdd=${addToCart} format=${format} />`)
              )
            )
          ]}
          ${view==='cart' && html`<${Checkout} items=${cart} onBack=${()=> setView('list')} onPlaced=${()=> { setCart([]); setView('list'); }} format=${format} />`}
        </main>
        <${Lightbox} open=${!!active} onClose=${()=> setActive(null)} product=${active} onAdd=${addToCart} format=${format} />
        <${Drawer} open=${view==='drawer'} onClose=${()=> setView('list')}>
          ${html`<${CartView} items=${cart} format=${format} onInc=${inc} onDec=${dec} onRemove=${remove} onCheckout=${()=> setView('cart')} />`}
        <//>`
      )}
  `;
}

const root = createRoot(document.getElementById('shop-root'));
root.render(html`<${App} />`);
