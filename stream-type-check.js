const through = require('through')
const bufferEqual = require('buffer-equal')

const PNG = {
  strict: true,
  signature: Buffer([137, 80, 78, 71, 13, 10, 26, 10])
}

const SVG = {
  strict: false,
  signature: 'http://www.w3.org/2000/svg'
}

module.exports = typeCheck;

function typeCheck(stream, callback) {
  var buf = Buffer(0)
  var restream = through()

  function onData (data) {
    buf = Buffer.concat([buf, data])
    if (buf.length < 256) return

    if (stream.removeListener)
      stream.removeListener('data', onData)

    var type
    if (check(buf, PNG))
      type = 'image/png'
    else if (check(buf, SVG))
      type = 'image/svg+xml'
    else
      type = 'unknown'

    callback(null, type, restream)

    restream.write(buf)
    if (stream.pipe)
      stream.pipe(restream)
    else
      restream.end()
  }

  if (!stream.pipe)
    return onData(Buffer(stream))

  stream.on('data', onData)
}

function check(bytes, type) {
  const siglen = type.signature.length

  if (type.strict)
    return bufferEqual(bytes.slice(0, siglen), type.signature)

  if (typeof type.signature == 'string')
    return bytes.toString('ascii').indexOf(type.signature) > -1

  return false
}
