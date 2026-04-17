import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DocsLayout from "@/components/docs/DocsLayout";

const ConnectXero = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/integrations", { replace: true });
  }, [navigate]);

  return (
    <DocsLayout title="Integrations" description="Connect your PMS and accounting software.">
      <p className="text-vesta-navy/70">Redirecting to Integrations…</p>
    </DocsLayout>
  );
};

export default ConnectXero;
