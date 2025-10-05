import { supabase, QRISPayment } from './supabase';
import { generateDynamicQRIS, generateUniqueFee, calculateExpiryTime } from './qrisGenerator';

export async function generateQRISPayment(
  userId: string,
  amount: number,
  type: 'deposit' | 'purchase',
  referenceId?: string
): Promise<QRISPayment> {
  // Generate fee unik untuk setiap transaksi (1-999)
  const uniqueFee = generateUniqueFee();
  const totalAmount = amount + uniqueFee;

  // Generate QRIS dinamis dengan nominal
  const qrisString = generateDynamicQRIS(amount, uniqueFee);

  // Generate kode QRIS unik
  const qrisCode = `QRIS${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;

  // Set expiry 30 menit
  const expiresAt = calculateExpiryTime(30);

  const { data, error } = await supabase
    .from('qris_payments')
    .insert({
      user_id: userId,
      qris_code: qrisString,
      qris_url: `https://qris.id/pay/${qrisCode}`,
      amount: totalAmount,
      type,
      reference_id: referenceId || null,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function checkQRISPaymentStatus(qrisPaymentId: string): Promise<string> {
  const { data, error } = await supabase
    .from('qris_payments')
    .select('status')
    .eq('id', qrisPaymentId)
    .single();

  if (error) throw error;

  return data.status;
}

export async function completeQRISPayment(qrisPaymentId: string): Promise<void> {
  const { error } = await supabase
    .from('qris_payments')
    .update({ status: 'completed' })
    .eq('id', qrisPaymentId);

  if (error) throw error;
}

export async function simulateQRISPayment(qrisPaymentId: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      await completeQRISPayment(qrisPaymentId);
      resolve();
    }, 3000);
  });
}
