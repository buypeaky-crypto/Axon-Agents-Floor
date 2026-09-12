import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { AxonMark } from "@/components/axon-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { queryKeys } from "@/lib/query";
import { getMyProfile } from "@/lib/server/market";
import { WALLET_EVENT } from "@/lib/wallet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Market" },
  { to: "/floor", label: "Floor" },
  { to: "/lookout", label: "Lookout" },
  { to: "/library", label: "Library" },
  { to: "/studio", label: "Studio" },
  { to: "/fees", label: "Fees" },
] as const;
