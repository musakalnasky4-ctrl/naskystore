import { useState } from 'react';
import { ArrowLeft, Tag } from 'lucide-react';
import { Product, Profile, supabase } from '../lib/supabase';

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
  onPurchase: (product: Product, useBalance: boolean, promoCode?: string, finalPrice?: number) => Promise<void>;
}

export default function ProductDetail({ product, profile, onBack, onPurchase }: ProductDetailProps) {
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'balance'>('qris');
  const [useBalance, setUseBalance] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

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
    } catch {
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

  const handlePayment = async () => {
    if (useBalance && (!profile || profile.balance < finalPrice)) {
      alert('Saldo tidak cukup');
      return;
    }

    await onPurchase(product, useBalance, appliedPromo?.code, finalPrice);
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gunakan Saldo
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setUseBalance(true)}
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                  useBalance
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full ${
                    useBalance ? 'bg-white' : 'bg-transparent'
                  }`}
                />
              </button>
              <span className="font-medium text-gray-700">Ya</span>

              <button
                onClick={() => setUseBalance(false)}
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                  !useBalance
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full ${
                    !useBalance ? 'bg-white' : 'bg-transparent'
                  }`}
                />
              </button>
              <span className="font-medium text-gray-700">Tidak</span>
            </div>
            {profile && (
              <p className="text-sm text-gray-500 mt-2">
                Saldo tersedia: Rp {profile.balance.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Metode Pembayaran</span>
                <span className="font-medium">{paymentMethod === 'qris' ? 'QRIS' : 'Saldo'}</span>
              </div>
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

            <button
              onClick={handlePayment}
              disabled={product.stock === 0 || (useBalance && (!profile || profile.balance < finalPrice))}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {product.stock === 0 ? 'Stok Habis' : 'Bayar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
