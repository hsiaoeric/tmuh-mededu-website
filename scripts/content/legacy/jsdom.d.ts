// The importer parses the legacy mirror with jsdom, which ships without type declarations. This
// is the small slice of the DOM the importer reads, declared locally so the scripts project does
// not need the browser `dom` lib.
declare module 'jsdom' {
  export interface LegacyNode {
    readonly nodeType: number;
    readonly nodeName: string;
    readonly textContent: string | null;
    readonly childNodes: ArrayLike<LegacyNode>;
    readonly parentElement: LegacyElement | null;
  }

  export interface LegacyElement extends LegacyNode {
    readonly tagName: string;
    readonly children: ArrayLike<LegacyElement>;
    readonly classList: { contains(token: string): boolean };
    innerHTML: string;
    getAttribute(name: string): string | null;
    hasAttribute(name: string): boolean;
    querySelector(selector: string): LegacyElement | null;
    querySelectorAll(selector: string): ArrayLike<LegacyElement>;
    closest(selector: string): LegacyElement | null;
    remove(): void;
  }

  export interface LegacyDocument {
    readonly body: LegacyElement;
    createElement(tagName: string): LegacyElement;
    querySelector(selector: string): LegacyElement | null;
    querySelectorAll(selector: string): ArrayLike<LegacyElement>;
  }

  export class JSDOM {
    constructor(html?: string, options?: { readonly url?: string });
    readonly window: {
      readonly document: LegacyDocument;
      readonly DOMParser: new () => { parseFromString(html: string, type: 'text/html'): LegacyDocument };
      close(): void;
    };
  }
}
