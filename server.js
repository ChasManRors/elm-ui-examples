var autoprefixer = require('autoprefixer');
var exec = require('child_process').exec;
var router = require('koa-router')();
var serve = require('koa-static');
var sass = require('node-sass');
var app = require('koa')();
var fs = require('fs');

/* Renders the CSS */
function renderCSS(example){
  return function(callback){
    sass.render({
      file: `./source/${example}/main.scss`,
      includePaths: ['./vendor/elm-ui/stylesheets']
    }, function(err, result) {
      if(err){
        callback(null, err.formatted)
      } else {
        autoprefixer
          .process(result.css)
          .then(function(result2){
            callback(null, result2.css)
          })
      }
    });
  }
}

/* Renders the JS */
function renderElm(str) {
  return function(callback) {
    var cmd = `elm-make '${str}' --output test.js`;
    exec(cmd, function(error, stdout, stderr) {
      if (stderr) {
        err = stderr.replace(/\n/g,"\\n")
                    .replace(/"/g, '\\"')
        callback(null, `console.error("${err}")`);
      } else {
        callback(null, fs.readFileSync('test.js', 'utf-8'))
        fs.unlink('test.js')
      }
    });
  }
}

function renderHtml(str) {
  return `<html>
      <head>
      </head>
      <body style="overflow: hidden;margin:0;">
        <script src='${str}' type='application/javascript'>
        </script>
        <script>Elm.fullscreen(Elm.Main);</script>
      </body>
    </html>`
}

router.register('/:id/', ['GET'], function *(next) {
  this.body = renderHtml('main.js')
}, { strict: true })

router.get('/:id', function *(next) {
  this.redirect(`/${this.params.id}/`)
})

router.get('/:id/main.js', function *(next) {
  this.type = 'text/javascript';
  this.body = yield renderElm('source/MoneyTrack/Main.elm')
})

router.get('/:id/main.css', function *(next) {
  this.type = 'text/css';
  this.body = yield renderCSS(this.params.id)
})

app
  .use(router.routes())
  .use(serve('./public'));

app.listen(8001);

console.log("Listening on localhost:8001")
