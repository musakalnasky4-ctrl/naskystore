import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { supabase, Profile, Banner, Product, Order } from './lib/supabase';
import Sidebar from './components/Sidebar';
import BannerCarousel from './components/BannerCarousel';
import UserMenu from './components/UserMenu';
import BalanceCard from './components/BalanceCard';
import BestSellers from './components/BestSellers';
import ProductGrid from './components/ProductGrid';
import LoginModal from './components/LoginModal';
import EditProfileModal from './components/EditProfileModal';
import ProductPurchaseModal from './components/ProductPurchaseModal';
import ProductDetail from './components/ProductDetail';
import DepositPage from './components/DepositPage';
import ComingSoonPage from './components/ComingSoonPage';
import TopSpentPage from './components/TopSpentPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import DepositHistoryPage from './components/DepositHistoryPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');
  const [user, setUser] = useState<Profile | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  useEffect(() => {
    checkUser();
    fetchBanners();
    fetchProducts();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      (() => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setOrders([]);
        }
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders(user.id);
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setUser(data);
    } else if (!data) {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: authUser.user.email || '',
            name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'User',
            balance: 0,
            is_admin: false,
          });

        if (!insertError) {
          await fetchUserProfile(userId);
        }
      }
    }
  };

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (data) {
      setBanners(data);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data);
    }
  };

  const fetchOrders = async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await fetchUserProfile(data.user.id);
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          name,
          balance: 0,
          is_admin: false,
        });

      if (profileError) throw profileError;

      await fetchUserProfile(data.user.id);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        if (error.message.includes('provider is not enabled')) {
          throw new Error('Google Login belum dikonfigurasi. Silakan gunakan email/password untuk login.');
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
  };

  const handleAdminLogin = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    const adminEmail = prompt('Masukkan email admin:');
    if (!adminEmail) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .eq('is_admin', true)
      .maybeSingle();

    if (data && data.id === user.id) {
      alert('Selamat datang, Admin!');
    } else {
      alert('Kamu bukan admin!');
    }
  };

  const handleUpdateProfile = async (name: string, email: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ name, email, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;

    await fetchUserProfile(user.id);
  };

  const handlePurchaseWithBalance = async (product: Product) => {
    if (!user) {
      alert('Silakan login terlebih dahulu');
      setLoginModalOpen(true);
      return;
    }

    if (user.balance < product.price) {
      alert('Saldo tidak cukup! Silakan deposit terlebih dahulu.');
      return;
    }

    if (product.stock === 0) {
      alert('Stok habis!');
      return;
    }

    const newBalance = user.balance - product.price;

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      alert('Terjadi kesalahan saat memproses pembayaran');
      return;
    }

    const newStock = product.stock - 1;

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product.id);

    if (stockError) {
      alert('Terjadi kesalahan saat memperbarui stok');
      return;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        product_id: product.id,
        amount: product.price,
        status: 'completed',
      });

    if (orderError) {
      alert('Terjadi kesalahan saat membuat pesanan');
      return;
    }

    await fetchUserProfile(user.id);
    await fetchProducts();
    await fetchOrders();
  };

  const handlePurchaseWithQRIS = async (product: Product, qrisPaymentId: string) => {
    if (!user) {
      alert('Silakan login terlebih dahulu');
      setLoginModalOpen(true);
      return;
    }

    if (product.stock === 0) {
      alert('Stok habis!');
      return;
    }

    const newStock = product.stock - 1;

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product.id);

    if (stockError) {
      alert('Terjadi kesalahan saat memperbarui stok');
      return;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        product_id: product.id,
        amount: product.price,
        status: 'completed',
        qris_payment_id: qrisPaymentId,
      });

    if (orderError) {
      alert('Terjadi kesalahan saat membuat pesanan');
      return;
    }

    await fetchProducts();
    await fetchOrders();
  };

  const handleDeposit = async (amount: number, qrisPaymentId: string) => {
    if (!user) {
      alert('Silakan login terlebih dahulu');
      setLoginModalOpen(true);
      return;
    }

    const newBalance = user.balance + amount;

    const { error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: user.id,
        amount: amount,
        status: 'completed',
        qris_payment_id: qrisPaymentId,
      });

    if (depositError) {
      throw new Error('Gagal membuat deposit');
    }

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      throw new Error('Gagal memperbarui saldo');
    }

    await fetchUserProfile(user.id);
  };

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  if (currentSection === 'deposit') {
    return (
      <DepositPage
        profile={user}
        onBack={() => setCurrentSection('home')}
        onDeposit={handleDeposit}
      />
    );
  }

  if (currentSection === 'orders' && user) {
    return (
      <OrderHistoryPage
        userId={user.id}
        onBack={() => setCurrentSection('home')}
      />
    );
  }

  if (currentSection === 'deposit-history' && user) {
    return (
      <DepositHistoryPage
        userId={user.id}
        onBack={() => setCurrentSection('home')}
      />
    );
  }

  if (currentSection === 'guide') {
    return <ComingSoonPage onBack={() => setCurrentSection('home')} />;
  }

  if (currentSection === 'support') {
    return <ComingSoonPage onBack={() => setCurrentSection('home')} />;
  }

  if (currentSection === 'topspent') {
    return <TopSpentPage onBack={() => setCurrentSection('home')} />;
  }

  if (showProductDetail && selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        profile={user}
        onBack={() => setShowProductDetail(false)}
        onPurchaseWithBalance={handlePurchaseWithBalance}
        onPurchaseWithQRIS={handlePurchaseWithQRIS}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <div className="container mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 bg-white hover:bg-gray-50 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Digital Store
          </h1>

          <UserMenu
            user={user}
            onLogin={() => setLoginModalOpen(true)}
            onLogout={handleLogout}
            onAdminLogin={handleAdminLogin}
            onEditProfile={() => setEditProfileModalOpen(true)}
            onDepositHistory={() => handleNavigate('deposit-history')}
          />
        </header>

        <BannerCarousel banners={banners} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-1">
            <BalanceCard
              profile={user}
              orders={orders}
              onDeposit={() => setCurrentSection('deposit')}
            />
          </div>

          <div className="lg:col-span-2">
            <BestSellers
              products={products}
              onProductClick={handleProductClick}
            />
          </div>
        </div>

        <ProductGrid products={products} onProductClick={handleProductClick} />
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGoogleLogin={handleGoogleLogin}
      />

      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        profile={user}
        onUpdate={handleUpdateProfile}
      />

      <ProductPurchaseModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={selectedProduct}
        profile={user}
        onPurchaseWithBalance={handlePurchaseWithBalance}
        onPurchaseWithQRIS={handlePurchaseWithQRIS}
      />
    </div>
  );
}

export default App;
