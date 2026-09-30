import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button, Tooltip, makeStyles } from "@/components/ui/app-shadcn";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

const useRichTextEditorStyles = makeStyles({
  root: {
    width: "100%",
    border: "1px solid var(--app-card-border)",
    borderRadius: "8px",
    backgroundColor: "var(--app-card-bg)",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    padding: "8px",
    borderBottom: "1px solid var(--app-card-border)",
    backgroundColor: "color-mix(in srgb, var(--app-card-bg) 92%, var(--app-card-border))",
  },
  editor: {
    minHeight: "180px",
    padding: "12px",
    color: "var(--app-card-fg, var(--app-user-value))",
    "& .ProseMirror": {
      minHeight: "156px",
      outline: "none",
      overflowWrap: "anywhere",
    },
    "& .ProseMirror p": {
      margin: "0 0 8px",
    },
    "& .ProseMirror h1": {
      margin: "0 0 10px",
      fontSize: "24px",
      lineHeight: "1.2",
    },
    "& .ProseMirror h2": {
      margin: "0 0 10px",
      fontSize: "20px",
      lineHeight: "1.25",
    },
    "& .ProseMirror ul, & .ProseMirror ol": {
      paddingLeft: "22px",
      margin: "0 0 8px",
    },
  },
  disabled: {
    backgroundColor: "color-mix(in srgb, var(--app-card-bg) 86%, var(--app-card-border))",
  },
});

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2],
    },
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
];

function ToolbarButton({ label, icon, active = false, disabled = false, onClick }) {
  return (
    <Tooltip content={label} relationship="label">
      <Button
        appearance={active ? "primary" : "outline"}
        size="small"
        icon={icon}
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
      />
    </Tooltip>
  );
}

export function RichTextEditor({ value, onChange, disabled = false, labels }) {
  const styles = useRichTextEditorStyles();
  const editor = useEditor({
    extensions,
    content: sanitizeHtml(value),
    editable: !disabled,
    onUpdate: ({ editor: activeEditor }) => {
      onChange?.(sanitizeHtml(activeEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;

    const nextValue = sanitizeHtml(value);
    if (editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, false);
    }
  }, [editor, value]);

  const buttonLabels = {
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    heading1: "Heading 1",
    heading2: "Heading 2",
    link: "Link",
    unlink: "Remove link",
    linkPrompt: "URL",
    bulletList: "Bullet list",
    orderedList: "Ordered list",
    alignLeft: "Align left",
    alignCenter: "Align center",
    alignRight: "Align right",
    undo: "Undo",
    redo: "Redo",
    ...labels,
  };

  const commandDisabled = disabled || !editor;
  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt(buttonLabels.linkPrompt, previousUrl);

    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className={`${styles.root} ${disabled ? styles.disabled : ""}`}>
      {!disabled ? (
        <div className={styles.toolbar}>
          <ToolbarButton
            label={buttonLabels.bold}
            icon={<Bold />}
            active={Boolean(editor?.isActive("bold"))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label={buttonLabels.italic}
            icon={<Italic />}
            active={Boolean(editor?.isActive("italic"))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label={buttonLabels.underline}
            icon={<UnderlineIcon />}
            active={Boolean(editor?.isActive("underline"))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            label={buttonLabels.heading1}
            icon={<Heading1 />}
            active={Boolean(editor?.isActive("heading", { level: 1 }))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            label={buttonLabels.heading2}
            icon={<Heading2 />}
            active={Boolean(editor?.isActive("heading", { level: 2 }))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            label={buttonLabels.link}
            icon={<Link2 />}
            active={Boolean(editor?.isActive("link"))}
            disabled={commandDisabled}
            onClick={setLink}
          />
          <ToolbarButton
            label={buttonLabels.unlink}
            icon={<Link2Off />}
            disabled={commandDisabled || !editor?.isActive("link")}
            onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}
          />
          <ToolbarButton
            label={buttonLabels.bulletList}
            icon={<List />}
            active={Boolean(editor?.isActive("bulletList"))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label={buttonLabels.orderedList}
            icon={<ListOrdered />}
            active={Boolean(editor?.isActive("orderedList"))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            label={buttonLabels.alignLeft}
            icon={<AlignLeft />}
            active={Boolean(editor?.isActive({ textAlign: "left" }))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          />
          <ToolbarButton
            label={buttonLabels.alignCenter}
            icon={<AlignCenter />}
            active={Boolean(editor?.isActive({ textAlign: "center" }))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          />
          <ToolbarButton
            label={buttonLabels.alignRight}
            icon={<AlignRight />}
            active={Boolean(editor?.isActive({ textAlign: "right" }))}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          />
          <ToolbarButton
            label={buttonLabels.undo}
            icon={<Undo2 />}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().undo().run()}
          />
          <ToolbarButton
            label={buttonLabels.redo}
            icon={<Redo2 />}
            disabled={commandDisabled}
            onClick={() => editor?.chain().focus().redo().run()}
          />
        </div>
      ) : null}
      <EditorContent className={styles.editor} editor={editor} />
    </div>
  );
}
