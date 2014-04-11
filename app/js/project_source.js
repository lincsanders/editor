var fs = require('fs'),
  format = require('util').format,
  express = require('express'),
  path = require('path');

var project_source = {
  remote_server: '',
  auth_token: '',
  init_settings: function(options, callback){
    if(this.remote_server)
      return this.remote_command('init_settings', options, callback);

    var fullpath = options.working_dir;

    if(!fs.existsSync(fullpath))
      return {
        success: false,
        message: "Specified path is not a file or folder"
      };

    var stat = fs.lstatSync(fullpath);

    if(stat.isFile())
      fullpath = path.dirname(fullpath);

    working_dir = fullpath;

    var results = {
      working_dir: working_dir,
      success: true
    };

    if(callback)
      callback(results);
    return results;
  },
  get_structure: function (options, callback) {
    if(this.remote_server)
      return this.remote_command('get_structure', options, callback);

    var files,
      structure,
      dir = options.working_dir;

    files = fs.readdirSync(dir);
    structure = {
      files: {},
      dirs: {}
    };

    files.forEach(function (file, index) {
      if (file[0] !== '.' && file !== 'node_modules') {
        var filepath = format('%s/%s', dir, file);
        var stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
	  structure['fullpath'] = dir;
          structure['dirs'][file] = project_source.get_structure({
            working_dir: filepath
	  });
        } else {
          structure['files'][file] = {
            fullpath: filepath,
            name: file,
            working_dir: dir,
            extension: path.extname(file)
          };
        }
      }
    });

    if(callback)
      callback(structure);
    return structure;
  },
  get_files: function(options, callback){
    if(this.remote_server)
      return this.remote_command('get_files', options, callback);

    var files = options.files,
      response = [];

    for(var i in files){
      var fullpath = files[i];

      if(!fs.existsSync(fullpath))
        continue;

      var data = fs.readFileSync(fullpath);

      response.push({
        contents: data.toString(),
        name: path.basename(fullpath),
        fullpath: fullpath,
        extension: path.extname(fullpath)
      })
    }

    if(callback)
      callback(response);
    return response;
  },
  save_file: function(options, callback){
    if(this.remote_server)
      return this.remote_command('save_file', options, callback);

    try{
      fs.writeFile(options.fullpath, options.contents);
      var results = {
        success: true
      };
    } catch(e){
      var results = {
        success: false
      };
    }

    if(callback)
      callback(results);
    return results;
  },
  remote_command: function(cmd, options, callback){
    options.auth_token = this.auth_token;

    $.post(this.remote_server+'/'+cmd, options)
    .success(function(data){
      if(!data || data.success === false)
        vex.dialog.alert({
          message: data.message || 'An unknown remote error occured'
        })
      else
      	callback(data);
    })
    .error(function(){
      callback({
        success: false
      });
    });
  },
  get remote_server_name(){
    return this.remote_server.replace('http://', '');
  }
}

if(global.module)
  global.module.exports = project_source;
else
  module.exports = project_source
