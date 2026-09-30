import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/app-shadcn";

export function ListViewModeToggle({ tableView, onChange, t }) {
  const label = tableView ? t("cardView") : t("tableView");

  return (
    <Button
      appearance="secondary"
      icon={tableView ? <LayoutGrid /> : <Table2 />}
      aria-label={label}
      onClick={() => onChange(!tableView)}
    >
      {label}
    </Button>
  );
}
