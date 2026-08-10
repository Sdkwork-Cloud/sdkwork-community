import { describe, expect, it } from "vitest";
import { CommunityH5Routes } from "@sdkwork/community-h5-community";
import { communityRouteDefinitions } from "./communityRoutes";

describe("community h5 route catalog", () => {
  it("exposes every community route path as a route definition", () => {
    const paths = communityRouteDefinitions.map((route) => route.path);
    const expected = Object.values(CommunityH5Routes);

    for (const path of expected) {
      expect(paths).toContain(path);
    }
  });

  it("keeps the consuming application route paths stable", () => {
    const paths = communityRouteDefinitions.map((route) => route.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/community",
        "/community/create",
        "/community/mine",
        "/community/:id",
        "/community/:id/profile",
        "/community/:id/profile/groups",
        "/community/:id/profile/groups/edit/:groupId",
        "/community/:id/profile/edit",
        "/community/:id/profile/image",
        "/community/:id/profile/tabs",
        "/community/:id/profile/members",
        "/community/:id/profile/qrcode",
        "/community/:id/post",
        "/community/:id/groups/create",
        "/community/:id/group/:groupId",
        "/login",
      ]),
    );
  });
});
