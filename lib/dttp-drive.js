const Dat = require('dat-node')
const HashMap = require('hashmap')
const url = require('url')

function noop () {}

class Drive {
  constructor (tmp) {
    this.archives = new HashMap()
    this.tmp = tmp
  }

  init (path, cb) {
    const self = this
    if (Array.isArray(path)) {
      path.forEach((v) => self.init(v, noop))
    } else if (typeof paths === 'string') {
      this.loadDat(path)
    }
    cb()
  }

  request (link, cb) {
    var parsed = (link.startsWith('/')) ? link : url.parse(link)
    if (this.archives.has(parsed.host)) {
      cb(this.archives.get(parsed.host))
    } else {
      this.loadDat(link, (dat) => cb(dat.archive))
    }
  }

  loadDat (link, cb) {
    const self = this
    const key = (link.startsWith('dat://')) ? url.parse(link).host : link
    console.log('loading dat://' + key)

    Dat(this.tmp + key + '/', {
      // temp: true,
      key: key,
      upload: false,
      sparse: true
    }, function (err, dat) {
      if (err) throw err

      dat.joinNetwork((err) => {
        if (err) throw err

        if (!dat.network.connected || !dat.network.connecting) {
          console.error('No users currently online for key ' + link)
        }
      })

      /* dat.network.on('connection', function () {
        console.log('connected to peer for key ' + key)
      }) */

      self.archives.set(/* dat.archive.discoveryKey */ key, dat.archive)
      cb(dat)
    })
  }
}

module.exports = Drive
