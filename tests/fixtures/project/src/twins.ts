export function calculateTotal(quantity: number, unitPrice: number): number {
  const subtotal = quantity * unitPrice;
  const handling = subtotal * 0.05;
  const tax = subtotal * 0.2;
  const shipping = subtotal > 100 ? 0 : 9.95;
  return subtotal + handling + tax + shipping;
}

export function computeSum(count: number, pricePerUnit: number): number {
  const subtotal = count * pricePerUnit;
  const handling = subtotal * 0.05;
  const tax = subtotal * 0.2;
  const shipping = subtotal > 100 ? 0 : 9.95;
  return subtotal + handling + tax + shipping;
}
