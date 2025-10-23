export function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseBoolean(value) {
  return value === "true" || value === true;
}

export function normalizeTelefono(telefono) {
  return telefono.startsWith("0") ? telefono.slice(1) : telefono;
}

export function normalizeTelefonoWhatsApp(telefono) {
  let t = telefono.replace(/\D/g, "");
  if (t.startsWith("0")) t = t.slice(1);
  if (!t.startsWith("9")) t = "9" + t;
  return `+54${t}`;
}
