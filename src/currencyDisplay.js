export function getCurrencyDisplay(config = {}) {
  if (config.currencyDisplay) {
    return {
      prefix: config.currencyDisplay.prefix ?? "",
      suffix: config.currencyDisplay.suffix ?? "",
      compactUnitSuffix: config.currencyDisplay.compactUnitSuffix ?? "",
    };
  }

  if (!config.usesCountryCurrency || !config.currencyCode) {
    return {
      prefix: config.tooltipPrefix ?? "",
      suffix: config.suffix ?? "",
      compactUnitSuffix: "",
    };
  }

  if (config.currencyCode === "USD") {
    return {
      prefix: "$",
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
