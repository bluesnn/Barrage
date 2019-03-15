let data = [{
    value: '111',
    speed: 2,
    time: 0,
    color: 'red',
    fontSize: 50
  },
  {
    value: '222',
    time: 1,
  },
  {
    value: '333',
    time: 2,
  }
];

let $ = document.querySelector.bind(document);
const canvas = $('#canvas');
const video = $('#video');

class Barrage { //渲染某一条弹幕的类
  constructor(obj, ctx) {
    this.value = obj.value; // 弹幕内容
    this.time = obj.time; // 弹幕时间
    this.obj = obj;
    this.ctx = ctx;
  }

  init() {
    this.opacity = this.obj.opacity || this.ctx.opacity;
    this.speed = this.obj.speed || this.ctx.speed;
    this.color = this.obj.color || this.ctx.color;
    this.fontSize = this.obj.fontSize || this.ctx.fontSize;

    // 求弹幕自己的宽度，目的来校验当前是否还需要继续绘制
    let span = document.createElement('span');
    span.innerText = this.value;
    span.style.font = this.fontSize + 'px "Microsoft YaHei"';
    span.style.position = 'absolute';
    document.body.appendChild(span);
    this.width = span.clientWidth; // 记录弹幕宽度
    document.body.removeChild(span);
    // 弹幕出现的位置
    this.x = this.ctx.canvas.width;
    this.y = this.ctx.canvas.height * Math.random();
    if (this.y < this.fontSize) {
      this.y = this.fontSize;
    }
    if (this.y > this.ctx.canvas.height - this.fontSize) {
      this.y = this.ctx.canvas.height - this.fontSize;
    }
  }

  render() {
    // 渲染自己,将自己画在画布上
    this.ctx.context.font = this.fontSize + 'px "Microsoft YaHei"';
    this.ctx.context.fillStyle = this.color;
    this.ctx.context.fillText(this.value, this.x, this.y);
  }
}

class CanvasBarrage { // 渲染canvas弹幕的类
  constructor(canvas, video, options = {}) {
    if (!canvas || !video) return;
    this.canvas = canvas;
    this.video = video;
    // 默认选项,弹幕默认值
    let defaultOptions = {
      fontSize: 20,
      color: 'gold',
      speed: 2,
      opacity: 0.3,
      data: []
    }
    // 对象合并，将属性全部挂载在实例上
    Object.assign(this, defaultOptions, options);
    this.context = canvas.getContext('2d'); // 获取canvas画布
    this.canvas.width = video.clientWidth; // 设置canvas和video等宽高
    this.canvas.height = video.clientHeight;
    this.isPaused = true // 是否暂停，默认暂停播放，表示不渲染弹幕
    // 存放所有弹幕,Barrage是创建弹幕实例的类
    this.barrages = this.data.map(obj => new Barrage(obj, this));
    // 渲染所有弹幕
    this.render();
  }

  renderBarrage() {
    // 将数组中的弹幕一个一个取出，判断时间和视频的时间是否符合，符合就执行渲染此弹幕
    let time = this.video.currentTime;

    this.barrages.forEach(barrage => {
      if (!barrage.flag && time >= barrage.time) {
        // 先初始化，后绘制
        // 1.如果没有初始化，首先初始化
        if (!barrage.isInited) {
          barrage.init();
          barrage.isInited = true;
        }
        barrage.x -= barrage.speed;
        barrage.render() // 渲染自己
        if (barrage.x <= barrage.width * -1) {
          barrage.flag = true; // 停止渲染的标记
        }
      }
    });
  }

  render() { // 渲染弹幕
    // 第一次，先进行清空操作，执行渲染弹幕，如果没有暂停继续渲染
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderBarrage(); // 渲染弹幕
    if (this.isPaused === false) {
      // 递归渲染
      requestAnimationFrame(this.render.bind(this));
    }
    // this.isPaused === false && requestAnimationFrame(this.render.bind(this)); // 递归渲染
  }

  add(obj) {
    this.barrages.push(new Barrage(obj, this));
  }
  // 拖拽视频进度条，显示当时弹幕
  reset() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let time = this.video.currentTime;
    this.barrages.forEach(barrage => {
      barrage.flag = false;
      if (time <= barrage.time) {
        barrage.isInited = false  // 重新初始化
      } else {
        barrage.flag = true   // 其他弹幕不在渲染
      }
      // time <= barrage.time ? barrage.isInited = false : barrage.flag = true;
    })
  }
}

let canvasBarrage = new CanvasBarrage(canvas, video, {
  data
});

video.addEventListener('play', () => {
  canvasBarrage.isPaused = false;
  canvasBarrage.render();
});

video.addEventListener('pause', () => {
  canvasBarrage.isPaused = true;
});

$('#add').addEventListener('click', () => {
  let time = video.currentTime;
  let value = $('#text').value;
  let color = $('#color').value;
  let fontSize = $('#range').value;
  let obj = {
    time,
    value,
    color,
    fontSize
  };
  canvasBarrage.add(obj); // 添加弹幕，实现添加功能
});
// 拖拽视频进度条，显示当时弹幕
video.addEventListener('seeked', () => {
  canvasBarrage.reset();
})