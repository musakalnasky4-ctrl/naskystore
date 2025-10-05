import { useState, useEffect, useRef } from 'react';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { QRISPayment } from '../lib/supabase';
import { checkQRISPaymentStatus } from '../lib/qris';
import { formatRemainingTime } from '../lib/qrisGenerator';
import QRCode from 'qrcode';

interface QRISPaymentModalProps {
  qrisPayment: QRISPayment;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export default function QRISPaymentModal({ qrisPayment, onClose, onPaymentComplete }: QRISPaymentModalProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'expired'>('pending');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Generate QR Code
    generateQRCode();

    // Start countdown timer
    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    // Check payment status setiap 3 detik
    statusCheckRef.current = setInterval(checkPaymentStatus, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, []);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(qrisPayment.qris_code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrImageUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const updateTimer = () => {
    const expiryDate = new Date(qrisPayment.expires_at);
    const remaining = formatRemainingTime(expiryDate);

    setTimeRemaining(remaining);

    if (remaining === 'Kadaluarsa') {
      setPaymentStatus('expired');
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const status = await checkQRISPaymentStatus(qrisPayment.id);
      if (status === 'completed') {
        setPaymentStatus('completed');
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);

        // Wait 2 seconds before calling completion
        setTimeout(() => {
          onPaymentComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Pembayaran QRIS</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {paymentStatus === 'completed' && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-xl">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-800">Pembayaran Berhasil!</p>
                  <p className="text-sm text-green-600">Saldo akan segera ditambahkan</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'expired' && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-bold text-red-800">Pembayaran Kadaluarsa</p>
                  <p className="text-sm text-red-600">Silakan buat transaksi baru</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'pending' && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-500 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-800">Waktu Pembayaran</p>
                    <p className="text-sm text-blue-600">Selesaikan dalam waktu ini</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{timeRemaining}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
            <div className="bg-white rounded-xl p-4 mb-4">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="QRIS QR Code"
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">Total Pembayaran</p>
              <p className="text-3xl font-bold text-gray-800">
                Rp {qrisPayment.amount.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sudah termasuk biaya unik
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-700">Buka aplikasi e-wallet (GoPay, OVO, Dana, dll)</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-700">Pilih menu Scan QR atau QRIS</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-700">Scan QR Code di atas dan lakukan pembayaran</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-yellow-800">
              <span className="font-bold">Penting:</span> Jangan tutup halaman ini sampai pembayaran selesai.
              Pembayaran akan otomatis terverifikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
