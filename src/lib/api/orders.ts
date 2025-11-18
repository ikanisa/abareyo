import type { QueryClient } from "@tanstack/react-query";

import { shopData, type Order, type OrderStatus } from "@/app/_data/shop_v2";

export type OrdersResponse = {
  viewer: typeof shopData.viewer;
  orders: Order[];
};

export type AdvanceOrderInput = {
  orderId: string;
};

export const ORDERS_QUERY_KEY = ["shop", "orders"] as const;

const statusOrder: OrderStatus[] = ["ordered", "paid", "ready", "pickedup"];

const withSimulatedDelay = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });

export const fetchOrders = async (): Promise<OrdersResponse> => {
  await withSimulatedDelay(200);
  return { viewer: shopData.viewer, orders: shopData.orders };
};

const getNextStatus = (current: OrderStatus): OrderStatus => {
  const currentIndex = statusOrder.indexOf(current);
  const nextIndex = Math.min(statusOrder.length - 1, currentIndex + 1);
  return statusOrder[nextIndex] ?? current;
};

export const advanceOrderStatus = async ({ orderId }: AdvanceOrderInput) => {
  await withSimulatedDelay(350);
  return { orderId };
};

export const applyOptimisticOrderStatus = (
  data: OrdersResponse | undefined,
  orderId: string,
): OrdersResponse | undefined => {
  if (!data) {
    return data;
  }

  const orders = data.orders.map((order) =>
    order.id === orderId ? { ...order, status: getNextStatus(order.status) } : order,
  );

  return { ...data, orders };
};

export const refreshOrders = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });

export const getOrderProgressLabel = (status: OrderStatus) => {
  const next = getNextStatus(status);
  if (next === status) {
    return "Awaiting pickup";
  }
  return `Move to ${next}`;
};
