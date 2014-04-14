# rendersvg for Node.js

Renders SVGs using PhantomJS.

```javascript
var rendersvg = require('rendersvg');

instream.pipe(rendersvg.renderStream([ext = 'png'])).pipe(outstream)
// or
rendersvg.convert(inbuffer, [ext = 'png'], function (err, outbuf) {
	// ...
})
```

Possible extensions:

* png
* gif
* jpg
* pdf

## Requirements

**OS X:** ```brew install phantomjs```

## License

MIT.