var file_browser = {
  $wrapper: null,
  $searchResults: null,
  $div: null,
  visible: false,
  structure: {},
  fuse: null,
  init: function(){
    this.$wrapper = $('<div></div>')
      .attr('id', 'file-browser')
      .appendTo('body');

    this.$div = $('<div></div>')
      .addClass('file-structure')
      .addClass('inner')
      .appendTo(this.$wrapper);

    this.$searchInput = $('<input>')
      .addClass('search-input')
      .on('keydown', function(e){
        if(e.which == key_bindings.keys.ESC) {
          e.preventDefault();
          file_browser.hide();
        } else if(e.which == key_bindings.keys.UP) {
          e.preventDefault();
          file_browser.highlightPrevious();
        } else if(e.which == key_bindings.keys.DOWN) {
          e.preventDefault();
          file_browser.highlightNext();
        } else if(e.which == key_bindings.keys.ENTER) {
          e.preventDefault();
          file_browser.openHighlighted();
        }
      })
      .on('keyup', function(e){
        if(key_bindings.inKeys(e.which)){
          e.preventDefault();
          return;
        }

        clearTimeout(file_browser.searchTimer);

        var term = $(this).val();
        if(!file_browser.visible || !term)
          return file_browser.hideSearchResults();

        file_browser.searchTimer = setTimeout(function(){
          file_browser.searchStructureForFiles(term);
        },200);
      })
      .appendTo(this.$wrapper);

    this.$searchResults = $('<div></div>')
      .addClass('inner')
      .addClass('search-results')
      .hide()
      .appendTo(this.$wrapper);

    this.$close = $('<div></div>')
      .addClass('close')
      .html('x')
      .on('click', function(e){
        if(app.current_tab)
          app.current_tab.focus();
        else
          file_browser.hide();
      })
      .appendTo(this.$wrapper);

    this.getStructure();

    this.contextMenu = context.attach(this.$div, this.getDirContextMenus());

    return this;
  },
  getDirContextMenus: function(){
    return [
      {
        text: 'New File',
        action: function(e){
          console.log($(this));
        }
      }
    ];
  },
  highlightStructure: function(){
    $('.highlighted').removeClass('highlighted');
    this.$searchResults.find('.file,.folder').first().addClass('highlighted');
  },
  highlightNext: function(){
    var $next = $('.highlighted:first').removeClass('highlighted').next('.file,.folder').filter(':visible');

    if($next.length > 0)
      $next.addClass('highlighted');
    else
      this.$searchResults.find('.file,.folder').filter(':visible').filter(':first').addClass('highlighted');
  },
  highlightPrevious: function(){
    var $prev = $('.highlighted:first').removeClass('highlighted').prev('.file,.folder').filter(':visible');

    if($prev.length > 0)
      $prev.addClass('highlighted')
    else
      this.$searchResults.find('.file,.folder').filter(':visible').filter(':last').addClass('highlighted');
  },
  openHighlighted: function(){
    $('.highlighted:first').trigger('click');
  },
  hideSearchResults: function(){
    this.$searchResults.hide();
    this.$searchInput.val('');
    this.$div.show();
  },
  showSearchResults: function(){
    this.$searchResults.show();
    this.$div.hide();

    this.highlightStructure();
  },
  allFilesFromStructure: function(structure){
    var files = [];

    for(var i in structure.files)
      files.push(structure.files[i]);

    for(var i in structure.dirs){
      files.push.apply(files, file_browser.allFilesFromStructure(structure.dirs[i]));
    }

    return files;
  },
  searchStructureForFiles: function(term){
    var matches = {},
        term = term.toLowerCase();

    // if(!file_browser.fuse)
    //  file_browser.fuse = new Fuse(file_browser.allFilesFromStructure(file_browser.structure), {keys: ['name', 'fullpath'], threshold: 0.4});
    //
    //matches = file_browser.fuse.search(term);

    if(!file_browser.all_files)
      file_browser.all_files = file_browser.allFilesFromStructure(file_browser.structure);

    var matches = file_browser.all_files.filter(function(item) {
        var j = 0; // remembers position of last found character

        // consider each search character one at a time
        for (var i = 0; i < term.length; i++) {
            var l = term[i];
            if (l == ' ') continue;     // ignore spaces

            j = item.fullpath.toLowerCase().indexOf(l, j);     // term for character & update position
            if (j == -1) return false;  // if it's not found, exclude this item
        }
        return true;
    });

    this.$searchResults.empty();
    this.drawSearchResults(matches, this.$searchResults);
    this.showSearchResults();
    this.highlightStructure();
  },
  toggle: function(){
    this.visible ? this.hide() : this.show();
  },
  hide: function(){
    if(!this.visible)
      return;

    this.visible = false;
    $('.dropdown-menu').fadeOut(100);

    this.hideSearchResults();
    this.$wrapper.stop(true, false).animate({
      left: '-30%'
    }, 150);

    if(app.current_tab)
      app.current_tab.focus();
  },
  focus: function(){
    this.$searchInput.focus();
  },
  show: function(){
    if(this.visible)
      return;
    this.$wrapper.stop(true, false).animate({
      left: '0%'
    }, 150);

    this.focus();

    this.highlightStructure();

    this.visible = true;
  },

  loadFiles: function(files, callback){
    if((typeof files) == "string")
      files = [files];

    project_source.get_files({
      files: files
    }, function(data){
      for(var i in data){
        var file_data = data[i];

        if(tab_bar.fileIsOpen(file_data.fullpath))
          tab_bar.focusFile(file_data.fullpath);
        else {
          tab_bar.addTab(file_data);

          file_browser.fileOpened(file_data.fullpath);
        }
      }

      if(callback) callback();
    });
  },
  restoreOpenedFiles: function(){
    var opened_files = app.projectStorage.get('opened_files'),
        previous_file = app.projectStorage.get('current_file');

    if(opened_files && opened_files.length > 0){
      app.projectStorage.set('opened_files', []);

      this.loadFiles(opened_files, function(){
        tab_bar.recoverCursorPositions();
        if(previous_file){
          tab_bar.focusFile(previous_file);
          tab_bar.focusTab(app.current_tab);
        }
      });
    } else {
      this.show();
    }
  },
  fileClosed: function(fullpath){
    var opened_files = app.projectStorage.get('opened_files'),
        index = $.inArray(fullpath, opened_files);

    opened_files.splice(index, 1);
    app.projectStorage.set('opened_files', opened_files);
  },
  fileOpened: function(fullpath){
    var opened_files = app.projectStorage.get('opened_files') ? app.projectStorage.get('opened_files') : [];

    if(opened_files && opened_files.indexOf(fullpath) == -1)
      opened_files.push(fullpath);

    app.projectStorage.set('opened_files', opened_files);
  },
  getStructure: function(){
    project_source.get_structure({working_dir: app.working_dir}, function(data){
      file_browser.structure = data;
      file_browser.createStructure(data);
    });

    return this;
  },
  createStructure: function(data){
    this.$div.empty();
    this.drawDirs(data.dirs, this.$div);
    this.drawFiles(data.files, this.$div);
  },
  drawDirs: function(dirs, $parent){
    for(var name in dirs){
      var dir = dirs[name];

      var $contents = $('<div></div>')
        .addClass('contents');

      var $label = $('<span></span>')
        .html(name+'/');

      var $dir = $('<div></div>')
        .html($label)
        .addClass('folder')
        .attr('data-fullpath', dir.fullpath)
        .append($contents)
        .appendTo($parent)
        //.on('contextmenu', function(e){
        //  e.preventDefault();
        //  console.log('CONTEXT MENU FOR FOLDER')
        //})
        .on('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          $(this).find('.contents:first').toggle();
        });

      if(dir.dirs)
        file_browser.drawDirs(dir.dirs, $contents);

      if(dir.files)
        file_browser.drawFiles(dir.files, $contents);
    }
  },
  drawFiles: function(files, $parent){
    var $files = [];

    for(var i in files){
      var file = files[i];

      var $label = $('<span></span>')
        .html(file.name);

      $files.push(
        $('<div></div>')
        .html($label)
        .addClass('file')
        .attr('data-fullpath', file.fullpath)
        .on('click', function(e){
          e.preventDefault();
          e.stopPropagation();

          file_browser.loadFiles($(this).attr('data-fullpath'), function(){
            file_browser.hide();
          });
        })
      );
    }
    $parent.append($files);
  },
  drawSearchResults: function(files){
    var $files = [];

    for(var i in files){
      var file = files[i];

      var $label = $('<p></p>')
        .html(file.name);

      var $dir = $('<p></p>')
      	.addClass('info-dir')
        .html(file.fullpath.replace(app.working_dir, '').replace(file.name, ''));

      $files.push(
        $('<div></div>')
        .html($label)
        .append($dir)
        .addClass('file')
        .attr('data-fullpath', file.fullpath)
        .on('click', function(e){
          e.preventDefault();
          e.stopPropagation();

          file_browser.loadFiles($(this).attr('data-fullpath'), function(){
            file_browser.hide();
          });
        })
      );
    }

    this.$searchResults.append($files);
  }
}
