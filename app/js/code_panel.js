var code_states = {
  DIRTY: 'dirty',
  SAVED: 'saved',
  LOADED: 'loaded'
};

var file_types = {
  '.js': 'javascript',
  '.json': {name: 'javascript', json: true},
  '.html': 'htmlmixed',
  '.css': 'css',
  '.php': 'php'
}

var code_panel = function(){
  return {
    tab: null,
    $codePanel: null,
    codeMirror: null,
    autocompleteTimeout: null,
    state: code_states.LOADED,
    name: 'untitled',
    fullpath: null,
    savedValue: '',
    init: function(options){
      this.$codePanel = $('<div></div>')
        .addClass('code-panel')
        .append(this.$code);

      this.fullpath = options.fullpath;
      this.savedValue = options.contents || '';

      this.codeMirror = CodeMirror(this.$codePanel[0], {
        mode: file_types[options.extension] || 'javascript',
        keyMap: 'sublime',
        theme: 'twilight',
        indentWithTabs: this.indentWithTabs,
        indentUnit: this.indentWithTabs ? 4 : 2,
        matchBrackets: settings.get('matchBrackets'),
        autoCloseBrackets: settings.get('autoCloseBrackets'),
        lineNumbers: true
      });

      this.$codePanel.appendTo($('body'));
      app.setTextSize();
      this.codeMirror.setSize('100%', '100%');
      this.codeMirror.setValue(options.contents || '');

      this.codeMirror.on('change', function(instance, change){
        if(this.text == this.savedValue){
          this.setState(code_states.LOADED);
        } else {
          this.setState(code_states.DIRTY);
        }
      }.bind(this));

      this.codeMirror.on('focus', function(){
        if(file_browser.visible)
          file_browser.hide();
      }.bind(this));

      this.codeMirror.on('cursorActivity', function(instance){
        app.update();
        this.storeCursorPosition();
      }.bind(this));

      this.codeMirror.on('inputRead', function(instance, e){
        var origin = e.origin;
        var triggerAutocompleteRegex = new RegExp(settings.get('trigger_autocomplete_regex'), 'i');

        if(origin == '+delete' || !triggerAutocompleteRegex.test(e.text[e.text.length-1]))
          return;

        if(this.autocompleteTimeout)
          clearTimeout(this.autocompleteTimeout);

        if(this.codeMirror.state.completionActive)
          this.codeMirror.state.completionActive.close();

        this.autocompleteTimeout = setTimeout(function(){
          CodeMirror.showHint(this.codeMirror, CodeMirror.hint.anyword, {completeSingle: false});
        }.bind(this), 120);
      }.bind(this));

      this.name = options.name || this.name;

      this.codeMirror.focus();

      return this;
    },
    storeCursorPosition: function(){
      if(this.fullpath){
        app.projectStorage.set(this.fullpath+'.cursor_position', this.codeMirror.getCursor());
      }
    },
    getStoredCursorPosition: function(){
      return app.projectStorage.get(this.fullpath+'.cursor_position') || {
        line: 0,
        ch: 0
      };
    },
    recoverCursorPosition: function(){
      this.codeMirror.setCursor(this.getStoredCursorPosition());
    },
    setState: function(state){
      if(this.state == state)
        return;

      this.state = state;

      this.tab.setState(this.state);
    },
    hide: function(){
      this.$codePanel.hide();

      return this;
    },
    close: function(){
      this.$codePanel.remove();
    },
    show: function(){
      this.$codePanel.show();

      return this;
    },
    focus: function(){
      tab_bar.update();
      status_bar.update();

      this.show();
      this.codeMirror.focus();
      this.codeMirror.scrollIntoView(this.codeMirror.getCursor(), this.$codePanel.height() / 2);
      this.codeMirror.refresh();
      return this;
    },
    setValue: function(){

    },
    update: function(){

      return this;
    },
    get indentWithTabs(){
      var double_spaces = this.savedValue.split('  ').length,
      tabs = this.savedValue.split("\t").length;

      return tabs > double_spaces;
    },
    get text(){
      return this.codeMirror.getValue();
    },
    get total_lines(){
      return this.codeMirror.lineCount();
    },
    get current_line(){
      return this.codeMirror.getCursor().line;
    },
    get total_characters(){
      return this.codeMirror.getLine(this.current_line).length;
    },
    get current_character(){
      return this.codeMirror.getCursor().ch;
      // var range = window.getSelection().getRangeAt(0);
      // var selectedObj = window.getSelection();
      // var rangeCount = 0;
      // var childNodes = selectedObj.anchorNode.parentNode.childNodes;
      // for (var i = 0; i < childNodes.length; i++) {
      //   if (childNodes[i] == selectedObj.anchorNode) {
      //     break;
      //   }
      //   if (childNodes[i].outerHTML)
      //     rangeCount += childNodes[i].outerHTML.length;
      //   else if (childNodes[i].nodeType == 3) {
      //     rangeCount += childNodes[i].textContent.length;
      //   }
      // }
      // return range.startOffset + rangeCount;
    }
  }
}
