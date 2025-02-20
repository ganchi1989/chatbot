import type { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { createRoot } from "react-dom/client";

import { Suggestion as PreviewSuggestion } from "@/components/suggestion";
import type { Suggestion } from "@/src/schema";
import { BlockKind } from "@/components/block";

export interface UISuggestion extends Suggestion {
  selectionStart: number;
  selectionEnd: number;
}

interface Position {
  start: number;
  end: number;
}

function findPositionsInDoc(doc: Node, searchText: string): Position | null {
  let positions: { start: number; end: number } | null = null;

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    if (node.isText && node.text) {
      const index = node.text.indexOf(searchText);
      if (index !== -1) {
        positions = {
          start: pos + index,
          end: pos + index + searchText.length,
        };
        return false; // stop recursing once found
      }
    }
    return true;
  });

  return positions;
}

export function projectWithPositions(
  doc: Node,
  suggestions: Array<Suggestion>
): Array<UISuggestion> {
  return suggestions.map((suggestion) => {
    const positions = findPositionsInDoc(doc, suggestion.originalText);
    if (!positions) {
      return {
        ...suggestion,
        selectionStart: 0,
        selectionEnd: 0,
      };
    }
    return {
      ...suggestion,
      selectionStart: positions.start,
      selectionEnd: positions.end,
    };
  });
}

// Creates the suggestion widget using React.
// It renders the Suggestion UI and wires up the Accept/Decline callbacks.
export function createSuggestionWidget(
  suggestion: UISuggestion,
  view: EditorView,
  blockKind: BlockKind = "text"
): { dom: HTMLElement; destroy: () => void } {
  const dom = document.createElement("span");
  const root = createRoot(dom);

  const onApply = () => {
    const { state, dispatch } = view;
    // Remove the decoration for this suggestion
    const pluginState = suggestionsPluginKey.getState(state);
    if (pluginState?.decorations) {
      const newDecos = DecorationSet.create(
        state.doc,
        pluginState.decorations
          .find()
          .filter((dec) => dec.spec.suggestionId !== suggestion.id)
      );
      dispatch(
        state.tr.setMeta(suggestionsPluginKey, {
          decorations: newDecos,
          selected: null,
        })
      );
    }
    // Replace original text with the suggestion
    dispatch(
      state.tr
        .replaceWith(
          suggestion.selectionStart,
          suggestion.selectionEnd,
          state.schema.text(suggestion.suggestedText)
        )
        .setMeta("no-debounce", true)
    );
  };

  const onDecline = () => {
    const { state, dispatch } = view;
    // Simply remove the decoration without changing the text
    const pluginState = suggestionsPluginKey.getState(state);
    if (pluginState?.decorations) {
      const newDecos = DecorationSet.create(
        state.doc,
        pluginState.decorations
          .find()
          .filter((dec) => dec.spec.suggestionId !== suggestion.id)
      );
      dispatch(
        state.tr.setMeta(suggestionsPluginKey, {
          decorations: newDecos,
          selected: null,
        })
      );
    }
  };

  root.render(
    <PreviewSuggestion
      suggestion={suggestion}
      onApply={onApply}
      onDecline={onDecline}
      blockKind={blockKind}
    />
  );

  return {
    dom,
    destroy: () => {
      setTimeout(() => {
        root.unmount();
      }, 0);
    },
  };
}

// Creates a widget decoration that inserts the suggestion UI
// right after the original text. The "side: 1" option tells ProseMirror
// to render it after the node.
export function suggestionDecoration(
  suggestion: UISuggestion,
  view: EditorView,
  blockKind: BlockKind = "text"
): Decoration {
  return Decoration.widget(
    suggestion.selectionEnd,
    () => {
      const { dom, destroy } = createSuggestionWidget(
        suggestion,
        view,
        blockKind
      );
      // Attach the suggestion id to the DOM so it can be identified later.
      dom.dataset.suggestionId = suggestion.id;
      return dom;
    },
    { key: suggestion.id, side: 1, suggestionId: suggestion.id }
  );
}

export const suggestionsPluginKey = new PluginKey("suggestions");

