/// <reference types="vite/client" />

// uuid@9 ships no type declarations of its own and this project has no
// @types/uuid; declaring the single function the counter uses keeps the ticket
// code generator typed without adding a dependency.
declare module "uuid" {
  export function v4(): string;
}
