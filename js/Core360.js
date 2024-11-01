/**
 * [Core360 コンストラクタ]
 *　引数にElementなオブジェクト上に球体画像を表示する。
 *　factory メソッド
 * @param {Object} Element [https://developer.mozilla.org/en-US/docs/Web/API/Element]
 * @return {Object} Core360
 */
function Core360(element) {
	var core360 = Object.create(Core360.prototype);
	core360.screenElement = element;
	core360.planeMeshObjectsForRaycasting = [];

	//デフォルトの球体画像urlをセット
	core360.imageSrc = "../img/default.png";

	core360.isVideo = 0;
	//状態に関するプロパティ
	//画面回転判定
	core360.isDuringRotary = false;
	//クリック判定
	core360.isMouseMoved = false;

	//マウス位置に関するプロパティ
	//前フレームのマウス位置
	core360.forwardClientX = 0;
	core360.forwardClientY = 0;
	//現在フレームのマウス位置
	core360.nowClientX = 0;
	core360.nowClientY = 0;

	//カメラの位置に関するプロパティ
	//経度緯度 カメラの中心を指す
	core360.lon = 0;
	core360.lat = 0;
	//経度緯度ごとのカメラの回転速度 単位 度数法
	core360.vlon = 0;
	core360.vlat = 0;
	//経度緯度ごとのカメラの回転速度　単位 弧度法 rad
	core360.phi = THREE.Math.degToRad(90 - core360.lat);
	core360.theta = THREE.Math.degToRad(core360.lon);

	//球体を配置するシーンとラベルを配置するシーン
	core360.scene = new THREE.Scene();
	core360.scene2 = new THREE.Scene();

	//表示を調整
	core360.screenElement.style.position = 'relative';
	core360.screenElement.style.height = '100%';
	core360.screenElement.style.width = '100%';

	core360.renderer = new THREE.WebGLRenderer();

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
		core360.renderer2 = new THREE.CSS2DRenderer();
	} else {
		core360.renderer2 = new THREE.CSS3DRenderer();
	}

	//各renderごとの表示調整
	core360.renderer.setSize(core360.screenElement.clientWidth, core360.screenElement.clientHeight);
	core360.renderer2.setSize(core360.screenElement.clientWidth, core360.screenElement.clientHeight);
	core360.renderer.domElement.style.position = 'absolute';
	core360.renderer.domElement.style.zIndex = 1;
	core360.renderer2.domElement.style.position = 'absolute';
	core360.renderer2.domElement.style.zIndex = 2;
	core360.renderer2.domElement.style.top = '0px';

	//screenElementに子要素renderer elementを追加する
	core360.screenElement.appendChild(core360.renderer.domElement);
	core360.screenElement.appendChild(core360.renderer2.domElement);

	//カメラの定義と角度を定義
	core360.camera = new THREE.PerspectiveCamera(75, core360.screenElement.clientWidth / core360.screenElement.clientHeight, 0.1, 1000);
	core360.camera.updateProjectionMatrix();
	core360.camera.target = new THREE.Vector3(0, 0, 0);
	core360.camera.target.x = 500 * Math.sin(core360.phi) * Math.cos(core360.theta);
	core360.camera.target.y = 500 * Math.cos(core360.phi);
	core360.camera.target.z = 500 * Math.sin(core360.phi) * Math.sin(core360.theta);
	core360.camera.lookAt(core360.camera.target);

	//球体を定義しsceneに追加する
	core360.sphereGeometry = new THREE.SphereGeometry(500, 50, 50);
	core360.sphereGeometry.scale(-1, 1, 1);
	core360.spherematerial = new THREE.MeshBasicMaterial();
	core360.sphere = new THREE.Mesh(core360.sphereGeometry, core360.spherematerial);
	core360.sphere.rotation.set(0, Math.PI, 0);
	core360.scene.add(core360.sphere);


	return core360;
}

