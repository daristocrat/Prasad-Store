import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Edit3,
  Eye,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingDown,
  Trash2,
  Truck,
  Upload,
  Users,
  X
} from 'lucide-react';
import {
  loadCategories,
  loadProducts,
  normalizeProduct,
  parseCsvProducts,
  saveCategories,
  saveProducts
} from './services/productStore';
import { auth, firebaseEnabled } from './services/firebase';
import {
  deleteRemoteProduct,
  fetchRemoteCategories,
  fetchRemoteProducts,
  saveRemoteCategory,
  saveRemoteProduct,
  uploadProductImage
} from './services/firebaseProducts';
import { verifyLocalAdminPassword } from './services/localAdminAuth';

const navItems = [
  { id: 'home',     label: 'Home'     },
  { id: 'products', label: 'Products' },
  { id: 'about',    label: 'About'    },
  { id: 'contact',  label: 'Contact'  },
  { id: 'admin',    label: 'Admin'    }
];

const store = {
  name:        'Prasad Store',
  address:     'Champasari, Nivedita Road, Siliguri, West Bengal, India',
  phone:       '+91 9563158383',
  email:       'prasadankit3151@gmail.com',
  whatsapp:    '919932682063',
  mapsUrl:     'https://maps.app.goo.gl/KaDMQDvZjifZ8Dn78',
  mapEmbedUrl: 'https://www.google.com/maps?q=26.7362803,88.4169546&z=18&output=embed'
};

const whatsappMessage = encodeURIComponent('Hello Prasad Store, I want to ask about grocery prices.');
const whatsappUrl     = `https://wa.me/${store.whatsapp}?text=${whatsappMessage}`;

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
});

const CATEGORY_EMOJI = {
  'Atta & Flour':     '🌾',
  'Rice':             '🍚',
  'Rice & Grains':    '🍚',
  'Dal':              '🫘',
  'Dal & Pulses':     '🫘',
  'Pulses':           '🫘',
  'Oil':              '🛢️',
  'Oils':             '🛢️',
  'Oils & Ghee':      '🛢️',
  'Ghee':             '🧈',
  'Spices':           '🌶️',
  'Masala':           '🌶️',
  'Masala & Spices':  '🌶️',
  'Sugar & Salt':     '🧂',
  'Snacks':           '🍿',
  'Biscuits':         '🍪',
  'Tea & Coffee':     '☕',
  'Beverages':        '🥤',
  'Dairy':            '🥛',
  'Cleaning':         '🧹',
  'Detergent':        '🧴',
  'Personal Care':    '💆',
  'Dry Fruits':       '🥜',
  'Condiments':       '🫙',
  'Noodles & Pasta':  '🍜',
  'Bread & Bakery':   '🍞',
  'Soaps & Body Wash':'🧼',
  'Baby Products':    '👶'
};

const getCategoryEmoji = (cat) => CATEGORY_EMOJI[cat] ?? '🛒';

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────

