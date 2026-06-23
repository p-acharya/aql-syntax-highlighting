/* 
 * Adapted from ANNIS: src/main/resources/org/corpus_tools/annis/gui/components/codemirror/mode/aql/aql.js
 * Copyright 2013 Corpuslinguistic working group Humboldt University Berlin.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function registerAqlMode(cm: any) {
  if (!cm || typeof cm.defineMode !== 'function' || typeof cm.defineMIME !== 'function') {
    console.warn('AQL mode registration skipped: CodeMirror mode API not available');
    return;
  }

  // Avoid crashing on reload if the mode is already present.
  if (cm.modes && cm.modes.aql) {
    cm.defineMIME('text/x-aql', 'aql');
    return;
  }

  cm.defineMode('aql', function(config: any, parserConfig: any) {
    const resolvedParserConfig = parserConfig ?? {};

    const regexMeta = /meta::([a-zA-Z_%]([a-zA-Z0-9_\-%])*:)?([a-zA-Z_%]([a-zA-Z0-9_\-%])*)/;
    const regexID = /([a-zA-Z_%]([a-zA-Z0-9_\-%])*:)?([a-zA-Z_\%]([a-zA-Z0-9_\-%])*)/;

    const regexLeftRightChild = />([a-zA-Z_%][a-zA-Z0-9_\-%]*)?(@(l|r)?)/;
    const regexPrecedenceNearPointingDom = /((\.)|(\^)|(->)|(>))([a-zA-Z_%][a-zA-Z0-9_\-%]*)?(\s*(\*)|([ \t,0-9]+))?/;

    const regexSimpleOperators = /(==)|(_=_)|(_i_)|(_o_)|(_l_)|(_r_)|(_ol_)|(_or_)|(_ident_)|(@\*?)/;

    function getNodeClassForString(state: any) {
      if (state.behindAssignment) {
        return state.position;
      }

      return getNodeClass(state);
    }

    function getNodeClass(state: any) {
      if (state.optionalNodes.has(state.numberOfNodes)) {
        return 'def';
      }

      let mappedNode = state.numberOfOutputNodes;
      if (state.nodeMappings[state.numberOfOutputNodes]) {
        mappedNode = state.nodeMappings[state.numberOfOutputNodes];
      }

      if (mappedNode >= 16) {
        return 'node_16';
      }

      return 'node_' + mappedNode;
    }

    function addNode(state: any) {
      // Always count the nodes as nodes of the query.
      state.numberOfNodes++;
      if (!state.optionalNodes.has(state.numberOfNodes)) {
        // Only nodes in the output get a color.
        state.numberOfOutputNodes++;
      }
      return getNodeClass(state);
    }

    return {
      token: function(stream: any, state: any) {
        while (stream.eatSpace());

        if (state.position === 'string') {
          if (stream.match('"')) {
            state.position = 'def';
            if (state.behindAssignment) {
              state.behindAssignment = false;
              // The closing quote character should still be highlighted as such.
              return 'string';
            }

            return getNodeClass(state);
          }

          stream.next();
          return getNodeClassForString(state);
        } else if (state.position === 'string-2') {
          if (stream.match('/')) {
            state.position = 'def';
            if (state.behindAssignment) {
              state.behindAssignment = false;
              // The closing slash character should still be highlighted as such.
              return 'string-2';
            }

            return getNodeClass(state);
          }

          stream.next();
          return getNodeClassForString(state);
        }

        if (stream.match('"')) {
          state.position = 'string';
          if (state.behindAssignment) {
            return 'string';
          }

          return addNode(state);
        } else if (stream.match('/')) {
          state.position = 'string-2';
          if (state.behindAssignment) {
            return 'string-2';
          }

          return addNode(state);
        } else if (stream.match('[')) {
          state.position = 'edge-anno';
          return 'property';
        } else if (stream.match('&') || stream.match('|')) {
          return 'operator';
        } else if (stream.match('(') || stream.match(')')) {
          return 'bracket';
        } else if (stream.match(regexSimpleOperators)) {
          return 'operator';
        } else if (stream.match(regexLeftRightChild)) {
          return 'operator';
        } else if (stream.match(regexPrecedenceNearPointingDom)) {
          return 'operator';
        } else if (stream.match('=') || stream.match('!=')) {
          state.behindAssignment = true;
          return 'operator';
        } else if (stream.match(regexMeta)) {
          return 'def';
        } else if (stream.match(regexID)) {
          if (state.position === 'edge-anno') {
            // Don't count edge annotations as nodes.
            return 'def';
          }

          return addNode(state);
        } else if (stream.match(/#[a-zA-Z0-9_\-%]+/)) {
          return 'variable-2';
        }

        // Clear edge-anno state if necessary.
        if (state.position === 'edge-anno' && stream.match(']')) {
          state.position = 'def';
        }

        // Always go to the next character by default.
        stream.next();

        return state.position;
      },

      startState: function() {
        return {
          position: 'def',
          behindAssignment: false,
          numberOfNodes: 0,
          numberOfOutputNodes: 0,
          nodeMappings: resolvedParserConfig.nodeMappings ?? {},
          optionalNodes: resolvedParserConfig.optionalNodes instanceof Set ? resolvedParserConfig.optionalNodes : new Set<number>()
        };
      }
    };
  });

  cm.defineMIME('text/x-aql', 'aql');
}
