"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import php from "highlight.js/lib/languages/php";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Undo,
} from "lucide-react";

import { cn } from "@/lib/utils";

const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("php", php);
lowlight.register("bash", bash);
lowlight.register("css", css);

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function ToolbarButton({ active, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition",
        active
          ? "border-[#2BE0B5]/35 bg-[#E7FBF5] text-[#0D2420] shadow-[0_8px_20px_rgba(43,224,181,0.18)]"
          : "border-transparent bg-white/70 text-[#59706c] hover:border-[#0D2420]/8 hover:bg-white hover:text-[#0D2420]"
      )}
    >
      {children}
    </button>
  );
}

export default function Editor({ content, onChange, onRequestImage }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ HTMLAttributes: { class: "editor-image" } }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Commence a ecrire ton article..." }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: content || EMPTY_DOCUMENT,
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextContent = content || EMPTY_DOCUMENT;
    const currentContent = editor.getJSON();

    if (JSON.stringify(currentContent) !== JSON.stringify(nextContent)) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [content, editor]);

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

    editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = async () => {
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

  const groups = [
    [
      {
        icon: <Undo size={15} />,
        title: "Annuler",
        action: () => editor.chain().focus().undo().run(),
      },
      {
        icon: <Redo size={15} />,
        title: "Retablir",
        action: () => editor.chain().focus().redo().run(),
      },
    ],
    [
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
    ],
    [
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
        icon: <Code size={15} />,
        title: "Code inline",
        action: () => editor.chain().focus().toggleCode().run(),
        active: editor.isActive("code"),
      },
    ],
    [
      {
        icon: <List size={15} />,
        title: "Liste",
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
    ],
    [
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
        icon: <ImageIcon size={15} />,
        title: "Image",
        action: addImage,
      },
    ],
  ];

  return (
    <div className="editor-shell overflow-hidden rounded-[1.75rem] border border-[#0D2420]/8 bg-white/85 shadow-[var(--mk-shadow-soft)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#0D2420]/8 bg-[#F8FFFD] px-4 py-3">
        {groups.map((group, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <div className="mx-1 h-6 w-px bg-[#0D2420]/8" />}
            {group.map((item) => (
              <ToolbarButton
                key={item.title}
                title={item.title}
                active={item.active}
                onClick={item.action}
              >
                {item.icon}
              </ToolbarButton>
            ))}
          </div>
        ))}
      </div>

      <div className="px-6 py-6 md:px-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
