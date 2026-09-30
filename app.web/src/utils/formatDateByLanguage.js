function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function isEnglishLanguage(language) {
  return String(language ?? "")
    .toLowerCase()
    .startsWith("en");
}

function readDateParts(value) {
  if (!value) return "";

  const normalized = String(value ?? "").trim();
  const isoMatch = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/u
  );

  if (isoMatch) {
    const isoValue = buildIsoDate({
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3],
      hour: isoMatch[4] ?? 0,
      minute: isoMatch[5] ?? 0,
      hasTime: Boolean(isoMatch[4]),
    });

    if (!isoValue) return "";

    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
      hour: Number(isoMatch[4] ?? 0),
      minute: Number(isoMatch[5] ?? 0),
      hasTime: Boolean(isoMatch[4]),
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    hasTime: true,
  };
}

export function formatDateByLanguage(value, language) {
  const dateParts = readDateParts(value);

  if (!dateParts) return "";

  const day = padDatePart(dateParts.day);
  const month = padDatePart(dateParts.month);
  const year = dateParts.year;
  const hours = padDatePart(dateParts.hour);
  const minutes = padDatePart(dateParts.minute);
  const datePart = isEnglishLanguage(language)
    ? `${month}/${day}/${year}`
    : `${day}/${month}/${year}`;

  return `${datePart} ${hours}:${minutes}`;
}

export function getDateInputPlaceholderByLanguage(language) {
  return isEnglishLanguage(language) ? "MM/DD/YYYY" : "DD/MM/AAAA";
}

export function getDateTimeInputPlaceholderByLanguage(language) {
  return `${getDateInputPlaceholderByLanguage(language)} HH:mm`;
}

function buildIsoDate({ year, month, day, hour = 0, minute = 0, hasTime = false }) {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const numericHour = Number(hour);
  const numericMinute = Number(minute);

  if (
    !Number.isInteger(numericYear) ||
    !Number.isInteger(numericMonth) ||
    !Number.isInteger(numericDay) ||
    numericYear < 1000 ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericDay < 1 ||
    numericDay > 31 ||
    numericHour < 0 ||
    numericHour > 23 ||
    numericMinute < 0 ||
    numericMinute > 59
  ) {
    return null;
  }

  const date = new Date(
    numericYear,
    numericMonth - 1,
    numericDay,
    numericHour,
    numericMinute,
    0,
    0
  );

  if (
    date.getFullYear() !== numericYear ||
    date.getMonth() !== numericMonth - 1 ||
    date.getDate() !== numericDay ||
    date.getHours() !== numericHour ||
    date.getMinutes() !== numericMinute
  ) {
    return null;
  }

  const datePart = [numericYear, padDatePart(numericMonth), padDatePart(numericDay)].join("-");

  if (!hasTime) {
    return datePart;
  }

  return `${datePart}T${padDatePart(numericHour)}:${padDatePart(numericMinute)}`;
}

function parseDateParts(value, language) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return { isValid: true, value: "" };
  }

  const isoMatch = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/u
  );

  if (isoMatch) {
    const isoValue = buildIsoDate({
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3],
      hour: isoMatch[4] ?? 0,
      minute: isoMatch[5] ?? 0,
      hasTime: Boolean(isoMatch[4]),
    });

    return { isValid: Boolean(isoValue), value: isoValue ?? "" };
  }

  const dateMatch = normalized.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/u
  );

  if (!dateMatch) {
    return { isValid: false, value: "" };
  }

  const isEnglish = isEnglishLanguage(language);
  const firstOrder = isEnglish
    ? { month: dateMatch[1], day: dateMatch[2] }
    : { day: dateMatch[1], month: dateMatch[2] };
  const fallbackOrder = isEnglish
    ? { day: dateMatch[1], month: dateMatch[2] }
    : { month: dateMatch[1], day: dateMatch[2] };

  const commonParts = {
    year: dateMatch[3],
    hour: dateMatch[4] ?? 0,
    minute: dateMatch[5] ?? 0,
    hasTime: Boolean(dateMatch[4]),
  };
  const firstIsoValue = buildIsoDate({ ...commonParts, ...firstOrder });

  if (firstIsoValue) {
    return { isValid: true, value: firstIsoValue };
  }

  const fallbackIsoValue = buildIsoDate({ ...commonParts, ...fallbackOrder });

  return { isValid: Boolean(fallbackIsoValue), value: fallbackIsoValue ?? "" };
}

export function parseDateFilterByLanguage(value, language) {
  return parseDateParts(value, language);
}

export function parseDateInputByLanguage(value, language) {
  const parsedDate = parseDateParts(value, language);

  if (!parsedDate.isValid || !parsedDate.value) return parsedDate;

  return { isValid: true, value: parsedDate.value.split("T")[0] };
}

export function parseDateTimeInputByLanguage(value, language) {
  const parsedDate = parseDateParts(value, language);

  if (!parsedDate.isValid || !parsedDate.value) return parsedDate;

  return {
    isValid: parsedDate.value.includes("T"),
    value: parsedDate.value.includes("T") ? parsedDate.value : "",
  };
}

export function formatDateFilterByLanguage(value, language) {
  const parsedDate = parseDateParts(value, language);

  if (!parsedDate.isValid || !parsedDate.value) {
    return String(value ?? "");
  }

  const [datePart] = parsedDate.value.split("T");
  const [year, month, day] = datePart.split("-");

  return isEnglishLanguage(language) ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export function formatDateInputByLanguage(value, language) {
  return formatDateFilterByLanguage(value, language);
}

export function formatDateTimeInputByLanguage(value, language) {
  const parsedDate = parseDateParts(value, language);

  if (!parsedDate.isValid || !parsedDate.value) {
    return String(value ?? "");
  }

  return formatDateByLanguage(parsedDate.value, language);
}
