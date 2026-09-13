import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/btc_/$id")({
  component: BtcRedirect,
});

function BtcRedirect() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/pay/$id", params: { id }, replace: true });
  }, [id, navigate]);
  return null;
}
