import React, { useEffect, useState } from 'react';
import { parse, format, isValid, differenceInYears } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DateOfBirthInputProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  isOver18: boolean;
  dateSelected: boolean;
}

const DateOfBirthInput: React.FC<DateOfBirthInputProps> = ({
  date,
  setDate,
  isOver18,
  dateSelected,
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (date) {
      setValue(format(date, 'MM/dd/yyyy'));
    }
  }, [date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    const parsed = parse(val, 'MM/dd/yyyy', new Date());
    if (isValid(parsed) && differenceInYears(new Date(), parsed) >= 0 && parsed <= new Date()) {
      setDate(parsed);
    } else {
      setDate(undefined);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="dob" className="block text-sm font-medium">Date of Birth</label>
      <Input
        id="dob"
        type="text"
        placeholder="MM/DD/YYYY"
        value={value}
        onChange={handleChange}
        pattern="^(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/[0-9]{4}$"
      />
      {dateSelected && !isOver18 && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            You must be over 18 years old to create an account. If you're under 18, please ask a parent or guardian to sign up first — they can create a child account for you.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DateOfBirthInput;
