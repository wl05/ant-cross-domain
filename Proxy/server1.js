const Koa = require('koa');
const app = new Koa();
const axios = require('axios')
app.use(async ctx => {
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set("Content-Type", "application/json; charset=utf-8'")
    const res = await axios.get('http://127.0.0.1:3001');
    ctx.response.body = res.data
});
app.listen(3000);
