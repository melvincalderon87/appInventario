import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";
import { DateTime } from "luxon";
import { Input } from "@/components/ui/app-shadcn";
import {
  formatDateInputByLanguage,
  formatDateTimeInputByLanguage,
  getDateInputPlaceholderByLanguage,
  getDateTimeInputPlaceholderByLanguage,
  parseDateInputByLanguage,
  parseDateTimeInputByLanguage,
} from "../../utils/formatDateByLanguage";

function formatValue(value, language, includeTime) {
  return includeTime
    ? formatDateTimeInputByLanguage(value, language)
    : formatDateInputByLanguage(value, language);
}

function parseValue(value, language, includeTime) {
  return includeTime
    ? parseDateTimeInputByLanguage(value, language)
    : parseDateInputByLanguage(value, language);
}

function getPlaceholder(language, includeTime) {
  return includeTime
    ? getDateTimeInputPlaceholderByLanguage(language)
    : getDateInputPlaceholderByLanguage(language);
}

function LocalizedDateBase({
  value,
  onChange,
  onBlur,
  includeTime = false,
  placeholder,
  min,
  max,
  disabled,
  ...props
}) {
  const { i18n } = useTranslation();
  const locale = String(i18n.language).toLowerCase().startsWith("en") ? "en-US" : "es-GT";
  const [displayValue, setDisplayValue] = useState(() =>
    formatValue(value, i18n.language, includeTime)
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarContainerRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    DateTime.fromISO(String(value ?? "").slice(0, 10), { locale }).isValid
      ? DateTime.fromISO(String(value ?? "").slice(0, 10), { locale }).startOf("month")
      : DateTime.now().setLocale(locale).startOf("month")
  );
  const lastEmittedValueRef = useRef(undefined);
  const lastLanguageRef = useRef(i18n.language);

  useEffect(() => {
    const externalValue = String(value ?? "");
    const languageChanged = lastLanguageRef.current !== i18n.language;
    lastLanguageRef.current = i18n.language;

    if (!languageChanged && externalValue === lastEmittedValueRef.current) {
      return;
    }

    const nextDisplayValue = formatValue(value, i18n.language, includeTime);
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setDisplayValue(nextDisplayValue);
      lastEmittedValueRef.current = undefined;
    });

    return () => {
      cancelled = true;
    };
  }, [value, i18n.language, includeTime]);

  useEffect(() => {
    const selected = DateTime.fromISO(String(value ?? "").slice(0, 10), { locale });
    if (selected.isValid) setCalendarMonth(selected.startOf("month"));
  }, [value, locale]);

  useEffect(() => {
    if (!calendarOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!calendarContainerRef.current?.contains(event.target)) setCalendarOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setCalendarOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [calendarOpen]);

  const handleChange = (event, data) => {
    const nextDisplayValue = data.value;
    const parsedValue = parseValue(nextDisplayValue, i18n.language, includeTime);
    const nextValue = parsedValue.isValid ? parsedValue.value : "";

    setDisplayValue(nextDisplayValue);
    lastEmittedValueRef.current = nextValue;
    onChange?.(event, { value: nextValue });
  };

  const handleBlur = (event) => {
    const parsedValue = parseValue(displayValue, i18n.language, includeTime);

    if (parsedValue.isValid) {
      setDisplayValue(formatValue(parsedValue.value, i18n.language, includeTime));
    }

    onBlur?.(event);
  };

  const selectCalendarDate = (date) => {
    const nextValue = date.toISODate();
    setDisplayValue(formatValue(nextValue, i18n.language, includeTime));
    lastEmittedValueRef.current = nextValue;
    onChange?.({ target: { value: nextValue } }, { value: nextValue });
    setCalendarOpen(false);
  };

  const month = calendarMonth.setLocale(locale).startOf("month");
  const weekStart = month.minus({ days: month.weekday % 7 });
  const selectedIso = String(value ?? "").slice(0, 10);
  const minIso = String(min ?? "").slice(0, 10);
  const maxIso = String(max ?? "").slice(0, 10);
  const monthName = month
    .toFormat("LLLL yyyy")
    .replace(/^./u, (letter) => letter.toLocaleUpperCase(locale));
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    weekStart.plus({ days: index }).toFormat("ccc").replace(".", "")
  );

  return (
    <span
      ref={calendarContainerRef}
      style={{
        display: "inline-flex",
        width: "100%",
        gap: 4,
        alignItems: "center",
        position: "relative",
      }}
    >
      <Input
        {...props}
        disabled={disabled}
        type="text"
        inputMode="numeric"
        placeholder={placeholder ?? getPlaceholder(i18n.language, includeTime)}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {!includeTime ? (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setCalendarOpen((open) => !open)}
            aria-label={locale.startsWith("en") ? "Open calendar" : "Abrir calendario"}
            title={locale.startsWith("en") ? "Calendar" : "Calendario"}
            style={{
              border: "1px solid var(--app-card-border)",
              background: "var(--app-card-bg)",
              color: "inherit",
              borderRadius: 4,
              width: 34,
              height: 32,
              display: "grid",
              placeItems: "center",
              cursor: disabled ? "default" : "pointer",
            }}
          >
            <CalendarClock size={17} />
          </button>
          {calendarOpen ? (
            <span
              role="dialog"
              aria-label={locale.startsWith("en") ? "Calendar" : "Calendario"}
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                zIndex: 1000,
                width: 280,
                padding: 10,
                background: "var(--app-card-bg, #fff)",
                border: "1px solid var(--app-card-border, #ccd6df)",
                borderRadius: 6,
                boxShadow: "0 6px 18px rgba(0,0,0,.18)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setCalendarMonth((current) => current.minus({ months: 1 }))}
                  aria-label={locale.startsWith("en") ? "Previous month" : "Mes anterior"}
                >
                  ‹
                </button>
                <strong>{monthName}</strong>
                <button
                  type="button"
                  onClick={() => setCalendarMonth((current) => current.plus({ months: 1 }))}
                  aria-label={locale.startsWith("en") ? "Next month" : "Mes siguiente"}
                >
                  ›
                </button>
              </span>
              <span
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 2,
                  textAlign: "center",
                }}
              >
                {weekdays.map((day, index) => (
                  <strong key={`${day}-${index}`} style={{ fontSize: 12, padding: 3 }}>
                    {day}
                  </strong>
                ))}
                {Array.from({ length: 42 }, (_, index) => {
                  const date = weekStart.plus({ days: index });
                  const iso = date.toISODate();
                  const allowed = (!minIso || iso >= minIso) && (!maxIso || iso <= maxIso);
                  const selected = iso === selectedIso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!allowed}
                      onClick={() => selectCalendarDate(date)}
                      style={{
                        height: 30,
                        border: selected ? "1px solid #0f6cbd" : "1px solid transparent",
                        borderRadius: 3,
                        background: selected
                          ? "#0f6cbd"
                          : date.month === month.month
                            ? "transparent"
                            : "rgba(0,0,0,.05)",
                        color: selected ? "#fff" : "inherit",
                        opacity: allowed ? 1 : 0.35,
                        cursor: allowed ? "pointer" : "default",
                      }}
                    >
                      {date.day}
                    </button>
                  );
                })}
              </span>
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}

export function LocalizedDateInput(props) {
  return <LocalizedDateBase {...props} />;
}

export function LocalizedDateTimeInput(props) {
  return <LocalizedDateBase {...props} includeTime />;
}
