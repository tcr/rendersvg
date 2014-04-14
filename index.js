var fs = require('fs');
var path = require('path');

var phantom = require('node-phantom');
var temp = require('temp');

function conversion (xml, ext, callback) {
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
                callback(info.path);
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
}

exports.renderStream = function (ext) {
  ext = ext || 'png';

  var buf = [];
  var ins = new (require('stream').Duplex)();
  ins.write = function (chunk, encoding, next) {
    buf.push(chunk);
    next();
  }
  ins.on('finish', function () {
    var xml = String(Buffer.concat(buf));
    conversion(xml, ext, function (imgpath) {
      var str = fs.createReadStream(imgpath);
      str.on('data', function (data) {
        ins.push(data);
      })
      str.on('end', function (data) {
        ins.end(data);
      })
    })
  })
  return ins;
}

exports.render = function (buf, ext, next) {
  if (typeof ext == 'function') {
    next = ext;
    ext = 'png';
  }
  ext = ext || 'png';

  var xml = buf.toString('utf-8');
  conversion(xml, ext, function (imgpath) {
    next(null, fs.readFileSync(imgpath));
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