var project_source = require('./app/js/project_source'),
  express = require('express'),
  argv = require('optimist').argv,
  port = argv.p || 8118,
  file_structure = {},
  auth_token = argv.auth_token || Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2), // Do something better here?
  app = express();

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

app.use(express.bodyParser());

//Load the static app files
app.use(express.static('./app/'));
app.set('title', 'Editor');

requireAuthentication = function(req,res,next){
  if(req.body.auth_token == auth_token)
    next();
  else
    res.send({
      success: false,
      message: 'Authentication token invalid'
    });
}

console.log('Port: '+port);
console.log('Authentication Token: '+auth_token);

app.all('*', requireAuthentication);

app.post('/init_settings', function(req, res){
  res.send(project_source.init_settings(req.body));
});

app.post('/get_structure', function(req, res){
  res.send(project_source.get_structure(req.body));
});

app.post('/get_files', function(req, res){
  res.send(project_source.get_files(req.body));
});

app.post('/save_file', function(req, res){
  res.send(project_source.save_file(req.body));
});

app.listen(port);

