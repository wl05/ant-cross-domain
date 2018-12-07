# 跨域总结

本篇通过实例讲解前端跨域的各种解决方案，结合具体的例子，加深对前后端跨域的理解。

## 1. 同源的概念

* 协议相同
* 域名相同
* 端口相同

举例来说，http://www.example.com/dir/page.html这个网址，协议是http://，域名是www.example.com，端口是80（默认端口可以省略）。它的同源情况如下。

* http://www.example.com/dir2/other.html：同源
* http://example.com/dir/other.html：不同源（域名不同）
* http://v2.www.example.com/dir/other.html：不同源（域名不同）
* http://www.example.com:81/dir/other.html：不同源（端口不同）

## 2. 跨域解决方案

###  JSONP

JSONP是服务器与客户端跨源通信的常用方法。最大特点就是简单适用，老式浏览器全部支持，服务器改造非常小。

它的基本思想是，网页通过添加一个<script>元素，向服务器请求JSON数据，这种做法不受同源政策限制；服务器收到请求后，将数据放在一个指定名字的回调函数里传回来。
由于  <font color="#00dddd"><script></font>元素请求的脚本，直接作为代码运行。这时，只要浏览器定义了foo函数，该函数就会立即调用。作为参数的JSON数据被视为JavaScript对象，而不是字符串，因此避免了使用JSON.parse的步骤。


* Server

```js
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
````

* Front

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JSON 跨域</title>
    <script src="https://code.jquery.com/jquery-3.3.1.js"></script>
</head>
<body>
<!-- 通过原生使用 script 标签 -->
<script>
    function jsonpCallback (data) {
        console.log(data);
    }
</script>
<script src="http://localhost:3000?callback=jsonpCallback"></script>

<!-- AJAX GET 请求 -->
<!-- <script>
    function jsonpCallback(data) {
        console.log(data);
    }
    $.ajax({
        type: 'GET',
        url: 'http://localhost:3000',
        dataType: 'jsonp',
        jsonpCallback: 'jsonpCallback'
    })
</script> -->
</body>
</html>
```

* 优缺点：

兼容性好，低版本的 IE 也支持这种方式。

只能支持 GET 方式的 HTTP 请求。

只支持前后端数据通信这样的 HTTP 请求，并不能解决不同域下的页面之间的数据交互通信问题。

### 2. CORS

CORS是跨源资源分享（Cross-Origin Resource Sharing）的缩写。它是W3C标准，是跨源AJAX请求的根本解决方法。相比JSONP只能发GET请求，CORS允许任何类型的请求。

CORS 跨域资源共享允许在服务端进行相关设置后，可以进行跨域通信。

服务端未设置 CORS 跨域字段，服务端会拒绝请求并提示错误警告

服务端设置 Access-Control-Allow-Origin 字段，值可以是具体的域名或者 '*' 通配符，配置好后就可以允许跨域请求数据。

具体的细节可以参考这篇文站[跨域资源共享 CORS 详解
](http://www.ruanyifeng.com/blog/2016/04/cors.html)

* server

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
    // ctx.body = 'Hello World';
    var data = {
        name : 'demo',
    };
    var callback = ctx.query.callback;
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.response.body = `${callback}(${JSON.stringify(data)})`;
});

app.listen(3000);
```

* Front
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CORS 跨域</title>
    <script src="https://code.jquery.com/jquery-3.3.1.js"></script>
</head>
<body>
<script>
    $.ajax({
        type: 'post',
        url: 'http://localhost:3000',
        success: function(res) {
            console.log(res);
        }
    })
</script>
</body>
</html>
```

### 3. Server Proxy

关于服务端代理请求我们先来看demo。

* server1
```js
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
```

* server2

```js
const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
    var data = {
        name : 'demo',
    };
    ctx.response.body = data;
});

app.listen(3001);
```
* front
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Proxy 代理</title>
    <script src="https://code.jquery.com/jquery-3.3.1.js"></script>
</head>
<body>
<script>
    $.ajax({
        type: 'post',
        url: 'http://localhost:3000',
        success: function(res) {
            console.log(res);
        }
    })
</script>
</body>
</html>
```

我们的前端需要请求server2 中的资源，由于存在跨域无法获取到，我们起一个代理服务器server1，前端向server1发起请求，再由server1向server2发起请求，由于服务端并不受同源策略的限制，也就不存在跨域的问题。所以说server1可以获取到server2中资源。server1获取到资源后再将资源返回给前端。这就是服务端代理请求的基本思路。

### 4. location.hash + iframe
两个网页一级域名相同，只是二级域名不同，浏览器允许通过设置document.domain共享资源。这种方法只适用于 Cookie 和 iframe窗口。设置相同的document.domain，两个网页就可以共享Cookie。
* a.html
```html
<iframe src="a.ant.com/a.html"></iframe>
<script>
    document.domain = 'ant.com';
</script>
```
* b.html
```html
<script>
    // 设置之后就可获取项目页面中定义的公共资源了
    document.domain = 'ant.com';
