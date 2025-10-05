import { useState } from 'react';
import { X, Wallet, QrCode, ShoppingCart, Package } from 'lucide-react';
import { Product, Profile, QRISPayment } from '../lib/supabase';
import { generateQRISPayment } from '../lib/qris';
import QRISPaymentModal from './QRISPaymentModal';

interface ProductPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  profile: Profile | null;
  onPurchaseWithBalance: (product: Product) => Promise<void>;
  onPurchaseWithQRIS: (product: Product, qrisPaymentId: string) => Promise<void>;
}

export default function ProductPurchaseModal({
  isOpen,
  onClose,
  product,
  profile,
  onPurchaseWithBalance,
  onPurchaseWithQRIS,
}: ProductPurchaseModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'qris' | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrisPayment, setQrisPayment] = useState<QRISPayment | null>(null);
  const [showQRIS, setShowQRIS] = useState(false);

  if (!isOpen || !product) return null;

  const canPayWithBalance = profile && profile.balance >= product.price;

  const handleBalancePurchase = async () => {
    if (!canPayWithBalance) {
      alert('Saldo Anda tidak mencukupi. Silakan top up terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      await onPurchaseWithBalance(product);
      alert('Pembelian berhasil! Cek riwayat pesanan untuk detail akun.');
      onClose();
      resetState();
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
        product.price,
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
      onClose();
      resetState();
    } catch (error) {
      alert('Terjadi kesalahan saat memproses pembelian');
      console.error(error);
    }
  };

  const handleCloseQRIS = () => {
    setShowQRIS(false);
    setQrisPayment(null);
  };

  const resetState = () => {
    setPaymentMethod(null);
    setShowQRIS(false);
    setQrisPayment(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
          <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            {product.is_best_seller && (
              <div className="absolute top-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Best Seller
              </div>
            )}
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
            <p className="text-gray-600 mb-4">{product.description}</p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Kategori</span>
                <span className="text-gray-800 font-semibold">{product.category}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Stok</span>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-800 font-semibold">{product.stock}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <span className="text-gray-700 font-medium">Harga</span>
                <span className="text-2xl font-bold text-blue-600">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
              </div>

              {profile && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <span className="text-gray-700 font-medium">Saldo Anda</span>
                  <span className="text-xl font-bold text-green-600">
                    Rp {profile.balance.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {!paymentMethod ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Pilih Metode Pembayaran</p>

                <button
                  onClick={() => setPaymentMethod('balance')}
                  disabled={!canPayWithBalance || product.stock === 0}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center space-x-4 ${
                    canPayWithBalance && product.stock > 0
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
                      {!canPayWithBalance ? 'Saldo tidak mencukupi' : 'Instant'}
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
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{loading ? 'Memproses...' : 'Beli Sekarang'}</span>
                  </button>
                )}

                {paymentMethod === 'qris' && (
                  <button
                    onClick={handleQRISPurchase}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>{loading ? 'Membuat QRIS...' : 'Bayar dengan QRIS'}</span>
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
    </>
  );
}
