// QRIS Dynamic Generator
// Mengubah QRIS statis menjadi QRIS dinamis dengan nominal dan fee unik

const BASE_QRIS = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214724010134537100303UMI51440014ID.CO.QRIS.WWW0215ID20243153077910303UMI5204541153033605802ID5920WAROENGG13 OK15808366009WAY KANAN61053476162070703A016304775D';

function crc16(data: string): string {
  let crc = 0xFFFF;
  const dataBytes = data.split('').map(c => c.charCodeAt(0));

  for (const byte of dataBytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0x8408;
      } else {
        crc = crc >> 1;
      }
    }
  }

  crc = ~crc & 0xFFFF;
  crc = ((crc & 0xFF) << 8) | ((crc >> 8) & 0xFF);

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatQRISField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

export function generateDynamicQRIS(amount: number, uniqueFee: number = 0): string {
  // Total amount dengan fee unik
  const totalAmount = amount + uniqueFee;
  const amountStr = totalAmount.toFixed(2);

  // Parse QRIS statis (tanpa CRC terakhir 4 digit)
  let qrisData = BASE_QRIS.slice(0, -4);

  // Cari dan replace amount field (ID 54)
  // Format: 54[length][amount]
  const amountField = formatQRISField('54', amountStr);

  // Cari posisi field 54 dalam QRIS
  const field54Regex = /54\d{2}[\d.]+/;
  const match = qrisData.match(field54Regex);

  if (match) {
    qrisData = qrisData.replace(field54Regex, amountField);
  } else {
    // Jika tidak ada field 54, tambahkan sebelum field 58 (country code)
    const field58Index = qrisData.indexOf('5802');
    if (field58Index !== -1) {
      qrisData = qrisData.slice(0, field58Index) + amountField + qrisData.slice(field58Index);
    }
  }

  // Tambahkan field 63 placeholder untuk CRC
  qrisData += '6304';

  // Hitung CRC16
  const checksum = crc16(qrisData);

  // Gabungkan semua
  return qrisData + checksum;
}

export function generateUniqueFee(): number {
  // Generate fee unik 1-999 untuk membedakan setiap transaksi
  return Math.floor(Math.random() * 999) + 1;
}

export function calculateExpiryTime(minutes: number = 30): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

export function formatRemainingTime(expiryDate: Date): string {
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();

  if (diff <= 0) return 'Kadaluarsa';

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
