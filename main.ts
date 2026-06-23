import { Plugin } from 'obsidian';
import { registerAqlMode } from './aql-mode';

export default class AQLSyntaxPlugin extends Plugin {
  async onload() {
    try {
      this.registerAQLMode();
    } catch (error) {
      console.error('AQL Syntax Highlighting mode registration failed', error);
    }
    console.log('AQL Syntax Highlighting loaded');
  }

  private registerAQLMode() {
    // Access CodeMirror from Obsidian
    const cm = (window as any).CodeMirror;

    if (!cm) {
      console.error('CodeMirror not available');
      return;
    }
    registerAqlMode(cm);
  }

  onunload() {
    console.log('AQL Syntax Highlighting unloaded');
  }
}
