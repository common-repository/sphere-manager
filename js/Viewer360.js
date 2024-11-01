/**
 * [Viewer360 コンストラクタ]
 * extend Core360
 * @param {Object} Element [https://developer.mozilla.org/en-US/docs/Web/API/Element]
 * @return {Object} viewer360
 */
function Viewer360(element) {
	var viewer360 = Object.create(Viewer360.prototype);
	//親オブジェクトプロパティを子オブジェクトへコピー　Core360を継承
	Object.assign(viewer360, Core360(element));

	//画面上のコントローラーを配置するelementを定義
	viewer360.controllerElement = document.createElement('div');
	viewer360.controllerElement.className = 'controller';
	viewer360.controllerElement.style.position = 'absolute';
	viewer360.controllerElement.style.pointerEvents = 'none';
	viewer360.controllerElement.style.zIndex = 3;
	viewer360.controllerElement.style.top = '0px';
	viewer360.controllerElement.style.width = element.style.width;
	viewer360.controllerElement.style.height = element.style.height;

	//IEにて動作変えている
	var userAgent = window.navigator.userAgent.toLowerCase();
	if (userAgent.match(/(msie|MSIE)/) || userAgent.match(/(T|t)rident/)) {
		var isIE = true;
		var ieVersion = userAgent.match(/((msie|MSIE)\s|rv:)([\d\.]+)/)[3];
		ieVersion = parseInt(ieVersion);
	} else {
		var isIE = false;
	}
	if (isIE) {
		//content: "Internet Explorer では表示できません";
		var notsaport = document.createElement('div');
		notsaport.classList.add("notsaport");
		notsaport.innerText = "Your browser is not supported";
		viewer360.controllerElement.appendChild(notsaport);
	}
	viewer360.screenElement.appendChild(viewer360.controllerElement);


	var ua = navigator.userAgent;
	
	if (ua.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('iPad') > 0 ) {
		// ios
	} else {
		//pc android
		//フルスクリーンボタンを配置
		var viewerFullScreenControll = document.createElement('div');
		viewerFullScreenControll.classList.add("viewerFullScreenControll");
		viewerFullScreenControll.innerHTML = '<span class="glyphicon glyphicon-fullscreen" aria-hidden="true"></span>';

		var fullScreen = function (event) {
			if(!documentIsEnabledFullscreen(document)){
				return;
			}
			if(documentIsFullscreen(document)){
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.msExitFullscreen) {
					document.msExitFullscreen();
				}

			}else{
				if (viewer360.screenElement.requestFullscreen) {
					viewer360.screenElement.requestFullscreen();
				} else if (viewer360.screenElement.webkitRequestFullscreen) {
					viewer360.screenElement.webkitRequestFullscreen();
				} else if (viewer360.screenElement.mozRequestFullScreen) {
					viewer360.screenElement.mozRequestFullScreen();
				} else if (viewer360.screenElement.msRequestFullscreen) {
					viewer360.screenElement.msRequestFullscreen();
				}
			}
		}
		viewerFullScreenControll.addEventListener('click',fullScreen, true);
		viewerFullScreenControll.addEventListener('touchend', fullScreen, true);
		viewer360.controllerElement.appendChild(viewerFullScreenControll);
	}
	

	

	//カメラのコントローラーを配置 
	/*
	 * 画面上のボタンにて移動中であるか
	 * clickしたボタンidが挿入される
	 * 移動が終わるとnullが挿入される
	 */

	viewer360.rotaryNumber = null;

	var cameraControllers = document.createElement('div');
	cameraControllers.classList.add("cameraControllers");
	var cameraDirection = document.createElement('div');
	cameraDirection.innerHTML = '<span class="glyphicon glyphicon-menu-down"></span>';
	cameraDirection.classList.add("cameraDirection");
	//core360.abcRenderをoverride
	viewer360.abcRender = function () {
		cameraDirection.style.MozTransform = 'rotate(' + viewer360.lon + 'deg)';
		cameraDirection.style.WebkitTransform = 'rotate(' + viewer360.lon + 'deg)';
		cameraDirection.style.OTransform = 'rotate(' + viewer360.lon + 'deg)';
		cameraDirection.style.MsTransform = 'rotate(' + viewer360.lon + 'deg)';
		cameraDirection.style.transform = 'rotate(' + viewer360.lon + 'deg)';
		// edge browser対応
		// fovの変更を行うことで正常にラベルが表示される。
		viewer360.camera.fov += 0.00001;
	};
	cameraControllers.appendChild(cameraDirection);
	viewer360.controllerElement.appendChild(cameraControllers);
	
	for (var i = 0; i < 4; i++) {
		var cameraController = document.createElement('div');
		cameraController.classList.add("cameraController-" + i);
		switch (i) {
			case 0:
				cameraController.innerHTML = '<span data-i="0" class="glyphicon glyphicon-chevron-up"></span>';
				break;
			case 1:
				cameraController.innerHTML = '<span data-i="1" class="glyphicon glyphicon-triangle-right"></span>';
				break;
			case 2:
				cameraController.innerHTML = '<span data-i="2" class="glyphicon glyphicon-chevron-down"></span>';
				break;
			case 3:
				cameraController.innerHTML = '<span data-i="3" class="glyphicon glyphicon-triangle-left"></span>';
				break;
			default:
		}
		var rotation = function (event) {

			if (event.target.dataset.i == null) {
        		return;
			}
			
			viewer360.lon = viewer360.lon % 360;
			viewer360.lat = viewer360.lat % 360;
			
			var targetPoint = {
				lat: 0,
				lon: Number(event.target.dataset.i) * 90,
				i: Number(event.target.dataset.i)
			};

			if (targetPoint.lon - viewer360.lon >= 180) {
				targetPoint.lon = targetPoint.lon - 360;
			}

			viewer360.rotaryNumber = Number(event.target.dataset.i);

			viewer360.isMouseMoved = true;
	
			var setTimeoutFunction  = function() {

				var vlon = viewer360.vlon - (viewer360.lon - targetPoint.lon) * 0.01;
				var vlat = viewer360.vlat - (viewer360.lat - targetPoint.lat) * 0.01;

				vlon *= 0.9;
				vlat *= 0.9;

				if (Math.abs(vlon) + Math.abs(vlat) < 0.01 || targetPoint.i !== viewer360.rotaryNumber) {
					return;
				}

				viewer360.vlon = vlon;
				viewer360.vlat = vlat;

				setTimeout(setTimeoutFunction, 10);
			}
			setTimeoutFunction();
		}
		cameraController.addEventListener('click', rotation, true);
		cameraController.addEventListener('touchend', rotation, true);

		cameraControllers.appendChild(cameraController);
	}

	//EventListenerを追加
	viewer360.addEventListeners();

	//レンダラーを実行
	viewer360.render();

	//viewer360オブジェクトを返す
	return viewer360;
}
Viewer360.prototype = {
	/**
	 * abcAddItem シーンにrenderCss3dObjectを追加する
	 * @param {object} data {'x','y','z','width','height','linkSceneId','isSprite','innerHTML'}
	 */
	abcAddItem: function (data) {
		var element = document.createElement("div");
		element.innerHTML = data.innerHTML;
		element.style.height = data.height + 'px';
		element.style.width = data.width + 'px';
		element.style.userSelect = 'none';

		/*
			スプライトまたは通常のオブジェクトか
		 */

		var renderCss3dObject = null;
		//IEにて動作変えている
		var userAgent = window.navigator.userAgent.toLowerCase();
		if (userAgent.match(/(msie|MSIE)/) || userAgent.match(/(T|t)rident/)) {
			var isIE = true;
			var ieVersion = userAgent.match(/((msie|MSIE)\s|rv:)([\d\.]+)/)[3];
			ieVersion = parseInt(ieVersion);
		} else {
			var isIE = false;
		}
		if (isIE) {
			renderCss3dObject = new THREE.CSS2DObject(element);
		} else {
			if (data.isSprite == "1") {
				renderCss3dObject = new THREE.CSS3DSprite(element);
			} else {
				renderCss3dObject = new THREE.CSS3DObject(element);
			}
		}

		var planeGeometry = new THREE.PlaneGeometry(data.width, data.height);
		var planeMaterial = new THREE.MeshDepthMaterial({
			transparent: true,
			opacity: 0.0
		});
		var planeMeshObjectForRaycasting = new THREE.Mesh(planeGeometry, planeMaterial);

		this.planeMeshObjectsForRaycasting.push(planeMeshObjectForRaycasting);

		//推移する要素があるか
		if (data.linkSceneId == -1) {
			planeMeshObjectForRaycasting.userData = {
				renderCss3dObjectId: renderCss3dObject.id
			};
		} else {
			planeMeshObjectForRaycasting.userData = {
				renderCss3dObjectId: renderCss3dObject.id,
				linkSceneId: data.linkSceneId
			};
		}

		renderCss3dObject.position.set(data.x, data.y, data.z);
		renderCss3dObject.lookAt(this.camera.rotation);

		planeMeshObjectForRaycasting.position.set(data.x, data.y, data.z);
		planeMeshObjectForRaycasting.lookAt(this.camera.rotation);

		this.scene2.add(renderCss3dObject);
		this.scene.add(planeMeshObjectForRaycasting);
	},

	/**
	 * イベントをエレメントやwindowオブジェクトに設定する。
	 */
	addEventListeners: function () {
		var onSelectStart = function (event) {
			return false;
		}
		/**
		 * mouseDown時のメソッド
		 * @param  {Object} event EventObject
		 */
		var onMouseDown = function (event) {
			this.isDuringRotary = true;
			this.isMouseMoved = false;
			this.forwardClientX = event.clientX;
			this.nowClientX = event.clientX;
			this.forwardClientY = event.clientY;
			this.nowClientY = event.clientY;
			this.vlon = 0;
			this.vlat = 0;
		}

		var onTouchStart = function (event) {
			event.preventDefault();
			this.isDuringRotary = true;
			this.isMouseMoved = false;

			this.forwardClientX = event.touches[0].clientX;
			this.nowClientX = event.touches[0].clientX;
			this.forwardClientY = event.touches[0].clientY;
			this.nowClientY = event.touches[0].clientY;
			this.vlon = 0;
			this.vlat = 0;
		}

		var onTouchMove = function (event) {
			event.preventDefault();

			if ( ( Math.abs( this.forwardClientX - event.touches[0].clientX ) > 6 ||  Math.abs( this.forwardClientY - event.touches[0].clientY ) > 6 )) {
				this.isMouseMoved = true;
			}

			if (this.isMouseMoved === true) {
				this.forwardClientX = this.nowClientX;
				this.nowClientX = event.touches[0].clientX;
				this.forwardClientY = this.nowClientY;
				this.nowClientY = event.touches[0].clientY;

				this.vlon = (this.forwardClientX - this.nowClientX) * 0.3 * this.camera.fov / 180;
				this.vlat = (this.nowClientY - this.forwardClientY) * 0.3 * this.camera.fov / 180;

				this.lon += this.vlon;
				this.lat += this.vlat;
				this.lat = Math.max(-85, Math.min(85, this.lat));
				this.phi = THREE.Math.degToRad(90 - this.lat);
				this.theta = THREE.Math.degToRad(this.lon);
				this.camera.target.x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
				this.camera.target.y = 500 * Math.cos(this.phi);
				this.camera.target.z = 500 * Math.sin(this.phi) * Math.sin(this.theta);
				this.camera.lookAt(this.camera.target);
			}
		}

		/**
		 * mouseUP時のメソッド
		 * @param  {Object} event EventObject
		 */
		var onMouseUp = function (event) {
			event.stopPropagation();
			if (this.isMouseMoved === false) {
				var mouse = {
					x: 0,
					y: 0
				};
				mouse.x = Number(this.nowClientX) - Number(this.screenElement.getBoundingClientRect().left);
				mouse.y = Number(this.nowClientY) - Number(this.screenElement.getBoundingClientRect().top);

				mouse.x = (mouse.x / this.screenElement.clientWidth) * 2 - 1;
				mouse.y = -(mouse.y / this.screenElement.clientHeight) * 2 + 1;

				var vector = new THREE.Vector3(mouse.x, mouse.y, -1);

				// vector はスクリーン座標系なので, オブジェクトの座標系に変換
				vector.unproject(this.camera);

				// 始点, 向きベクトルを渡してレイを作成
				var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

				var obj = ray.intersectObjects(this.planeMeshObjectsForRaycasting, true);

				if (obj.length > 0) {　 //選択されたオブジェクト

					if (obj[0].object.userData.linkSceneId && obj[0].object.userData.linkSceneId != -1) {
						this.controllerElement.style.backgroundColor = 'rgba(200,200,200,255)';
						this.controllerElement.className = 'controller loading';
						var self = this;
						this.setSceneForRepository(
							obj[0].object.userData.linkSceneId,
							function (data) {
								self.controllerElement.style.backgroundColor = 'rgba(0,0,0,0)';
								self.controllerElement.className = 'controller';
							},
							function (data) {
								alert(data.massage);
								self.controllerElement.style.backgroundColor = 'rgba(0,0,0,0)';
								self.controllerElement.className = 'controller';
							}
						);
					}
				}
			}

			this.isDuringRotary = false;
			this.isMouseMoved = false;
		}

		/**
		 * 画面上でマウスがドラックしていたら画面を回転させる
		 * @param  {Object} event EventObject
		 */
		var onMouseMove = function (event) {
			event.stopPropagation();
			event.preventDefault();

			if (event.which === 0) {
				this.isMouseMoved = false;
				this.isDuringRotary = false;
			}
			
			
			if ( ( Math.abs(this.forwardClientX - event.clientX ) > 3 ||  Math.abs( this.forwardClientY - event.clientY ) > 3 ) && event.which !== 0) {
				this.isMouseMoved = true;
			}

			if (this.isDuringRotary === true) {
				this.forwardClientX = this.nowClientX;
				this.nowClientX = event.clientX;
				this.forwardClientY = this.nowClientY;
				this.nowClientY = event.clientY;

				this.vlon = (this.forwardClientX - this.nowClientX) * 0.3 * this.camera.fov / 180;
				this.vlat = (this.nowClientY - this.forwardClientY) * 0.3 * this.camera.fov / 180;

				this.lon += this.vlon;
				this.lat += this.vlat;
				this.lat = Math.max(-85, Math.min(85, this.lat));
				this.phi = THREE.Math.degToRad(90 - this.lat);
				this.theta = THREE.Math.degToRad(this.lon);
				this.camera.target.x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
				this.camera.target.y = 500 * Math.cos(this.phi);
				this.camera.target.z = 500 * Math.sin(this.phi) * Math.sin(this.theta);
				this.camera.lookAt(this.camera.target);
			}

			//IEにおいて選択禁止
			event.returnValue = false;

			return false;
		}

		/**
		 * マウスのホイールした時にカメラのFOV値を変える
		 * @param  {object} event EventObject
		 */
		var onMouseWheel = function (event) {
			event.preventDefault();
			event.stopPropagation();
			this.camera.fov += event.deltaY * 0.1;
			this.camera.fov = Math.max(10, Math.min(110, this.camera.fov));
			this.camera.updateProjectionMatrix();
		}

		/**
		 * リサイズ時シーン毎の画面サイズ等をあわせる
		 */
		var onWindowResize = function () {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			this.renderer2.setSize(window.innerWidth, window.innerHeight);
			this.renderer.render(this.scene, this.camera);
			this.renderer2.render(this.scene2, this.camera);
			this.controllerElement.style.width = element.style.width;
			this.controllerElement.style.height = element.style.height;
		}

		var scroll_event = 'onwheel' in this.screenElement ? 'wheel' : 'onmousewheel' in this.screenElement ? 'mousewheel' : 'DOMMouseScroll';
		this.screenElement.addEventListener(scroll_event, onMouseWheel.bind(this), false);
		this.screenElement.addEventListener('onSelectStart', onSelectStart.bind(this), false);
		this.screenElement.addEventListener('mousedown', onMouseDown.bind(this), false);
		window.addEventListener('mouseup', onMouseUp.bind(this), false);
		window.addEventListener('mousemove', onMouseMove.bind(this), false);
		this.screenElement.addEventListener("touchstart", onTouchStart.bind(this), false);
		window.addEventListener("touchmove", onTouchMove.bind(this), false);
		window.addEventListener("touchend", onMouseUp.bind(this), false);
		window.addEventListener('resize', onWindowResize.bind(this), false);
	}
};
//Core360のプロトタイプ利用し継承する。
Object.setPrototypeOf(Viewer360.prototype, Core360.prototype);


/**
 * [documentIsEnabledFullscreen フルスクリーン表示が可能か調べる関数]
 * @param {Object} Document [https://developer.mozilla.org/en-US/docs/Web/API/Document]
 * @return {Boolean}
 */
function documentIsEnabledFullscreen(document_obj) {
	return (
		document_obj.fullscreenEnabled ||
		document_obj.webkitFullscreenEnabled ||
		document_obj.mozFullScreenEnabled ||
		document_obj.msFullscreenEnabled ||
		false
	);
}


/**
 * [documentIsFullscreen フルスクリーン表示であるか調べる関数]
 * @param {Object} Document [https://developer.mozilla.org/en-US/docs/Web/API/Document]
 * @return {Boolean}
 */
function documentIsFullscreen(document_obj) {
	return (
		document_obj.fullScreen ||
		document_obj.mozFullScreen ||
		document_obj.webkitIsFullScreen ||
		false
	);
}
