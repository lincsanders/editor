var key_bindings = {
  keys: {
    ESC: 27,
    UP: 38,
    DOWN: 40,
    ENTER: 13
  },
  inKeys: function(value){
    for(var i in this.keys){
      if(this.keys[i] == value)
        return true;
    }
    return false;
  },
  keydown_overrides: {
    simple_combos: {
      "meta s": function(){ app.current_tab.save() },
      "meta t": function(){ file_browser.toggle() },
      "meta p": function(){ file_browser.toggle() },
      "meta w": function(){ app.current_tab.close() },
      //Text Size
      "meta =": function(){ app.increaseTextSize() }, //For some reason + is =...... ?
      "meta -": function(){ app.decreaseTextSize() },
      //Dev Tools
      "meta alt j": function(){ require('nw.gui').Window.get().showDevTools() },
      "alt meta j": function(){ require('nw.gui').Window.get().showDevTools() },
      //Tab Navigation
      "meta alt right": function(){ tab_bar.next() },
      "alt meta right": function(){ tab_bar.next() },
      "meta alt left": function(){ tab_bar.previous() },
      "alt meta left": function(){ tab_bar.previous() }
    },
    sequences: {
    }
  },
  init: function(){
    this.listener = new keypress.Listener();

    for(var cmd in this.keydown_overrides.simple_combos){
      this.listener.simple_combo(cmd, this.keydown_overrides.simple_combos[cmd]);
    }

    for(var cmd in this.keydown_overrides.sequences){
      this.listener.sequence_combo(cmd, this.keydown_overrides.sequences[cmd], true);
    }
  }
}
