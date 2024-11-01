function Generator360(element) {
	var generator360 = Object.create(Generator360.prototype);
	Object.assign(generator360, Core360(element));

	generator360.pointData = null;
	generator360.addEventListeners();
	generator360.render();
	return generator360;
}
Generator360.prototype = {
	/**
	 * [abcAddItem シーンにアイテムを追加する]
	 * @param {Object} {
	 *       'linkCceneId'   => 'Number',
	 *       'isSprite'     => 'Number',
	 *       'innerHTML' => 'String',
	 *       'width' => 'Number',
	 *       'height' => 'Number',
	 *       'x' => 'Number',
	 *       'y' => 'Number',
	 *       'z' => 'Number'
	 * }
	 */

	abcAddItem: function (data) {
		var element = document.createElement('div');
		element.innerHTML = data.innerHTML;
		element.style.pointerEvents = 'none';
		element.style.height = data.height + 'px';
		element.style.width = data.width + 'px';
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
		var planeMaterial = new THREE.MeshBasicMaterial();
		planeMaterial.wireframe = true
		var planeMeshObjectForRaycasting = new THREE.Mesh(planeGeometry, planeMaterial);

		this.planeMeshObjectsForRaycasting.push(planeMeshObjectForRaycasting);

		//推移する要素があるか
		if (data.linkSceneId === -1) {
			planeMeshObjectForRaycasting.userData = {
				renderCss3dObjectId: renderCss3dObject.id,
				isSprite: data.isSprite
			};
		} else {
			planeMeshObjectForRaycasting.userData = {
				renderCss3dObjectId: renderCss3dObject.id,
				isSprite: data.isSprite,
				linkSceneId: data.linkSceneId
			};
		}

		renderCss3dObject.position.set(data.x, data.y, data.z);
		renderCss3dObject.lookAt(this.camera.rotation);

		planeMeshObjectForRaycasting.position.set(data.x, data.y, data.z);
		planeMeshObjectForRaycasting.lookAt(this.camera.rotation);

		this.scene2.add(renderCss3dObject);
		this.scene.add(planeMeshObjectForRaycasting);
		this.itemUpdate();
	},

	/**
	 * [getJsonData json文字列でラベルとして挿入されている情報を全て返します]
	 * @return {String} {
	 *         imageSrc: 'String',
	 *         displayElementObjects : [{
	 *           'linksceneid'   => 'Number',
	 *           'issprite'     => 'Number',
	 *           'innerhtml' => 'String',
	 *           'width' => 'Number',
	 *           'height' => 'Number',
	 *           'x' => 'Number',
	 *           'y' => 'Number',
	 *           'z' => 'Number'
	 *          }]
	 *  }
	 */
	getJsonData: function () {
		var data = {
			isVideo: this.isVideo,
			imageSrc: this.imageSrc,
			displayElementObjects: []
		};
		data.displayElementObjects = this.getLabelObjectsData();
		return JSON.stringify(data);
	},

	/**
	 * [getData オブジェクトでラベルとして挿入されている情報を全て返します]
	 * @return {Object} {
	 *         isVideo: 'Number'
	 *         imageSrc: 'String',
	 *         displayElementObjects : [{
	 *           'linksceneid'   => 'Number',
	 *           'issprite'     => 'Number',
	 *           'innerhtml' => 'String',
	 *           'width' => 'Number',
	 *           'height' => 'Number',
	 *           'x' => 'Number',
	 *           'y' => 'Number',
	 *           'z' => 'Number'
	 *          }]
	 *  }
	 */
	getData: function () {
		var data = {
			isVideo: this.isVideo,
			imageSrc: this.imageSrc,
			displayElementObjects: []
		};
		data.displayElementObjects = this.getLabelObjectsData();
		return data;
	},
	getLabelObjectsData: function () {
		var data = [];
		for (var i = 0; i < this.planeMeshObjectsForRaycasting.length; i++) {
			var displayElementObject = {};
			if (this.planeMeshObjectsForRaycasting[i].userData.linkSceneId) {
				displayElementObject.linkSceneId = this.planeMeshObjectsForRaycasting[i].userData.linkSceneId;
			} else {
				displayElementObject.linkSceneId = -1;
			}
			displayElementObject.isSprite = Number(this.planeMeshObjectsForRaycasting[i].userData.isSprite);
			displayElementObject.x = this.planeMeshObjectsForRaycasting[i].position.x;
			displayElementObject.y = this.planeMeshObjectsForRaycasting[i].position.y;
			displayElementObject.z = this.planeMeshObjectsForRaycasting[i].position.z;
			displayElementObject.width = this.planeMeshObjectsForRaycasting[i].geometry.parameters.width;
			displayElementObject.height = this.planeMeshObjectsForRaycasting[i].geometry.parameters.height;
			displayElementObject.innerHTML = this.scene2.getObjectById(this.planeMeshObjectsForRaycasting[i].userData.renderCss3dObjectId).element.innerHTML;
			displayElementObject.threejsId = this.planeMeshObjectsForRaycasting[i].id;
			data.push(displayElementObject);
		}
		return data;
	},
	/**
	 * [setpointData 追加したいcss3dオブジェクトを設定。]
	 * @param {object} {
	 *        'linksceneid'   => 'Number',
	 *        'issprite'     => 'Number',
	 *        'innerhtml' => 'String',
	 *        'width' => 'Number',
	 *        'height' => 'Number',
	 *        'x' => 'Number',
	 *        'y' => 'Number',
	 *        'z' => 'Number'
	 * }
	 */
	setpointData: function (pointData) {
		this.pointData = pointData;
	},

	onSelectItemObj: function (id) {

	},

	selectEffect: function (id) {
		for (var i = 0; i < this.planeMeshObjectsForRaycasting.length; i++) {
			this.planeMeshObjectsForRaycasting[i].material.color = new THREE.Color(0xFFFFFF);
			if (id == this.planeMeshObjectsForRaycasting[i].id) {
				this.planeMeshObjectsForRaycasting[i].material.color = new THREE.Color(0xFF0000);
			}
			this.planeMeshObjectsForRaycasting[i].material.update();
		}
	},
	/**
	 * [addEventListeners イベントをエレメントやwindowオブジェクトに設定する。]
	 */
	addEventListeners: function () {
		var onMouseDown = function (event) {
			event.stopPropagation();
			event.preventDefault();
			var mouse = {
				x: 0,
				y: 0
			};
			mouse.x = Number(event.clientX) - Number(this.screenElement.getBoundingClientRect().left);
			mouse.y = Number(event.clientY) - Number(this.screenElement.getBoundingClientRect().top);

			mouse.x = (mouse.x / this.screenElement.clientWidth) * 2 - 1;
			mouse.y = -(mouse.y / this.screenElement.clientHeight) * 2 + 1;

			// マウスベクトル
			var vector = new THREE.Vector3(mouse.x, mouse.y, -1);

			// vector はスクリーン座標系なので, オブジェクトの座標系に変換
			vector.unproject(this.camera);

			// 始点, 向きベクトルを渡してレイを作成
			var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

			// クリック判定
			var obj = ray.intersectObjects(this.planeMeshObjectsForRaycasting, true);

			if (obj.length > 0) {　 //選択されたオブジェクトを移動
				this.isDuringRotary = false;
				this.isMouseMoved = false;
				this.isDuringObject = true;

				this.duringObject = obj[0].object;
			} else { //ドラッグしない。
				this.isDuringRotary = true;
				this.isMouseMoved = false;
				this.isDuringObject = false;

				this.forwardClientX = event.clientX;
				this.nowClientX = event.clientX;
				this.forwardClientY = event.clientY;
				this.nowClientY = event.clientY;
				this.vlon = 0;
				this.vlat = 0;
			}


		};

		var onMouseUp = function (event) {
			event.stopPropagation();
			if (this.isDuringObject === true) {
				this.duringObject = null;
			}

			if (this.isMouseMoved === false) {
				var mouse = {
					x: 0,
					y: 0
				};
				mouse.x = Number(event.clientX) - Number(this.screenElement.getBoundingClientRect().left);
				mouse.y = Number(event.clientY) - Number(this.screenElement.getBoundingClientRect().top);

				mouse.x = (mouse.x / this.screenElement.clientWidth) * 2 - 1;
				mouse.y = -(mouse.y / this.screenElement.clientHeight) * 2 + 1;

				// マウスベクトル
				var vector = new THREE.Vector3(mouse.x, mouse.y, -1);

				// vector はスクリーン座標系なので, オブジェクトの座標系に変換
				vector.unproject(this.camera);

				// 始点, 向きベクトルを渡してレイを作成
				var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

				// クリック判定
				var obj = ray.intersectObjects(this.planeMeshObjectsForRaycasting, true);

				if (obj.length > 0) {
					this.onSelectItemObj(obj[0].object.id);
				} else { //要素を追加
					var obj = ray.intersectObjects([this.sphere]);

					if (obj.length > 0) {
						if (this.pointData) {
							this.abcAddItem({
								innerHTML: this.pointData.innerHTML,
								isSprite: this.pointData.isSprite,
								linkSceneId: this.pointData.linkSceneId,
								width: this.pointData.width,
								height: this.pointData.height,
								x: obj[0].point.x * 0.8,
								y: obj[0].point.y * 0.8,
								z: obj[0].point.z * 0.8
							});
						}
					}
				}
			}

			this.isDuringRotary = false;
			//g
			this.isDuringObject = false;
		};

		var onMouseMove = function (event) {
			event.stopPropagation();
			
			if ( ( Math.abs(this.forwardClientX - event.clientX ) > 3 ||  Math.abs( this.forwardClientY - event.clientY ) > 3 ) && event.which !== 0) {
				this.isMouseMoved = true;
			}
			
			if (this.isDuringObject === true) {

				var mouse = {
					x: 0,
					y: 0
				};
				mouse.x = Number(event.clientX) - Number(this.screenElement.getBoundingClientRect().left);
				mouse.y = Number(event.clientY) - Number(this.screenElement.getBoundingClientRect().top);
				mouse.x = (mouse.x / this.screenElement.clientWidth) * 2 - 1;
				mouse.y = -(mouse.y / this.screenElement.clientHeight) * 2 + 1;

				// マウスベクトル
				var vector = new THREE.Vector3(mouse.x, mouse.y, -1);

				// vector はスクリーン座標系なので, オブジェクトの座標系に変換
				vector.unproject(this.camera);

				// 始点, 向きベクトルを渡してレイを作成
				var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

				// クリック判定
				var obj = ray.intersectObjects([this.sphere]);
				if (obj) {
					var data = {
						x: obj[0].point.x * 0.8,
						y: obj[0].point.y * 0.8,
						z: obj[0].point.z * 0.8
					};
					this.duringObject.position.set(data.x, data.y, data.z);
					this.duringObject.lookAt(this.camera.rotation);

					var _css3dObject = this.scene2.getObjectById(this.duringObject.userData.renderCss3dObjectId);
					_css3dObject.position.set(data.x, data.y, data.z);
					_css3dObject.lookAt(this.camera.rotation);
				}
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
		};

		var onMouseWheel = function (event) {
			event.preventDefault();
			event.stopPropagation();
			this.camera.fov += event.deltaY * 0.1;
			this.camera.fov = Math.max(10, Math.min(110, this.camera.fov));
			this.camera.updateProjectionMatrix();
		};

		var onWindowResize = function () {
			this.camera.aspect = this.screenElement.clientWidth / this.screenElement.clientHeight;
			this.renderer.setSize(this.screenElement.clientWidth, this.screenElement.clientHeight);
			this.renderer2.setSize(this.screenElement.clientWidth, this.screenElement.clientHeight);
			this.camera.updateProjectionMatrix();
		};

		var scroll_event = 'onwheel' in this.screenElement ? 'wheel' : 'onmousewheel' in this.screenElement ? 'mousewheel' : 'DOMMouseScroll';
		this.screenElement.addEventListener(scroll_event, onMouseWheel.bind(this), false);
		this.screenElement.addEventListener('mousedown', onMouseDown.bind(this), false);
		window.addEventListener('mouseup', onMouseUp.bind(this), false);
		window.addEventListener('mousemove', onMouseMove.bind(this), false);
		window.addEventListener('resize', onWindowResize.bind(this), false);
	}
};
Object.setPrototypeOf(Generator360.prototype, Core360.prototype);
