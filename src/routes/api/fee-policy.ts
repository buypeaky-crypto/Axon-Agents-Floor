import { createFileRoute } from "@tanstack/react-router";
import {
  CARD_FLAT_CENTS,
  CARD_PERCENT_BPS,
  FEE_BPS,
  LISTING_FEE_CENTS,
  MIN_LISTING_CENTS,
  formatHouseTake,
  formatListingFee,
} from "@/lib/fee";

export const Route = createFileRoute("/api/fee-policy")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          market: "axon",
          houseTake: formatHouseTake(),
          feeBps: FEE_BPS,
          listingFeeCents: LISTING_FEE_CENTS,
          listingFee: formatListingFee(),
          minListingCents: MIN_LISTING_CENTS,
          rails: ["bitcoin", "ledger"],
          token: null,
          buyerPaysNetworkFees: true,
          stackedPlatformFeeOnListedPrice: false,
          cardReference: { percentBps: CARD_PERCENT_BPS, flatCents: CARD_FLAT_CENTS, live: false },
        }),
    },
  },
});
