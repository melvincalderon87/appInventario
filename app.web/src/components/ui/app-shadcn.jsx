/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import {
  Checkbox as CheckboxPrimitive,
  Dialog as DialogPrimitive,
  Popover as PopoverPrimitive,
  Select as SelectPrimitive,
  Switch as SwitchPrimitive,
  Tooltip as TooltipPrimitive,
} from "radix-ui";
import { Check, ChevronDown, ChevronRight, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const UNIT_LESS_CSS_PROPERTIES = new Set([
  "animationIterationCount",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "fontWeight",
  "gridArea",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
]);

let styleCounter = 0;
const insertedStyleIds = new Set();

function toKebabCase(property) {
  if (property.startsWith("--")) return property;

  return property.replace(/^ms/u, "-ms").replace(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`);
}

function formatCssValue(property, value) {
  if (value == null) return "";
  if (typeof value === "number" && value !== 0 && !UNIT_LESS_CSS_PROPERTIES.has(property)) {
    return `${value}px`;
  }

  return String(value);
}

function appendRule(css, selector, declarations) {
  const body = Object.entries(declarations)
    .filter(([, value]) => value != null)
    .map(([property, value]) => `${toKebabCase(property)}:${formatCssValue(property, value)};`)
    .join("");

  if (!body) return css;

  return `${css}${selector}{${body}}\n`;
}

function serializeStyle(selector, style) {
  const declarations = {};
  let css = "";

  for (const [property, value] of Object.entries(style ?? {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (property.startsWith("@")) {
        css += `${property}{${serializeStyle(selector, value)}}\n`;
        continue;
      }

      const nestedSelector = property.startsWith("&")
        ? property.replaceAll("&", selector)
        : property.startsWith(":")
          ? `${selector}${property}`
          : `${selector} ${property}`;

      css += serializeStyle(nestedSelector, value);
      continue;
    }

    declarations[property] = value;
  }

  return appendRule(css, selector, declarations);
}

function ensureStyleInserted(styleId, css) {
  if (typeof document === "undefined" || insertedStyleIds.has(styleId)) return;

  const style = document.createElement("style");
  style.dataset.appUi = styleId;
  style.textContent = css;
  document.head.appendChild(style);
  insertedStyleIds.add(styleId);
}

export function makeStyles(styles) {
  const styleId = `app-ui-ms-${styleCounter++}`;
  const classes = {};
  let css = "";

  for (const key of Object.keys(styles ?? {})) {
    const className = `${styleId}-${key}`;
    classes[key] = className;
    css += serializeStyle(`.${className}`, styles[key]);
  }

  return function useAppStyles() {
    ensureStyleInserted(styleId, css);
    return classes;
  };
}

export const treeItemLayoutClassNames = {
  expandIcon: "app-ui-tree-expand-icon",
};

function cleanStyle(style) {
  if (!style || typeof style !== "object") return style;

  return Object.fromEntries(
    Object.entries(style).filter(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) return false;
      return !key.startsWith("&") && !key.startsWith(":") && !key.startsWith("@");
    })
  );
}

function pickText(children) {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(pickText).join("");
  if (React.isValidElement(children)) return pickText(children.props.children);
  return "";
}

export function ThemeProvider({ children }) {
  return children;
}

export const Button = React.forwardRef(function Button(
  {
    appearance = "secondary",
    size,
    icon,
    iconPosition = "before",
    className,
    children,
    style,
    type = "button",
    ...props
  },
  ref
) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <button
      ref={ref}
      type={type}
      data-appearance={appearance}
      data-size={size}
      data-icon-only={!hasChildren || undefined}
      className={cn("app-ui-button", className)}
      style={cleanStyle(style)}
      {...props}
    >
      {icon && iconPosition !== "after" ? <span className="app-ui-button-icon">{icon}</span> : null}
      {hasChildren ? <span className="app-ui-button-label">{children}</span> : null}
      {icon && iconPosition === "after" ? <span className="app-ui-button-icon">{icon}</span> : null}
    </button>
  );
});

export const Input = React.forwardRef(function Input(
  { contentBefore, className, style, onChange, ...props },
  ref
) {
  const handleChange = (event) => {
    onChange?.(event, { value: event.target.value });
  };

  if (!contentBefore) {
    return (
      <input
        ref={ref}
        className={cn("app-ui-input", className)}
        style={cleanStyle(style)}
        onChange={handleChange}
        {...props}
      />
    );
  }

  return (
    <span className={cn("app-ui-input-shell", className)} style={cleanStyle(style)}>
      <span className="app-ui-input-addon" aria-hidden="true">
        {contentBefore}
      </span>
      <input
        ref={ref}
        className="app-ui-input app-ui-input-with-addon"
        onChange={handleChange}
        {...props}
      />
    </span>
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { className, style, onChange, ...props },
  ref
) {
  const handleChange = (event) => {
    onChange?.(event, { value: event.target.value });
  };

  return (
    <textarea
      ref={ref}
      className={cn("app-ui-textarea", className)}
      style={cleanStyle(style)}
      onChange={handleChange}
      {...props}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { className, style, onChange, children, size, ...props },
  ref
) {
  const handleChange = (event) => {
    onChange?.(event, { value: event.target.value });
  };

  return (
    <select
      ref={ref}
      data-size={size}
      className={cn("app-ui-select", className)}
      style={cleanStyle(style)}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  );
});

export function Option({ children, text, value, disabled }) {
  const label = text ?? pickText(children);

  return (
    <SelectPrimitive.Item
      className="app-ui-combobox-item"
      value={String(value ?? label)}
      textValue={String(label)}
      disabled={disabled}
    >
      <SelectPrimitive.ItemIndicator className="app-ui-combobox-indicator">
        <Check size={14} />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children ?? label}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function Combobox({
  children,
  className,
  style,
  value,
  selectedOptions = [],
  disabled,
  onOptionSelect,
  onChange,
  positioning,
  ...props
}) {
  const selectedValue = selectedOptions[0] ? String(selectedOptions[0]) : "";
  const selectChildren = React.Children.toArray(children);

  const selectedChild = selectChildren.find(
    (child) => React.isValidElement(child) && String(child.props.value ?? "") === selectedValue
  );
  const selectedLabel =
    value ??
    (React.isValidElement(selectedChild)
      ? (selectedChild.props.text ?? pickText(selectedChild.props.children))
      : "");

  const handleValueChange = (nextValue) => {
    const data = {
      optionValue: nextValue,
      selectedOptions: nextValue ? [nextValue] : [],
      value: nextValue,
    };

    onOptionSelect?.(undefined, data);
    onChange?.(undefined, data);
  };

  const side = String(positioning?.position ?? "").startsWith("above") ? "top" : "bottom";
  const align = String(positioning?.position ?? "").endsWith("-end") ? "end" : "start";

  return (
    <SelectPrimitive.Root
      value={selectedValue}
      disabled={disabled}
      onValueChange={handleValueChange}
    >
      <SelectPrimitive.Trigger
        className={cn("app-ui-combobox-trigger", className)}
        style={cleanStyle(style)}
        {...props}
      >
        <SelectPrimitive.Value placeholder={selectedLabel || props.placeholder || ""}>
          {selectedLabel}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={16} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="app-ui-combobox-content"
          position="popper"
          side={side}
          align={align}
          sideOffset={positioning?.offset?.mainAxis ?? 6}
        >
          <SelectPrimitive.Viewport className="app-ui-combobox-viewport">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function Field({ label, required, children, className, style, validationMessage }) {
  return (
    <label className={cn("app-ui-field", className)} style={cleanStyle(style)}>
      {label ? (
        <span className="app-ui-field-label">
          {label}
          {required ? <span className="app-ui-field-required">*</span> : null}
        </span>
      ) : null}
      {children}
      {validationMessage ? <span className="app-ui-field-message">{validationMessage}</span> : null}
    </label>
  );
}

export function Text({ as = "span", size, className, style, children, ...props }) {
  return React.createElement(
    as,
    {
      "data-size": size,
      className: cn("app-ui-text", className),
      style: cleanStyle(style),
      ...props,
    },
    children
  );
}

export function Title1({ className, style, children, ...props }) {
  return (
    <h1
      className={cn("app-ui-title app-ui-title-1", className)}
      style={cleanStyle(style)}
      {...props}
    >
      {children}
    </h1>
  );
}

export function Title2({ className, style, children, ...props }) {
  return (
    <h2
      className={cn("app-ui-title app-ui-title-2", className)}
      style={cleanStyle(style)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function MessageBar({ intent = "info", className, style, onDismiss, children, ...props }) {
  return (
    <div
      role={intent === "error" ? "alert" : "status"}
      data-intent={intent}
      className={cn("app-ui-message-bar", className)}
      style={cleanStyle(style)}
      {...props}
    >
      <span className="app-ui-message-content">{children}</span>
      {onDismiss ? (
        <button
          className="app-ui-message-dismiss"
          type="button"
          aria-label="Cerrar"
          onClick={onDismiss}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

export function Spinner({ label, size, className, style }) {
  return (
    <span data-size={size} className={cn("app-ui-spinner", className)} style={cleanStyle(style)}>
      <LoaderCircle className="app-ui-spinner-icon" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export function Badge({ color = "brand", className, style, children, ...props }) {
  return (
    <span
      data-color={color}
      className={cn("app-ui-badge", className)}
      style={cleanStyle(style)}
      {...props}
    >
      {children}
    </span>
  );
}

export function Card({ className, style, children, ...props }) {
  return (
    <div className={cn("app-ui-card", className)} style={cleanStyle(style)} {...props}>
      {children}
    </div>
  );
}

export function Checkbox({
  checked,
  label,
  disabled,
  className,
  style,
  onChange,
  onCheckedChange,
}) {
  const handleCheckedChange = (nextChecked) => {
    const value = nextChecked === true;
    onCheckedChange?.(value);
    onChange?.(undefined, { checked: value });
  };

  return (
    <label className={cn("app-ui-checkbox-wrap", className)} style={cleanStyle(style)}>
      <CheckboxPrimitive.Root
        className="app-ui-checkbox"
        checked={checked}
        disabled={disabled}
        onCheckedChange={handleCheckedChange}
      >
        <CheckboxPrimitive.Indicator>
          <Check size={14} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function Switch({ checked, label, disabled, className, style, onChange, onCheckedChange }) {
  const handleCheckedChange = (nextChecked) => {
    const value = nextChecked === true;
    onCheckedChange?.(value);
    onChange?.(undefined, { checked: value });
  };

  return (
    <label className={cn("app-ui-switch-wrap", className)} style={cleanStyle(style)}>
      <SwitchPrimitive.Root
        className="app-ui-switch"
        checked={checked}
        disabled={disabled}
        onCheckedChange={handleCheckedChange}
      >
        <SwitchPrimitive.Thumb className="app-ui-switch-thumb" />
      </SwitchPrimitive.Root>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function Tooltip({ content, children }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content className="app-ui-tooltip" sideOffset={6}>
            {content}
            <TooltipPrimitive.Arrow className="app-ui-tooltip-arrow" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => onOpenChange?.(undefined, { open: nextOpen })}
    >
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogSurface({ className, style, children }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="app-ui-dialog-overlay" />
      <DialogPrimitive.Content
        className={cn("app-ui-dialog-surface", className)}
        style={cleanStyle(style)}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogBody({ className, children }) {
  return <div className={cn("app-ui-dialog-body", className)}>{children}</div>;
}

export function DialogTitle({ className, children }) {
  return (
    <DialogPrimitive.Title className={cn("app-ui-dialog-title", className)}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogContent({ className, children }) {
  return <div className={cn("app-ui-dialog-content", className)}>{children}</div>;
}

export function DialogActions({ className, children }) {
  return <div className={cn("app-ui-dialog-actions", className)}>{children}</div>;
}

export function Popover({ open, onOpenChange, children }) {
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => onOpenChange?.(undefined, { open: nextOpen })}
    >
      {children}
    </PopoverPrimitive.Root>
  );
}

export function PopoverTrigger({ children }) {
  return <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>;
}

export function PopoverSurface({ className, style, children }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn("app-ui-popover-surface", className)}
        style={cleanStyle(style)}
        sideOffset={8}
        align="end"
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export function Table({ className, style, children, ...props }) {
  return (
    <table className={cn("app-ui-table", className)} style={cleanStyle(style)} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ className, children }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ className, children }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({ className, children, ...props }) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
}

const TreeItemContext = React.createContext(null);

export function Tree({ className, style, children, ...props }) {
  return (
    <div role="tree" className={cn("app-ui-tree", className)} style={cleanStyle(style)} {...props}>
      {children}
    </div>
  );
}

export function TreeItem({ itemType = "leaf", children }) {
  const isBranch = itemType === "branch";
  const [open, setOpen] = React.useState(false);
  const context = React.useMemo(
    () => ({
      isBranch,
      open,
      toggle: () => setOpen((current) => !current),
    }),
    [isBranch, open]
  );

  return (
    <TreeItemContext.Provider value={context}>
      <div role="treeitem" aria-expanded={isBranch ? open : undefined} className="app-ui-tree-item">
        {React.Children.map(children, (child) => {
          if (isBranch && React.isValidElement(child) && child.type === Tree) {
            return open ? child : null;
          }

          return child;
        })}
      </div>
    </TreeItemContext.Provider>
  );
}

export function TreeItemLayout({ iconBefore, className, style, children, onClick, ...props }) {
  const treeItem = React.useContext(TreeItemContext);

  const handleClick = (event) => {
    if (treeItem?.isBranch) {
      treeItem.toggle();
    }

    onClick?.(event);
  };

  return (
    <button
      type="button"
      className={cn("app-ui-tree-layout", className)}
      style={cleanStyle(style)}
      onClick={handleClick}
      {...props}
    >
      {iconBefore ? <span className="app-ui-tree-icon">{iconBefore}</span> : null}
      <span className="app-ui-tree-label">{children}</span>
      {treeItem?.isBranch ? (
        <span
          className={cn(
            treeItemLayoutClassNames.expandIcon,
            "app-ui-tree-expand",
            treeItem.open && "app-ui-tree-expand-open"
          )}
          aria-hidden="true"
        >
          <ChevronRight size={14} />
        </span>
      ) : null}
    </button>
  );
}