Core360.prototype = {
	/**
	 * [render THREE.jsライブラリで呼ばれるrenderメソッド]
	 */
	render: function () {
		requestAnimationFrame(this.render.bind(this));
		if (this.texture) {
			this.texture.needsUpdate = true;
		}

		if (this.isDuringRotary === false) {
			this.vlon = this.vlon * 0.97
			this.vlat = this.vlat * 0.97
			this.lon += this.vlon;
			var _limitLat = this.lat + this.vlat;
			this.lat = Math.max(-85, Math.min(85, _limitLat));
			this.phi = THREE.Math.degToRad(90 - this.lat);
			this.theta = THREE.Math.degToRad(this.lon);
			this.camera.target.x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
			this.camera.target.y = 500 * Math.cos(this.phi);
			this.camera.target.z = 500 * Math.sin(this.phi) * Math.sin(this.theta);
			this.camera.lookAt(this.camera.target);
			this.camera.updateProjectionMatrix();
		}
		this.abcRender();
		this.renderer.render(this.scene, this.camera);
		this.renderer2.render(this.scene2, this.camera);
	},

	/**
	 * [abcRender render内で呼び出される abstract メソッド]
	 * 継承先からrender毎に値を取得または設定するときに使用します。
	 * 継承先でオバーライドしてください。
	 */
	abcRender: function () { },

	/**
	 * [abcAddItem パノラマ画像を設定]
	 * @param {String} url 画像URL
	 */
	setImage: function (url) {
		if ('video' in this) {
			this.video.pause();
			delete this.video;
		}

		this.imageSrc = url;
		this.isVideo = 0;
		this.scene.remove(this.sphere);

		if (this.mapSphereTexture) {
			this.mapSphereTexture.dispose();
		}

		this.spherematerial.dispose();

		var texloader = new THREE.TextureLoader();
		this.mapSphereTexture = texloader.load(this.imageSrc);
		this.spherematerial = new THREE.MeshBasicMaterial({
			map: this.mapSphereTexture
		});
		this.sphere = new THREE.Mesh(this.sphereGeometry, this.spherematerial);
		this.sphere.rotation.set(0, Math.PI, 0);
		this.scene.add(this.sphere);
	},

	/**
	 * [itemUpdate]
	 * itemが追加または削除された時に呼ばれる。
	 * オーバーライドで利用。
	 */
	lookCameraById: function (id) {
		for (var i = 0; i < this.planeMeshObjectsForRaycasting.length; i++) {
			if (this.planeMeshObjectsForRaycasting[i].id == id) {
				var targetPosition = this.planeMeshObjectsForRaycasting[i].position;
				var phi;
				phi = Math.atan(targetPosition.z / targetPosition.x);
				if (targetPosition.x >= 0) {
					this.lon = THREE.Math.radToDeg(phi);
				} else {
					this.lon = THREE.Math.radToDeg(phi) - 180;
				}

				var r = Math.sqrt(targetPosition.x * targetPosition.x + targetPosition.z * targetPosition.z);
				var theta = Math.atan(targetPosition.y / r);

				this.lat = THREE.Math.radToDeg(theta);

				this.vlat = 0;
				this.vlon = 0;
			}
		}
	},

	/**
	 * [itemUpdate]
	 * itemが追加または削除された時に呼ばれる。
	 * オーバーライドで利用。
	 */
	itemUpdate: function (cb) { },

	/**
	 * [abcAddItem abstract メソッド]
	 * 継承先のViewer360とGenerator360でabcAddItemにて意味合いが異なるため抽象メソッドにした。
	 * 例　editor画面ではラベルに白い枠が付いて削除が可能。
	 * 継承先でオーバーライド
	 */
	abcAddItem: function () {
		this.itemUpdate();
	},

	/**
	 * [delItemById]
	 * 指定されたidのplaneMeshObjectsForRaycastingにあるオブジェクトをsceneから削除
	 */
	delItemById: function (id) {
		for (var i = 0; i < this.planeMeshObjectsForRaycasting.length; i++) {
			if (this.planeMeshObjectsForRaycasting[i].id == id) {
				this.scene.remove(this.planeMeshObjectsForRaycasting[i]);
				this.scene2.remove(this.scene2.getObjectById(this.planeMeshObjectsForRaycasting[i].userData.renderCss3dObjectId));
				this.planeMeshObjectsForRaycasting.splice(i, 1);
			}
		}
		this.itemUpdate();
	},

	/**
	 * [setSceneRepositoryUrl sceneが保存されているサーバURLを設定]
	 * @param {string} url [description]
	 */
	setSceneRepositoryUrl: function (url) {
		this.SceneRepositoryUrl = url;
	},

	/**
	 * [setSceneForRepository サーバーからsceneを取得]
	 * @param {Number} id 取得したいsceneのid
	 * @param {Function} 成功したとき非同期的にcbを実行
	 * @param {Function} 失敗したとき非同期的にcbを実行
	 */
	setSceneForRepository: function (id, cb, failcb) {
		if (!this.setSceneRepositoryUrl) {
			console.log('not set repo');
			return;
		}
		var self = this;
		jQuery.ajax({
			url: this.SceneRepositoryUrl + '&sceneid=' + id,
			type: 'POST',
			dataType: 'json',
			scriptCharset: 'UTF-8',
			contentType: 'application/json'
		})
		.done(function (data, textStatus, jqXHR) {
			self.refresh();
			if (data['isVideo'] == '0') {
				self.setImage(data['imageSrc']);
			} else {
				self.setVideo(data['imageSrc']);
			}


			for (var i = 0; data.displayElementObjects && i < data.displayElementObjects.length; i++) {
				self.abcAddItem(data.displayElementObjects[i]);
			}
			if (cb) {
				cb(data);
			}
		})
		.fail(function (jqXHR, textStatus, errorThrown) {
			failcb(jqXHR.responseJSON);
		})
		.always(function () {
		});
	},

	/**
	 * [setVideo パノラマ動画を設定する]
	 * @param {String} url ブラウザが画像と認識するurl
	 */
	setVideo: function (url) {
		if ('video' in this) {
			this.video.pause();
			delete this.video;
		}
		this.isVideo = 1;
		this.imageSrc = url;
		this.scene.remove(this.sphere);
		if (this.mapSphereTexture) {
			this.mapSphereTexture.dispose();
		}
		this.spherematerial.dispose();

		this.video = document.createElement('video');
		this.video.crossOrigin = "anonymous";
		this.video.src = url;
		this.video.loop = true;
		this.video.autoplay = true;
		this.video.load();


		this.texture = new THREE.Texture(this.video);
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;
		this.texture.format = THREE.RGBFormat;

		this.spherematerial = new THREE.MeshBasicMaterial({
			map: this.texture
		});
		this.sphere = new THREE.Mesh(this.sphereGeometry, this.spherematerial);

		this.scene.add(this.sphere);

	},

	/**
	 * [refresh ラベルをすべて削除する]
	 */
	refresh: function () {
		for (var i = 0; i < this.planeMeshObjectsForRaycasting.length; i++) {
			this.scene2.remove(this.scene2.getObjectById(this.planeMeshObjectsForRaycasting[i].userData.renderCss3dObjectId));
			this.scene.remove(this.planeMeshObjectsForRaycasting[i]);
		}
		this.planeMeshObjectsForRaycasting = []
	}
};
