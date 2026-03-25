"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  selectedDate?: Date | null;
}

export default function Calendar({
  onSelectDate,
  minDate = new Date(),
  maxDate,
  selectedDate,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const handleDayClick = (day: number) => {
    const selected = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    onSelectDate(selected);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const isDisabled = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    if (date < startOfDay(minDate)) return true;
    if (maxDate && date > startOfDay(maxDate)) return true;
    return false;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === currentDate.getFullYear() &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === currentDate.getFullYear() &&
      now.getMonth() === currentDate.getMonth() &&
      now.getDate() === day
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{monthName}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const today = isToday(day);
          return (
            <button
              key={day}
              onClick={() => !disabled && handleDayClick(day)}
              disabled={disabled}
              className={`relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all
                ${
                  selected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
                    : disabled
                      ? "cursor-not-allowed text-gray-300"
                      : today
                        ? "bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100"
                        : "text-gray-900 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
            >
              {day}
              {today && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
