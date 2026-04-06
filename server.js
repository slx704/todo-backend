const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

// 中间件
app.use(cors())                 // 允许跨域
app.use(express.json())         // 解析 JSON 请求体

// 模拟数据库（内存数组）
let tasks = [
    { id: 1, text: '学习 Node.js', done: false },
    { id: 2, text: '改造待办清单', done: false }
]
let nextId = 3

// 获取所有任务
app.get('/tasks', (req, res) => {
    res.json(tasks)
})

// 添加任务
app.post('/tasks', (req, res) => {
    const { text } = req.body
    if (!text) {
        return res.status(400).json({ error: 'text is required' })
    }
    const newTask = { id: nextId++, text, done: false }
    tasks.push(newTask)
    res.status(201).json(newTask)
})

// 修改任务（切换完成状态）
app.put('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const task = tasks.find(t => t.id === id)
    if (!task) {
        return res.status(404).json({ error: 'Task not found' })
    }
    const { done, text } = req.body
    if (done !== undefined) task.done = done
    if (text !== undefined) task.text = text
    res.json(task)
})

// 删除任务
app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const index = tasks.findIndex(t => t.id === id)
    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' })
    }
    tasks.splice(index, 1)
    res.status(204).send()   // 无内容响应
})

// 清空所有任务
app.delete('/tasks', (req, res) => {
    tasks = []
    nextId = 1
    res.status(204).send()
})

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:3000`)
})