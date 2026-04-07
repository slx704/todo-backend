const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const app = express()
const port = 3000

// 中间件
app.use(cors())
app.use(express.json())

// 密钥（生产环境请使用环境变量）
const JWT_SECRET = 'your-secret-key-change-this'

// ---------- 内存存储（重启会丢失，后续可换数据库）----------
let users = []        // { id, username, password }
let nextUserId = 1

let tasks = []        // { id, text, done, userId }
let nextTaskId = 1

// ---------- 认证中间件 ----------
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ error: '未提供认证信息' })
    }
    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded   // { userId, username }
        next()
    } catch (err) {
        return res.status(401).json({ error: '无效的 token' })
    }
}

// ---------- 用户路由 ----------
// 注册
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' })
    }
    const existingUser = users.find(u => u.username === username)
    if (existingUser) {
        return res.status(400).json({ error: '用户名已存在' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = { id: nextUserId++, username, password: hashedPassword }
    users.push(newUser)
    const token = jwt.sign({ userId: newUser.id, username }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: newUser.id, username } })
})

// 登录
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body
    const user = users.find(u => u.username === username)
    if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' })
    }
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
        return res.status(401).json({ error: '用户名或密码错误' })
    }
    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, username } })
})

// ---------- 任务路由（需要认证）----------
// 获取当前用户的所有任务
app.get('/tasks', authenticate, (req, res) => {
    const userTasks = tasks.filter(t => t.userId === req.user.userId)
    res.json(userTasks)
})

// 添加任务
app.post('/tasks', authenticate, (req, res) => {
    const { text } = req.body
    if (!text) {
        return res.status(400).json({ error: 'text is required' })
    }
    const newTask = { id: nextTaskId++, text, done: false, userId: req.user.userId }
    tasks.push(newTask)
    res.status(201).json(newTask)
})

// 修改任务（切换完成状态）
app.put('/tasks/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id)
    const task = tasks.find(t => t.id === id && t.userId === req.user.userId)
    if (!task) {
        return res.status(404).json({ error: 'Task not found' })
    }
    const { done, text } = req.body
    if (done !== undefined) task.done = done
    if (text !== undefined) task.text = text
    res.json(task)
})

// 删除任务
app.delete('/tasks/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id)
    const index = tasks.findIndex(t => t.id === id && t.userId === req.user.userId)
    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' })
    }
    tasks.splice(index, 1)
    res.status(204).send()
})

// 清空所有任务（只清空当前用户的）
app.delete('/tasks', authenticate, (req, res) => {
    tasks = tasks.filter(t => t.userId !== req.user.userId)
    res.status(204).send()
})

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:3000`)
})