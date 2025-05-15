
import React, { useEffect, useState } from 'react';
import { format, differenceInYears } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DateOfBirthPickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  isOver18: boolean;
  dateSelected: boolean;
}

const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  date,
  setDate,
  isOver18,
  dateSelected
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 25);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  // Generate year options for the dropdown (from current year - 100 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  
  // Month names for the dropdown
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Update actual date when year or month changes
  useEffect(() => {
    if (selectedYear && selectedMonth !== undefined) {
      // Set to the 1st day of the month initially
      const newDate = new Date(selectedYear, selectedMonth, 1);
      setDate(newDate);
    }
  }, [selectedYear, selectedMonth, setDate]);

  return (
    <div className="space-y-2">
      <label htmlFor="date-of-birth" className="block text-sm font-medium">Date of Birth</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {date && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-2",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select day</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              month={new Date(selectedYear, selectedMonth)}
              onSelect={setDate}
              disabled={(date) => {
                // Disable future dates and dates that don't match the selected year/month
                return (
                  date > new Date() || 
                  date.getFullYear() !== selectedYear || 
                  date.getMonth() !== selectedMonth
                );
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}
      
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

export default DateOfBirthPicker;
