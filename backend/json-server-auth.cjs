const jsonServer = require('json-server')
const path = require('path')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, '../db/db.json'))
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// Minimal auth endpoint backed by json-server users collection
server.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' })
  }

  const db = router.db
  const user = db.get('users').find({ username, password }).value()
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  }
  return res.json({ user: safeUser })
})

server.use(router)

const port = process.env.PORT || 4000
server.listen(port, () => {
  console.log(`JSON Server with auth listening on http://localhost:${port}`)
})
