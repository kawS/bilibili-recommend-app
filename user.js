// ==UserScript==
// @name         b站首页推荐精简测试版
// @namespace    kasw
// @version      0.6
// @description  网页端首页推荐视频
// @author       kaws
// @match        *://www.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com

// @source       https://github.com/kawS/bilibili-recommend-app

// @include      https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png?*

// @connect      app.bilibili.com
// @connect      api.bilibili.com
// @connect      passport.bilibili.com
// @connect      www.mcbbs.net

// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @run-at       document-idle

// @require      https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/js-md5@0.7.3/src/md5.min.js

// @license      MIT
// ==/UserScript==

(function() {
  'use strict';
  // 用于授权
  if (location.href.startsWith('https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png?')) {
    window.stop();
    return window.top.postMessage(location.href, 'https://www.bilibili.com');
	}
  let isWait = false;
  let options = {
    maxClientWidth: $(window).width(),
    sizes: null,
    accessKey: GM_getValue('biliAppHomeKey'),
    refresh: 1,
    itemHeight: 0
  }
  let $list = null;
  function init(){
    if(location.pathname != '/'){
      return
    }
    setSize(options.maxClientWidth);
    initStyle();
    intiHtml();
    initEvent();
    if(options.accessKey){
      $('#JaccessKey').hide()
    }
    getRecommendList();
    console.log(options)
  }
  // 样式
  function initStyle(){
    let style = `
      <style>
        .van-danmu{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:6px;z-index:5;pointer-events:none;transition:opacity .3s;overflow:hidden;}
        .van-danmu-item{position:absolute;top:40px;left:100%;color:#fff;text-shadow:1px 1px 2px #000;will-change:transform;white-space:pre}
        .van-danmu-item.row2{top:70px}
        .van-danmu-item.row3{top:100px}
        .van-framepreview{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:6px;z-index:4;overflow:hidden}
        .van-fpbar-box{position:absolute;left:1%;bottom:1px;width:98%;height:8px;border-color:#ccc;border-style:solid;border-width:3px 8px;border-radius:2px;background:#444;box-sizing:border-box;}
        .van-fpbar-box span{display:block;background:#fff;height:2px;transition:width .12s}
        .dislike-botton{position:absolute;top:8px;right:8px;opacity:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-align:right;font-weight:700;transition:all .3s;text-shadow:1px 1px 2px #000;color:#fff;z-index:22;cursor:default}
        .dislike-list{display:none;}
        .cardwp:hover .dislike-botton{opacity:1}
        .dislike-botton:hover .dislike-list{display:unset;}
        .dislike-list>div:hover{text-decoration:line-through;}
        .dislike-cover{position:absolute!important;top:0px;width:100%;height:100%;background:hsla(0,0%,100%,.9);text-align:center;font-size:15px;z-index:22;cursor:default}
        @keyframes turn{0%{-webkit-transform:rotate(0deg);}100%{-webkit-transform:rotate(360deg);}}
        .taglike{position: absolute;bottom: 25px;left: 8px;padding: 0 2px;height: 18px;line-height: 18px;font-size: 12px;}
        .load-state{position:absolute;top:0;left:0;background:rgba(255,255,255,.8);width:100%;height:100%;min-height:240px;border-radius:4px;font-size:3rem;text-align:center;z-index:50}
        .load-state .loading{line-height:240px}
        .load-state .loading svg{margin:0 10px 0 0;width:2rem;height:2rem;transform: rotate(0deg);animation:turn 1s linear infinite;transition: transform .5s ease}
        .toast{position: fixed;top: 30%;left: 50%;z-index: 999999;margin-left: -180px;padding: 12px 24px;font-size: 14px;background: rgba(0,0,0,.8);width: 360px;border-radius: 6px;color: #fff;text-align: center}
        .BBDown{margin-top: 4px;width: 60%;line-height: 1;font-size: 12px;display: inline-block;}
      </style>`;
    $('head').append(style)
  }
  // 结构
  function intiHtml(){
    let $position = $('.bili-grid').eq(1);
    let html = `
      <section class="bili-grid" data-area='推荐' id="recommend">
        <div class="eva-extension-area">
          <div class="area-header">
            <div class="left">
              <a href="javascript:;" class="title"><span>油猴插件推荐</span></a>
            </div>
            <div class="right">
              <button class="primary-btn roll-btn" id="JaccessKey">
                <span>${options.accessKey ? '删除授权' : '获取授权'}</span>
              </button>
              <button class="primary-btn roll-btn" id="Jrefresh">
                <svg style="transform: rotate(0deg);"><use xlink:href="#widget-roll"></use></svg>
                <span>换一换</span>
              </button>
            </div>
          </div>
          <div class="eva-extension-body" id="recommend-list">

          </div>
        </div>
      </section>`;
    $position.after(html);
    $list = $('#recommend-list');
  }
  // 提示
  function toast(msg, duration = 2000){
    let $toast = $(`<div class="toast">${msg}</div>`);
    $toast.appendTo($('body'));
    setTimeout(() => {
      $toast.remove()
    }, duration)
  }
  // loading
  function showLoading(minHeight){
    $list.prepend(`
      <div class="load-state spread-module" style="min-height:${minHeight}px">
        <p class="loading" style="line-height:${minHeight / 2}px">
          <svg><use xlink:href="#widget-roll"></use></svg>正在加载...
        </p>
      </div>`)
  }
  // 事件
  function initEvent(){
    $('#JaccessKey').on('click', function(){
      let $this = $(this);
      let type = $this.text().trim();
      if(isWait){
        return
      }
      isWait = true
      if(type == '删除授权'){
        $this.find('span').text('获取授权');
        delAccessKey()
      }
      if(type == '获取授权'){
        $this.find('span').text('获取中...');
        getAccessKey($this)
      }
      return false
    })
    $('#Jrefresh').on('click', function(){
      let $this = $(this);
      let $svg = $this.find('svg');
      var reg = /(rotate\([\-\+]?((\d+)(deg))\))/i;
      var css = $svg.attr('style');
      var wts = css.match(reg);
      $svg.css('transform', `rotate(${parseFloat(wts[3]) + 360}deg)`);
      console.log(options);
      options.maxClientWidth = $(window).width();
      setSize(options.maxClientWidth);
      getRecommendList();
    })
    $list.on('mouseenter', '.bili-video-card__image', function(e){
      e.stopPropagation();
      let rect = e.currentTarget.getBoundingClientRect();
      let $this = $(this);
      if($this.data('go') == 'av'){
        $this.find('.bili-watch-later').stop().fadeIn();
        $this.find('.v-inline-player').addClass('mouse-in visible');
        getPreviewImage($this, e.clientX - rect.left)
      }
    }).on('mouseleave', '.bili-video-card__image', function(e){
      e.stopPropagation();
      let $this = $(this);
      if($this.data('go') == 'av'){
        $this.find('.bili-watch-later').stop().fadeOut();
        $this.find('.v-inline-player').removeClass('mouse-in visible');
      }
    }).on('mousemove', '.bili-video-card__image', function(e){
      e.stopPropagation();
      let rect = e.currentTarget.getBoundingClientRect();
      let $this = $(this);
      if($this.data('go') == 'av'){
        if($this[0].pvData){
          // if(e.target.className == 'bili-watch-later'){
          //   return
          // }
          setPosition($this, e.clientX - rect.left, $this[0].pvData)
        }
      }
    }).on('mouseenter', '.bili-watch-later', function(e){
      e.stopPropagation();
      let $this = $(this);
      $this.find('span').stop().fadeIn()
    }).on('mouseleave', '.bili-watch-later', function(e){
      e.stopPropagation();
      let $this = $(this);
      $this.find('span').stop().fadeOut()
    }).on('click', '.bili-watch-later', function(){
      let $this = $(this);
      watchlater($this);
      return false
    }).on('click', '.BBDown', function(){
      let $this = $(this);
      let id = $this.data('id');
      let isGo = /\//.test(id);
      if(isGo){
        let arr = id.split('/');
        id = arr[arr.length - 1]
      }
      GM_setClipboard(`BBDown -app -token ${options.accessKey} -mt -ia -p all "${id}"`);
      toast('复制命令成功')
      return
    })
  }
  function setSize(width){
    if(width < 1684){
      options.sizes = 5 * 4
    }else if(width >= 2183){
      options.sizes = 7 * 4
    }else{
      options.sizes = 6 * 4
    }
  }
  // 删除授权
  function delAccessKey(){
    isWait = false;
    options.accessKey = null;
    GM_deleteValue('biliAppHomeKey');
    toast('获取删除成功');
  }
  // 获取授权
  async function getAccessKey(el){
    let uri = null;
    let res = await fetch('https://passport.bilibili.com/login/app/third?appkey=27eb53fc9058f8c3&api=https%3A%2F%2Fwww.mcbbs.net%2Ftemplate%2Fmcbbs%2Fimage%2Fspecial_photo_bg.png&sign=04224646d1fea004e79606d3b038c84a', {
      method: 'GET',
      credentials: 'include'
    })
    let data = await res.json();
    if (data.code || !data.data) {
      el.find('span').text('获取授权')
      toast(data.msg || data.message || data.code)
    } else if (!data.data.has_login) {
      el.find('span').text('获取授权');
      toast('你必须登录B站之后才能使用授权')
    } else if (!data.data.confirm_uri) {
      el.find('span').text('获取授权');
      toast('无法获得授权网址')
    } else {
      uri = data.data.confirm_uri
    }
    let $iframe = $(`<iframe src='${uri}' style="display: none;" />`);
    $iframe.appendTo($('body'));
    let timeout = setTimeout(() => {
      $iframe.remove();
      el.find('span').text('获取授权');;
      toast('获取授权超时')
    }, 5000);
    window.onmessage = ev => {
      if (ev.origin != 'https://www.mcbbs.net' || !ev.data) return;
      const key = ev.data.match(/access_key=([0-9a-z]{32})/);
      if (key) {
        GM_setValue('biliAppHomeKey', options.accessKey = key[1]);
        toast('获取授权成功');
        el.find('span').text('删除授权');;
        clearTimeout(timeout);
        $iframe.remove();
        console.log(options)
      } else {
        toast('没有获得匹配的密钥')
      }
    }
    isWait = false;
  }
  // 获取视频
  function getRecommend(url, type){
    const errmsg = '获取推荐视频失败';
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: res => {
          try {
            const rep = JSON.parse(res.response);
            if (rep.code != 0) {
              reject(errmsg)
            }
            if(type == 'new'){
              resolve(rep.data.item)
            }else{
              resolve(rep.data)
            }
          } catch(e) {
            reject(errmsg)
          }
        },
        onerror: e => {
          reject(errmsg)
        }
      })
    })
  }

  async function getRecommendList(){
    options.itemHeight = $('.bili-grid').eq(0).find('.bili-video-card').height() * 4 + 20 * 3;
    // $('#recommend-list').css('min-height', options.itemHeight + 'px');
    showLoading(options.itemHeight);
    let url1 = `https://api.bilibili.com/x/web-interface/index/top/rcmd?fresh_type=3&version=1&ps=10&fresh_idx=${options.refresh}&fresh_idx_1h=${options.refresh}`;
    let url2 = 'https://app.bilibili.com/x/feed/index?build=1&mobi_app=android&idx=' + ((Date.now() / 1000).toFixed(0) + Math.round(Math.random() * 100)) + (options.accessKey ? '&access_key=' + options.accessKey : '');
    let url3 = 'https://app.bilibili.com/x/feed/index?build=1&mobi_app=android&idx=' + ((Date.now() / 1000).toFixed(0) + (Math.round(Math.random() * 100) + 100)) + (options.accessKey ? '&access_key=' + options.accessKey : '');
    let result = Promise.all([getRecommend(url1, 'new'), getRecommend(url2), getRecommend(url3)]);
    let data = await result;
    data[0] = new2old(data[0]);
    let list = data.reduce((pre, item) => {
      return pre.concat(item)
    })
    options.refresh += 1;
    updateRecommend(list)
  }
  // 新版转换老版格式
  function new2old(data){
    return data.map((item) => {
      return {
        autoplay: 1,
        cid: item.cid,
        cover: item.pic,
        ctime: item.pubdate,
        danmaku: item.stat.danmaku,
        desc: `${item.stat.danmaku}弹幕`,
        duration: item.duration,
        face: item.owner.face,
        goto: item.goto,
        idx: item.id,
        like: item.stat.like,
        mid: item.owner.mid,
        name: item.owner.name,
        param: item.id,
        play: item.stat.view,
        title: item.title,
        tname: '',
        uri: item.uri,
        rcmd_reason: {
          content: item.rcmd_reason.reason_type == 1 ? '已关注' : item.rcmd_reason.content ? item.rcmd_reason.content : ''
        }
      }
    })
  }

  function updateRecommend(list){
    let html = '';
    for(let i=0;i<options.sizes;i++){
      let data = list[i];
      html += `
        <div class="bili-video-card" style="display: block !important">
          <div class="bili-video-card__skeleton hide">
            <div class="bili-video-card__skeleton--cover"></div>
            <div class="bili-video-card__skeleton--info">
              <div class="bili-video-card__skeleton--face"></div>
              <div class="bili-video-card__skeleton--right">
                <p class="bili-video-card__skeleton--text"></p>
                <p class="bili-video-card__skeleton--text short"></p>
                <p class="bili-video-card__skeleton--light"></p>
              </div>
            </div>
          </div>
          <div class="bili-video-card__wrap __scale-wrap">
            <a href="${data.goto == 'av' ? '/video/av' + data.param : data.uri}" target="_blank" class="cardwp">
              <div class="bili-video-card__image __scale-player-wrap" data-go="${data.goto}" data-aid="${data.param}" data-duration="${data.duration}">
                <div class="bili-video-card__image--wrap">
                  <div class="bili-watch-later" data-aid="${data.param}" style="display: none;">
                    <svg class="bili-watch-later__icon"><use xlink:href="#widget-watch-later"></use></svg>
                    <span class="bili-watch-later__tip" style="display: none;">稍后再看</span>
                  </div>
                  <picture class="v-img bili-video-card__cover">
                    <source srcset="${data.cover.replace('http:','')}@672w_378h_1c_100q.webp" type="image/webp"/>
                    <img src="${data.cover.replace('http:','')}@672w_378h_1c_100q" alt="${data.title}" loading="eager" onload=""/>
                  </picture>
                  <div class="v-inline-player"></div>
                </div>
                <div class="bili-video-card__mask">
                  <div class="taglike" style="background:${data.badge ? '#ff8f00' : data.tname ? '#fff' : '#ff005d'};color:${data.badge ? '#fff' : data.tname ? '#333' : '#fff'}">${data.badge||data.tname||'官方新版推荐'}</div>
                  <div class="bili-video-card__stats">
                    <div class="bili-video-card__stats--left">
                      <span class="bili-video-card__stats--item">
                        <svg class="bili-video-card__stats--icon">
                          <use xlink:href="#widget-play-count"></use>
                        </svg>
                        <span class="bili-video-card__stats--text">${formatNumber(data.play)}</span>
                      </span>
                      <span class="bili-video-card__stats--item">
                        <svg class="bili-video-card__stats--icon"><use xlink:href="#widget-agree"></use></svg>
                        <span class="bili-video-card__stats--text">${formatNumber(data.like)}</span>
                      </span>
                    </div>
                    <span class="bili-video-card__stats__duration">${data.duration && formatNumber(data.duration, 'time') || ''}</span>
                  </div>
                </div>
              </div>
            </a>
            <div class="bili-video-card__info __scale-disable">
              <div>
                <a href="https://space.bilibili.com/${data.mid}" target="_blank">
                  <div class="v-avatar bili-video-card__avatar">
                    <picture class="v-img v-avatar__face">
                      <source srcset="${data.face.replace('http:','')}@72w_72h.webp" type="image/webp"/>
                      <img src="${data.face.replace('http:','')}@72w_72h" alt="${data.name||data.badge}" loading="lazy" onload=""/>
                    </picture>
                  </div>
                </a>
              <a href="javascript:;" class="BBDown" data-id="${data.goto=='av' ? 'av'+data.param : data.uri}">BBDown下载</a>
              </div>
              <div class="bili-video-card__info--right">
                <a href="${data.goto=='av'?'/video/av'+data.param:data.uri}" target="_blank">
                  <h3 class="bili-video-card__info--tit" title="${data.title}">${data.title}</h3>
                </a>
                <p class="bili-video-card__info--bottom" style="${(data.rcmd_reason && data.rcmd_reason.content == '已关注') ? 'color:#f00' : data.badge ? 'color:#ff8f00' : ''}">
                  <a class="bili-video-card__info--owner" href="//space.bilibili.com/${data.mid}" target="_blank">
                    <svg class="bili-video-card__info--owner__up">
                      <use xlink:href="#widget-up"></use>
                    </svg>
                    <span class="bili-video-card__info--author">${data.name || data.badge + ' - ' + data.desc}</span>
                    <span class="bili-video-card__info--date">${returnDateTxt(data.ctime)}</span>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>`;
    }
    $list.html(html)
  }
  function formatNumber(input, format = 'number'){
    if (format == 'time') {
      let second = input % 60;
      let minute = Math.floor(input / 60);
      let hour;
      if (minute > 60) {
        hour = Math.floor(minute / 60);
        minute = minute % 60;
      }
      if (second < 10) second = '0' + second;
      if (minute < 10) minute = '0' + minute;
      return hour ? `${hour}:${minute}:${second}` : `${minute}:${second}`;
    } else {
      return input > 9999 ? `${(input / 10000).toFixed(1)}万` : input || 0;
    }
  }
  function returnDateTxt(time){
    if (!time) return '';
    let date = new Date(time * 1000);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    return `· ${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`
  }
  function token(){
    try {
      return document.cookie.match(/bili_jct=([0-9a-fA-F]{32})/)[1];
    } catch(e) {
      return '';
    }
  }
  async function watchlater(el){
    let type = el.hasClass('del') ? 'del' : 'add';
    let aid = el.data('aid');
    let res = await fetch(`https://api.bilibili.com/x/v2/history/toview/${type}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: `aid=${aid}&csrf=${token()}`
    })
    let data = await res.json();
    if(data.code == 0){
      if(type == 'add'){
        el.addClass('del').find('span').text('移除');
        el.find('svg').html('<use xlink:href="#widget-watch-save"></use>');
        toast('添加成功')
      }else{
        el.removeClass('del').find('span').text('稍后再看');
        el.find('svg').html('<use xlink:href="#widget-watch-later"></use>');
        toast('移除成功')
      }
    }else{
      toast(data.message)
    }
  }
  async function getPreviewImage(el, e){
    let aid = el.data('aid');
    let pvData = el[0].pvData;
    if(!pvData){
      let res = await fetch(`https://api.bilibili.com/pvideo?aid=${aid}`);
      let data = await res.json();
      pvData = el[0].pvData = data.data
    }
    setPosition(el, e, pvData)
  }
  function setPosition(el, mouseX, pvData){
    let $tarDom = el.find('.v-inline-player');
    let duration = el.data('duration');
    let width = $tarDom.width();
    let height = $tarDom.height();
    let sizeX = width * pvData.img_x_len;
    let sizeY = height * pvData.img_y_len;
    let onePageImgs = pvData.img_x_len * pvData.img_y_len;
    let rIndexList = pvData.index.slice(1);
    let pageSize = Math.ceil(rIndexList.length / onePageImgs);
    // console.log(pvData);
    // 寻点
    let percent = mouseX / width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    let durIndex = Math.floor(percent * rIndexList.length)
    let page = Math.floor(durIndex / (pvData.img_x_len * pvData.img_y_len));
    let imgUrl = pvData.image[page];
    // 坐标
    let imgIndex = durIndex - page * onePageImgs;
    let x = ((imgIndex - 1) % pvData.img_x_len) * width;
    // let y = Math.floor(imgIndex / (pvData.img_x_len)) * (width * pvData.img_y_size / pvData.img_x_size);
    let y = Math.floor(imgIndex / (pvData.img_x_len)) * height;
    let imgY = (Math.floor(imgIndex / pvData.img_x_len)) + 1;
    let imgX = imgIndex - (imgY - 1) * pvData.img_x_len;
    // console.log(_index, durIndex, x, y, (imgX-1) * width, (imgY-1) * height);
    // 进度条
    let bar = percent * 100;
    let $pvbox = $tarDom.find('pv-box');
    if($pvbox.length > 0){
      $pvbox.css({
        'background': `url(https:${imgUrl}) -${x}px -${y}px no-repeat`
      })
      $pvbox.next().css({
        'width': `${bat}%`
      })
      return
    }
    $tarDom.html(`
      <div class="pv-box" style="background: url(https:${imgUrl}) -${x}px -${y}px no-repeat;background-size: ${sizeX}px ${sizeY}px;height: 100%;pointer-events:none"></div>
      <div class="pv-bar" style="position: absolute;left: 0;bottom: 0;background: #f00;width: ${bar}%;height: 2px;z-index: 2"></div>
    `)
  }

  init()
})();