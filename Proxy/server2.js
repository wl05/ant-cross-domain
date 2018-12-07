const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
    var data = {
        name : 'demo',
    };
    ctx.response.body = data;
});

app.listen(3001);
