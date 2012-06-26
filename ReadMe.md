# Gignal stream for #rf12

## Install

1. git clone `git@github.com:webjay/rf12.git`
2. cd rf12
3. git submodule init
4. git submodule update
5. open widget/index.html

### Mustache templates

#### Install

1. npm install -g hogan.js

#### Compile

1. hulk widget/mustaches/frame_*.mustache > widget/js/frame_templates.js
2. hulk widget/mustaches/screen_*.mustache > widget/js/screen_templates.js
