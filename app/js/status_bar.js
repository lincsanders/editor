var status_bar = {
	$bar: null,
	init: function(){
		this.$bar = $('<div></div>')
			.addClass('status-bar');

		return this;
	},
	show: function(){
		this.$bar.appendTo($('body'));
		this.characters.show();
		this.lines.show();
		this.project_info.show();
	},
	buildAmounts: function(){
		return $('<span class="current">0</span>/<span class="total">');
	},
	update: function(){
		this.characters.update();
		this.lines.update();
	}
};

status_bar.characters = {
	$div: $('<pre></pre>')
		.addClass('status-bar-item')
		.append('character: ')
		.append(status_bar.buildAmounts()),
	show: function(){
		this.$div.appendTo(status_bar.$bar);
	},
	update: function(){
		var current = app.current_code_panel.current_character,
			total = app.current_code_panel.total_characters;

		this.$div.find('.current').html(current);
		this.$div.find('.total').html(total);
	}
};

status_bar.lines = {
	$div: $('<pre></pre>')
		.addClass('status-bar-item')
		.append('line: ')
		.append(status_bar.buildAmounts()),
	show: function(){
		this.$div.appendTo(status_bar.$bar);
	},
	update: function(){
		var current = app.current_code_panel.current_line + 1,
			total = app.current_code_panel.total_lines;

		this.$div.find('.current').html(current);
		this.$div.find('.total').html(total);
	}
};

status_bar.project_info = {
  $div: $('<pre></pre>'),
  show: function(){
		this.$div
			.addClass('status-bar-item-right')
			.append(project_source.remote_server ? 'Remote Server: '+project_source.remote_server_name+' ' : '')
			.append('Working Dir: '+app.working_dir);
		this.$div.appendTo(status_bar.$bar);
  }
};
