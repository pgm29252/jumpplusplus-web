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

  const monthStart = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1);

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

  const canGoPrev = monthStart(currentDate) > monthStart(minDate);
  const canGoNext = maxDate
    ? monthStart(currentDate) < monthStart(maxDate)
    : true;

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
    <div className="min-h-140 rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-sm font-semibold text-emerald-800 sm:text-base">
          {monthName}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            disabled={!canGoNext}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white/80 text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
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
              className={`relative flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium transition-all lg:h-16
                ${
                  selected
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-105"
                    : disabled
                      ? "cursor-not-allowed text-gray-300"
                      : today
                        ? "bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100"
                        : "text-gray-900 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
            >
              {day}
              {today && !selected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
