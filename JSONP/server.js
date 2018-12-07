const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
    var data = {
        name : 'demo',
    };
    var callback = ctx.query.callback;
    ctx.response.body = `${callback}(${JSON.stringify(data)})`;
});

app.listen(3000);
