var phantom = require('node-phantom');
var temp = require('temp');

module.exports = function (ins, out, ext) {
  ext = ext || 'png';
  var buf = [];
  ins.on('data', function (data) {
    buf.push(data);
  });
  ins.on('end', function (data) {
    if (arguments.length) {
      buf.push(data);
    }
    var xml = String(Buffer.concat(buf));
    phantom.create(function (err, ph) {
      if (err) { throw err; }
      ph.createPage(function (err, page) {
        if (err) { ph.exit(); throw err; }

        page.onLoadFinished = function () {
          getSvgDimensions(page, function (err, dimensions) {
            page.set('viewportSize', {
              width: dimensions.width,
              height: dimensions.height
            }, function () {
              temp.open({suffix: '.' + ext}, function (err, info) {
                page.render(info.path, function (err) {
                  fs.createReadStream(info.path).pipe(out);
                  ph.exit();
                });
              });
            });
          });
        };

        page.set('content', xml, function (err) {
          if (err) { ph.exit(); throw err; }
        });
      });
    });
  })
}

function getSvgDimensions(page, next) {
  page.evaluate(function () {
    var el = document.documentElement;
    var bbox = el.getBoundingClientRect();

    var width = parseFloat(el.getAttribute("width"));
    var height = parseFloat(el.getAttribute("height"));
    var viewBoxWidth = el.viewBox && el.viewBox.animVal && el.viewBox.animVal.width;
    var viewBoxHeight = el.viewBox && el.viewBox.animVal && el.viewBox.animVal.height;
    var usesViewBox = viewBoxWidth && viewBoxHeight;

    if (usesViewBox) {
      if (width && !height) {
        height = width * viewBoxHeight / viewBoxWidth;
      }
      if (height && !width) {
        width = height * viewBoxWidth / viewBoxHeight;
      }
      if (!width && !height) {
        width = viewBoxWidth;
        height = viewBoxHeight;
      }
    }

    if (!width) {
        width = bbox.width;
    }
    if (!height) {
        height = bbox.height;
    }

    return {
      width: width,
      height: height,
      usesViewBox: usesViewBox
    };
  }, next);
}