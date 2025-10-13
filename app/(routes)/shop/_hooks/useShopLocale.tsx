"use client";

type ShopLocaleStrings = {
  buy: string;
  addToCart: string;
  payViaUSSD: string;
  size: string;
  color: string;
  filters: string;
  sort: string;
  details: string;
  returns: string;
  official: string;
  new: string;
  sale: string;
  limited: string;
  price: string;
  outOfStock: string;
  total: string;
  cartEmpty: string;
};

const EN_STRINGS: ShopLocaleStrings = {
  buy: 'Buy',
  addToCart: 'Add to cart',
  payViaUSSD: 'Pay via USSD',
  size: 'Size',
  color: 'Color',
  filters: 'Filters',
  sort: 'Sort',
  details: 'Details',
  returns: 'Returns',
  official: 'Official',
  new: 'New',
  sale: 'Sale',
  limited: 'Limited',
  price: 'Price',
  outOfStock: 'Out of stock',
  total: 'Total',
  cartEmpty: 'Your cart is empty',
};

export default function useShopLocale() {
  return EN_STRINGS;
}
