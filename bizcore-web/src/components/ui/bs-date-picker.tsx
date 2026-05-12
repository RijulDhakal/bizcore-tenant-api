import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const convertToBS = (adDate: Date): { year: number; month: number; day: number; monthName: string } => {
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

const convertToBSString = (adDate: Date): string => {
  const bs = convertToBS(adDate);
  return `${bs.year}-${bs.month.toString().padStart(2, '0')}-${bs.day.toString().padStart(2, '0')}`;
};

const convertToAD = (bsYear: number, bsMonth: number, bsDay: number): Date => {
  const adYear = bsYear - 56;
  const adMonth = bsMonth - 1;
  return new Date(adYear, adMonth, bsDay);
};

const formatBSDate = (bsDateStr: string): string => {
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

interface BSDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const BSDatePicker = ({ value, onChange, placeholder, disabled }: BSDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bsYear, setBsYear] = useState(value ? convertToBS(value).year.toString() : '');
  const [bsMonth, setBsMonth] = useState(value ? convertToBS(value).month.toString() : '');
  const [bsDay, setBsDay] = useState(value ? convertToBS(value).day.toString() : '');

  const currentBS = value ? convertToBSString(value) : '';

  const handleSetDate = () => {
    if (bsYear && bsMonth && bsDay) {
      const year = parseInt(bsYear);
      const month = parseInt(bsMonth);
      const day = parseInt(bsDay);

      if (month >= 1 && month <= 12 && day >= 1 && day <= 32 && year >= 2000) {
        const adDate = convertToAD(year, month, day);
        onChange(adDate);
        setIsOpen(false);
      }
    }
  };

  const bsMonths = [
    { value: 1, label: 'Baisakh' },
    { value: 2, label: 'Jestha' },
    { value: 3, label: 'Ashadh' },
    { value: 4, label: 'Shrawan' },
    { value: 5, label: 'Bhadra' },
    { value: 6, label: 'Ashwin' },
    { value: 7, label: 'Kartik' },
    { value: 8, label: 'Mangsir' },
    { value: 9, label: 'Poush' },
    { value: 10, label: 'Magh' },
    { value: 11, label: 'Falgun' },
    { value: 12, label: 'Chaitra' },
  ];

  return (
    <div className="relative">
      <div
        className={`flex items-center border rounded-md px-3 py-2 cursor-pointer ${
          disabled ? 'bg-gray-100 opacity-50' : 'bg-white hover:border-gray-400'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
        <span className="flex-1 text-sm">
          {currentBS ? formatBSDate(currentBS) : placeholder || 'Select date (BS)'}
        </span>
        {value && (
          <span className="text-xs text-gray-400 ml-2">
            ({value.toLocaleDateString('en-GB')})
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 ml-2 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg p-3 w-72">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Year (BS)</label>
              <input
                type="number"
                placeholder="2082"
                value={bsYear}
                onChange={(e) => setBsYear(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Month</label>
              <select
                value={bsMonth}
                onChange={(e) => setBsMonth(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="">Month</option>
                {bsMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.value} - {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Day</label>
              <input
                type="number"
                placeholder="15"
                value={bsDay}
                onChange={(e) => setBsDay(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSetDate}
              className="flex-1 bg-blue-600 text-white rounded p-2 text-sm hover:bg-blue-700"
            >
              Set Date
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 border rounded p-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};