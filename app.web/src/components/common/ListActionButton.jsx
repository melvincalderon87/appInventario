import { Button, Tooltip } from "@/components/ui/app-shadcn";
import {
  Plus,
  ArrowLeft,
  Ban,
  CalendarClock,
  Download,
  Trash2,
  FileText,
  LogIn,
  LogOut,
  Pencil,
  UserX,
  UserCog,
  ShieldUser,
  Settings,
  Upload,
  RotateCcw,
  Send,
  Calculator,
} from "lucide-react";

const ACTION_CONFIG = {
  agregar: {
    appearance: "primary",
    icon: Plus,
  },
  ingreso: {
    appearance: "primary",
    icon: LogIn,
  },
  salida: {
    appearance: "secondary",
    icon: LogOut,
  },
  visualizar: {
    appearance: "outline",
    icon: FileText,
  },
  descargar: {
    appearance: "outline",
    icon: Download,
  },
  cargar: {
    appearance: "secondary",
    icon: Upload,
  },
  programar: {
    appearance: "secondary",
    icon: CalendarClock,
  },
  enviar: {
    appearance: "primary",
    icon: Send,
  },
  calcular: {
    appearance: "secondary",
    icon: Calculator,
  },
  reintentar: {
    appearance: "secondary",
    icon: RotateCcw,
  },
  cancelar: {
    appearance: "outline",
    icon: Ban,
  },
  editar: {
    appearance: "secondary",
    icon: Pencil,
  },
  eliminar: {
    appearance: "outline",
    icon: Trash2,
  },
  cambiarPassword: {
    appearance: "outline",
    icon: ShieldUser,
  },
  log: {
    appearance: "outline",
    icon: UserX,
  },
  agregarPermiso: {
    appearance: "primary",
    icon: ShieldUser,
  },
  configuracion: {
    appearance: "outline",
    icon: Settings,
  },
  preferencia: {
    appearance: "outline",
    icon: UserCog,
  },
  regresar: {
    appearance: "subtle",
    icon: ArrowLeft,
  },
};

export function ListActionButton({
  action,
  label,
  onClick,
  text,
  icon,
  disabled = false,
  type = "button",
}) {
  const config = ACTION_CONFIG[action] ?? ACTION_CONFIG.visualizar;
  const Icon = config.icon;

  const button = (
    <Button
      type={type}
      size="small"
      appearance={config.appearance}
      icon={icon ?? <Icon />}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      {text ?? null}
    </Button>
  );

  return text ? (
    button
  ) : (
    <Tooltip content={label} relationship="label">
      {button}
    </Tooltip>
  );
}