function App() {
  const [activePage,  setActivePage]  = useState('home');
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [products,    setProducts]    = useState(() => loadProducts());
  const [categories,  setCategories]  = useState(() => loadCategories());
  const [adminUser,   setAdminUser]   = useState(null);
  const [dataStatus,  setDataStatus]  = useState(
    firebaseEnabled ? 'Connecting to Firebase...' : 'Local demo mode'
  );

  useEffect(() => { if (!firebaseEnabled) saveProducts(products); },   [products]);
  useEffect(() => { if (!firebaseEnabled) saveCategories(categories); }, [categories]);

  useEffect(() => {
    if (!firebaseEnabled || !auth) return undefined;
    return onAuthStateChanged(auth, setAdminUser);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;
    (async () => {
      try {
        const [rp, rc] = await Promise.all([fetchRemoteProducts(), fetchRemoteCategories()]);
        if (rp?.length) setProducts(rp);
        if (rc?.length) setCategories(rc);
        setDataStatus('Firebase connected');
      } catch (e) {
        setDataStatus(`Firebase read blocked: ${e.message}`);
      }
    })();
  }, []);

  const goTo = (page) => {
    setActivePage(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AnnouncementBar />
      <Header activePage={activePage} goTo={goTo} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>
        {activePage === 'home'     && <HomePage     goTo={goTo} products={products} categories={categories} />}
        {activePage === 'products' && <ProductsPage products={products} categories={categories} />}
        {activePage === 'about'    && <AboutPage    goTo={goTo} />}
        {activePage === 'contact'  && <ContactPage />}
        {activePage === 'admin'    && (
          <AdminPage
            products={products}   setProducts={setProducts}
            categories={categories} setCategories={setCategories}
            adminUser={adminUser}  dataStatus={dataStatus}
          />
        )}
      </main>
      <Footer goTo={goTo} />
      {/* WhatsApp FAB — keep brand green for WhatsApp recognition */}
      <a
        href={whatsappUrl} target="_blank" rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus:outline-none"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANNOUNCEMENT BAR
// ─────────────────────────────────────────────────────────────

function AnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-orange-800 to-orange-600 text-white text-xs font-semibold py-2 px-4">
      <div className="container-max flex items-center justify-center gap-5 flex-wrap">
        <span className="flex items-center gap-1.5"><Truck size={12} /> Free delivery assistance in Siliguri</span>
        <span className="text-white/30 hidden sm:inline">|</span>
        <span className="hidden sm:flex items-center gap-1.5"><Phone size={12} /> +91 9563158383</span>
        <span className="text-white/30 hidden md:inline">|</span>
        <span className="hidden md:flex items-center gap-1.5"><MessageCircle size={12} /> WhatsApp for bulk orders</span>
        <span className="text-white/30 hidden lg:inline">|</span>
        <span className="hidden lg:flex items-center gap-1.5"><MapPin size={12} /> Champasari, Nivedita Road, Siliguri</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────

function Header({ activePage, goTo, mobileOpen, setMobileOpen }) {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Main row */}
      <div className="container-max flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => goTo('home')} className="flex items-center gap-2.5 shrink-0 focus:outline-none" aria-label="Prasad Store home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
            <Store size={21} />
          </span>
          <span className="hidden sm:block text-left">
            <span className="block text-lg font-extrabold leading-tight text-orange-800">Prasad Store</span>
            <span className="block text-[11px] font-semibold text-gray-400 leading-tight">Wholesale Grocery, Siliguri</span>
          </span>
        </button>

        {/* Search */}
        <div className="hidden md:flex flex-1 mx-4">
          <label className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />
            <input
              readOnly onClick={() => goTo('products')}
              placeholder="Search atta, rice, oil, dal, snacks..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-orange-200 bg-orange-50/60 text-sm font-medium cursor-pointer transition hover:bg-orange-50 hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </label>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <a href={`tel:${store.phone}`}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-orange-800 border border-orange-200 rounded-xl hover:bg-orange-50 transition">
            <Phone size={14} /> Call Us
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-[#25D366] rounded-xl hover:brightness-95 transition">
            <MessageCircle size={14} /> WhatsApp
          </a>
          <button onClick={() => goTo('products')}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold text-white bg-brand-primary rounded-xl hover:bg-brand-dark transition">
            <ShoppingBasket size={15} /> Price List
          </button>
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 text-orange-700"
            aria-label="Toggle menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Nav strip */}
      <div className="hidden md:block border-t border-orange-100 bg-orange-50/50">
        <div className="container-max flex items-center px-4 sm:px-6 lg:px-8">
          {navItems.map(item => (
            <button key={item.id} onClick={() => goTo(item.id)}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition ${
                activePage === item.id
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent text-gray-600 hover:text-brand-primary hover:bg-white'
              }`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-orange-100 bg-white px-4 py-3 shadow-md">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input readOnly onClick={() => goTo('products')}
              placeholder="Search products..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-orange-200 bg-orange-50/60 text-sm cursor-pointer" />
          </div>
          <div className="grid gap-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => goTo(item.id)}
                className={`rounded-xl px-4 py-2.5 text-left text-sm font-bold transition ${
                  activePage === item.id ? 'bg-orange-50 text-brand-primary' : 'text-gray-700 hover:bg-orange-50'
                }`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={`tel:${store.phone}`}
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-orange-800 border border-orange-200 rounded-xl">
              <Phone size={14} /> Call
            </a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-white bg-[#25D366] rounded-xl">
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────

function HomePage({ goTo, products, categories }) {
  const featured    = products.filter(p => p.homepageFeatured || p.todaysDeal).slice(0, 8);
  const todaysDeals = products.filter(p => p.todaysDeal).slice(0, 4);

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] rounded-2xl overflow-hidden shadow-soft min-h-[420px]">
            {/* Left: orange gradient panel */}
            <div className="bg-gradient-to-br from-orange-950 via-orange-800 to-orange-700 text-white px-8 py-12 lg:py-14 flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-4 py-1.5 text-xs font-bold w-fit mb-5">
                <MapPin size={12} /> Champasari, Nivedita Road, Siliguri
              </span>
              <h1 className="text-3xl sm:text-4xl xl:text-[2.6rem] font-black leading-tight tracking-tight">
                Wholesale Grocery at <br />
                <span className="text-orange-100">Best Rates</span> in Siliguri
              </h1>
              <p className="mt-4 text-sm sm:text-base font-medium leading-7 text-orange-100 max-w-md">
                Compare market prices and save more. Fresh staples, snacks, oils, and daily essentials — all in one place.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <button onClick={() => goTo('products')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-brand-deeper font-extrabold rounded-xl hover:bg-orange-100 transition text-sm shadow-sm">
                  View All Products <ArrowRight size={17} />
                </button>
                <button onClick={() => goTo('contact')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/15 border border-white/30 text-white font-extrabold rounded-xl hover:bg-white/25 transition text-sm">
                  Contact Us <Phone size={15} />
                </button>
              </div>
              {/* Mini stats */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-7">
                {[[`${products.length}+`, 'Products'], ['17', 'Categories'], ['Bulk', 'Orders']].map(([val, lbl]) => (
                  <div key={lbl}>
                    <p className="text-2xl font-black text-white">{val}</p>
                    <p className="text-[11px] font-bold text-orange-200 mt-0.5">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: grocery image */}
            <div className="hidden lg:flex items-center justify-center bg-orange-50 p-8">
              <img src="/grocery-hero.jpg" alt="Grocery products at Prasad Store"
                className="w-full h-full object-contain max-h-80" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <div className="bg-gradient-to-r from-orange-800 to-orange-600 text-white py-3 px-4">
        <div className="container-max flex flex-wrap items-center justify-center gap-6 text-xs font-bold">
          {[
            [BadgeIndianRupee, 'Wholesale Pricing'],
            [Truck,            'Local Delivery'  ],
            [ShieldCheck,      'Trusted Store'   ],
            [Boxes,            'Bulk Orders'      ],
            [ShoppingBasket,   '500+ Products'   ]
          ].map(([Icon, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon size={14} /> {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Shop by Category ── */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container-max">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-primary mb-1">Browse</p>
              <h2 className="text-2xl font-black text-gray-900">Shop by Category</h2>
            </div>
            <button onClick={() => goTo('products')}
              className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:underline">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {categories.slice(0, 16).map(cat => (
              <button key={cat} onClick={() => goTo('products')}
                className="group flex flex-col items-center gap-2 py-4 px-2 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50 hover:border-orange-300 transition">
                <span className="text-2xl leading-none">{getCategoryEmoji(cat)}</span>
                <span className="text-[11px] font-extrabold text-gray-600 text-center leading-tight group-hover:text-brand-primary">
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Deals ── */}
      {featured.length > 0 && (
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-orange-50/60">
          <div className="container-max">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-brand-primary mb-1">Best Value</p>
                <h2 className="text-2xl font-black text-gray-900">Popular Wholesale Deals</h2>
              </div>
              <button onClick={() => goTo('products')}
                className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:underline">
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Today's Deals ── */}
      {todaysDeals.length > 0 && (
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="container-max">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shrink-0">
                <Sparkles size={19} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-brand-primary leading-none mb-0.5">Limited Time</p>
                <h2 className="text-2xl font-black text-gray-900">Today's Best Deals</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {todaysDeals.map(product => <ProductCard key={product.id} product={product} deal />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Compare & Save CTA banner ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 bg-orange-50/60">
        <div className="container-max">
          <div className="rounded-2xl bg-gradient-to-br from-orange-900 to-orange-700 text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-orange-200 mb-2">Compare &amp; Save</p>
              <h3 className="text-2xl font-black">See how much you save vs market prices</h3>
              <p className="mt-2 text-sm font-medium text-orange-100">
                Every product shows our price vs JioMart / market rate so you know exactly what you save.
              </p>
            </div>
            <button onClick={() => goTo('products')}
              className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 bg-white text-brand-deeper font-extrabold rounded-xl hover:bg-orange-100 transition text-sm shadow-sm">
              View Full Price List <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <WhyChooseSection />
      <BulkOrdersSection />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────

function ProductCard({ product, deal = false }) {
  const savings  = product.marketPrice - product.ourPrice;
  const discount = product.marketPrice > 0
    ? Math.round((savings / product.marketPrice) * 100) : 0;
  const updated  = product.lastUpdated
    ? new Date(product.lastUpdated).toLocaleDateString('en-IN') : 'Today';
  const orderMsg = encodeURIComponent(
    `Hello Prasad Store, I want to order: ${product.name} (${product.unit}). Please share the current price and availability.`
  );
  const orderUrl = `https://wa.me/${store.whatsapp}?text=${orderMsg}`;

  return (
    <article className={`group bg-white rounded-2xl overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${
      deal ? 'ring-1 ring-orange-300 shadow-sm' : 'ring-1 ring-gray-100 shadow-sm'
    }`}>
      {/* Image */}
      <div className={`relative aspect-square overflow-hidden flex items-center justify-center p-4 ${
        deal ? 'bg-orange-50' : 'bg-gray-50'
      }`}>
        <img src={product.image} alt={product.name}
          className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-105"
          loading="lazy" />
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-brand-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            {discount}% OFF
          </span>
        )}
        {product.bestSeller && (
          <span className="absolute top-2.5 right-2.5 bg-orange-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            Best Seller
          </span>
        )}
        {deal && (
          <span className="absolute bottom-2.5 right-2.5 bg-brand-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Sparkles size={10} /> Deal
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-brand-primary mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-black text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {product.unit}
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            product.stock === 'In Stock'
              ? 'text-brand-green bg-brand-greenLight'
              : product.stock === 'Low Stock'
              ? 'text-orange-600 bg-orange-50'
              : 'text-red-600 bg-red-50'
          }`}>
            {product.stock}
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-end gap-3">
          <div>
            <p className="text-[10px] font-bold text-gray-400 leading-none mb-0.5">Our Price</p>
            <p className="text-xl font-black text-brand-deeper leading-none">
              {currency.format(product.ourPrice)}
            </p>
          </div>
          <div className="pb-px">
            <p className="text-[10px] font-bold text-gray-400 leading-none mb-0.5">Market</p>
            <p className="text-sm font-bold text-gray-400 line-through leading-none">
              {currency.format(product.marketPrice)}
            </p>
          </div>
        </div>

        {savings > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[11px] font-black px-2.5 py-1 rounded-lg border border-orange-100">
            <TrendingDown size={11} /> You Save {currency.format(savings)}
          </div>
        )}

        {/* Order button */}
        <a href={orderUrl} target="_blank" rel="noreferrer"
          className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-2.5 bg-brand-primary text-white text-sm font-extrabold rounded-xl hover:bg-brand-dark transition">
          <MessageCircle size={15} /> Order on WhatsApp
        </a>

        <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-gray-400">
          <Clock size={10} /> Updated: {updated}
        </p>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS PAGE
// ─────────────────────────────────────────────────────────────

function ProductsPage({ products, categories }) {
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState('All Products');
  const [sort,     setSort]     = useState('savings');
  const categoryOrder = ['All Products', ...categories];

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = products.filter(p => {
      const matchCat = category === 'All Products' || p.category === category;
      const matchQ   = [p.name, p.category, p.unit].join(' ').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    return [...result].sort((a, b) => {
      if (sort === 'price-low')  return a.ourPrice - b.ourPrice;
      if (sort === 'price-high') return b.ourPrice - a.ourPrice;
      return (b.marketPrice - b.ourPrice) - (a.marketPrice - a.ourPrice);
    });
  }, [category, query, sort]);

  return (
    <section className="min-h-screen bg-gray-50">
      {/* Page hero — orange gradient */}
      <div className="bg-gradient-to-br from-orange-900 to-orange-700 text-white px-4 sm:px-6 lg:px-8 py-8">
        <div className="container-max">
          <p className="text-xs font-black uppercase tracking-widest text-orange-200 mb-1">Price Comparison</p>
          <h1 className="text-3xl font-black">All Products</h1>
          <p className="mt-1.5 text-sm font-medium text-orange-100">
            Compare Prasad Store wholesale prices vs market rates — updated regularly.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="container-max">
          {/* Search + Sort */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-orange-100 p-4 mb-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search atta, oil, dal, tea..."
                  className="h-11 w-full rounded-xl border border-orange-200 bg-orange-50/50 pl-10 pr-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </label>
              <label className="relative block">
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-orange-50/50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="savings">Highest Savings</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              </label>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {categoryOrder.map(item => (
              <button key={item} onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition border ${
                  category === item
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                    : 'bg-white text-gray-600 border-orange-200 hover:bg-orange-50 hover:text-brand-primary hover:border-orange-300'
                }`}>
                {item !== 'All Products' && `${getCategoryEmoji(item)} `}{item}
              </button>
            ))}
          </div>

          {/* Results bar */}
          <div className="flex items-center justify-between mb-5 bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
            <span className="text-sm font-bold text-orange-800">{filteredProducts.length} products</span>
            <span className="text-xs font-semibold text-gray-500">Prices updated regularly</span>
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// ABOUT PAGE
// ─────────────────────────────────────────────────────────────

function AboutPage({ goTo }) {
  return (
    <>
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container-max grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-primary mb-2">About Us</p>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Wholesale Grocery &amp; General Store Based in Siliguri
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-gray-600">
              Prasad Store is a wholesale grocery and general store based in Champasari, Nivedita Road,
              Siliguri, West Bengal. We provide daily essential products at highly competitive wholesale
              prices for households, retailers, and businesses.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ['Trusted local wholesale supplier', ShieldCheck],
                ['Affordable pricing',               BadgeIndianRupee],
                ['Large product inventory',           Boxes],
                ['Bulk order availability',           PackageCheck],
                ['Local delivery support',            Truck],
                ['Direct customer support',           Users]
              ].map(([text, Icon]) => (
                <div key={text} className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-brand-primary">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-extrabold text-gray-700">{text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => goTo('contact')}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-extrabold text-white hover:bg-brand-dark transition">
              Discuss Bulk Supply <ArrowRight size={17} />
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden bg-orange-50 flex items-center justify-center p-10 shadow-card ring-1 ring-orange-100 min-h-64">
            <img src="/grocery-hero.jpg" alt="Grocery products at Prasad Store"
              className="w-full object-contain max-h-80" />
          </div>
        </div>
      </section>
      <BulkOrdersSection />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTACT PAGE
// ─────────────────────────────────────────────────────────────

function ContactPage() {
  return (
    <section className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container-max">
        <p className="text-xs font-black uppercase tracking-widest text-brand-primary mb-2">Get In Touch</p>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Visit or Message Prasad Store</h1>
        <p className="text-base font-medium text-gray-500 mb-8 max-w-2xl">
          Reach out for wholesale grocery pricing, regular supply, local delivery support, and product availability.
        </p>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3 content-start">
            <ContactCard icon={Store}         label="Store Name" value={store.name} />
            <ContactCard icon={MapPin}        label="Address"    value={store.address}   href={store.mapsUrl} />
            <ContactCard icon={Phone}         label="Phone"      value={store.phone}     href={`tel:${store.phone.replace(/\s/g,'')}`} />
            <ContactCard icon={MessageCircle} label="WhatsApp"   value="+91 9932682063"  href={whatsappUrl} />
            <ContactCard icon={Mail}          label="Email"      value={store.email}     href={`mailto:${store.email}`} />
            <a href={whatsappUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-4 font-extrabold text-white hover:brightness-95 transition">
              <MessageCircle size={19} /> WhatsApp Prasad Store
            </a>
            <a href={store.mapsUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-4 font-extrabold text-orange-800 hover:bg-orange-50 transition">
              <MapPin size={19} /> Open in Google Maps
            </a>
          </div>

          <form className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <h3 className="text-lg font-black text-gray-900 mb-5">Send an Enquiry</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-extrabold text-gray-700">
                Name
                <input className="h-11 rounded-xl border border-orange-200 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Your name" />
              </label>
              <label className="grid gap-1.5 text-sm font-extrabold text-gray-700">
                Phone
                <input className="h-11 rounded-xl border border-orange-200 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="+91" />
              </label>
            </div>
            <label className="mt-4 grid gap-1.5 text-sm font-extrabold text-gray-700">
              Message
              <textarea className="min-h-32 rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Tell us what products or quantities you need." />
            </label>
            <button type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-4 font-extrabold text-white hover:bg-brand-dark transition">
              Send Enquiry <ArrowRight size={17} />
            </button>
          </form>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl shadow-sm ring-1 ring-orange-100">
          <iframe title="Prasad Store location map" src={store.mapEmbedUrl}
            className="h-[360px] w-full border-0" loading="lazy"
            referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN PAGE
// ─────────────────────────────────────────────────────────────

function AdminPage({ products, setProducts, categories, setCategories, adminUser, dataStatus }) {
  const [isAuthed,       setIsAuthed]       = useState(() => !firebaseEnabled && localStorage.getItem('prasad-admin-auth') === 'true');
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [authError,      setAuthError]      = useState('');
  const [query,          setQuery]          = useState('');
  const [category,       setCategory]       = useState('All Products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategory,    setNewCategory]    = useState('');
  const hasAdminAccess = firebaseEnabled ? Boolean(adminUser) : isAuthed;

  const categoryOptions   = ['All Products', ...categories];
  const filteredProducts  = products.filter(p => {
    const matchCat = category === 'All Products' || p.category === category;
    const s = [p.name, p.brand, p.category, p.unit].join(' ').toLowerCase();
    return matchCat && s.includes(query.toLowerCase());
  });
  const latestUpdates = [...products]
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, 5);

  const login = async () => {
    setAuthError('');
    if (!firebaseEnabled) {
      if (await verifyLocalAdminPassword(password)) {
        localStorage.setItem('prasad-admin-auth', 'true');
        setIsAuthed(true); setPassword('');
      } else { setAuthError('Incorrect password.'); }
      return;
    }
    try { await signInWithEmailAndPassword(auth, email, password); setEmail(''); setPassword(''); }
    catch (e) { setAuthError(e.message); }
  };

  const logout = async () => {
    if (firebaseEnabled) { await signOut(auth); }
    else { localStorage.removeItem('prasad-admin-auth'); setIsAuthed(false); }
  };

  const saveProduct = async (product) => {
    const normalized = normalizeProduct({ ...product, lastUpdated: new Date().toISOString() });
    if (firebaseEnabled) {
      const saved = await saveRemoteProduct(normalized);
      setProducts(curr => {
        const exists = curr.some(i => i.id === normalized.id);
        return exists ? curr.map(i => i.id === normalized.id ? saved : i) : [saved, ...curr];
      });
    } else {
      setProducts(curr => {
        const exists = curr.some(i => i.id === normalized.id);
        return exists ? curr.map(i => i.id === normalized.id ? normalized : i) : [normalized, ...curr];
      });
    }
    if (!categories.includes(normalized.category)) {
      setCategories(curr => [...curr, normalized.category]);
      if (firebaseEnabled) await saveRemoteCategory(normalized.category);
    }
    setEditingProduct(null);
  };

  const deleteProduct = async (id) => {
    if (firebaseEnabled) await deleteRemoteProduct(id);
    setProducts(curr => curr.filter(p => p.id !== id));
  };

  const addCategory = async () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(curr => [...curr, trimmed]);
      if (firebaseEnabled) await saveRemoteCategory(trimmed);
      setNewCategory('');
    }
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = parseCsvProducts(await file.text());
    if (imported.length) {
      if (firebaseEnabled) {
        const saved = [];
        for (const p of imported) saved.push(await saveRemoteProduct(p));
        setProducts(curr => [...saved, ...curr]);
      } else {
        setProducts(curr => [...imported, ...curr]);
      }
      const next = [...new Set([...categories, ...imported.map(p => p.category)])];
      setCategories(next);
      if (firebaseEnabled) await Promise.all(next.map(saveRemoteCategory));
    }
    event.target.value = '';
  };

  const handleImageUpload = async (file, onUrl) => {
    if (!file) return;
    if (!firebaseEnabled) { onUrl(URL.createObjectURL(file)); return; }
    const url = await uploadProductImage(file);
    if (url) onUrl(url);
  };

  if (!hasAdminAccess) {
    return (
      <section className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 grid place-items-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-card ring-1 ring-orange-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand-primary">
            <ShieldCheck size={28} />
          </div>
          <h1 className="mt-5 text-3xl font-black text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-500">
            Secure admin access is handled by Firebase Authentication when configured.
          </p>
          {firebaseEnabled && (
            <label className="mt-5 grid gap-1.5 text-sm font-extrabold text-gray-700">
              Email
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="h-11 rounded-xl border border-orange-200 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="admin@prasadstore.com" />
            </label>
          )}
          <label className="mt-4 grid gap-1.5 text-sm font-extrabold text-gray-700">
            Password
            <input value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()} type="password"
              className="h-11 rounded-xl border border-orange-200 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Enter admin password" />
          </label>
          {authError && (
            <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700">{authError}</div>
          )}
          <button onClick={login}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-4 font-extrabold text-white hover:bg-brand-dark transition">
            <Eye size={17} /> Login to Dashboard
          </button>
          <p className="mt-3 text-xs font-bold text-gray-400">
            {firebaseEnabled ? 'Use the admin account created in Firebase Authentication.' : 'Local admin access is enabled for development.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container-max">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end mb-8">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-primary mb-1">Admin</p>
            <h1 className="text-3xl font-black text-gray-900">Product & Price Management</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Manage products, prices, stock, images, categories, and homepage features.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-black text-orange-800 shadow-sm ring-1 ring-orange-100">
              {dataStatus}
            </div>
            <button onClick={() => setEditingProduct(createBlankProduct(categories[0]))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-brand-dark transition">
              <Plus size={16} /> Add Product
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-700 hover:bg-orange-50 transition">
              <Upload size={16} /> Bulk CSV
              <input type="file" accept=".csv" onChange={importCsv} className="sr-only" />
            </label>
            <button onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-600 hover:bg-gray-50 transition">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <AdminStat icon={Database} value={products.length}                                 label="Total Products"    />
          <AdminStat icon={Tag}      value={categories.length}                               label="Categories"        />
          <AdminStat icon={Star}     value={products.filter(p => p.todaysDeal).length}       label="Today's Deals"     />
          <AdminStat icon={BarChart3} value={products.filter(p => p.homepageFeatured).length} label="Homepage Featured" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Table */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-orange-100">
            <div className="grid gap-3 md:grid-cols-[1fr_220px] mb-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-orange-200 bg-orange-50/40 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Search product, brand, category..." />
              </label>
              <label className="relative block">
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-orange-50/40 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  {categoryOptions.map(item => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-sm">
                <thead className="bg-orange-50 text-orange-800">
                  <tr>
                    {['Product','Category','Stock','Our Price','Market Price','Discount','Updated','Actions'].map(h => (
                      <th key={h} className="px-3 py-3 text-xs font-black uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="border-b border-gray-100 align-middle hover:bg-orange-50/30 transition">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name}
                            className="h-11 w-11 rounded-xl object-cover bg-gray-100" />
                          <div>
                            <div className="font-black text-gray-900 text-sm">{product.name}</div>
                            <div className="text-xs font-bold text-gray-400">{product.brand} · {product.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-600">{product.category}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-600">{product.stock}</td>
                      <td className="px-3 py-3 text-sm font-black text-brand-deeper">{currency.format(product.ourPrice)}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-400">{currency.format(product.marketPrice)}</td>
                      <td className="px-3 py-3 text-sm font-black text-brand-primary">{product.discount}%</td>
                      <td className="px-3 py-3 text-xs font-bold text-gray-400">
                        {new Date(product.lastUpdated).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingProduct(product)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-brand-primary hover:bg-orange-100 transition"
                            aria-label="Edit product"><Edit3 size={16} /></button>
                          <button onClick={() => deleteProduct(product.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                            aria-label="Delete product"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="grid gap-5 content-start">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
              <h3 className="text-base font-black text-gray-900 mb-4">Manage Categories</h3>
              <div className="flex gap-2">
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-orange-200 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="New category" />
                <button onClick={addCategory}
                  className="rounded-xl bg-brand-primary px-4 text-sm font-black text-white hover:bg-brand-dark transition">
                  Add
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map(item => (
                  <span key={item} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-800 border border-orange-100">
                    {getCategoryEmoji(item)} {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
              <h3 className="text-base font-black text-gray-900 mb-4">Latest Updated Prices</h3>
              <div className="grid gap-3">
                {latestUpdates.map(product => (
                  <div key={product.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <div className="text-sm font-black text-gray-800">{product.name}</div>
                      <div className="text-xs font-bold text-gray-400">
                        {new Date(product.lastUpdated).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-sm font-black text-brand-deeper shrink-0">
                      {currency.format(product.ourPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-orange-900 to-orange-700 p-5 text-white shadow-sm">
              <h3 className="text-base font-black">Database Ready</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-orange-100">
                Products persist in browser storage for demo use. Firebase, Supabase,
                MongoDB, or PostgreSQL can replace storage without changing the UI.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {editingProduct && (
        <ProductEditor
          product={editingProduct} categories={categories}
          onClose={() => setEditingProduct(null)} onSave={saveProduct}
          onImageUpload={handleImageUpload}
        />
      )}
    </section>
  );
}

function createBlankProduct(category) {
  return normalizeProduct({
    id: `local-${Date.now()}`, name: '', category, brand: '', unit: '',
    ourPrice: 0, marketPrice: 0, stock: 'In Stock', description: '', image: '',
    bestSeller: false, discounted: false, homepageFeatured: false, todaysDeal: false
  });
}

function AdminStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-black text-brand-deeper">{value}</div>
          <div className="mt-1 text-sm font-bold text-gray-500">{label}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-brand-primary">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProductEditor({ product, categories, onClose, onSave, onImageUpload }) {
  const [form,      setForm]      = useState(product);
  const [uploading, setUploading] = useState(false);
  const update = (key, value) => setForm(curr => ({ ...curr, [key]: value }));
  const liveDiscount = normalizeProduct(form).discount;

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await onImageUpload(file, url => update('image', url)); }
    finally { setUploading(false); event.target.value = ''; }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-soft">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-black text-gray-900">Product Editor</h3>
            <p className="text-xs font-semibold text-gray-400">Update daily prices, image, stock, and product highlights.</p>
          </div>
          <button onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            aria-label="Close editor"><X size={18} /></button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <AdminInput label="Product Name"         value={form.name}        onChange={v => update('name', v)} />
          <AdminInput label="Brand"                value={form.brand}       onChange={v => update('brand', v)} />
          <label className="grid gap-1.5 text-sm font-extrabold text-gray-700">
            Category
            <select value={form.category} onChange={e => update('category', e.target.value)}
              className="h-11 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary">
              {categories.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <AdminInput label="Weight / Quantity"    value={form.unit}        onChange={v => update('unit', v)} />

          <div className="grid gap-1.5 text-sm font-extrabold text-gray-700">
            Product Image
            <div className="grid gap-3 sm:grid-cols-[88px_1fr]">
              <img src={form.image} alt={form.name || 'Product preview'}
                className="h-22 w-22 rounded-xl object-cover ring-1 ring-gray-200 bg-gray-50" />
              <div className="grid gap-2">
                <input value={form.image} onChange={e => update('image', e.target.value)}
                  className="h-11 rounded-xl border border-orange-200 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Image URL" />
                <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-black text-orange-800 hover:bg-orange-100 transition">
                  <Upload size={15} />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={uploadImage} className="sr-only" />
                </label>
              </div>
            </div>
          </div>

          <label className="grid gap-1.5 text-sm font-extrabold text-gray-700">
            Stock Availability
            <select value={form.stock} onChange={e => update('stock', e.target.value)}
              className="h-11 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary">
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
          </label>
          <AdminInput label="Our Price"              type="number" value={form.ourPrice}    onChange={v => update('ourPrice', v)} />
          <AdminInput label="Market / JioMart Price" type="number" value={form.marketPrice} onChange={v => update('marketPrice', v)} />
          <label className="grid gap-1.5 text-sm font-extrabold text-gray-700 md:col-span-2">
            Description
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              className="min-h-24 rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          </label>
          <div className="rounded-xl bg-orange-50 p-4 text-sm font-black text-orange-800 border border-orange-100">
            Auto Discount: {liveDiscount}%
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['bestSeller',       'Best Seller'       ],
              ['discounted',       'Discounted'        ],
              ['todaysDeal',       "Today's Best Deal" ],
              ['homepageFeatured', 'Homepage Featured' ]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-extrabold text-gray-700">
                <input type="checkbox" checked={Boolean(form[key])} onChange={e => update(key, e.target.checked)}
                  className="h-4 w-4 accent-brand-primary rounded" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end rounded-b-2xl">
          <button onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-black text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-black text-white hover:bg-brand-dark transition">
            <CheckCircle2 size={17} /> Save Product
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="grid gap-1.5 text-sm font-extrabold text-gray-700">
      {label}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="h-11 rounded-xl border border-orange-200 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary" />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// WHY CHOOSE SECTION
// ─────────────────────────────────────────────────────────────

function WhyChooseSection() {
  const items = [
    ['Wholesale Pricing',    'Value-focused prices for everyday essentials and bulk grocery orders.',             BadgeIndianRupee, 'bg-orange-50 text-brand-primary'],
    ['Trusted Local Supplier','A Siliguri-based store with approachable service and local knowledge.',            ShieldCheck,      'bg-amber-50 text-amber-600'   ],
    ['Direct Support',       'Call or WhatsApp for product availability, quantities, and delivery.',              Phone,            'bg-orange-100 text-brand-dark' ],
    ['Bulk Discounts',       'Support for homes, retail shops, restaurants, hotels, and businesses.',             Boxes,            'bg-red-50 text-red-500'       ],
    ['Transparent Prices',   'Clear comparisons help buyers understand savings before they buy.',                 CheckCircle2,     'bg-yellow-50 text-yellow-600'  ]
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container-max">
        <div className="text-center mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-brand-primary mb-2">
            Why Customers Prefer Prasad Store
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Reliable Supply. Transparent Pricing. Local Support.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {items.map(([title, text, Icon, iconClass]) => (
            <div key={title} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-orange-100 flex flex-col gap-3 hover:shadow-md transition">
              <div className={`h-11 w-11 flex items-center justify-center rounded-2xl ${iconClass}`}>
                <Icon size={22} />
              </div>
              <h3 className="text-base font-black text-gray-900">{title}</h3>
              <p className="text-sm font-medium leading-6 text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BULK ORDERS SECTION
// ─────────────────────────────────────────────────────────────

function BulkOrdersSection() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-950 via-orange-800 to-orange-700 text-white">
      <div className="container-max grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-200 mb-3">
            Bulk Orders & Retail Supply
          </p>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            Wholesale grocery support for homes and businesses
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-orange-100 max-w-xl">
            Prasad Store supports grocery supply for homes, retail shops, restaurants, hotels,
            offices, and local buyers who need dependable stock at wholesale pricing.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 px-6 py-3.5 bg-white text-brand-deeper font-extrabold rounded-xl hover:bg-orange-100 transition text-sm shadow-sm">
            <MessageCircle size={17} /> WhatsApp for Bulk Orders
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {['Grocery supply for homes','Retail shop supply','Restaurant & hotel supply','Wholesale bulk pricing','Local delivery assistance','Regular order support'].map(item => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-white/15 p-4 ring-1 ring-white/20">
              <CheckCircle2 className="text-orange-200 shrink-0" size={18} />
              <span className="text-sm font-extrabold">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTACT CARD
// ─────────────────────────────────────────────────────────────

function ContactCard({ icon: Icon, label, value, href }) {
  const Tag = href ? 'a' : 'div';
  return (
    <Tag href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
      className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand-primary">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="mt-0.5 font-extrabold leading-6 text-gray-800 text-sm">{value}</p>
      </div>
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────

function Footer({ goTo }) {
  return (
    <footer className="bg-orange-950 text-white px-4 pt-12 pb-6 sm:px-6 lg:px-8">
      <div className="container-max">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-white/10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary text-white">
                <Store size={21} />
              </span>
              <div>
                <p className="text-lg font-black">{store.name}</p>
                <p className="text-xs font-semibold text-orange-200">Wholesale Grocery & General Store</p>
              </div>
            </div>
            <p className="text-sm font-medium leading-7 text-orange-100">
              Trusted wholesale grocery supplier at Champasari, Nivedita Road, Siliguri, West Bengal, India.
            </p>
            <div className="mt-5 flex gap-3">
              <a href={`tel:${store.phone}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-brand-primary transition"
                aria-label="Call"><Phone size={17} /></a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-[#25D366] transition"
                aria-label="WhatsApp"><MessageCircle size={17} /></a>
              <a href={`mailto:${store.email}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-brand-primary transition"
                aria-label="Email"><Mail size={17} /></a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-orange-200 mb-4">Quick Links</p>
            <div className="grid gap-2">
              {navItems.map(item => (
                <button key={item.id} onClick={() => goTo(item.id)}
                  className="w-fit text-sm font-semibold text-orange-200 hover:text-white transition text-left">
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-orange-200 mb-4">Categories</p>
            <div className="grid gap-2">
              {['Atta & Flour','Rice & Grains','Dal & Pulses','Oils & Ghee','Spices','Snacks','Tea & Coffee','Cleaning'].map(cat => (
                <button key={cat} onClick={() => goTo('products')}
                  className="w-fit text-sm font-semibold text-orange-200 hover:text-white transition text-left">
                  {getCategoryEmoji(cat)} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-orange-200 mb-4">Contact</p>
            <div className="grid gap-3 text-sm font-semibold text-orange-200">
              <span className="flex items-start gap-2">
                <MapPin size={15} className="shrink-0 mt-0.5 text-brand-primary" />
                {store.address}
              </span>
              <a href={`tel:${store.phone}`}
                className="flex items-center gap-2 hover:text-white transition">
                <Phone size={14} className="text-brand-primary" /> {store.phone}
              </a>
              <a href={`mailto:${store.email}`}
                className="flex items-center gap-2 hover:text-white transition">
                <Mail size={14} className="text-brand-primary" /> {store.email}
              </a>
              <a href={store.mapsUrl} target="_blank" rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-extrabold rounded-xl hover:bg-brand-dark transition w-fit">
                <MapPin size={13} /> View on Maps
              </a>
            </div>
          </div>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-orange-200">
          <span>© 2026 Prasad Store. All rights reserved.</span>
          <span>Prices shown are sample comparison rates and may change.</span>
        </div>
      </div>
    </footer>
  );
}

export default App;
