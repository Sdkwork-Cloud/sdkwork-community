import { OrderService } from "@sdkwork/order-mobile-react-orders";

/**
 * Host-injectable circle membership order runtime.
 *
 * Circle membership orders MUST flow through sdkwork-order: the host injects
 * `createMembershipOrder` (backed by the order App SDK
 * `memberships.orders.create`). Payment execution and payment-status polling
 * reuse the official `OrderService` from `@sdkwork/order-mobile-react-orders`
 * (which is configured by the host through `configureOrderMobileRuntime`).
 */

export interface CreateCircleMembershipOrderOptions {
  /** membership_package external id resolved from the tier. */
  packageId: string;
  paymentMethod: string;
  /** Purchase source tag for order attribution. */
  source?: string;
}

export interface CircleMembershipOrder {
  orderId: string;
  orderNo: string;
  amount: string;
  cashierUrl: string;
}

export interface CommunityOrderRuntime {
  createMembershipOrder(options: CreateCircleMembershipOrderOptions): Promise<CircleMembershipOrder>;
}

let orderRuntime: CommunityOrderRuntime | null = null;

export function configureCommunityOrderRuntime(nextRuntime: CommunityOrderRuntime): void {
  orderRuntime = nextRuntime;
}

export function resetCommunityOrderRuntime(): void {
  orderRuntime = null;
}

export function getCommunityOrderRuntime(): CommunityOrderRuntime {
  if (!orderRuntime) {
    throw new CommunityOrderUnavailableError();
  }
  return orderRuntime;
}

export class CommunityOrderUnavailableError extends Error {
  constructor() {
    super(
      "Circle membership orders are unavailable because the Order capability is not composed by the host.",
    );
    this.name = "CommunityOrderUnavailableError";
  }
}

/** Payment-status polling helper for the cashier bridge (3s interval). */
export const CIRCLE_CASHIER_POLL_INTERVAL_MS = 3000;

export async function isCircleMembershipOrderPaid(orderId: string): Promise<boolean> {
  const status = await OrderService.getPaymentStatus(orderId);
  return status.paid;
}
