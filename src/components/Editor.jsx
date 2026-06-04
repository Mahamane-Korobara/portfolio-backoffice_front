"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Columns3,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Rows3,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo,
  Upload,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  CODE_LANGUAGES,
  DEFAULT_CODE_LANGUAGE,
  lowlight,
} from "@/lib/editor/lowlight";
import { cn } from "@/lib/utils";

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

// Upload par défaut : pousse le fichier vers la bibliothèque média de l'API.
async function defaultUploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api.uploadMedia(formData);
}

function isImageFile(file) {
  return file && file.type && file.type.startsWith("image/");
}

function ToolbarButton({ active, disabled, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-[#2BE0B5]/35 bg-[#E7FBF5] text-[#0D2420] shadow-[0_8px_20px_rgba(43,224,181,0.18)]"
          : "border-transparent bg-white/70 text-[#59706c] hover:border-[#0D2420]/8 hover:bg-white hover:text-[#0D2420]"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-[#0D2420]/8" />;
}

export default function Editor({
  content,
  onChange,
  onRequestImage,
  onUploadImage = defaultUploadImage,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  // Force le re-render de la toolbar quand la sélection / le document change.
  const [, setSelectionTick] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ HTMLAttributes: { class: "editor-image" } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder:
          "Commence a ecrire ton article... (titres, code, images, tableaux)",
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: DEFAULT_CODE_LANGUAGE,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: content || EMPTY_DOCUMENT,
    editorProps: {
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []);
        const image = files.find(isImageFile);
        if (image) {
          event.preventDefault();
          void uploadAndInsert(image);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const image = files.find(isImageFile);
        if (image) {
          event.preventDefault();
          void uploadAndInsert(image);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getJSON());
    },
    onSelectionUpdate: () => setSelectionTick((tick) => tick + 1),
    onTransaction: () => setSelectionTick((tick) => tick + 1),
  });

  useEffect(() => {
    if (!editor) return;

    const nextContent = content || EMPTY_DOCUMENT;
    const currentContent = editor.getJSON();

    if (JSON.stringify(currentContent) !== JSON.stringify(nextContent)) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [content, editor]);

  // Recalculé à chaque rendu (déclenché par onUpdate/onTransaction) — léger.
  const editorText = editor ? editor.getText().trim() : "";
  const wordCount = editorText ? editorText.split(/\s+/).length : 0;

  async function uploadAndInsert(file) {
    if (!editor) return;
    setUploading(true);
    try {
      const media = await onUploadImage(file);
      if (media?.url) {
        editor
          .chain()
          .focus()
          .setImage({ src: media.url, alt: media.alt || media.original_name || "" })
          .run();
      }
    } finally {
      setUploading(false);
    }
  }

  if (!editor) {
    return (
      <div className="editor-shell rounded-[1.75rem] border border-[#0D2420]/8 bg-white/80 p-6 shadow-[var(--mk-shadow-soft)]">
        <div className="h-80 animate-pulse rounded-[1.35rem] bg-[#E7FBF5]" />
      </div>
    );
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("URL du lien", previousUrl);

    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Insertion d'image depuis la bibliotheque media (ou prompt URL en secours).
  const addImageFromLibrary = async () => {
    if (onRequestImage) {
      const media = await onRequestImage();
      if (media?.url) {
        editor
          .chain()
          .focus()
          .setImage({ src: media.url, alt: media.alt || media.original_name || "" })
          .run();
      }
      return;
    }

    const url = window.prompt("URL de l'image");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleFilePick = async (event) => {
    const file = event.target.files?.[0];
    if (file && isImageFile(file)) {
      await uploadAndInsert(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const inCodeBlock = editor.isActive("codeBlock");
  const inTable = editor.isActive("table");
  const currentLanguage =
    editor.getAttributes("codeBlock").language || DEFAULT_CODE_LANGUAGE;

  const headings = [
    {
      icon: <Heading1 size={15} />,
      title: "Titre 1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: <Heading2 size={15} />,
      title: "Titre 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: <Heading3 size={15} />,
      title: "Titre 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
  ];

  const marks = [
    {
      icon: <Bold size={15} />,
      title: "Gras",
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: <Italic size={15} />,
      title: "Italique",
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      icon: <UnderlineIcon size={15} />,
      title: "Souligne",
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
    },
    {
      icon: <Strikethrough size={15} />,
      title: "Barre",
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
    },
    {
      icon: <Highlighter size={15} />,
      title: "Surligne",
      action: () => editor.chain().focus().toggleHighlight().run(),
      active: editor.isActive("highlight"),
    },
    {
      icon: <Code size={15} />,
      title: "Code inline",
      action: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive("code"),
    },
  ];

  const aligns = [
    {
      icon: <AlignLeft size={15} />,
      title: "Aligner a gauche",
      action: () => editor.chain().focus().setTextAlign("left").run(),
      active: editor.isActive({ textAlign: "left" }),
    },
    {
      icon: <AlignCenter size={15} />,
      title: "Centrer",
      action: () => editor.chain().focus().setTextAlign("center").run(),
      active: editor.isActive({ textAlign: "center" }),
    },
    {
      icon: <AlignRight size={15} />,
      title: "Aligner a droite",
      action: () => editor.chain().focus().setTextAlign("right").run(),
      active: editor.isActive({ textAlign: "right" }),
    },
  ];

  const blocks = [
    {
      icon: <List size={15} />,
      title: "Liste a puces",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: <ListOrdered size={15} />,
      title: "Liste numerotee",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      icon: <ListChecks size={15} />,
      title: "Liste de taches",
      action: () => editor.chain().focus().toggleTaskList().run(),
      active: editor.isActive("taskList"),
    },
    {
      icon: <Quote size={15} />,
      title: "Citation",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      icon: <Code2 size={15} />,
      title: "Bloc de code",
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
    },
  ];

  const inserts = [
    {
      icon: <Minus size={15} />,
      title: "Separateur",
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      icon: <Link2 size={15} />,
      title: "Lien",
      action: addLink,
      active: editor.isActive("link"),
    },
    {
      icon: <TableIcon size={15} />,
      title: "Inserer un tableau",
      action: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
  ];

  return (
    <div className="editor-shell overflow-hidden rounded-[1.75rem] border border-[#0D2420]/8 bg-white/85 shadow-[var(--mk-shadow-soft)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#0D2420]/8 bg-[#F8FFFD] px-4 py-3">
        <ToolbarButton title="Annuler" onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton title="Retablir" onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={15} />
        </ToolbarButton>

        <ToolbarDivider />
        {headings.map((item) => (
          <ToolbarButton key={item.title} active={item.active} title={item.title} onClick={item.action}>
            {item.icon}
          </ToolbarButton>
        ))}

        <ToolbarDivider />
        {marks.map((item) => (
          <ToolbarButton key={item.title} active={item.active} title={item.title} onClick={item.action}>
            {item.icon}
          </ToolbarButton>
        ))}

        <ToolbarDivider />
        {aligns.map((item) => (
          <ToolbarButton key={item.title} active={item.active} title={item.title} onClick={item.action}>
            {item.icon}
          </ToolbarButton>
        ))}

        <ToolbarDivider />
        {blocks.map((item) => (
          <ToolbarButton key={item.title} active={item.active} title={item.title} onClick={item.action}>
            {item.icon}
          </ToolbarButton>
        ))}

        <ToolbarDivider />
        {inserts.map((item) => (
          <ToolbarButton key={item.title} active={item.active} title={item.title} onClick={item.action}>
            {item.icon}
          </ToolbarButton>
        ))}

        <ToolbarButton title="Image (bibliotheque)" onClick={addImageFromLibrary}>
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Televerser une image"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={15} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />
      </div>

      {/* Barre contextuelle : langage du bloc de code en cours */}
      {inCodeBlock ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#0D2420]/8 bg-[#0D2420] px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2BE0B5]">
            Langage du code
          </span>
          <select
            value={currentLanguage}
            onChange={(event) =>
              editor
                .chain()
                .focus()
                .updateAttributes("codeBlock", { language: event.target.value })
                .run()
            }
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white outline-none"
          >
            {CODE_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} className="text-[#0D2420]">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Barre contextuelle : controles de tableau */}
      {inTable ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#0D2420]/8 bg-[#EEFBF6] px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0D2420]/60">
            Tableau
          </span>
          <ToolbarButton title="Ajouter une colonne" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns3 size={15} />
          </ToolbarButton>
          <ToolbarButton title="Ajouter une ligne" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows3 size={15} />
          </ToolbarButton>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="rounded-lg border border-[#0D2420]/8 bg-white px-3 py-1.5 text-xs font-semibold text-[#0D2420]"
          >
            Suppr. colonne
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="rounded-lg border border-[#0D2420]/8 bg-white px-3 py-1.5 text-xs font-semibold text-[#0D2420]"
          >
            Suppr. ligne
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className="rounded-lg border border-[#0D2420]/8 bg-white px-3 py-1.5 text-xs font-semibold text-[#0D2420]"
          >
            Ligne d&apos;en-tete
          </button>
          <ToolbarButton title="Supprimer le tableau" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 size={15} />
          </ToolbarButton>
        </div>
      ) : null}

      <div className="px-6 py-6 md:px-8">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between border-t border-[#0D2420]/8 bg-[#F8FFFD] px-5 py-2.5 text-xs font-medium text-[#3D5350]/75">
        <span>
          {wordCount} mot{wordCount > 1 ? "s" : ""}
        </span>
        <span>
          {uploading
            ? "Televersement de l'image..."
            : "Glisse-depose ou colle une image directement"}
        </span>
      </div>
    </div>
  );
}
