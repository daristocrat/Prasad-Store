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
  Star,
  Store,
  Tag,
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
  { id: 'home', label: 'Home' },
  { id: 'products', label: 'Products' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'admin', label: 'Admin' }
];

const store = {
  name: 'Prasad Store',
  address: 'Champasari, Nivedita Road, Siliguri, West Bengal, India',
  phone: '+91 00000 00000',
  email: 'prasadstore@example.com',
  whatsapp: '910000000000',
  mapsUrl: 'https://maps.app.goo.gl/KaDMQDvZjifZ8Dn78',
  mapEmbedUrl: 'https://www.google.com/maps?q=26.7362803,88.4169546&z=18&output=embed'
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

function App() {
  const [activePage, setActivePage] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState(() => loadProducts());
  const [categories, setCategories] = useState(() => loadCategories());
  const [adminUser, setAdminUser] = useState(null);
  const [dataStatus, setDataStatus] = useState(firebaseEnabled ? 'Connecting to Firebase...' : 'Local demo mode');

  useEffect(() => {
    if (!firebaseEnabled) saveProducts(products);
  }, [products]);

  useEffect(() => {
    if (!firebaseEnabled) saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (!firebaseEnabled || !auth) return undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;

    async function syncRemoteData() {
      try {
        const [remoteProducts, remoteCategories] = await Promise.all([
          fetchRemoteProducts(),
          fetchRemoteCategories()
        ]);

        if (remoteProducts?.length) setProducts(remoteProducts);
        if (remoteCategories?.length) setCategories(remoteCategories);
        setDataStatus('Firebase connected');
      } catch (error) {
        setDataStatus(`Firebase read blocked: ${error.message}`);
      }
    }

    syncRemoteData();
  }, []);

  const goTo = (page) => {
    setActivePage(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <Header activePage={activePage} goTo={goTo} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>
        {activePage === 'home' && <HomePage goTo={goTo} products={products} />}
        {activePage === 'products' && <ProductsPage products={products} categories={categories} />}
        {activePage === 'about' && <AboutPage goTo={goTo} />}
        {activePage === 'contact' && <ContactPage />}
        {activePage === 'admin' && (
          <AdminPage
            products={products}
            setProducts={setProducts}
            categories={categories}
            setCategories={setCategories}
            adminUser={adminUser}
            dataStatus={dataStatus}
          />
        )}
      </main>
      <Footer goTo={goTo} />
      <a
        href={`https://wa.me/${store.whatsapp}?text=Hello%20Prasad%20Store%2C%20I%20want%20to%20ask%20about%20grocery%20prices.`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition hover:scale-105 focus-ring"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}

function Header({ activePage, goTo, mobileOpen, setMobileOpen }) {
  return (
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 backdrop-blur">
      <div className="container-max flex h-18 items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button onClick={() => goTo('home')} className="flex items-center gap-3 focus-ring" aria-label="Prasad Store home">
          <span className="flex h-11 w-11 items-center justify-center rounded bg-brand-green text-white shadow-soft">
            <Store size={24} />
          </span>
          <span className="text-left">
            <span className="block text-xl font-extrabold tracking-normal text-brand-deep">Prasad Store</span>
            <span className="block text-xs font-semibold text-slate-500">Wholesale Grocery, Siliguri</span>
          </span>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              className={`rounded px-4 py-2 text-sm font-bold transition focus-ring ${
                activePage === item.id ? 'bg-brand-light text-brand-deep' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={`tel:${store.phone}`} className="inline-flex items-center gap-2 rounded border border-green-200 px-3 py-2 text-sm font-bold text-brand-deep transition hover:bg-brand-light focus-ring">
            <Phone size={16} />
            Call Store
          </a>
          <button onClick={() => goTo('products')} className="inline-flex items-center gap-2 rounded bg-brand-orange px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:bg-orange-600 focus-ring">
            <ShoppingBasket size={17} />
            Price List
          </button>
        </div>

        <button
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded border border-slate-200 text-slate-700 md:hidden focus-ring"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-green-100 bg-white px-4 py-3 md:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={`rounded px-4 py-3 text-left text-sm font-bold ${
                  activePage === item.id ? 'bg-brand-light text-brand-deep' : 'text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function HomePage({ goTo, products }) {
  const featured = products.filter((product) => product.homepageFeatured || product.todaysDeal).slice(0, 8);
  const todaysDeals = products.filter((product) => product.todaysDeal).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80"
            alt="Fresh grocery shelves"
            className="h-full w-full object-cover opacity-42"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#072815] via-[#0d4624]/90 to-[#0d4624]/45" />
        </div>
        <div className="container-max relative grid min-h-[620px] items-center gap-10 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded bg-white/12 px-4 py-2 text-sm font-bold ring-1 ring-white/18">
              <MapPin size={16} />
              Champasari, Nivedita Road, Siliguri
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Wholesale Grocery Prices at the Best Rates in Siliguri
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-green-50 sm:text-xl">
              Compare market prices and save more with Prasad Store.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => goTo('products')} className="inline-flex items-center justify-center gap-2 rounded bg-brand-orange px-6 py-4 font-extrabold text-white shadow-soft transition hover:bg-orange-600 focus-ring">
                View Products
                <ArrowRight size={20} />
              </button>
              <button onClick={() => goTo('contact')} className="inline-flex items-center justify-center gap-2 rounded bg-white px-6 py-4 font-extrabold text-brand-deep shadow-soft transition hover:bg-brand-light focus-ring">
                Contact Us
                <Phone size={19} />
              </button>
            </div>
          </div>

          <div className="grid gap-4 rounded bg-white/95 p-4 text-ink shadow-soft ring-1 ring-white/40 sm:grid-cols-2">
            {[
              [`${products.length}+`, 'Products Listed'],
              ['17', 'Grocery Categories'],
              ['Bulk', 'Order Support'],
              ['Local', 'Delivery Assistance']
            ].map(([value, label]) => (
              <div key={label} className="rounded border border-green-100 bg-white p-5">
                <div className="text-3xl font-black text-brand-green">{value}</div>
                <div className="mt-1 text-sm font-bold text-slate-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="-mt-12 px-4 sm:px-6 lg:px-8">
        <div className="container-max grid gap-4 rounded bg-white p-4 shadow-card ring-1 ring-green-100 md:grid-cols-4">
          <MiniStat icon={BadgeIndianRupee} title="Wholesale Pricing" text="Competitive rates for homes, retailers, hotels, and regular buyers." />
          <MiniStat icon={ShoppingBasket} title="Fresh Grocery & Daily Essentials" text="Staples, snacks, dairy, household goods, and personal care in one place." />
          <MiniStat icon={Truck} title="Fast Local Delivery" text="Delivery support around Siliguri for convenient order fulfilment." />
          <MiniStat icon={ShieldCheck} title="Trusted Local Store" text="A dependable neighborhood supplier based at Champasari, Nivedita Road." />
        </div>
      </section>

      <WhyChooseSection />

      <section className="section-pad bg-white">
        <div className="container-max">
          <SectionHeading kicker="Live Price Comparison" title="Popular Wholesale Deals" text="Quickly see Prasad Store pricing against common market or grocery platform prices." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => goTo('products')} className="inline-flex items-center gap-2 rounded bg-brand-green px-6 py-3 font-extrabold text-white transition hover:bg-brand-deep focus-ring">
              Explore Full Price List
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-max">
          <SectionHeading kicker="Editable From Admin" title="Today's Best Deals" text="Highlighted deals can be changed from the admin dashboard whenever prices are updated." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {todaysDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <BulkOrdersSection />
    </>
  );
}

function ProductsPage({ products, categories }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Products');
  const [sort, setSort] = useState('savings');
  const categoryOrder = ['All Products', ...categories];

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesCategory = category === 'All Products' || product.category === category;
      const matchesQuery = [product.name, product.category, product.unit].join(' ').toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });

    return [...result].sort((a, b) => {
      if (sort === 'price-low') return a.ourPrice - b.ourPrice;
      if (sort === 'price-high') return b.ourPrice - a.ourPrice;
      return b.marketPrice - b.ourPrice - (a.marketPrice - a.ourPrice);
    });
  }, [category, query, sort]);

  return (
    <section className="section-pad">
      <div className="container-max">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <SectionHeading
            kicker="Products / Price Comparison"
            title="Compare Prasad Store Prices With Market Rates"
            text="Search products, filter by category, and spot savings instantly before placing a bulk or household order."
          />
          <div className="grid gap-3 rounded bg-white p-4 shadow-card ring-1 ring-green-100 sm:grid-cols-[1fr_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search atta, oil, dal, tea..."
                className="h-12 w-full rounded border border-slate-200 bg-white pl-11 pr-4 font-semibold text-slate-800 focus-ring"
              />
            </label>
            <label className="relative block">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-12 w-full appearance-none rounded border border-slate-200 bg-white px-4 font-bold text-slate-700 focus-ring"
              >
                <option value="savings">Highest Savings</option>
                <option value="price-low">Price Low</option>
                <option value="price-high">Price High</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </label>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-3">
          {categoryOrder.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded border px-4 py-2 text-sm font-extrabold transition focus-ring ${
                category === item
                  ? 'border-brand-green bg-brand-green text-white shadow-soft'
                  : 'border-green-100 bg-white text-slate-700 hover:bg-brand-light'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded bg-brand-light p-4 text-sm font-bold text-brand-deep">
          <span>{filteredProducts.length} products shown</span>
          <span>Prices are sample comparison rates and can be updated from JSON.</span>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutPage({ goTo }) {
  return (
    <>
      <section className="section-pad bg-white">
        <div className="container-max grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              kicker="About Us"
              title="Wholesale Grocery and General Store Based in Siliguri"
              text="Prasad Store is a wholesale grocery and general store based in Champasari, Nivedita Road, Siliguri, West Bengal. We provide daily essential products at highly competitive wholesale prices for households, retailers, and businesses."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ['Trusted local wholesale supplier', ShieldCheck],
                ['Affordable pricing', BadgeIndianRupee],
                ['Large product inventory', Boxes],
                ['Bulk order availability', PackageCheck],
                ['Local delivery support', Truck],
                ['Direct customer support', Users]
              ].map(([text, Icon]) => (
                <div key={text} className="flex items-center gap-3 rounded border border-green-100 bg-slate-50 p-4">
                  <Icon className="text-brand-green" size={22} />
                  <span className="font-extrabold text-slate-700">{text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => goTo('contact')} className="mt-8 inline-flex items-center gap-2 rounded bg-brand-orange px-6 py-3 font-extrabold text-white transition hover:bg-orange-600 focus-ring">
              Discuss Bulk Supply
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="overflow-hidden rounded shadow-card">
            <img
              src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1000&q=80"
              alt="Wholesale grocery store inventory"
              className="h-[520px] w-full object-cover"
            />
          </div>
        </div>
      </section>
      <BulkOrdersSection />
    </>
  );
}

function ContactPage() {
  return (
    <section className="section-pad">
      <div className="container-max">
        <SectionHeading
          kicker="Contact Us"
          title="Visit or Message Prasad Store"
          text="Reach out for wholesale grocery pricing, regular supply, local delivery support, and product availability."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-4">
            <ContactCard icon={Store} label="Store Name" value={store.name} />
            <ContactCard icon={MapPin} label="Address" value={store.address} />
            <ContactCard icon={Phone} label="Phone" value={store.phone} />
            <ContactCard icon={Mail} label="Email" value={store.email} />
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded bg-[#25D366] px-5 py-4 font-extrabold text-white shadow-soft transition hover:brightness-95 focus-ring"
            >
              <MessageCircle size={20} />
              WhatsApp Prasad Store
            </a>
            <a
              href={store.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded border border-green-200 bg-white px-5 py-4 font-extrabold text-brand-deep shadow-card transition hover:bg-brand-light focus-ring"
            >
              <MapPin size={20} />
              Open in Google Maps
            </a>
          </div>

          <form className="rounded bg-white p-5 shadow-card ring-1 ring-green-100">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                Name
                <input className="h-12 rounded border border-slate-200 px-4 font-semibold focus-ring" placeholder="Your name" />
              </label>
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                Phone
                <input className="h-12 rounded border border-slate-200 px-4 font-semibold focus-ring" placeholder="+91" />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-extrabold text-slate-700">
              Message
              <textarea className="min-h-36 rounded border border-slate-200 px-4 py-3 font-semibold focus-ring" placeholder="Tell us what products or quantities you need." />
            </label>
            <button type="button" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-brand-green px-5 py-4 font-extrabold text-white transition hover:bg-brand-deep focus-ring">
              Send Enquiry
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div className="mt-8 overflow-hidden rounded bg-white shadow-card ring-1 ring-green-100">
          <iframe
            title="Prasad Store location map"
            src={store.mapEmbedUrl}
            className="h-[360px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function AdminPage({ products, setProducts, categories, setCategories, adminUser, dataStatus }) {
  const [isAuthed, setIsAuthed] = useState(() => !firebaseEnabled && localStorage.getItem('prasad-admin-auth') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const hasAdminAccess = firebaseEnabled ? Boolean(adminUser) : isAuthed;

  const categoryOptions = ['All Products', ...categories];
  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === 'All Products' || product.category === category;
    const searchable = [product.name, product.brand, product.category, product.unit].join(' ').toLowerCase();
    return matchesCategory && searchable.includes(query.toLowerCase());
  });

  const latestUpdates = [...products]
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, 5);

  const login = async () => {
    setAuthError('');

    if (!firebaseEnabled) {
      if (await verifyLocalAdminPassword(password)) {
        localStorage.setItem('prasad-admin-auth', 'true');
        setIsAuthed(true);
        setPassword('');
      } else {
        setAuthError('Incorrect password.');
      }
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const logout = async () => {
    if (firebaseEnabled) {
      await signOut(auth);
    } else {
      localStorage.removeItem('prasad-admin-auth');
      setIsAuthed(false);
    }
  };

  const saveProduct = async (product) => {
    const normalized = normalizeProduct({ ...product, lastUpdated: new Date().toISOString() });

    if (firebaseEnabled) {
      const saved = await saveRemoteProduct(normalized);
      setProducts((current) => {
        const exists = current.some((item) => item.id === normalized.id);
        return exists ? current.map((item) => (item.id === normalized.id ? saved : item)) : [saved, ...current];
      });
    } else {
      setProducts((current) => {
        const exists = current.some((item) => item.id === normalized.id);
        return exists ? current.map((item) => (item.id === normalized.id ? normalized : item)) : [normalized, ...current];
      });
    }

    if (!categories.includes(normalized.category)) {
      setCategories((current) => [...current, normalized.category]);
      if (firebaseEnabled) await saveRemoteCategory(normalized.category);
    }
    setEditingProduct(null);
  };

  const deleteProduct = async (id) => {
    if (firebaseEnabled) await deleteRemoteProduct(id);
    setProducts((current) => current.filter((product) => product.id !== id));
  };

  const addCategory = async () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((current) => [...current, trimmed]);
      if (firebaseEnabled) await saveRemoteCategory(trimmed);
      setNewCategory('');
    }
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = parseCsvProducts(text);
    if (imported.length) {
      if (firebaseEnabled) {
        const savedProducts = [];
        for (const product of imported) {
          savedProducts.push(await saveRemoteProduct(product));
        }
        setProducts((current) => [...savedProducts, ...current]);
      } else {
        setProducts((current) => [...imported, ...current]);
      }

      const nextCategories = [...new Set([...categories, ...imported.map((product) => product.category)])];
      setCategories(nextCategories);
      if (firebaseEnabled) await Promise.all(nextCategories.map((item) => saveRemoteCategory(item)));
    }
    event.target.value = '';
  };

  const handleImageUpload = async (file, onUrl) => {
    if (!file) return;

    if (!firebaseEnabled) {
      onUrl(URL.createObjectURL(file));
      return;
    }

    const url = await uploadProductImage(file);
    if (url) onUrl(url);
  };

  if (!hasAdminAccess) {
    return (
      <section className="section-pad">
        <div className="container-max grid min-h-[560px] place-items-center">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-card ring-1 ring-green-100">
            <div className="flex h-14 w-14 items-center justify-center rounded bg-brand-light text-brand-green">
              <ShieldCheck size={28} />
            </div>
            <h1 className="mt-5 text-3xl font-black text-slate-950">Admin Login</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Secure admin access is handled by Firebase Authentication when configured. Product edits are protected by Firestore rules.
            </p>
            {firebaseEnabled && (
              <label className="mt-5 grid gap-2 text-sm font-extrabold text-slate-700">
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="h-12 rounded border border-slate-200 px-4 font-semibold focus-ring"
                  placeholder="admin@prasadstore.com"
                />
              </label>
            )}
            <label className="mt-5 grid gap-2 text-sm font-extrabold text-slate-700">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && login()}
                type="password"
                className="h-12 rounded border border-slate-200 px-4 font-semibold focus-ring"
                placeholder="Enter admin password"
              />
            </label>
            {authError && <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{authError}</div>}
            <button onClick={login} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-brand-green px-5 py-4 font-extrabold text-white transition hover:bg-brand-deep focus-ring">
              <Eye size={18} />
              Login to Dashboard
            </button>
            <p className="mt-3 text-xs font-bold text-slate-500">
              {firebaseEnabled ? 'Use the admin account created in Firebase Authentication.' : 'Local admin access is enabled for development.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-pad">
      <div className="container-max">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <SectionHeading
            kicker="Admin Dashboard"
            title="Easy Product & Price Management"
            text="Manage products, prices, stock, images, categories, best sellers, discounts, today's deals, and homepage featured items from one mobile-friendly dashboard."
          />
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center rounded bg-white px-4 py-3 text-sm font-black text-brand-deep shadow-card ring-1 ring-green-100">
              {dataStatus}
            </div>
            <button
              onClick={() => setEditingProduct(createBlankProduct(categories[0]))}
              className="inline-flex items-center gap-2 rounded bg-brand-green px-5 py-3 font-extrabold text-white transition hover:bg-brand-deep focus-ring"
            >
              <Plus size={18} />
              Add Product
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-green-200 bg-white px-5 py-3 font-extrabold text-brand-deep shadow-card transition hover:bg-brand-light focus-ring">
              <Upload size={18} />
              Bulk CSV Upload
              <input type="file" accept=".csv" onChange={importCsv} className="sr-only" />
            </label>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-5 py-3 font-extrabold text-slate-700 shadow-card transition hover:bg-slate-50 focus-ring">
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <AdminStat icon={Database} value={products.length} label="Total Products" />
          <AdminStat icon={Tag} value={categories.length} label="Categories" />
          <AdminStat icon={Star} value={products.filter((product) => product.todaysDeal).length} label="Today's Deals" />
          <AdminStat icon={BarChart3} value={products.filter((product) => product.homepageFeatured).length} label="Homepage Featured" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded bg-white p-4 shadow-card ring-1 ring-green-100">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-12 w-full rounded border border-slate-200 pl-11 pr-4 font-semibold focus-ring"
                  placeholder="Search product, brand, category..."
                />
              </label>
              <label className="relative block">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-12 w-full appearance-none rounded border border-slate-200 bg-white px-4 font-bold text-slate-700 focus-ring"
                >
                  {categoryOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </label>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-sm">
                <thead className="bg-brand-light text-brand-deep">
                  <tr>
                    <th className="px-3 py-3 font-black">Product</th>
                    <th className="px-3 py-3 font-black">Category</th>
                    <th className="px-3 py-3 font-black">Stock</th>
                    <th className="px-3 py-3 font-black">Our Price</th>
                    <th className="px-3 py-3 font-black">Market Price</th>
                    <th className="px-3 py-3 font-black">Discount</th>
                    <th className="px-3 py-3 font-black">Updated</th>
                    <th className="px-3 py-3 font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 align-middle">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="h-12 w-12 rounded object-cover" />
                          <div>
                            <div className="font-black text-slate-900">{product.name}</div>
                            <div className="text-xs font-bold text-slate-500">{product.brand} · {product.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-600">{product.category}</td>
                      <td className="px-3 py-3 font-bold text-slate-600">{product.stock}</td>
                      <td className="px-3 py-3 font-black text-brand-deep">{currency.format(product.ourPrice)}</td>
                      <td className="px-3 py-3 font-bold text-slate-500">{currency.format(product.marketPrice)}</td>
                      <td className="px-3 py-3 font-black text-orange-600">{product.discount}%</td>
                      <td className="px-3 py-3 font-bold text-slate-500">{new Date(product.lastUpdated).toLocaleDateString('en-IN')}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingProduct(product)} className="inline-flex h-9 w-9 items-center justify-center rounded bg-brand-light text-brand-green focus-ring" aria-label="Edit product">
                            <Edit3 size={17} />
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="inline-flex h-9 w-9 items-center justify-center rounded bg-red-50 text-red-600 focus-ring" aria-label="Delete product">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="rounded bg-white p-5 shadow-card ring-1 ring-green-100">
              <h3 className="text-lg font-black text-slate-950">Manage Categories</h3>
              <div className="mt-4 flex gap-2">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  className="h-11 min-w-0 flex-1 rounded border border-slate-200 px-3 font-semibold focus-ring"
                  placeholder="New category"
                />
                <button onClick={addCategory} className="rounded bg-brand-green px-4 font-black text-white focus-ring">Add</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <span key={item} className="rounded bg-brand-light px-3 py-1 text-xs font-black text-brand-deep">{item}</span>
                ))}
              </div>
            </div>

            <div className="rounded bg-white p-5 shadow-card ring-1 ring-green-100">
              <h3 className="text-lg font-black text-slate-950">Latest Updated Prices</h3>
              <div className="mt-4 grid gap-3">
                {latestUpdates.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <div className="font-black text-slate-800">{product.name}</div>
                      <div className="text-xs font-bold text-slate-500">{new Date(product.lastUpdated).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="font-black text-brand-deep">{currency.format(product.ourPrice)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded bg-brand-deep p-5 text-white shadow-card">
              <h3 className="text-lg font-black">Database Ready</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-green-50">
                This dashboard currently persists products in browser storage for easy demo use. The product service is isolated so Firebase, Supabase, MongoDB, or PostgreSQL APIs can replace storage without changing the UI.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSave={saveProduct}
          onImageUpload={handleImageUpload}
        />
      )}
    </section>
  );
}

function createBlankProduct(category) {
  return normalizeProduct({
    id: `local-${Date.now()}`,
    name: '',
    category,
    brand: '',
    unit: '',
    ourPrice: 0,
    marketPrice: 0,
    stock: 'In Stock',
    description: '',
    image: '',
    bestSeller: false,
    discounted: false,
    homepageFeatured: false,
    todaysDeal: false
  });
}

function AdminStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded bg-white p-5 shadow-card ring-1 ring-green-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-black text-brand-deep">{value}</div>
          <div className="mt-1 text-sm font-bold text-slate-500">{label}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded bg-brand-light text-brand-green">
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function ProductEditor({ product, categories, onClose, onSave, onImageUpload }) {
  const [form, setForm] = useState(product);
  const [uploading, setUploading] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const liveDiscount = normalizeProduct(form).discount;

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onImageUpload(file, (url) => update('image', url));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded bg-white shadow-soft">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <div>
            <h3 className="text-2xl font-black text-slate-950">Product Editor</h3>
            <p className="text-sm font-semibold text-slate-500">Update daily prices, image, stock, and product highlights.</p>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 focus-ring" aria-label="Close editor">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <AdminInput label="Product Name" value={form.name} onChange={(value) => update('name', value)} />
          <AdminInput label="Brand" value={form.brand} onChange={(value) => update('brand', value)} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            Category
            <select value={form.category} onChange={(event) => update('category', event.target.value)} className="h-12 rounded border border-slate-200 bg-white px-4 font-semibold focus-ring">
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <AdminInput label="Weight / Quantity" value={form.unit} onChange={(value) => update('unit', value)} />
          <div className="grid gap-2 text-sm font-extrabold text-slate-700">
            Product Image
            <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
              <img src={form.image} alt={form.name || 'Product preview'} className="h-24 w-24 rounded object-cover ring-1 ring-slate-200" />
              <div className="grid gap-2">
                <input
                  value={form.image}
                  onChange={(event) => update('image', event.target.value)}
                  className="h-12 rounded border border-slate-200 px-4 font-semibold focus-ring"
                  placeholder="Image URL"
                />
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-green-200 bg-brand-light px-4 py-2 font-black text-brand-deep focus-ring">
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={uploadImage} className="sr-only" />
                </label>
              </div>
            </div>
          </div>
          <label className="grid gap-2 text-sm font-extrabold text-slate-700">
            Stock Availability
            <select value={form.stock} onChange={(event) => update('stock', event.target.value)} className="h-12 rounded border border-slate-200 bg-white px-4 font-semibold focus-ring">
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
          </label>
          <AdminInput label="Our Price" type="number" value={form.ourPrice} onChange={(value) => update('ourPrice', value)} />
          <AdminInput label="Market / JioMart Price" type="number" value={form.marketPrice} onChange={(value) => update('marketPrice', value)} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-700 md:col-span-2">
            Description
            <textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="min-h-28 rounded border border-slate-200 px-4 py-3 font-semibold focus-ring" />
          </label>
          <div className="rounded bg-brand-light p-4 text-sm font-black text-brand-deep">
            Auto Discount: {liveDiscount}%
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['bestSeller', 'Best Seller'],
              ['discounted', 'Discounted'],
              ['todaysDeal', "Today's Best Deal"],
              ['homepageFeatured', 'Homepage Featured']
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
                <input type="checkbox" checked={Boolean(form[key])} onChange={(event) => update(key, event.target.checked)} className="h-4 w-4 accent-brand-green" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded border border-slate-200 px-5 py-3 font-black text-slate-700 focus-ring">Cancel</button>
          <button onClick={() => onSave(form)} className="inline-flex items-center justify-center gap-2 rounded bg-brand-green px-5 py-3 font-black text-white focus-ring">
            <CheckCircle2 size={18} />
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded border border-slate-200 px-4 font-semibold focus-ring"
      />
    </label>
  );
}

function ProductCard({ product }) {
  const savings = product.marketPrice - product.ourPrice;
  const discount = Math.round((savings / product.marketPrice) * 100);
  const updated = product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString('en-IN') : 'Today';

  return (
    <article className="group overflow-hidden rounded bg-white shadow-card ring-1 ring-green-100 transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-light">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <span className="absolute left-3 top-3 rounded bg-brand-orange px-3 py-1 text-xs font-black text-white">{discount}% OFF</span>
        {product.bestSeller && <span className="absolute bottom-3 left-3 rounded bg-white px-3 py-1 text-xs font-black text-brand-deep">Best Seller</span>}
      </div>
      <div className="p-4">
        <div className="text-xs font-black uppercase tracking-normal text-brand-green">{product.category}</div>
        <h3 className="line-clamp-2 mt-1 min-h-12 text-lg font-black leading-snug text-slate-900">{product.name}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex rounded bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">{product.unit}</span>
          <span className="inline-flex rounded bg-green-50 px-3 py-1 text-xs font-extrabold text-brand-green">{product.stock}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded bg-brand-light p-3">
            <div className="text-xs font-bold text-slate-500">Our Price</div>
            <div className="text-xl font-black text-brand-deep">{currency.format(product.ourPrice)}</div>
          </div>
          <div className="rounded bg-slate-50 p-3">
            <div className="text-xs font-bold text-slate-500">Market Price</div>
            <div className="text-lg font-black text-slate-500 line-through">{currency.format(product.marketPrice)}</div>
          </div>
        </div>
        <div className="mt-3 rounded bg-brand-amber px-3 py-2 text-center text-sm font-black text-orange-700">
          You Save {currency.format(savings)}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
          <Clock size={14} />
          Last Updated: {updated}
        </div>
      </div>
    </article>
  );
}

function WhyChooseSection() {
  const items = [
    ['Better wholesale pricing', 'Value-focused prices for everyday essentials and bulk grocery orders.', BadgeIndianRupee],
    ['Trusted local grocery supplier', 'A Siliguri-based store with approachable service and local knowledge.', ShieldCheck],
    ['Direct customer support', 'Call or WhatsApp for product availability, order quantities, and delivery details.', Phone],
    ['Bulk order discounts', 'Support for households, retail shops, restaurants, hotels, and businesses.', Boxes],
    ['Competitive market rates', 'Clear comparisons help buyers understand savings before they purchase.', CheckCircle2]
  ];

  return (
    <section className="section-pad">
      <div className="container-max">
        <SectionHeading
          kicker="Why Customers Prefer Prasad Store"
          title="Reliable Supply, Transparent Pricing, Local Support"
          text="A clean wholesale buying experience for customers who want strong prices without guessing what they are saving."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {items.map(([title, text, Icon]) => (
            <div key={title} className="rounded bg-white p-5 shadow-card ring-1 ring-green-100">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded bg-brand-light text-brand-green">
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BulkOrdersSection() {
  return (
    <section className="section-pad bg-brand-deep text-white">
      <div className="container-max grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-orange-200">Bulk Orders & Retail Supply</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">Wholesale grocery support for homes and businesses</h2>
          <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-green-50">
            Prasad Store supports grocery supply for homes, retail shops, restaurants, hotels, offices, and local buyers who need dependable stock at wholesale bulk pricing.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {['Grocery supply for homes', 'Retail shop supply', 'Restaurant & hotel supply', 'Wholesale bulk pricing'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded bg-white/10 p-4 ring-1 ring-white/15">
              <CheckCircle2 className="text-orange-200" />
              <span className="font-extrabold">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-4 rounded p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-brand-light text-brand-green">
        <Icon size={23} />
      </div>
      <div>
        <h3 className="font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function ContactCard({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-4 rounded bg-white p-5 shadow-card ring-1 ring-green-100">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-brand-light text-brand-green">
        <Icon size={22} />
      </div>
      <div>
        <div className="text-sm font-black uppercase tracking-normal text-slate-400">{label}</div>
        <div className="mt-1 font-extrabold leading-7 text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function SectionHeading({ kicker, title, text }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-normal text-brand-orange">{kicker}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-600">{text}</p>
    </div>
  );
}

function Footer({ goTo }) {
  return (
    <footer className="bg-[#111b16] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="container-max grid gap-8 md:grid-cols-[1.3fr_0.7fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded bg-brand-green text-white">
              <Store />
            </span>
            <div>
              <div className="text-xl font-black">{store.name}</div>
              <div className="text-sm font-semibold text-slate-300">Wholesale Grocery & General Store</div>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-300">
            Trusted wholesale grocery supplier at Champasari, Nivedita Road, Siliguri, West Bengal, India.
          </p>
        </div>
        <div>
          <div className="font-black">Quick Links</div>
          <div className="mt-3 grid gap-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => goTo(item.id)} className="w-fit text-sm font-semibold text-slate-300 hover:text-white focus-ring">
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-black">Contact</div>
          <div className="mt-3 grid gap-2 text-sm font-semibold leading-7 text-slate-300">
            <span>{store.address}</span>
            <span>{store.phone}</span>
            <span>{store.email}</span>
          </div>
        </div>
      </div>
      <div className="container-max mt-8 border-t border-white/10 pt-5 text-sm font-semibold text-slate-400">
        © 2026 Prasad Store. Prices shown are sample comparison rates and may change.
      </div>
    </footer>
  );
}

export default App;
