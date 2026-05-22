const currencySymbols = {
  "Int$": "$",
  USD: "$",
  CAD: "$",
  AUD: "$",
  NZD: "$",
  MXN: "$",
  ARS: "$",
  COP: "$",
  CLP: "$",
  DOP: "$",
  BRL: "R$",
  NIO: "C$",
  EUR: "€",
  GBP: "£",
  SEK: "kr ",
  NOK: "kr ",
  DKK: "kr ",
  ISK: "kr ",
  RUB: "₽",
  TWD: "$",
  JPY: "¥",
  CNY: "¥",
  HKD: "$",
  MOP: "$",
  KRW: "₩",
  KPW: "₩",
  MNT: "₮",
  PHP: "₱",
  VND: "₫",
  KHR: "៛",
  LAK: "₭",
  THB: "฿",
  SGD: "$",
  BND: "$",
  MYR: "RM",
  IDR: "Rp",
  INR: "₹",
  BDT: "৳",
  EGP: "E£",
  TRY: "₺",
  ILS: "₪",
  ZAR: "R",
  NGN: "₦",
  KZT: "₸",
  UAH: "₴",
  AOA: "Kz ",
  ETB: "Br ",
  GHS: "₵",
  CRC: "₡",
}

export function getCurrencyDisplay(config = {}) {
  if (config.currencyDisplay) {
    return {
      prefix: config.currencyDisplay.prefix ?? "",
      suffix: config.currencyDisplay.suffix ?? "",
      compactUnitSuffix: config.currencyDisplay.compactUnitSuffix ?? "",
    };
  }

  if (!config.currencyCode) {
    return {
      prefix: config.tooltipPrefix ?? "",
      suffix: config.suffix ?? "",
      compactUnitSuffix: "",
    };
  }

  const currencySymbol = currencySymbols[config.currencyCode];

  if (currencySymbol) {
    return {
      prefix: currencySymbol,
      suffix: "",
      compactUnitSuffix: "",
    };
  }

  return {
    prefix: "",
    suffix: config.currencyCode,
    compactUnitSuffix: ` ${config.currencyCode}`,
  };
}
