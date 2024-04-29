const express = require("express")
const app = express()
const port = 3000

/*
API Keys
b39af5e4fa24453cbef5da0e995041e1
2546a9a33a3e464ca8d5887df53c14d6
*/

app.get('/*', (req, res) => {
  const country = req.url.replace("/", "").replaceAll("%20", " ")

  // Set cors headers
  res.setHeader("Access-Control-Allow-Origin", 'http://localhost:5174')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

  let date = new Date()
  let year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate()
  // let year = 2024, month = 3, day = 1
  if (day <= 7) {
    if (month == 1) {
      year -= 1
      month = 12
    }
    else month -= 1

    day = day - 7
    switch (month) {
      case 1:
      case 3:
      case 5:
      case 7:
      case 8:
      case 10:
      case 12:
        day = 31 + day
        break;
      case 2:
        if (year % 4 == 0) day = 29 + day
        else day = 28 + day
        break;
      case 4:
      case 6:
      case 9:
      case 11:
        day = 30 + day
        break
    }
  }
  else day -= 7

  if (day < 10) day = `0${day}`
  if (month < 10) month = `0${month}`
  console.log(`Since ${year}-${month}-${day}`)
  console.log(country)
  var url = 'https://newsapi.org/v2/everything?' +
          `q=${country}&` +
          `from=${year}-${month}-${day}&sortBy=publishedAt&` +
          'apiKey=' + '2546a9a33a3e464ca8d5887df53c14d6'
  console.log(url)
  var req = new Request(url)
  fetch(req)
    .then(function(response) {
      return response.json()
    }).then((js) => {
      console.log(js)
      res.write(JSON.stringify(js))
      res.end()
    })
})

app.listen(port, () => {
  console.log(`Server running [${port}]`)
})