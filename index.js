const connect = require('connect')
const serveStatic = require('serve-static')
const vhost = require('vhost')
const DattpServer = require('./lib/dttp-webserver')
const DattpDrive = require('./lib/dttp-drive')
const HashMap = require('hashmap')
const url = require('url')
const datDns = require('dat-dns')()

const hostname = 'localhost'
const protocol = 'http://'
const www = './www/'
const tmp = 'D:/tmp/'
const port = 80

var mainapp = connect()
mainapp.use(serveStatic(www))

const drive = new DattpDrive(tmp)
const webserver = new DattpServer(drive, hostname, protocol)

var datapp = connect()

const datmap = new HashMap()
const aliasmap = new HashMap()

mainapp.use('/dat', (req, res, next) => {
  const parsed = url.parse(req.url, true)
  const path = (parsed.query) ? parsed.query.page : null
  if (path) {
    datDns.resolveName(path, (err, daturl) => {
      if(err){
        redirect(res, '/404.html')
        return
      }
      var alias = null
      if (aliasmap.has(daturl)) {
        // dat already loaded
        alias = aliasmap.get(daturl)
      } else {
        // dat is new
        alias = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36)
        datmap.set(alias, [])
        aliasmap.set(daturl, alias)
        drive.loadDat(daturl, (dat) => {
          var cbs = datmap.get(alias)
          datmap.set(alias, dat)
          cbs.forEach(cb => cb())
        })
      }

      redirect(res, protocol + '//' + alias + '.' + hostname + '/dat?page=dat://' + daturl)
    })
  } else {
    redirect(res, '/404.html')
  }
})

datapp.use(function (req, res, next) {
  const alias = req.vhost[0]

  if (req.url.startsWith('/dat?')) {
    if (!datmap.has(alias)) {
      redirect(res, protocol + '//' + hostname + req.url)
      return
    } else {
      webserver.sendTemplate(alias, res)
      return
    }
  }

  if (!datmap.has(alias)) {
    res.writeHead(404, 'alias not found')
    res.end()
    return
  }

  if (Array.isArray(datmap.get(alias))) {
    datmap.get(alias).push(send)
  } else {
    send()
  }

  function send () {
    const dat = datmap.get(alias)
    const path = req.url
    const key = (dat.key) ? dat.key.toString('hex') : 'error'
    console.log('sending dat://' + key + path)
    try {
      webserver.handleRequest(dat.archive, req, res)
    } catch (e) {
      console.log(e)
    }
  }
})

var app = connect()
app.use(vhost(hostname, mainapp))
app.use(vhost('www.' + hostname, mainapp))

app.use(vhost('*.' + hostname, datapp))
app.listen(port, () => console.log('webserver running on port ' + port))

function redirect (res, page) {
  res.writeHead(302, {
    'Location': page
  })
  res.end()
}
