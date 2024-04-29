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

  console.log(country)
  var url = 'https://newsapi.org/v2/top-headlines?' +
          `q=${country}&` +
          'apiKey=' + '2546a9a33a3e464ca8d5887df53c14d6'
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