export const suggestionsPlugin = new Plugin({
  key: suggestionsPluginKey,
  state: {
    init() {
      return { decorations: DecorationSet.empty, selected: null };
    },
    apply(tr, prevState) {
      const meta = tr.getMeta(suggestionsPluginKey);
      if (meta) return meta;
      return {
        decorations: prevState.decorations.map(tr.mapping, tr.doc),
        selected: prevState.selected,
      };
    },
  },
  props: {
    decorations(state) {
      return this.getState(state)?.decorations || DecorationSet.empty;
    },
    handleDOMEvents: {
      mousedown: (view) => {
        const { state } = view;
        const pluginState = suggestionsPluginKey.getState(state);
        if (pluginState.selected) {
          view.dispatch(
            state.tr.setMeta(suggestionsPluginKey, {
              ...pluginState,
              selected: null,
            })
          );
        }
        return false;
      },
    },
  },
});

// import type { Node } from "prosemirror-model";
// import { Plugin, PluginKey } from "prosemirror-state";
// import {
//   type Decoration,
//   DecorationSet,
//   type EditorView,
// } from "prosemirror-view";
// import { createRoot } from "react-dom/client";

// import { Suggestion as PreviewSuggestion } from "@/components/suggestion";
// import type { Suggestion } from "@/src/schema";
// import { BlockKind } from "@/components/block";

// export interface UISuggestion extends Suggestion {
//   selectionStart: number;
//   selectionEnd: number;
// }

// interface Position {
//   start: number;
//   end: number;
// }

// function findPositionsInDoc(doc: Node, searchText: string): Position | null {
//   let positions: { start: number; end: number } | null = null;

//   doc.nodesBetween(0, doc.content.size, (node, pos) => {
//     if (node.isText && node.text) {
//       const index = node.text.indexOf(searchText);

//       if (index !== -1) {
//         positions = {
//           start: pos + index,
//           end: pos + index + searchText.length,
//         };

//         return false;
//       }
//     }

//     return true;
//   });

//   return positions;
// }

// export function projectWithPositions(
//   doc: Node,
//   suggestions: Array<Suggestion>
// ): Array<UISuggestion> {
//   return suggestions.map((suggestion) => {
//     const positions = findPositionsInDoc(doc, suggestion.originalText);

//     if (!positions) {
//       return {
//         ...suggestion,
//         selectionStart: 0,
//         selectionEnd: 0,
//       };
//     }

//     return {
//       ...suggestion,
//       selectionStart: positions.start,
//       selectionEnd: positions.end,
//     };
//   });
// }

// export function createSuggestionWidget(
//   suggestion: UISuggestion,
//   view: EditorView,
//   blockKind: BlockKind = "text"
// ): { dom: HTMLElement; destroy: () => void } {
//   const dom = document.createElement("span");
//   const root = createRoot(dom);

//   dom.addEventListener("mousedown", (event) => {
//     event.preventDefault();
//     view.dom.blur();
//   });

//   const onApply = () => {
//     const { state, dispatch } = view;

//     const decorationTransaction = state.tr;
//     const currentState = suggestionsPluginKey.getState(state);
//     const currentDecorations = currentState?.decorations;

//     if (currentDecorations) {
//       const newDecorations = DecorationSet.create(
//         state.doc,
//         currentDecorations.find().filter((decoration: Decoration) => {
//           return decoration.spec.suggestionId !== suggestion.id;
//         })
//       );

//       decorationTransaction.setMeta(suggestionsPluginKey, {
//         decorations: newDecorations,
//         selected: null,
//       });
//       dispatch(decorationTransaction);
//     }

//     const textTransaction = view.state.tr.replaceWith(
//       suggestion.selectionStart,
//       suggestion.selectionEnd,
//       state.schema.text(suggestion.suggestedText)
//     );

//     textTransaction.setMeta("no-debounce", true);

//     dispatch(textTransaction);
//   };

//   root.render(
//     <PreviewSuggestion
//       suggestion={suggestion}
//       onApply={onApply}
//       blockKind={blockKind}
//     />
//   );

//   return {
//     dom,
//     destroy: () => {
//       // Wrapping unmount in setTimeout to avoid synchronous unmounting during render
//       setTimeout(() => {
//         root.unmount();
//       }, 0);
//     },
//   };
// }

// export const suggestionsPluginKey = new PluginKey("suggestions");
// export const suggestionsPlugin = new Plugin({
//   key: suggestionsPluginKey,
//   state: {
//     init() {
//       return { decorations: DecorationSet.empty, selected: null };
//     },
//     apply(tr, state) {
//       const newDecorations = tr.getMeta(suggestionsPluginKey);
//       if (newDecorations) return newDecorations;

//       return {
//         decorations: state.decorations.map(tr.mapping, tr.doc),
//         selected: state.selected,
//       };
//     },
//   },
//   props: {
//     decorations(state) {
//       return this.getState(state)?.decorations ?? DecorationSet.empty;
//     },
//   },
// });
