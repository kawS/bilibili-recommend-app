// ==UserScript==
// @name         b站app首页推荐精简测试版
// @namespace    kaws
// @version      0.1
// @description  网页端首页添加APP首页推荐、可选提交不喜欢的视频 原作者indefined
// @author       kaws
// @match        *://www.bilibili.com/*
// @include      https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png?*
// @license      MIT
// @connect      app.bilibili.com
// @connect      api.bilibili.com
// @connect      passport.bilibili.com
// @connect      www.mcbbs.net
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-idle
// ==/UserScript==

(function() {
	'use strict';
	if (location.href.startsWith('https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png?')) {
		//用于获取授权
		window.stop();
		return window.top.postMessage(location.href, 'https://www.bilibili.com');
	}

	//设置，包含设置变量以及设置窗口和对应的方法
	const setting = {
		dialog: undefined,
		historyData: JSON.parse(GM_getValue('historyRecommend', '[]')),
		historyLimit: isNaN(+GM_getValue('historyLimit')) ? 10 : +GM_getValue('historyLimit'),
		pageLimit: +GM_getValue('pageLimit') || 0,
		autoFreshCount: isNaN(+GM_getValue('autoFreshCount')) ? 1 : +GM_getValue('autoFreshCount'),
		manualFreshCount: (() => {
			var mfc = GM_getValue('manualFreshCount', 1);
			if (isNaN(mfc) || mfc < 1) mfc = 1;
			return mfc;
		})(),
		accessKey: GM_getValue('biliAppHomeKey'),
		storageAccessKey(key) {
			if (key) {
				GM_setValue('biliAppHomeKey', this.accessKey = key);
			} else {
				delete this.accessKey;
				GM_deleteValue('biliAppHomeKey');
			}
		},
		pushHistory(data) {
			this.historyData.unshift(...data);
		},
		saveHistory() {
			while (this.historyData.length > this.historyLimit) this.historyData.pop();
			GM_setValue('historyRecommend', JSON.stringify(this.historyData));
		},
		setHistoryLimit(limit) {
			GM_setValue('historyLimit', this.historyLimit = +limit);
		},
		setPageLimit(limit) {
			GM_setValue('pageLimit', this.pageLimit = +limit);
		},
		setAutoFreshCount(count) {
			GM_setValue('autoFreshCount', this.autoFreshCount = +count);
		},
		setManualFreshCount(target) {
			var count = +target.value;
			if (count < 1) count = target.value = 1;
			GM_setValue('manualFreshCount', this.manualFreshCount = +count);
		},
		init() {
			this.setStyle()
		},
		setStyle(){
			if (!this.styleDiv) {
				this.styleDiv = element._c({
					nodeType: 'style',
					parent: document.head
				})
			}
			let html = '';
			if (element.isNew) {
				let h = document.querySelector('.bili-video-card img').offsetHeight;
				html += `.van-danmu{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:6px;z-index:5;pointer-events:none;transition:opacity .3s;overflow:hidden;}.van-danmu-item{position:absolute;top:40px;left:100%;color:#fff;text-shadow:1px 1px 2px #000;will-change:transform;white-space:pre}.van-danmu-item.row2{top:70px}.van-danmu-item.row3{top:100px}.van-framepreview{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:6px;z-index:4;overflow:hidden}.van-fpbar-box{position:absolute;left:1%;bottom:1px;width:98%;height:8px;border-color:#ccc;border-style:solid;border-width:3px 8px;border-radius:2px;background:#444;box-sizing:border-box;}.van-fpbar-box span{display:block;background:#fff;height:2px;transition:width .12s}.dislike-botton{position:absolute;top:8px;right:8px;opacity:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-align:right;font-weight:700;transition:all .3s;text-shadow:1px 1px 2px #000;color:#fff;z-index:22;cursor:default}.dislike-list{display:none;}.cardwp:hover .dislike-botton{opacity:1}.dislike-botton:hover .dislike-list{display:unset;}.dislike-list>div:hover{text-decoration:line-through;}.dislike-cover{position:absolute!important;top:0px;width:100%;height:100%;background:hsla(0,0%,100%,.9);text-align:center;font-size:15px;z-index:22;cursor:default}@keyframes turn{0%{-webkit-transform:rotate(0deg);}100%{-webkit-transform:rotate(360deg);}}`
			}
			this.styleDiv.innerHTML = html;
		},
		show(){
			if (this.dialog) return document.body.appendChild(this.dialog);
			this.dialog = element._c({
				nodeType: 'div',
				id: 'biliAppHomeSetting',
				style: 'position: fixed;top: 0;bottom: 0;left: 0;right: 0;background: rgba(0,0,0,0.4);z-index: 10000;',
				childs: [{
					nodeType: 'div',
					style: 'width:400px;right:0;left:0;position:absolute;padding:20px;background:#fff;border-radius:8px;margin:auto;transform:translate(0,50%);box-sizing:content-box',
					childs: [{
						nodeType: 'h2',
						innerText: 'APP首页推荐设置',
						style: "font-size: 20px;color: #4fc1e9;font-weight: 400;",
						childs: [{
							nodeType: 'span',
							innerText: 'Ｘ',
							style: "float:right;cursor: pointer;",
							onclick: () => document.body.removeChild(this.dialog)
						}]
					},
					{
						nodeType: 'div',
						style: 'margin: 10px 0;',
						childs: ['<label style="margin-right: 5px;">保存推荐数量:</label>', {
							nodeType: 'input',
							type: 'number',
							value: this.historyLimit,
							min: 0,
							step: 10,
							onchange: ({target}) => this.setHistoryLimit(target.value),
							style: 'width:50px'
						}]
					},
					{
						nodeType: 'div',
						style: 'margin: 10px 0;',
						childs: ['<label style="margin-right: 5px;">页面显示限制:</label > ', {
							nodeType: 'input',
							type: 'number',
							value: this.pageLimit,
							min: 0,
							step: 10,
							onchange: ({target}) => this.setPageLimit(+target.value),
							style: 'width: 50px'
						}]
					},
					{
						nodeType: 'div',
						style: 'margin: 10px 0;',
						childs: ['<label style="margin-right: 5px;">自动刷新页数:</label>', {
							nodeType: 'input',
							type: 'number',
							value: this.autoFreshCount,
							min: 0,
							step: 1,
							onchange: ({target}) => this.setAutoFreshCount(+target.value),
							style: 'width: 50px'
						}]
					},
					{
						nodeType: 'div',
						style: 'margin: 10px 0;',
						childs: ['<label style="margin-right: 5px;">手动刷新页数:</label>', {
							nodeType: 'input',
							type: 'number',
							value: this.manualFreshCount,
							min: 1,
							step: 1,
							onchange: ({target}) => this.setManualFreshCount(target),
							style: 'width: 50px'
						}]
					},
					{
						nodeType: 'div',
						style: 'margin: 10px 0;',
						childs: ['<label style="margin-right: 5px;">APP接口授权:</label>', {
							nodeType: 'button',
							style: 'padding:0 15px;height:30px;background:#4fc1e9;color:white;border-radius:5px;border:none;cursor:pointer;',
							innerText: this.accessKey ? '删除授权': '获取授权',
							onclick: ({target}) => this.handleKey(target)
						}]
					},
					{
						nodeType: 'div',
						childs: ['<a href="https://github.com/indefined/UserScripts" target="_blank">原作者github</a>', `<span style="padding-left:20px;">当前修改版本:${GM_info.script.version}</spab>`]
					}]
				}],
				parent:document.body
			});
			return false
		},
		handleKey(target) {
			if (target.innerText === '删除授权') {
				this.storageAccessKey(undefined);
				target.innerText = '获取授权';
				tools.toast('删除授权成功');
				return
			} else {
				target.innerText = '获取中...';
				target.style['pointer-events'] = 'none';
				let tip = '请求授权接口错误';
				fetch('https://passport.bilibili.com/login/app/third?appkey=27eb53fc9058f8c3&api=https%3A%2F%2Fwww.mcbbs.net%2Ftemplate%2Fmcbbs%2Fimage%2Fspecial_photo_bg.png&sign=04224646d1fea004e79606d3b038c84a', {
					method: 'GET',
					credentials: 'include',
				}).then(res => {
					return res.json().
					catch(e => {
						throw ({
							tip,
							msg: '返回数据异常:',
							data: res
						})
					})
				}).then(data => {
					if (data.code || !data.data) {
						throw ({
							tip,
							msg: data.msg || data.message || data.code,
							data
						})
					} else if (!data.data.has_login) {
						throw ({
							tip,
							msg: '你必须登录B站之后才能使用授权',
							data
						})
					} else if (!data.data.confirm_uri) {
						throw ({
							tip,
							msg: '无法获得授权网址',
							data
						})
					} else {
						return data.data.confirm_uri
					}
				}).then(url => new Promise((resolve, reject) => {
					let tip = '获取授权错误';
					let iframe = element._c({
						nodeType: 'iframe',
						style: 'display:none',
						src: url,
						parent: document.body
					})
					let timeout = setTimeout(() => {
						document.body.contains(iframe) && document.body.removeChild(iframe);
						reject({
							tip,
							msg: '请求超时'
						});
					}, 5000);
					window.addEventListener('message', ev => {
						if (ev.origin != 'https://www.mcbbs.net' || !ev.data) return;
						const key = ev.data.match(/access_key=([0-9a-z]{32})/);
						if (key) {
							this.storageAccessKey(key[1]);
							tools.toast('获取授权成功');
							target.innerText = '删除授权';
							clearTimeout(timeout);
							document.body.contains(iframe) && document.body.removeChild(iframe);
							resolve()
						} else {
							reject({
								tip,
								msg: '没有获得匹配的密钥',
								data: ev
							})
						}
					})
				})).catch(error => {
					target.innerText = '获取授权';
					tools.toast(`${error.tip}:${error.msg}`, error)
				}).then(() => {
					target.style['pointer-events'] = 'unset'
				})
			}
		}
	};

	//一些通用模块
	const tools = {
		token: (() => {
			try {
				return document.cookie.match(/bili_jct=([0-9a-fA-F]{32})/)[1];
			} catch(e) {
				console.error('添加APP首页推荐找不到token，请检查是否登录');
				return undefined;
			}
		})(),
		imgType: (() => {
			try {
				return 0 == document.createElement('canvas').toDataURL("image/webp").indexOf("data:image/webp") ? 'webp': 'jpg';
			} catch(e) {
				return 'jpg';
			}
		})(),
		toast(msg, error) {
			if (error) console.error(msg, error);
			const toast = element._c({
				nodeType: 'div',
				style: 'position: fixed;top: 50%;left: 50%;z-index: 999999;margin-left: -180px;padding: 12px 24px;font-size: 14px;background: #ffb243;width: 360px;border-radius: 6px;color: #fff;',
				innerHTML: msg,
				parent: document.body
			});
			setTimeout(() => document.body.removeChild(toast), 2000);
			return false;
		},
		formatNumber(input, format = 'number') {
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
				return input > 9999 ? `${(input / 10000).toFixed(1)}万`: input || 0;
			}
		},
		returnDateTxt(time) {
      if (!time) return '';
			let date = new Date(time * 1000);
			let year = date.getFullYear();
			let month = date.getMonth() + 1;
			let day = date.getDate();
			return `· ${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`
		},
		previewImage(pv, target, width, height, dmlength) {
			if (!pv || !target || !target.cover) return;
			width = +width <= 0 ? 0 : +width;
			let pWidth = target.parentNode.offsetWidth,
					data = target.cover,
					percent = width / pWidth,
					index = Math.floor(percent * data.index.length),
					url = data.image[Math.floor(index / data.img_x_len / data.img_y_len)],
					size = pWidth * data.img_x_len,
					y = Math.floor(index / data.img_x_len) * -pWidth / data.img_x_size * data.img_y_size,
					x = (index % target.cover.img_x_len) * -pWidth;
			if (pv.classList.contains('van-framepreview')) {
				if (pv.classList.contains('ranking')) y += 10;
				pv.style = `background-image: url(${url});background-position: ${x}px ${y}px;background-size: ${size}px;opacity: 1;height: ${height}px`;
				pv.innerHTML = `<div style="color:#fff;text-shadow:1px 1px 2px #000;display:inline">分区:${target.dataset.group}&nbsp;&nbsp;预览弹幕:${dmlength}</div><div class="van-fpbar-box"><span style="width: ${percent * 100}%;display:block;"></span></div >`;
			} else {
				pv.innerHTML = `<div class="cover" style="background-image: url(${url});background-position: ${x}px ${y}px;background-size: ${size}px;"></div><div class="progress-bar van-fpbar-box"><span style="width: ${percent * 100}%;display:block;"></span></div>`
			}
		},
		previewDanmu(target, status) {
			if (!target || !target.data || !target.data.length || !target.previewDanmu) return;
			clearInterval(target.timmer);
			if (status) {
				target.previewDanmu();
				target.timmer = setInterval(target.previewDanmu, 2.5 * 1000);
			} else {
				target.style.opacity = 0;
			}
		},
		preview(ev) {
			if (!ev.target) return;
			let deep = 1,
					target = ev.target;
			let pv, danmu, vheight;
			while (!target.dataset.id && deep++<4) {
				target = target.parentNode;
			}
			pv = target.querySelector('.cover-preview-module');
			danmu = target.querySelector('.danmu-module');
			vheight = target.clientHeight;

			if (!pv || !danmu) return;
			if (ev.type == 'mouseenter') {
				target.timmer = setTimeout(() => {
					if (!target.timmer) return;
					pv.classList.add('show');
					danmu.classList.add('show');
					if (!target.cover) {
						fetch(`//api.bilibili.com/pvideo?aid=${target.dataset.id}&=${Date.now()}`)
						// fetch(`//api.bilibili.com/x/player/videoshot?aid=${target.dataset.id}&index=1`)
							.then(res => res.json())
							.then(d => (target.cover = d.data))
							.catch(err => console.log(err))
							.then(() => fetch(`//api.bilibili.com/x/v2/dm/ajax?aid=${target.dataset.id}&=${Date.now()}`))
							.then(res => res.json())
							.then(d => {
								danmu.data = d.data;
								danmu.count = 0;
								danmu.previewDanmu = function() {
									danmu.style.opacity = 1;
									if (danmu.count % danmu.data.length == 0) {
										let index = 1;
										let html = '';
										danmu.count = 0;
										// danmu.innerHTML = danmu.data.map((item, i) => `<p class="dm van-danmu-item ${i%2 == 0 ? '' : i%3 == 0 ? 'row3' : 'row2'}">${item}</p>`).join('');
										danmu.data.map((item, i) => {
											if(index > 3){
												index = 1
											}
											html += `<p class="dm van-danmu-item ${index == 1 ? '' : index == 2 ? 'row2' : 'row3'}">${item}</p>`
											index++
										})
										danmu.innerHTML = html
									}
									const item = danmu.children[danmu.count++];
									if(!item) return;
									item.style = `left: -${item.offsetWidth + 10}px;transition: left 5s linear 0s;`;
								};
								if(!target.timmer) return;
								tools.previewImage(pv,target,ev.offsetX,vheight,danmu.data.length);
								tools.previewDanmu(danmu, true);
								delete target.timmer;
							})
							.catch(err => console.log(err))
					} else {
						tools.previewImage(pv,target,ev.offsetX,vheight,danmu.data.length);
						tools.previewDanmu(danmu, true);
						delete target.timmer;
					}
				}, 100)
			} else if(ev.type == 'mouseleave') {
				clearTimeout(target.timmer);
				delete target.timmer;
				pv.classList.remove('show');
				if (pv.classList.contains('van-framepreview')) {
					pv.style.opacity = 0
				}
				danmu.classList.remove('show');
				tools.previewDanmu(danmu, false);
			} else {
				if(!target.cover) return;
				let length = 0;
				if(danmu.data){
					length = danmu.data.length
				}
				tools.previewImage(pv,target,ev.offsetX,vheight,length);
			}
		},
		delCommentAttr(div) {
			let length = div.childNodes.length;
			while (length--) {
				let node = div.childNodes[length];
				if (node.nodeType == 8) {
					div.removeChild(node)
				} else {
					if (node.attributes) {
						for (let i = 0; i < node.attributes.length; i++) {
							let name = node.attributes[i].name;
							if (/data-/.test(name)) {
								node.removeAttribute(name)
							}
						}
					}
					this.delCommentAttr(node)
				}
			}
		}
	};

	//页面元素助手，包含克隆的一个未初始化版块和创建、设置页面元素的简单封装
	const element = {
		mainDiv: (() => {
			try {
				return document.querySelectorAll('.bili-grid')[2].cloneNode(true);
			} catch(e) {
				return undefined;
			}
		})(),
		getLoadingDiv(target) {
			return this._c({
				nodeType: 'div',
				style: target == 'recommend' ? 'position:absolute;top:0;left:0;background:rgba(255,255,255,.4);width:100%;height:100%;min-height:240px;border-radius:4px;font-size:3rem;text-align:center;z-index:50' : 'text-align:center;',
				className: target == 'recommend' ? 'load-state spread-module' : 'load-state',
				innerHTML: '<p class="loading" style="line-height:240px"><svg style="margin:0 10px 0 0;width:2rem;height:2rem;transform: rotate(0deg);animation:turn 1s linear infinite;transition: transform .5s ease"><use xlink:href="#widget-roll"></use></svg>正在加载...</p>'
			});
		},
		_c(config) {
			if (config instanceof Array) return config.map(item => this._c(item));
			const item = document.createElement(config.nodeType);
			return this._s(item, config);
		},
		_s(item, config) {
			for (const i in config) {
				if (i == 'nodeType') continue;
				if (i == 'childs' && config.childs instanceof Array) {
					config.childs.forEach(child => {
						if (child instanceof HTMLElement) item.appendChild(child);
						else if (typeof(child) == 'string') item.insertAdjacentHTML('beforeend', child);
						else item.appendChild(this._c(child));
					})
				} else if (i == 'parent') {
					config.parent.appendChild(item);
				} else if (config[i] instanceof Object && item[i]) {
					Object.entries(config[i]).forEach(([k, v]) => {
						item[i][k] = v;
					})
				} else {
					item[i] = config[i];
				}
			}
			return item;
		}
	};

	//APP首页推荐
	function InitRecommend() {
		element.mainDiv.id = 'recommend';
		let listBox = element.mainDiv.querySelector('div.eva-extension-body');
		listBox.id = 'recommend-list';
		if (element.isNew == 1) {
			element._s(element.mainDiv.querySelector('.left'), {
				innerHTML: '<a href="javascript:;" class="title"><span>油猴插件推荐</span></a>'
			});
			element._s(element.mainDiv.querySelector('.right'), {
				innerHTML: '',
				childs: [{
					nodeType: 'button',
					className: 'primary-btn roll-btn',
					innerHTML: '<svg style="transform: rotate(0deg);"><use xlink:href="#widget-roll"></use></svg><span>换一换</span>',
					onclick: (ev) => {
						let tar = ev.currentTarget.querySelector('svg');
						var reg = /(rotate\([\-\+]?((\d+)(deg))\))/i;
						var wt = tar.style.transform, wts = wt.match (reg);
						var $2 = RegExp.$2;
						tar.style.transform = wt.replace ($2, parseFloat (RegExp.$3) + 360 + RegExp.$4);
						// for (let i = 0; i < setting.manualFreshCount; i++) getRecommend()
						showRecommendList(setting.manualFreshCount, listBox)
					}
				},
				{
					nodeType: 'a',
					className: 'primary-btn see-more',
					href: 'javascript:;',
					innerHTML: '<span>设置</span><svg><use xlink:href="#widget-arrow"></use></svg>',
					onclick: () => setting.show()
				}]
			});
			element._s(listBox, {
				innerHTML: '<span style="display:none">empty</span>'
			});
			document.querySelectorAll('.grid-anchor')[0].after(element.mainDiv)
		}

		//保存当前页面中的推荐元素，用于清除多余内容
		const recommends = [];

		//显示历史推荐
		if (setting.historyData) updateRecommend(setting.historyData);

		//加载新推荐
		// for (let i = 0; i < setting.autoFreshCount; i++) getRecommend();
		showRecommendList(setting.autoFreshCount, listBox);

		//获取推荐视频数据
		function getRecommend() {
			return new Promise((resolve, reject) => {
				GM_xmlhttpRequest({
					method: 'GET',
					url: 'https://app.bilibili.com/x/feed/index?build=1&mobi_app=android&idx=' + (Date.now() / 1000).toFixed(0) + (setting.accessKey ? '&access_key=' + setting.accessKey: ''),
					onload: res => {
						try {
							const rep = JSON.parse(res.response);
							// console.log(rep);
							if (rep.code != 0) {
								// loadingDiv.firstChild.innerText = `请求app首页失败 code ${rep.code}</br>msg ${rep.message}`;
								reject('请求app首页失败');
								return console.error('请求app首页失败', rep);
							}
							// setting.pushHistory(rep.data);
							// updateRecommend(rep.data);
							resolve(rep.data)
							// loadingDiv.style.display = 'none';
						} catch(e) {
							// loadingDiv.firstChild.innerText = `请求app首页发生错误 ${e}`;
							console.error(e, '请求app首页发生错误');
							reject(e)
						}
					},
					onerror: e => {
						// loadingDiv.firstChild.innerText = `请求app首页发生错误 ${e}`;
						console.error(e, '请求app首页发生错误');
						reject(e)
					}
				})
			})
		}

		async function showRecommendList(times, parentBox){
			let result = [];
			let loadingDiv = element.getLoadingDiv('recommend');
			parentBox.insertAdjacentElement('afterBegin', loadingDiv);
			while (times--) {
				try {
					let resData = await getRecommend();
					setting.pushHistory(resData);
					result = [...result, ...resData];
				} catch (err) {
					console.log(err)
				}
			}
			updateRecommend(result);
			console.log(result)
		}

		//新版创建视频卡
		function createNewRecommend(data, index) {
			return element._c({
				nodeType: 'div',
				style: 'display:block!important',
				className: 'bili-video-card',
				childs: ['<div class="bili-video-card__skeleton hide"><div class="bili-video-card__skeleton--cover"></div><div class="bili-video-card__skeleton--info"><div class="bili-video-card__skeleton--face"></div><div class="bili-video-card__skeleton--right"><p class="bili-video-card__skeleton--text"></p><p class="bili-video-card__skeleton--text short"></p><p class="bili-video-card__skeleton--light"></p></div></div></div>', {
					nodeType: 'div',
					className: 'bili-video-card__wrap __scale-wrap',
					childs: [{
						nodeType: 'a',
						href: `${data.goto == 'av' ? '/video/av' + data.param : data.uri}`,
						target: '_blank',
						className: 'cardwp',
						style: 'display: block',
						dataset: {
							tagId: data.tag ? data.tag.tag_id: '',
							id: data.param,
							goto: data.goto,
							mid: data.mid,
							rid: data.tid,
							idx: `${index}`,
							group: data.tname
						},
						onmouseenter: data.goto == 'av' && tools.preview,
						onmouseleave: data.goto == 'av' && tools.preview,
						onmousemove: data.goto == 'av' && tools.preview,
						childs: [
							`<div class="bili-video-card__image __scale-player-wrap">
								<div class="bili-video-card__image--wrap">
									<picture class="v-img bili-video-card__cover">
										<source srcset="${data.cover.replace('http:','')}@672w_378h_1c_100q.webp" type="image/webp">
										<img src="${data.cover.replace('http:','')}@672w_378h_1c_100q" alt="${data.title}" loading="eager" onload=""/>
									</picture>
									<div class="v-inline-player"></div>
								</div>
								<div class="bili-video-card__mask">
									<div class="bili-video-card__stats">
										<div class="bili-video-card__stats--left">
											<span class="bili-video-card__stats--item">
												<svg class="bili-video-card__stats--icon"><use xlink:href="#widget-play-count"></use></svg>
												<span class="bili-video-card__stats--text">${tools.formatNumber(data.play)}</span>
											</span>
											<span class="bili-video-card__stats--item">
												<svg class="bili-video-card__stats--icon"><use xlink:href="#widget-agree"></use></svg>
												<span class="bili-video-card__stats--text">${tools.formatNumber(data.like)}</span>
											</span>
										</div >
										<span class="bili-video-card__stats__duration">${data.duration && tools.formatNumber(data.duration, 'time') || ''}</span>
									</div>
								</div>
							</div>`,
							'<div class="cover-preview-module van-framepreview"></div><div class="danmu-module van-danmu"></div>',
							(data.dislike_reasons && setting.accessKey) ? {
								nodeType: 'div',
								innerText: 'Ｘ',
								className: 'dislike-botton',
								childs: [{
									nodeType: 'div',
									className: 'dislike-list',
									childs: data.dislike_reasons.map(reason => ({
										nodeType: 'div',
										dataset: {
											reason_id: reason.reason_id
										},
										innerText: reason.reason_name,
										title: `提交因为【${reason.reason_name}】不喜欢`,
										onclick: dislike,
									}))
								}]
							}: ''
						]
					},
					`<div class="bili-video-card__info __scale-disable">
						<a href="https://space.bilibili.com/${data.mid}" target="_blank" data-idx="${index}">
							<div class="v-avatar bili-video-card__avatar">
								<picture class="v-img v-avatar__face">
									<source srcset="${data.face.replace('http:','')}@72w_72h.webp" type="image/webp">
									<img src="${data.face.replace('http:','')}@72w_72h" alt="${data.name||data.badge}" loading="lazy" onload="">
								</picture>
							</div>
						</a>
						<div class="bili-video-card__info--right">
							<a href="${data.goto=='av'?'/video/av'+data.param:data.uri}" target="_blank" data-idx="${index}">
								<h3 class="bili-video-card__info--tit" title="${data.title}">${data.title}</h3>
							</a>
							<p class="bili-video-card__info--bottom" style="${(data.rcmd_reason && data.rcmd_reason.content == '已关注') ? 'color:#f00' : data.badge ? 'color:#ff8f00' : ''}">
								<a class="bili-video-card__info--owner" href="//space.bilibili.com/${data.mid}" target="_blank" data-idx=${index}">
								<span class="bili-video-card__info--author">${data.name || data.badge + ' - ' + data.desc}</span>
								<span class="bili-video-card__info--date">${tools.returnDateTxt(data.ctime)}</span></a>
							</p>
						</div>
					</div>`]
				}]
			})
		}

		//显示推荐视频
		function updateRecommend(datas) {
			const point = listBox.firstChild;
			let index = 0;
			datas.forEach(data => {
				const recommend = createNewRecommend(data, index);
				recommends.push(point.insertAdjacentElement('beforeBegin', recommend));
				index++
			});
			//移除多余的显示内容
			while (setting.pageLimit && recommends.length > setting.pageLimit) listBox.removeChild(recommends.shift());
			if(listBox.querySelector('.load-state')){listBox.removeChild(listBox.querySelector('.load-state'))}
		}

		//提交不喜欢视频，视频数据提前绑定在页面元素上
		function dislike(ev) {
			let target = ev.target,
					parent = target.parentNode;
			let cancel = false;
			let url = 'https://app.bilibili.com/x/feed/dislike';
			if (parent.className != 'dislike-list') {
				cancel = true;
				if (parent.className == 'bili-video-card__wrap __scale-wrap') {
					parent = parent.querySelector('.cardwp')
				} else if (parent.className == 'dislike-cover') {
					parent = parent.parentNode.querySelector('.cardwp')
				} else if (parent.className == 'lazy-img') {
					parent = parent.parentNode.parentNode.querySelector('.cardwp')
				}
				if (!parent.dataset.id) {
					tools.toast('请求撤销稍后再看失败：页面元素异常', ev);
					return false;
				}
				url += '/cancel';
			} else {
				parent = parent.parentNode.parentNode//.querySelector('.cardwp');
			}
			url += `?build=5000000&goto=${parent.dataset.goto}&id=${parent.dataset.id}&mid=${parent.dataset.mid}&reason_id=${target.dataset.reason_id}&rid=${parent.dataset.rid}&tag_id=${parent.dataset.tag_id}`;
			if (setting.accessKey) url += '&access_key=' + setting.accessKey;
			const handleCover = () => {
				if (cancel) {
					let f = parent.parentNode;
					f.removeChild(f.querySelector('.dislike-cover'))
				} else {
					const cover = document.createElement('div');
					cover.className = 'dislike-cover';
					cover.dataset.reason_id = target.dataset.reason_id;
					cover.innerHTML = '<a class="lazy-img"><br><br><br>提交成功，但愿服务器少给点这种东西。<br><b>点击撤销操作</b></a>';
					cover.onclick = dislike;
					parent.parentNode.appendChild(cover);
				}
			};
			//console.log(url);
			GM_xmlhttpRequest({
				method: 'GET',
				url,
				onload: res => {
					try {
						const par = JSON.parse(res.response);
						if (par.code == 0) {
							handleCover()
						} else if ((par.code == -101 && par.message == '账号未登录')) {
							setting.storageAccessKey(undefined);
							tools.toast(`未获取授权或者授权失效，请点击设置重新获取授权`)
						} else {
							tools.toast(`请求不喜欢错误code${par.code}</br>msg${par.message}`,{par,url})
						}
					} catch (e){
						tools.toast(`请求不喜欢发生错错误${e}`,e)
					}
				},
				onerror: e=> {
					tools.toast(`请求不喜欢发生错误`,e)
				}
			});
			return false;
		}
	}

	//初始化
	function init() {
		if (document.querySelector('.bili-layout')) {
			element.isNew = 1;
		} else if (document.querySelector('#i_cecream')) {
			element.isNew = 2;
			alert('Bilibili APP首页脚本目前尚未适配新版主页，点击https://github.com/indefined/UserScripts/issues/76 查看详情');
		}
		try {
			setting.init();
			InitRecommend();
			window.addEventListener("beforeunload", () => setting.saveHistory())
		} catch(e) {
			console.error(e);
		}
	}

	if (element.mainDiv) {
		tools.delCommentAttr(element.mainDiv)
		init()
	}
})()
