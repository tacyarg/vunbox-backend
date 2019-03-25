// decrypt wax encoding...

const t = Buffer
const r = require('crypto')
const i = 'aes-256-ctr'

var n = r
  .createHash('sha256')
  .update(String('https://explorer.wax.io'))
  .digest()

module.exports = function decrypt(e) {
  if (null == e) throw new Error('value must not be null or undefined')
  var o,
    a = String(e),
    s = t.from(a.slice(0, 32), 'hex'),
    c = a.slice(32),
    u = !1
  try {
    o = r.createDecipheriv(i, n, s)
  } catch (d) {
    if ('Invalid IV length' !== d.message) throw d
    u = !0
  }
  if (!u) return o.update(c, 'hex', 'utf8') + o.final('utf8')
  var f = a.slice(0, 16),
    l = a.slice(16)
  return (
    (o = r.createDecipheriv(i, n, f)).update(l, 'hex', 'utf8') + o.final('utf8')
  )
}
