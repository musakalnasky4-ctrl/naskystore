import { useState } from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';
import { Profile } from '../lib/supabase';

interface DepositPageProps {
  profile: Profile | null;
  onBack: () => void;
  onDeposit: (amount: number) => Promise<void>;
}

export default function DepositPage({ profile, onBack, onDeposit }: DepositPageProps) {
  const [amount, setAmount] = useState('');
  const [showQRIS, setShowQRIS] = useState(false);
  const [loading, setLoading] = useState(false);

  const templateAmounts = [10000, 15000, 20000, 30000, 40000, 50000];

  const handleTemplateClick = (templateAmount: number) => {
    setAmount(templateAmount.toString());
  };

  const handlePayment = async () => {
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert('Masukkan jumlah deposit yang valid');
      return;
    }

    setLoading(true);
    setShowQRIS(true);

    setTimeout(async () => {
      try {
        await onDeposit(depositAmount);
        alert('Deposit berhasil!');
        setAmount('');
        setShowQRIS(false);
        onBack();
      } catch (error) {
        alert('Terjadi kesalahan saat deposit');
      } finally {
        setLoading(false);
      }
    }, 2000);
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

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Deposit Saldo</h1>
                <p className="text-sm text-gray-500">Isi saldo untuk bertransaksi</p>
              </div>
            </div>

            {profile && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-6 text-white">
                <p className="text-sm text-blue-100 mb-1">Saldo Saat Ini</p>
                <p className="text-3xl font-bold">
                  Rp {profile.balance.toLocaleString('id-ID')}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal Deposit
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Masukkan nominal"
                  className="w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Template Nominal
              </p>
              <div className="grid grid-cols-3 gap-3">
                {templateAmounts.map((templateAmount) => (
                  <button
                    key={templateAmount}
                    onClick={() => handleTemplateClick(templateAmount)}
                    className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                      amount === templateAmount.toString()
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    Rp {templateAmount.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Metode Pembayaran
              </p>
              <div className="flex items-center space-x-3 p-4 border-2 border-blue-500 rounded-xl bg-blue-50">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">QRIS</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">QRIS</p>
                  <p className="text-xs text-gray-500">Scan & Pay</p>
                </div>
              </div>
            </div>

            {!showQRIS ? (
              <button
                onClick={handlePayment}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Bayar Sekarang
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 flex flex-col items-center">
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <p className="text-xs mb-2">QRIS CODE</p>
                        <p className="font-bold text-2xl mb-1">
                          Rp {parseFloat(amount).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs">Scan untuk bayar</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Scan kode QRIS di atas dengan aplikasi pembayaran
                  </p>
                  {loading && (
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <p className="text-sm text-gray-600 ml-2">Memproses pembayaran...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
