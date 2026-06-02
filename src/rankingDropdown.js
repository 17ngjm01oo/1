export function createRankingDropdown({
  menuClassName = "",
  toggleText,
  toggleAriaLabel,
  menuAriaLabel,
  options,
  initialValue,
  onChange,
}) {
  const control = document.createElement("details");
  control.className = "ranking-dropdown";

  const toggle = document.createElement("summary");
  toggle.className = "ranking-dropdown-toggle";
  toggle.textContent = toggleText(initialValue);
  toggle.setAttribute("aria-label", toggleAriaLabel);

  const menu = document.createElement("div");
  menu.className = `ranking-dropdown-menu${menuClassName ? ` ${menuClassName}` : ""}`;
  menu.setAttribute("role", "group");
  menu.setAttribute("aria-label", menuAriaLabel);

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "ranking-dropdown-option";
    button.type = "button";
    button.dataset.rankingOption = option.value;
    button.setAttribute("aria-pressed", String(option.value === initialValue));
    button.textContent = option.label;

    button.addEventListener("click", () => {
      menu.querySelectorAll("[data-ranking-option]").forEach((optionButton) => {
        optionButton.setAttribute("aria-pressed", String(optionButton === button));
      });
      toggle.textContent = toggleText(option.value);
      control.open = false;
      onChange?.(option.value);
    });

    menu.append(button);
  });

  control.append(toggle, menu);

  document.addEventListener("click", (event) => {
    if (!control.contains(event.target)) {
      control.open = false;
    }
  });

  control.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      control.open = false;
      toggle.focus();
    }
  });

  return control;
}
