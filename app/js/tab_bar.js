var tab_states = {}
tab_states[code_states.DIRTY] = '+';
tab_states[code_states.SAVED] = '';
tab_states[code_states.LOADED] ='';

var tab_bar = {
  tabs: [],
  $div: null,
  init: function(){
    this.$div = $('<div></div>')
      .attr('id', 'tab-bar')
      .appendTo('body');

    this.$newTab = $('<div></div>')
      .html('+')
      .on('click', function(){
        file_browser.toggle();
      })
      .addClass('new-tab')
      .appendTo(this.$div);

    return this;
  },
  focusTab: function(tab){
    if(app.current_tab)
      this.$div.scrollLeft((this.$div.scrollLeft() + tab.$tab.offset().left) - ((this.$div.width() / 2) - (tab.$tab.width() / 2)));
  },
  fileIsOpen: function(fullpath){
    for(var i in this.tabs){
      if(this.tabs[i].fullpath == fullpath){
        return true;
      }
    }

    return false;
  },
  focusFile: function(fullpath){
    for(var i in this.tabs){
      if(this.tabs[i].fullpath == fullpath){
        this.tabs[i].focus();
        return;
      }
    }
  },
  previous: function(){
    if(!app.current_tab)
      return;

    var prev_tab = this.tabs[this.tabs.indexOf(app.current_tab)-1];
    if(prev_tab)
      prev_tab.focus();
    else
      this.tabs[this.tabs.length-1].focus();

    tab_bar.focusTab(app.current_tab);
  },
  next: function(){
    if(!app.current_tab)
      return;

    var next_tab = this.tabs[this.tabs.indexOf(app.current_tab)+1];
    if(next_tab)
      next_tab.focus();
    else
      this.tabs[0].focus();

    tab_bar.focusTab(app.current_tab);
  },
  recoverCursorPositions: function(){
    for(var i in this.tabs){
      this.tabs[i].code_panel.recoverCursorPosition();
    }
  },
  addTab: function(options){
    if(this.fileIsOpen(options.fullpath)){
      this.focusFile(options.fullpath);
      tab_bar.focusTab(app.current_tab);
      return;
    }
    this.tabs.push(tab(options).focus());
    tab_bar.focusTab(app.current_tab);
    this.update();
  },
  get open_files(){
    var files = [];
    for(var i in this.tabs){
      files.push(this.tabs[i].fullpath)
    }
    return files;
  },
  update: function(){
  }
}

var tab = function(options){
  var tab = {
    $tab: null,
    fullpath: options.fullpath,
    code_panel: code_panel().init(options),
    focus: function(){
      if(app.current_tab)
        app.current_tab.hide();

      app.current_tab = this;
      app.projectStorage.set('current_file', this.fullpath);

      this.$tab.addClass('active');
      this.code_panel.focus();

      return this;
    },
    hide: function(){
      this.$tab.removeClass('active');
      this.code_panel.hide();
    },
    save: function(options){
      var _this = this;

      project_source.save_file({
        contents: this.code_panel.text,
        fullpath: this.fullpath
      }, function(data){
        if(data.success){
          _this.code_panel.setState(code_states.SAVED);
          _this.code_panel.savedValue = _this.code_panel.text;
        }
      });
    },
    remove: function(){
      this.code_panel.close();
      this.$tab.remove();

      var index = $.inArray(this, tab_bar.tabs);
      tab_bar.tabs.splice(index, 1);

      file_browser.fileClosed(this.fullpath);

      if(app.current_tab == this)
        app.current_tab = null;

      var prev_tab = tab_bar.tabs[index-1] || tab_bar.tabs[0];
      if(prev_tab)
        prev_tab.focus();
      else
        file_browser.show();
    },
    close: function(){
      var _this = this;
      if(this.code_panel.state == code_states.DIRTY)
        vex.dialog.confirm({
          message: "Unsaved changes! Discard?",
          callback: function(result){
            if(result)
              _this.remove();
          }
        });
      else
        this.remove();
    },
    setState: function(state){
      var state_indicator =  tab_states[state] ? '['+tab_states[state]+']' : '';
      this.$tab.find('.name').html(state_indicator+tab.code_panel.name);
    }
  };

  tab.code_panel.tab = tab;

  tab.$tab = $('<div></div>')
    .addClass('tab')
    .html($('<span></span>')
      .addClass('name')
      .html(tab.code_panel.name))
    .on('click', function(e){
      tab.focus();
    })
    .append($('<div></div>')
      .addClass('close')
      .html('x')
      .on('click', function(e){
        tab.close();
      }))
    .insertBefore(tab_bar.$newTab);

  return tab;
}
