// Registre centralisé des langages pour la coloration syntaxique des blocs de
// code (TipTap + lowlight). Pour ajouter un langage : importer son module
// highlight.js puis l'enregistrer dans `LANGUAGES` ci-dessous.

import { createLowlight } from "lowlight";

import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import dart from "highlight.js/lib/languages/dart";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import graphql from "highlight.js/lib/languages/graphql";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import nginx from "highlight.js/lib/languages/nginx";
import php from "highlight.js/lib/languages/php";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scss from "highlight.js/lib/languages/scss";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// `name` = identifiant lowlight (et valeur stockée dans le JSON TipTap).
// `label` = libellé affiché dans le sélecteur. `aliases` = synonymes acceptés.
const REGISTRY = [
  { name: "plaintext", label: "Texte brut", mod: plaintext, aliases: ["text"] },
  { name: "javascript", label: "JavaScript", mod: javascript, aliases: ["js", "jsx", "mjs"] },
  { name: "typescript", label: "TypeScript", mod: typescript, aliases: ["ts", "tsx"] },
  { name: "php", label: "PHP", mod: php },
  { name: "python", label: "Python", mod: python, aliases: ["py"] },
  { name: "bash", label: "Bash / Shell", mod: bash, aliases: ["sh", "shell", "zsh"] },
  { name: "json", label: "JSON", mod: json },
  { name: "xml", label: "HTML / XML", mod: xml, aliases: ["html", "vue", "svg"] },
  { name: "css", label: "CSS", mod: css },
  { name: "scss", label: "SCSS / Sass", mod: scss, aliases: ["sass"] },
  { name: "sql", label: "SQL", mod: sql },
  { name: "go", label: "Go", mod: go, aliases: ["golang"] },
  { name: "rust", label: "Rust", mod: rust, aliases: ["rs"] },
  { name: "java", label: "Java", mod: java },
  { name: "kotlin", label: "Kotlin", mod: kotlin, aliases: ["kt"] },
  { name: "csharp", label: "C#", mod: csharp, aliases: ["cs"] },
  { name: "cpp", label: "C++", mod: cpp, aliases: ["c++"] },
  { name: "c", label: "C", mod: c },
  { name: "swift", label: "Swift", mod: swift },
  { name: "dart", label: "Dart", mod: dart },
  { name: "ruby", label: "Ruby", mod: ruby, aliases: ["rb"] },
  { name: "yaml", label: "YAML", mod: yaml, aliases: ["yml"] },
  { name: "markdown", label: "Markdown", mod: markdown, aliases: ["md"] },
  { name: "dockerfile", label: "Dockerfile", mod: dockerfile, aliases: ["docker"] },
  { name: "nginx", label: "Nginx", mod: nginx },
  { name: "ini", label: "INI / .env", mod: ini, aliases: ["toml", "env"] },
  { name: "graphql", label: "GraphQL", mod: graphql, aliases: ["gql"] },
  { name: "diff", label: "Diff / Patch", mod: diff },
];

export const lowlight = createLowlight();

REGISTRY.forEach(({ name, mod, aliases = [] }) => {
  lowlight.register(name, mod);
  aliases.forEach((alias) => lowlight.register(alias, mod));
});

// Liste {value, label} prête pour le menu déroulant de l'éditeur.
export const CODE_LANGUAGES = REGISTRY.map(({ name, label }) => ({
  value: name,
  label,
}));

export const DEFAULT_CODE_LANGUAGE = "plaintext";
