var settings = {
  defaults: {
    matchBrackets: true,
    autoCloseBrackets: true,
    font_size: 12,
    trigger_autocomplete_regex: "[a-zA-Z\>\.]"
  },
  get _settings(){
    return app.storage.get('settings') || {};
  },
  get: function(key){
    return this._settings[key] || this.defaults[key];
  },
  set: function(key, value){
    var settings = this._settings;
    settings[key] = value;

    return app.storage.set('settings', settings);
  }
}
