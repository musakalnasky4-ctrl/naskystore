import { useState, useEffect } from 'react';
import { ArrowLeft, Tag, Wallet, QrCode } from 'lucide-react';
import { Product, Profile, QRISPayment, supabase } from '../lib/supabase';
import { generateQRISPayment } from '../lib/qris';
import QRISPaymentModal from './QRISPaymentModal';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
}

interface ProductDetailProps {
  product: Product;
  profile: Profile | null;
  onBack: () => void;
  onPurchaseWithBalance: (product: Product) => Promise<void>;
  onPurchaseWithQRIS: (product: Product, qrisPaymentId: string) => Promise<void>;
}

export default function ProductDetail({ product, profile, onBack, onPurchaseWithBalance, onPurchaseWithQRIS }: ProductDetailProps) {
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'qris' | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qrisPayment, setQrisPayment] = useState<QRISPayment | null>(null);
  const [showQRIS, setShowQRIS] = useState(false);

  const subtotal = product.price;
  const finalPrice = subtotal - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Masukkan kode promo');
      return;
    }

    setPromoError('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setPromoError('Kode promo tidak valid');
        setAppliedPromo(null);
        setDiscount(0);
        setLoading(false);
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        setPromoError('Kode promo sudah kadaluarsa');
        setAppliedPromo(null);
        setDiscount(0);
        setLoading(false);
        return;
      }

      if (data.max_usage && data.current_usage >= data.max_usage) {
        setPromoError('Kode promo sudah mencapai batas penggunaan');
        setAppliedPromo(null);
        setDiscount(0);
        setLoading(false);
        return;
      }

      if (subtotal < data.min_purchase) {
        setPromoError(`Minimal pembelian Rp ${data.min_purchase.toLocaleString('id-ID')}`);
        setAppliedPromo(null);
        setDiscount(0);
        setLoading(false);
        return;
      }

      let calculatedDiscount = 0;
      if (data.discount_type === 'percentage') {
        calculatedDiscount = (subtotal * data.discount_value) / 100;
      } else {
        calculatedDiscount = data.discount_value;
      }

      calculatedDiscount = Math.min(calculatedDiscount, subtotal);

      setAppliedPromo(data);
      setDiscount(calculatedDiscount);
      setPromoError('');
    } catch (err) {
      setPromoError('Terjadi kesalahan');
      setAppliedPromo(null);
      setDiscount(0);
    }

    setLoading(false);
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setDiscount(0);
    setPromoError('');
  };

  const handleBalancePurchase = async () => {
    if (!profile || profile.balance < finalPrice) {
      alert('Saldo tidak cukup');
      return;
    }

    setLoading(true);
    try {
      await onPurchaseWithBalance(product);
      alert('Pembelian berhasil! Cek riwayat pesanan untuk detail akun.');
      onBack();
    } catch (error) {
      alert('Terjadi kesalahan saat membeli produk');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRISPurchase = async () => {
    if (!profile) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const qris = await generateQRISPayment(
        profile.id,
        finalPrice,
        'purchase',
        product.id
      );

      setQrisPayment(qris);
      setShowQRIS(true);
    } catch (error) {
      alert('Terjadi kesalahan saat membuat QRIS');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRISPaymentComplete = async () => {
    if (!qrisPayment) return;

    try {
      await onPurchaseWithQRIS(product, qrisPayment.id);
      alert('Pembayaran berhasil! Cek riwayat pesanan untuk detail akun.');
      onBack();
    } catch (error) {
      alert('Terjadi kesalahan saat memproses pembelian');
      console.error(error);
    }
  };

  const handleCloseQRIS = () => {
    setShowQRIS(false);
    setQrisPayment(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-medium">Kembali</span>
        </button>

        <div className="bg-white rounded-3xl overflow-hidden shadow-xl mb-6">
          <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.is_best_seller && (
              <div className="absolute top-6 right-6 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Best Seller
              </div>
            )}
          </div>

          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
            <p className="text-gray-600 mb-6">{product.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Stok Tersedia</p>
                <p className="text-2xl font-bold text-gray-800">{product.stock}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Harga Per Unit</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Note:</span> Jika habis hubungi owner, nanti langsung di restock / beli langsung di owner
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Metode Pembayaran</h3>

          <div className="space-y-3 mb-6">
            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="radio"
                name="payment"
                value="qris"
                checked={paymentMethod === 'qris'}
                onChange={() => setPaymentMethod('qris')}
                className="w-5 h-5 text-blue-600"
              />
              <span className="font-medium text-gray-700">QRIS</span>
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promo Code
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode promo"
                  disabled={!!appliedPromo}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                />
              </div>
              {appliedPromo ? (
                <button
                  onClick={handleRemovePromo}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Hapus
                </button>
              ) : (
                <button
                  onClick={handleApplyPromo}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Terapkan
                </button>
              )}
            </div>
            {promoError && (
              <p className="text-sm text-red-600 mt-2">{promoError}</p>
            )}
            {appliedPromo && (
              <p className="text-sm text-green-600 mt-2">
                Promo berhasil diterapkan! Diskon{' '}
                {appliedPromo.discount_type === 'percentage'
                  ? `${appliedPromo.discount_value}%`
                  : `Rp ${appliedPromo.discount_value.toLocaleString('id-ID')}`}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Promo Code</span>
                <span className="font-medium">
                  {appliedPromo ? `-Rp ${discount.toLocaleString('id-ID')}` : '-'}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800">
                <span>Total Harga</span>
                <span className="text-blue-600">Rp {finalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {profile && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Saldo Anda</p>
                <p className="text-xl font-bold text-green-600">
                  Rp {profile.balance.toLocaleString('id-ID')}
                </p>
              </div>
            )}

            {!paymentMethod ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Pilih Metode Pembayaran</p>

                <button
                  onClick={() => setPaymentMethod('balance')}
                  disabled={!profile || profile.balance < finalPrice || product.stock === 0}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center space-x-4 ${
                    profile && profile.balance >= finalPrice && product.stock > 0
                      ? 'border-green-500 bg-green-50 hover:bg-green-100'
                      : 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-800">Bayar dengan Saldo</p>
                    <p className="text-xs text-gray-500">
                      {!profile || profile.balance < finalPrice ? 'Saldo tidak mencukupi' : 'Instant'}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('qris')}
                  disabled={product.stock === 0}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center space-x-4 ${
                    product.stock > 0
                      ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                      : 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-800">Bayar dengan QRIS</p>
                    <p className="text-xs text-gray-500">Scan & Pay</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="text-sm text-gray-600 hover:text-gray-800 mb-2"
                >
                  ← Ganti metode pembayaran
                </button>

                {paymentMethod === 'balance' && (
                  <button
                    onClick={handleBalancePurchase}
                    disabled={loading || product.stock === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? 'Memproses...' : product.stock === 0 ? 'Stok Habis' : 'Bayar Sekarang'}
                  </button>
                )}

                {paymentMethod === 'qris' && (
                  <button
                    onClick={handleQRISPurchase}
                    disabled={loading || product.stock === 0}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? 'Membuat QRIS...' : product.stock === 0 ? 'Stok Habis' : 'Bayar dengan QRIS'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQRIS && qrisPayment && (
        <QRISPaymentModal
          qrisPayment={qrisPayment}
          onClose={handleCloseQRIS}
          onPaymentComplete={handleQRISPaymentComplete}
        />
      )}
    </div>
  );
}
