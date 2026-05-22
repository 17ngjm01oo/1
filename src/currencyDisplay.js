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
  TWD: "NT$",
  SGD: "S$",
  HKD: "HK$",
  BRL: "R$",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  GBP: "£",
  EGP: "E£",
  INR: "₹",
  KRW: "₩",
  KPW: "₩",
  RUB: "₽",
  TRY: "₺",
  IDR: "Rp",
  SEK: "kr ",
  NOK: "kr ",
  DKK: "kr ",
  ISK: "kr ",
  ILS: "₪",
  THB: "฿",
  VND: "₫",
  PHP: "₱",
  BDT: "৳",
  ZAR: "R",
  NGN: "₦",
  KZT: "₸",
  UAH: "₴",
  AOA: "Kz ",
  ETB: "Br ",
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
