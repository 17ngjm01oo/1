const currencySymbols = {
  "INT$": "$",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  KRW: "₩",
  RUB: "₽",
  BRL: "R$",
  TRY: "₺",
  IDR: "Rp",
};

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