</script>
```

### 5. window.postMessage

这是HTML5引入的跨文档通信API，window.postMessage 允许跨页面通信，不管这两个页面是不是同源,我们来看代码。

* server

```
const Koa = require('koa');
const static = require('koa-static')
const path = require('path')
const app = new Koa();
const staticPath = './'
app.use(static(
    path.join(__dirname, staticPath)
))
app.listen(3000);
```
* a.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JSON 跨域</title>
</head>
<body>
<script>
    var popup = window.open('http://localhost:3000/b.html', 'title');
    popup.postMessage('Hello', 'http://localhost:3000/b.html');
    window.addEventListener('message', function (event) {
        console.log(event.data);
    }, false);
</script>
</body>
</html>
```
* b.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JSON 跨域</title>
</head>
<body>
<script>
    window.addEventListener('message', function (event) {
        if (event.origin !== 'http://localhost:3000') return;
        if (event.data === 'Hello') {
            event.source.postMessage('Hello World', event.origin + '/a.html');
        } else {
            console.log(event.data);
        }
    }, false);
</script>
</body>
</html>
```

我们通过postMessage方法从a.html页面向b.html页面发送消息，然后我们在b.html页面中监听message,从而监听a.html页面发送过来的消息，这里的event对象包含三个属性值：
```md
* event.source：发送消息的窗口
* event.origin: 消息发向的网址
* event.data: 消息内容
```
同理我们也可以在a.html中监听b.html中返回的消息。

### 5. window.name + iframe

浏览器窗口有window.name属性。这个属性的最大特点是，无论是否同源，只要在同一个窗口里，前一个网页设置了这个属性，后一个网页可以读取它。

实现思路:

http://localhost:3000/a.html 与 http://localhost:3001/b.html 跨域通信，a 页面通过 iframe 嵌套 b 页面，b 页面中设置好  window.name  的值，由于是不同域，a 页面不能直接访问到 b 页面设置的 window.name 的值，需要一个与 a 页面同域的中间页c.html来代理作为 a 页面与 b 页面通信的桥梁。

* a.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CORS 跨域</title>
</head>
<body>
<script>
    var data = null;
    var state = 0;
    var iframe = document.createElement('iframe');
    iframe.src = "http://localhost:3001/b.html";
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.onload = function () {
        if (state === 0) {
            iframe.src = "http://localhost:3000/c.html";
            state = 1;
        } else if (state === 1) {
            data = iframe.contentWindow.name;
            console.log('收到数据:', data);
        }
    }
</script>
</body>
</html>
```
* b.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CORS 跨域</title>
</head>
<body>
<script>
    window.name = 'Hello world';
</script>
</body>
</html>
```
* c.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CORS 跨域</title>
</head>
<body>
</body>
</html>
```
### 6. location.hash + iframe

location.hash + iframe 跨域通信的实现是这样的：

* 不同域的 a 页面与 b 页面进行通信，在 a 页面中通过 iframe 嵌入 b 页面，并给 iframe 的 src 添加一个 hash 值。
* b 页面接收到了 hash 值后，确定 a 页面在尝试着与自己通信，然后通过修改 parent.location.hash 的值，将要通信的数据传递给 a 页面的 hash 值。
* 但由于在 IE 和 Chrmoe 下不允许子页面直接修改父页面的 hash 值，所以需要一个代理页面，通过与 a 页面同域的 c 页面来传递数据。
* 同样的在 b 页面中通过 iframe 嵌入 c 页面，将要传递的数据通过  iframe 的 src 链接的 hash 值传递给 c 页面，由于 a 页面与 c 页面同域，c 页面可以直接修改 a 页面的 hash 值或者调用 a 页面中的全局函数。

* a.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>跨域</title>
</head>
<body>
<script>
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = "http://localhost:3001/b.html#data";
    document.body.appendChild(iframe);

    function checkHash () {
        try {
            var data = location.hash ? location.hash.substring(1) : '';
            console.log('获得到的数据是：', data);
        } catch (e) {
        }
    }

    window.addEventListener('hashchange', function (e) {
        console.log('监听到hash的变化：', location.hash.substring(1));
    })
</script>
</body>
</html>
```

* b.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>跨域</title>
</head>
<body>
<script>
    switch (location.hash) {
        case '#data':
            callback();
            break;
    }

    function callback () {
        var data = "aHash"
        try {
            parent.location.hash = data;
        } catch (e) {
            var ifrproxy = document.createElement('iframe');
            ifrproxy.style.display = 'none';
            ifrproxy.src = 'http://localhost:3000/c.html#' + data;
            document.body.appendChild(ifrproxy);
        }
    }
</script>
</body>
</html>
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>跨域</title>
</head>
<body>
<script>
    parent.parent.location.hash = self.location.hash.substring(1);
    parent.parent.checkHash();
</script>
</body>
</html>
```

### 7. WebSocket

WebSocket是一种通信协议，使用ws://（非加密）和wss://（加密）作为协议前缀。该协议不实行同源政策，只要服务器支持，就可以通过它进行跨源通信。我们来看demo。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>跨域</title>
</head>
<body>
<script>
    var ws = new WebSocket('ws://localhost:8080');
    ws.onopen = function () {
        console.log('ws onopen');
        ws.send('from client: hello');
    };
    ws.onmessage = function (e) {
        console.log('ws onmessage');
        console.log('from server: ' + e.data);
    };
</script>
</body>
</html>
```

```js
const Koa = require('koa');
const app = new Koa();
const WebSocket = require('ws');
const static = require('koa-static');
const staticPath = './'
const path = require('path')
const wss = new WebSocket.Server({port : 8080});
wss.on('connection', function connection (ws) {
    console.log('server: receive connection.');
    ws.on('message', function incoming (message) {
        console.log('server: received: %s', message);
    });
    ws.send('world');
});

app.use(static(
    path.join(__dirname, staticPath)
))
app.listen(3000);
```
(完)



