// const url = require('url')
const mime = require('mime')
const watch = require('node-watch')
const fs = require('fs')
const path = require('path')

class DattpWebserver {
  constructor (drive) {
    const self = this
    this.drive = drive

    // auto-reload page if not yet loaded
    this.template = ['<html><script>location.reload()', '</script></html>']
    this.loadTemplate()
    watch(path.join(__dirname, '../templates/view.html'), {recursive: false}, function (evt, name) {
      self.loadTemplate()
      console.log('reloaded template')
    })
  }

  loadTemplate () {
    const self = this
    fs.readFile(path.join(__dirname, '../templates/view.html'), {encoding: 'utf-8', flag: 'r'}, (err, html) => {
      if (err) throw err

      self.template = html.split('{{token}}')
      if (self.template.length !== 2) throw new Error('template has != 1 {{token}} in it')
    })
  }

  sendTemplate (subdomain, res) {
    res.write(this.template[0] + 'const token = "' + subdomain + '" ' + this.template[1])
    res.end()
  }

  handleRequest (id, req, res) {
    const page = req.url.split('?')[0] // (dirty) Workaround - removes query
    const self = this
    if (id.key) {
      var dat = id
      if (typeof page !== 'string' || page === null) {
        console.log('no page specified')
        return
      }
      dat.stat(page, (err, stat) => {
        if (err) {
          if (err.status === 404) {
            res.writeHead(404, 'file not found')
            res.write('file not found :(')
          } else {
            res.write('error: ' + JSON.stringify(err))
          }
          res.end()
        } else {
          if (stat.isDirectory()) {
            dat.readdir('/', (err, strings) => {
              if (err) throw err
              if (strings.includes('index.html')) {
                self.printFile(dat, page + 'index.html', req, res)
              } else {
                self.printDir(dat, page, req, res)
              }
            })
          } else {
            self.printFile(dat, page, req, res)
          }
        }
      })
    }
    // })
  }

  printDir (dat, path, req, res) {
    console.log('read dir dat://' + dat.key.toString('hex') + path)
    dat.readdir(path, (err, strings) => {
      if (err) throw err
      console.log('done reading dir: ' + JSON.stringify(strings))
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.write(JSON.stringify(strings))
      res.end()
    })
  }

  printFile (dat, path, req, res) {
    var stream = dat.createReadStream(path)
    var type = mime.getType(path)
    res.writeHead(200, {'Content-Type': type})
    // const chunks = []
    const key = dat.key.toString('hex')
    console.log('send file dat://' + key + path + ' - type: ' + type)
    stream.pipe(res)
    stream.on('end', () => res.end())
  }
}

module.exports = DattpWebserver
