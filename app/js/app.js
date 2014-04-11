var app = {
  code_panels: [],
  vexProjectPrompt: null,
  working_dir: '',
  current_tab: null,
  log: function(msg){
    console.log(msg);
  },
  increaseTextSize: function(){
  	var font_size = settings.get('font_size') + 1;

    if(font_size >= 48)
      font_size = 48;

    app.setTextSize(font_size);
    settings.set('font_size', font_size);
  },
  decreaseTextSize: function(){
  	var font_size = settings.get('font_size') - 1;

    if(font_size <= 1)
      font_size = 1;

    app.setTextSize(font_size);
    settings.set('font_size', font_size);
  },
  setTextSize: function(font_size){
    font_size = font_size || settings.get('font_size');

    $('.CodeMirror').css('font-size', font_size+'px');
    if(app.current_code_panel)
      app.current_code_panel.codeMirror.refresh();
  },
  saveRecentProjects: function(newProject){
    var recent_projects = this.getRecentProjects(),
        alreadyExists = false;

    for(var i in recent_projects){
      if(recent_projects[i].fullpath == newProject.fullpath && recent_projects[i].remote_server == newProject.remote_server)
        alreadyExists = true;
    }

    if(!alreadyExists)
      recent_projects.unshift(newProject);

    app.storage.set('recent_projects', recent_projects);
  },
  getRecentProjects: function(){
    return app.storage.get('recent_projects') ? app.storage.get('recent_projects') : [];
  },
  getProjectsPromptHtml: function(){
    var recent_projects = this.getRecentProjects();

    var elements = [
      '<input name="working_dir" type="text" placeholder="Project directory" id="open-project-working-dir" required>',
      '<input name="server" type="text" placeholder="Remote Server (server.local:port) (optional)" id="open-project-remote-server">',
      '<input name="auth_token" type="text" placeholder="Authentication Token (optional)" id="open-project-auth-token">',
      '<br><br>',
      '<p>Recent Projects:</p>'
    ];
    for(var i in recent_projects){
      var recent_project_file = recent_projects[i];

      elements.push(
        $('<div></div>')
        .html(
          $('<a href="#">'+recent_project_file.fullpath+(recent_project_file.remote_server ? '@'+recent_project_file.remote_server : '')+'</a>')
          .attr('data-fullpath', recent_project_file.fullpath)
          .attr('data-remote-server', recent_project_file.remote_server)
          .attr('data-auth-token', recent_project_file.auth_token)
          .on('click', function(){
            $('#open-project-working-dir').val($(this).attr('data-fullpath'));
            $('#open-project-remote-server').val($(this).attr('data-remote-server'));
            $('#open-project-auth-token').val($(this).attr('data-auth-token'));
          })
        )
      );
    }

    return elements;
  },
  get current_code_panel(){
    return this.current_tab ? this.current_tab.code_panel : null;
  },
  loadWorkingDirectory: function(data){
    var entered_working_dir = data.working_dir;
    context.init({
      fadeSpeed: 100,
      compress: true
    })

    if(!entered_working_dir)
      return app.promptForProject();
    if(data.server){
      project_source.remote_server = (data.server.indexOf('http://') == -1 ? 'http://' : '')+data.server;

      project_source.auth_token = data.auth_token;
    }

    project_source.init_settings({
      working_dir: data.working_dir
    }, function(data){
      if(!data.success){
        return vex.dialog.alert({
          message: '"' + entered_working_dir + '" could not be loaded. '+data.message,
          callback: app.promptForProject
        });
      }

      app.saveRecentProjects({
        fullpath: entered_working_dir,
        remote_server: project_source.remote_server_name,
        auth_token: project_source.auth_token
      });

      app.working_dir = data.working_dir || '';
      file_browser.init();
      tab_bar.init();

      file_browser.restoreOpenedFiles();

      key_bindings.init();
      status_bar.init().show();

      app.update();
    });
  },
  promptForProject: function(){
    app.vexProjectPrompt = vex.dialog.open({
      message: "Choose your working dir",
      buttons: [
        $.extend({}, vex.dialog.buttons.YES, {text: 'CODE'})
      ],
      input: app.getProjectsPromptHtml(),
      callback: app.loadWorkingDirectory
    });
  },
  init: function(working_dir){
    this.promptForProject();
  },
  projectStorage: {
    get: function(key){
      return app.storage.get(app.working_dir+'.'+key);
    },
    set: function(key, value){
      return app.storage.set(app.working_dir+'.'+key, value);
    }
  },
  storage: {
    get: function(key){
      var value = window.localStorage.getItem(key);

      try{
        value = JSON.parse(value);
      } catch(e){}

      return value;
    },
    set: function(key, value){
      if(value == null)
        return window.localStorage.removeItem(key);

      if(typeof(value) == 'object')
        value = JSON.stringify(value);

      return window.localStorage.setItem(key, value);
    }
  },
  update: function(){
    if(app.current_code_panel){
      app.current_code_panel.update();
      status_bar.update();
    }
  }
}
