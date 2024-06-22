const express = require('express')
const app = express()
const port = 3000
const { get_balance_handler } = require("./handlers/get_balance")

app.use(express.json())

app.get('/get_balance', get_balance_handler)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})