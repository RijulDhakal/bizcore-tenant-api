export const adToBS = (adDate: Date): string => {
  const bsMonths = [
    'Baisakh',
    'Jestha',
    'Ashadh',
    'Shrawan',
    'Bhadra',
    'Ashwin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra',
  ];

  const bsYear = adDate.getFullYear() + 56;
  const bsMonth = bsMonths[adDate.getMonth()];
  const bsDay = adDate.getDate();

  return `${bsDay} ${bsMonth} ${bsYear}`;
};

export const convertToBS = (adDate: Date): { year: number; month: number; day: number; monthName: string } => {
  const bsMonths = [
    'Baisakh',
    'Jestha',
    'Ashadh',
    'Shrawan',
    'Bhadra',
    'Ashwin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra',
  ];

  const bsYear = adDate.getFullYear() + 56;
  const bsMonth = adDate.getMonth();
  const bsDay = adDate.getDate();

  return {
    year: bsYear,
    month: bsMonth + 1,
    day: bsDay,
    monthName: bsMonths[bsMonth],
  };
};

export const convertToBSString = (adDate: Date): string => {
  const bs = convertToBS(adDate);
  return `${bs.year}-${bs.month.toString().padStart(2, '0')}-${bs.day.toString().padStart(2, '0')}`;
};

export const convertToAD = (bsYear: number, bsMonth: number, bsDay: number): Date => {
  const adYear = bsYear - 56;
  const adMonth = bsMonth - 1;
  return new Date(adYear, adMonth, bsDay);
};

export const formatBSDate = (bsDateStr: string): string => {
  if (!bsDateStr) return '';
  const parts = bsDateStr.split('-');
  if (parts.length !== 3) return '';

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  const bsMonths = [
    'Baisakh',
    'Jestha',
    'Ashadh',
    'Shrawan',
    'Bhadra',
    'Ashwin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra',
  ];

  return `${day} ${bsMonths[month - 1]} ${year}`;
};

export const getCurrentBSDate = (): string => {
  const now = new Date();
  return convertToBSString(now);
};

export const formatDateWithBS = (dateStr: string): string => {
  const date = new Date(dateStr);
  const adFormatted = date.toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const bsFormatted = adToBS(date);
  return `${adFormatted} (${bsFormatted} BS)`;
};

export const amountToWords = (amount: number): string => {
  if (amount === 0) return 'Zero Rupees Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertGroup = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) result += ones[n] + ' ';
    return result;
  };

  const wholePart = Math.floor(amount);
  const paisaPart = Math.round((amount - wholePart) * 100);

  let result = '';
  const crore = Math.floor(wholePart / 10000000);
  const lakh = Math.floor((wholePart % 10000000) / 100000);
  const thousand = Math.floor((wholePart % 100000) / 1000);
  const remainder = wholePart % 1000;

  if (crore > 0) result += convertGroup(crore) + 'Crore ';
  if (lakh > 0) result += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) result += convertGroup(thousand) + 'Thousand ';
  if (remainder > 0) result += convertGroup(remainder);

  result += 'Rupees';

  if (paisaPart > 0) result += ' and ' + convertGroup(paisaPart) + 'Paisa';

  return result.trim() + ' Only';
};

export const getNepaliFinancialYear = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 7) {
    return `${year - 2000 + 56}/${(year - 2000 + 57).toString().slice(-2)}`;
  }

  return `${year - 2000 + 55}/${(year - 2000 + 56).toString().slice(-2)}`;
};

export const formatNPR = (amount: number): string => {
  if (amount >= 10000000) {
    return `NPR ${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `NPR ${(amount / 100000).toFixed(2)} L`;
  }

  return `NPR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const validatePAN = (pan: string): boolean => {
  return /^\d{9}$/.test(pan);
};

export const validatePhone = (phone: string): boolean => {
  return /^(98|97)\d{8}$/.test(phone.replace(/\s/g, ''));
};
