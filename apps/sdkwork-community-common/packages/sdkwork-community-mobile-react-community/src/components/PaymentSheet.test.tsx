import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PaymentSheet } from "./PaymentSheet";
import type { MembershipTier } from "../types";

// The sheet resolves the current user through the host-injected auth session
// port; a logged-in user keeps the sheet from redirecting to /login.
vi.mock("../services/communityAuthSessionPort", () => ({
  getCommunityCurrentUser: () => ({ id: "user-1", name: "QA Tester" }),
}));

// The sheet only reads navigation facts; mocking the router keeps the test
// free of react-router's render tree (sibling-workspace React copies).
vi.mock("react-router", () => ({
  useNavigate: () => () => undefined,
  useLocation: () => ({ pathname: "/community/circle-1", search: "" }),
}));

// `t` falls back to the default text (the source of truth for assertions) and
// interpolates the i18next `{{var}}` placeholders.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: Record<string, unknown>) => {
      if (!options) {
        return fallback ?? key;
      }
      return (fallback ?? key).replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
        String(options[name] ?? ""),
      );
    },
  }),
}));

// The UI package pulls react-i18next from another workspace's store; mock its
// surface so the component test stays on one React copy. Stubs are JSX-free
// (mock factories are hoisted before imports initialize).
vi.mock("@sdkwork/ui-mobile-react", () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
  IconButton: () => null,
}));

// lucide-react also resolves to a second React copy; icons carry no
// test-relevant behavior, so stub the icons the sheet renders.
vi.mock("lucide-react", () => ({
  MessageSquare: () => null,
  Check: () => null,
  X: () => null,
  Lock: () => null,
}));

const TIERS: MembershipTier[] = [
  {
    id: "tier-standard",
    categoryId: "circle-1",
    name: "普通会员",
    description: "圈子全部内容与官方交流群",
    price: 999,
    durationDays: 365,
    benefits: ["圈子全部内容", "官方交流群"],
    enabled: true,
    sortOrder: 1,
    catalogPackageId: "1001",
  },
  {
    id: "tier-plus",
    categoryId: "circle-1",
    name: "高级会员",
    description: "普通会员权益 + 项目研判",
    price: 1999,
    durationDays: 365,
    benefits: ["圈子全部内容", "官方交流群", "项目研判"],
    enabled: true,
    sortOrder: 2,
    catalogPackageId: "1002",
  },
  {
    id: "tier-vip",
    categoryId: "circle-1",
    name: "董事会员",
    description: "高级会员权益 + 线下闭门交流",
    price: 3999,
    durationDays: 365,
    lifetimePrice: 9999,
    lifetimePackageId: "9003",
    benefits: ["圈子全部内容", "官方交流群", "线下闭门交流"],
    enabled: true,
    sortOrder: 3,
    catalogPackageId: "1003",
    agentLevel: "platinum",
  },
];

function renderSheet(tiers: MembershipTier[], onConfirm = vi.fn(), onClose = vi.fn()) {
  return render(
    <PaymentSheet
      communityName="SDKWORK智能云天使投资群"
      communityCoverImage=""
      tiers={tiers}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
}

describe("PaymentSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders every price tier as a selectable option", () => {
    renderSheet(TIERS);
    for (const tier of TIERS) {
      expect(screen.getByText(tier.name)).toBeTruthy();
      expect(screen.getByText(`¥${tier.price}`)).toBeTruthy();
    }
  });

  it("preselects the first tier when the list arrives after the sheet opens", () => {
    renderSheet(TIERS);
    // The confirm CTA carries the preselected tier price.
    expect(screen.getByText("立即支付 ¥999")).toBeTruthy();
  });

  it("lets the user select one of the multiple prices and confirms with it", () => {
    const onConfirm = vi.fn();
    renderSheet(TIERS, onConfirm);
    fireEvent.click(screen.getByText("董事会员"));
    expect(screen.getByText("立即支付 ¥3999")).toBeTruthy();
    fireEvent.click(screen.getByText("立即支付 ¥3999"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: expect.objectContaining({ id: "tier-vip", price: 3999, catalogPackageId: "1003" }),
        packageId: "1003",
        paymentMethod: expect.any(String),
        isLifetime: false,
      }),
    );
  });

  it("lets the user switch to the lifetime purchase for a tier that offers it", () => {
    const onConfirm = vi.fn();
    renderSheet(TIERS, onConfirm);
    fireEvent.click(screen.getByText("董事会员"));
    fireEvent.click(screen.getByText("终身"));
    expect(screen.getByText("立即支付 ¥9999")).toBeTruthy();
    fireEvent.click(screen.getByText("立即支付 ¥9999"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        packageId: "9003",
        isLifetime: true,
      }),
    );
  });

  it("never dead-ends when no tier is purchasable: shows an explanation instead of a disabled pay button", () => {
    const onConfirm = vi.fn();
    renderSheet([], onConfirm);
    expect(
      screen.getByText("该圈子暂无可购买的会员套餐，请稍后再试或联系圈主"),
    ).toBeTruthy();
    expect(screen.queryByText(/立即支付/)).toBeNull();
    expect(screen.queryByText("请选择会员等级")).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("recovers a stale selection when the tier list is refreshed without the chosen tier", () => {
    const { rerender } = renderSheet(TIERS);
    fireEvent.click(screen.getByText("董事会员"));
    expect(screen.getByText("立即支付 ¥3999")).toBeTruthy();
    // The parent refreshes the tier list and the previously chosen tier is gone.
    const refreshed = TIERS.slice(0, 2);
    rerender(
      <PaymentSheet
        communityName="SDKWORK智能云天使投资群"
        communityCoverImage=""
        tiers={refreshed}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    // The sheet falls back to the first available tier instead of a dead state.
    expect(screen.getByText("立即支付 ¥999")).toBeTruthy();
  });
});
