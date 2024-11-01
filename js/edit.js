jQuery('#loader-bg ,#loader').css('display','block');
jQuery(window).load(function () { //全ての読み込みが完了したら実行
	jQuery('#loader-bg').delay(400).fadeOut(800);
	jQuery('#loader').delay(400).fadeOut(300);
});
jQuery(function() {
	
	//bootstrap3 ツールチップ有効
	jQuery('[data-toggle="popover"]').popover();
	jQuery('[data-toggle="tooltip"]').tooltip();

	//colorpickers 初期化
	jQuery('#input-label-colorpicker').colorpicker({
		color: '#99AA99',
		format: 'rgb'
	});

	//リスト内の選択されているシーンの背景を変更
	if (mwsim_configs.sceneid != 0) {
		jQuery('.list-group-item[data-sceneid=' + mwsim_configs.sceneid +  ']').addClass('bg-primary');
	}
	
	//ラベル作成画面のコードタブでは遷移機能を使用できないようにする。
	jQuery('#button_label_tab3').on('show.bs.tab', function (event) {
		jQuery('#form-transition-scene').hide('fast');
	});
	jQuery('#button_label_tab3').on('hidden.bs.tab', function (event) {
		jQuery('#form-transition-scene').show('fast');
	});

	//シーンリスト要素数更新
	jQuery('#scene-list-len').text(jQuery('#scene-list').children().length);

	if (3 <= jQuery('#scene-list').children().length && mwsim_configs.sceneid == 0) {
		var href = jQuery('#scene-list > li:first-child .btn-warning').attr("href");
		location.href = href;
	}

	if (3 <= jQuery('#scene-list').children().length) {
		jQuery('#new-scene-button a').click(function(){
			return false;
		})
		jQuery('#new-scene-button a').addClass('disabled');
	} else {
		jQuery('#new-scene-button').popover('destroy');
	}

	//共通メソッド集
	function initLabelData() {
		jQuery('#preview').empty();
		jQuery('#label-is-sprite').prop("checked", false);
		jQuery("#input-label-linkSceneId").val('');

		//text
		jQuery("#input-label-text").val('');
		jQuery("#input-label-size").val(20);
		jQuery('#input-label-colorpicker').colorpicker('setValue','#999999');

		//img
		jQuery('#select-image-src').val('');
		
		//code
		jQuery('#codeTextarea').val('');
		jQuery('#input-code-size-width').val('150');
		jQuery('#input-code-size-heigth').val('100');

		generator.selectEffect();
	}

	var $format = function (fmt, a) {
		var rep_fn;

		if (typeof a == "object") {
			rep_fn = function (m, k) { return a[k]; }
		}
		else {
			var args = arguments;
			rep_fn = function (m, k) { return args[parseInt(k) + 1]; }
		}

		return fmt.replace(/\{(\w+)\}/g, rep_fn);
	}

	var Base64 = {
		encode: function(str) {
			return window.btoa(unescape(encodeURIComponent(str)));
		},
		decode: function(str) {
			return decodeURIComponent(escape(window.atob(str)));
		}
	};
	const beforeHtmlText = '<!DOCTYPE html><html><head><meta charset="utf-8" /><title>HTML Object</title><style> body { margin : 0; } body > iframe { vertical-align : bottom; }</style></head><body>';
	const afterHtmlText = '</body></html>';

	function htmlText(body) {
		return beforeHtmlText + body + afterHtmlText;
	}

	function getHtmlBodyText(htmlText) {
		let escapeBeforeHtmlText = beforeHtmlText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		let escapeAfterHtmlText = afterHtmlText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

		let eraserBeforeHtmlText = htmlText.replace(new RegExp(escapeBeforeHtmlText, 'g'), '');
		let bodyText = eraserBeforeHtmlText.replace(new RegExp(escapeAfterHtmlText, 'g'), '');
		return bodyText;
	}

	function errorAlert(textStatus, errorThrown) {
		if (textStatus == 'error' && errorThrown == 'Bad Request') {
			alert(mwsim_character_string["error bat request"]);
		} else if (textStatus == 'error' && errorThrown == 'Not Found') {
			alert(mwsim_character_string["error not found"]);
		} else if (textStatus == 'error' && errorThrown == 'Internal Server Error') {
			alert(mwsim_character_string["error unknown"]);
		} else if (textStatus == 'error' && errorThrown == ''){
			alert(mwsim_character_string["error unknown"]);
		} else {
			alert(textStatus + ' : ' + errorThrown);
		}
	}

	function checkTransitionSceneId() {
		if (jQuery('#input-label-linkSceneId').val()) {
			if (isNaN(Number(jQuery('#input-label-linkSceneId').val())) || Number(jQuery('#input-label-linkSceneId').val()) === 0 ) {
				return false;
			}
		}
		return true;
	}

	function updateLabelData() {
		initLabelData();
		if (!editingPointData) {
			return;
		}
		generator.selectEffect(editingPointData.threejsId);

		jQuery('#preview').html(editingPointData.innerHTML);

		if (editingPointData.isSprite === 1) {
			jQuery('#label-is-sprite').prop("checked", true);
		}

		if (editingPointData.linkSceneId != -1) {
			jQuery("#input-label-linkSceneId").val(editingPointData.linkSceneId);
		}


		var $editingPoint = jQuery(editingPointData.innerHTML);
		switch ($editingPoint[0].nodeName) {
			case "SPAN":
				jQuery("a[href = '#label_tab1']").tab('show');
				jQuery("#input-label-text").val($editingPoint.text())
				jQuery("#input-label-size").val(parseInt($editingPoint.css('font-size')));
				jQuery('#input-label-colorpicker').colorpicker('setValue',$editingPoint.css('color'));
				break;
			case "IMG":
				jQuery("a[href = '#label_tab2']").tab('show');
				jQuery('#select-image-src').val($editingPoint.prop('src'));
				break;
			case "IFRAME":
				jQuery("a[href = '#label_tab3']").tab('show');
				jQuery("#input-code-size-width").val(editingPointData.width)
				jQuery("#input-code-size-height").val(editingPointData.height);
				var base64 = $editingPoint.prop('src').replace( /data:text\/html;charset=utf-8;base64,/ , '' ) ;
				var decodedData = Base64.decode(base64);
				jQuery('#codeTextarea').val(getHtmlBodyText(decodedData));
				break;
			default:

		}

	}

	function updateLabelList() {

		jQuery('#label-list').empty();
		var labelList = generator.getLabelObjectsData();
		for (var i = 0; i < labelList.length; i++) {
			jQuery('#label-list').append(label$element(i, labelList));
		}
		jQuery('#label-list-len').text(labelList.length);
	}

	function label$element(i, labelList) {
		var label = labelList[i];
		var id = label.threejsId;
		var $list = jQuery('<li></li>');
		var $body;
		if (editingPointData && editingPointData.threejsId == id) {
			$body = jQuery('<div class="panel panel-info" ></div>');
		} else {
			$body = jQuery('<div class="panel panel-default"></div>');
		}

		var $heading = jQuery('<div class="panel-heading"><span class="glyphicon glyphicon-search"></span></div>');
		var put;
		$heading.on("click", function() {
			generator.lookCameraById(id);
			if (editingPointData && editingPointData.threejsId == id) {
				editingPointData = null;
			} else {
				editingPointData = label;
			}
			generator.setpointData(null);
			updateLabelList();
			updateLabelData();
		});



		var nodeName = null;
		switch (jQuery(label.innerHTML)[0].nodeName) {
			case "IMG":
				nodeName = "image";
				break;
			case "SPAN":
				nodeName = "text";
				break;
			case "IFRAME":
				nodeName = "code";
				break;
			default:
		}
		var $name = jQuery('<div></div>', {
			text: nodeName,
			addClass: "vertically label-name",
		});
		var $button = jQuery('<button class="btn btn-danger delete-button" type="button" ><span class="glyphicon glyphicon-remove"></span></button>');

		$button.on("click", function() {
			if (editingPointData && editingPointData.threejsId == id) {
				editingPointData = null;
				initLabelData();
			}
			generator.delItemById(id);
			updateLabelList();
		});
		$body.append($heading);
		$body.append($name);
		$body.append($button);
		$list.append($body);
		return $list;
	}

	function overWritePointData(pointData) {
		if (editingPointData) {

			generator.delItemById(editingPointData.threejsId);
			pointData.x = editingPointData.x;
			pointData.y = editingPointData.y;
			pointData.z = editingPointData.z;
			generator.abcAddItem(pointData);
			initLabelData();
			editingPointData = null;
			generator.setpointData(null);
		} else {
			generator.setpointData(pointData);
		}
	}

	var generator = Generator360(document.getElementById('screen'));
	generator.setSceneRepositoryUrl(mwsim_configs.mwsim_api_get_url);
	if (mwsim_configs.sceneid == 0 ){
	  generator.setImage(mwsim_configs.sim_plugin_path+"img/default.png");
	} else {
	  	generator.setSceneForRepository(
			mwsim_configs.sceneid,
			function(json) {
				jQuery('#descriptionTextarea').val(json['description']);
				jQuery('#title').val(json['title']);
			},
			function (json) {
				alert(mwsim_character_string["error read"]);
			}
		);
	}

	generator.itemUpdate = function () {
		generator.setpointData(null);
		updateLabelList();
		updateLabelData();
	}
		

	var editingPointData = null;

	generator.onSelectItemObj = function(id) {

		var labelList = generator.getLabelObjectsData();
		for (var i = 0; i < labelList.length; i++) {
			if (labelList[i].threejsId == id) {
				if (editingPointData) {
					if (labelList[i].threejsId == editingPointData.threejsId) {
						editingPointData = null;
					} else {
						editingPointData = labelList[i];
					}
				} else {
					editingPointData = labelList[i];
				}
				generator.setpointData(null);
			}
		}
		updateLabelList();
		updateLabelData();
	}

	jQuery('.on_view').on('click', function (event) {
		var recipient = jQuery(this).attr('data-recipient');
		var modal = jQuery('#sim-view');
		var list_preview_screen = jQuery('#list-preview-screen');
		list_preview_screen.attr("src",mwsim_configs.sim_previewhtml_url + "&sceneid="+recipient);
		modal.find('.modal-title').text("ID "+recipient);
		modal.modal('show');
	});
	jQuery('.scene-list-delete').on('click',function(event){
		var jThis = jQuery(this);
		var remove = confirm(mwsim_character_string["warning remove"]);
		if (remove) {
			jQuery.ajax(
				{
				  url:mwsim_configs.mwsim_api_del_url + "&force=false&sceneid=" + jThis.attr('data-sceneid'),
				  type: 'POST',
				  dataType: 'json',
				  contentType: 'application/json'
				}
			)
				.done(function (data, textStatus, jqXHR) {
					window.location.href = mwsim_configs.sim_admin_url;
				})
				.fail(function (jqXHR, textStatus, errorThrown) {

					if (textStatus == 'error' && errorThrown == 'Locked') {
						var ids = '';
						jqXHR.responseJSON.forEach(function (element) {
							ids += '"' + element.id + '" ';
						});
						$format
						const confirmText = $format(mwsim_character_string["warning remove2"], ids);

						if (confirm(confirmText)) {
							jQuery.ajax(
								{
									url: mwsim_configs.mwsim_api_del_url + "&force=true&sceneid=" + jThis.attr('data-sceneid'),
									type: 'POST',
									dataType: 'json',
									contentType: 'application/json'
								}
							)
								.done(function (data, textStatus, jqXHR) {
									window.location.href = mwsim_configs.sim_admin_url;
								})
								.fail(function (jqXHR, textStatus, errorThrown) {
									errorAlert(textStatus, errorThrown);
								});

						}
					} else {
						errorAlert(textStatus, errorThrown);
					}
				});
		}
	});

	jQuery('.scenes-column').on('click',function(event){
	  var sceneId = jQuery(this).attr('data-sceneid');
	  jQuery('.u-scene-selecter-dropdown input').val(sceneId);
	});

	jQuery('#button-new-label').on('click', function () {
		editingPointData = null;
		generator.setpointData(null);
		updateLabelList();
		updateLabelData();
	});

	jQuery('#button-set-sphere-image').on('click', function () {
		const imageSrc = jQuery("#select-sphere-image-src").val()
		if (imageSrc !== '') {
			generator.setImage(imageSrc);
		} else {
			alert(mwsim_character_string["warning select image"]);
		}
	});

	jQuery('#button-set-sphere-video').on('click', function () {
		const vidoeSrc = jQuery("#select-sphere-video-src").val()
		if (vidoeSrc !== '') {
			generator.setVideo(vidoeSrc);
		} else {
			alert(mwsim_character_string["warning select video"]);
		}
	});

	//画像選択時に呼ばれる
	jQuery('#button-image-selecter-img').on('click',function(event){
	  jQuery('.image-column').on('click',function(event){
		jQuery("#select-image-src").val(jQuery(this).attr('data-img-src'));
		jQuery('#image-select-modal').modal('hide');
		jQuery('.image-column').off('click');
	  });
	  jQuery('#image-select-modal').modal('show');
	});

	//球体画像選択時に呼ばれる。

	jQuery('#button-sphere-image-selecter-img').on('click',function(event){
	  jQuery('.image-column').on('click',function(event){
		jQuery("#select-sphere-image-src").val(jQuery(this).attr('data-img-src'));
		jQuery("#select-sphere-image-label").text(jQuery(this).find('td').eq(1).text());
		jQuery('#image-select-modal').modal('hide');
		jQuery('.image-column').off('click');
	  });
	  jQuery('#image-select-modal').modal('show');
	});

	//球体動画選択時に呼ばれる。
	jQuery('#button-sphere-video-selecter').on('click',function(event){
	  jQuery('.video-column').on('click',function(event){
		jQuery("#select-sphere-video-src").val(jQuery(this).attr('data-img-src'));
		jQuery("#select-sphere-video-label").text(jQuery(this).find('td').eq(1).text());
		jQuery('#video-select-modal').modal('hide');
		jQuery('.video-column').off('click');
	  });
	  jQuery('#video-select-modal').modal('show');
	});

	jQuery('#button-preview-label-text').on('click', function () {

		if (!checkTransitionSceneId()) {
			alert(mwsim_character_string["warning input only numbers"]);
		}

		if (jQuery('#input-label-text').val() === '') {
			alert(mwsim_character_string["warning input enter text"]);
			return
		}

		var input_labelString = jQuery('#input-label-text').val();

		var input_labelSize = jQuery('#input-label-size').val();

		if (!input_labelSize) {
			input_labelSize = 20;
		}else {
			input_labelSize = Number(input_labelSize);
		}

		var Hex = jQuery('#input-label-colorpicker').data('colorpicker').color.toHex();

		var font_color = "color: " + Hex + ";";

		let pointData = {
			innerHTML: null,
			isSprite: 0,
			linkSceneId: -1,
			width: 100,
			height: 100,
			x: 0,
			y: 0,
			z: 0
		};

		let span = document.createElement('span');
		span.style = "pointer-events: none; font-size: " + input_labelSize + "px; color: " + Hex + ";";
		span.textContent = input_labelString;
		
		pointData.innerHTML = span.outerHTML;
		if (Number(jQuery('#input-label-linkSceneId').val())) {
			pointData.linkSceneId = Number(jQuery('#input-label-linkSceneId').val());
		}


		if (jQuery('#label-is-sprite').attr('checked')) {
		  pointData.isSprite = 1;
		}else {
		  pointData.isSprite = 0;
		}

		if (pointData.linkSceneId === -1) {
			jQuery('#preview').children().remove();

			let jQuery_element = jQuery(span);

			jQuery('#preview').append(jQuery_element);

			pointData.width = parseInt(jQuery('#preview').children().width() + 2);
			pointData.height = parseInt(jQuery('#preview').children().height());
			overWritePointData(pointData);
		} else {
			jQuery.ajax(
				{
					url:mwsim_configs.mwsim_api_get_url + "&sceneid=" + pointData.linkSceneId,
					type: 'POST',
					dataType: 'json',
				}
			)
			.done(function(data, textStatus, jqXHR ){
				jQuery('#preview').children().remove();

				let jQuery_element = jQuery(span);

				jQuery('#preview').append(jQuery_element);

				pointData.width = parseInt(jQuery('#preview').children().width() + 2);
				pointData.height = parseInt(jQuery('#preview').children().height());
				overWritePointData(pointData);
			})
			.fail(function(jqXHR, textStatus, errorThrown){
				errorAlert(textStatus,errorThrown);
			});
		}
	});

	jQuery('#button-preview-label-image').on('click', function () {

		if (!checkTransitionSceneId()) {
			alert(mwsim_character_string["warning input only numbers"]);
		}

		if (jQuery('#select-image-src').val() === '') {
			alert(mwsim_character_string["warning select image"]);
			return
		}

		let pointData = {
			innerHTML: null,
			isSprite: 0,
			linkSceneId: -1,
			width: 100,
			height: 100,
			x:0,
			y:0,
			z:0
		};

		var url=jQuery('#select-image-src').val();
		var innerHTMLString = "<img style='pointer-events: none' src='" + url + "' />";

		pointData.innerHTML=innerHTMLString;
		if (Number(jQuery('#input-label-linkSceneId').val())) {
			pointData.linkSceneId = Number(jQuery('#input-label-linkSceneId').val());
		}

		if (jQuery('#label-is-sprite').attr('checked')) {
		  pointData.isSprite = 1;
		}else {
		  pointData.isSprite = 0;
		}

		if (pointData.linkSceneId === -1) {
			jQuery('#preview').children().remove();
			let jQuery_element = jQuery(innerHTMLString);
			let imgPreloader = new Image();
			//onloadイベントハンドラ追加
			imgPreloader.onload=function() {
				//ロード完了で画像を表示
				jQuery('#preview').append(jQuery_element);
				pointData.width = parseInt(jQuery('#preview').children().width() + 2);
				pointData.height = parseInt(jQuery('#preview').children().height() + 2);

				overWritePointData(pointData);
			}
			imgPreloader.src=url;
		} else {
			jQuery.ajax(
				{
					url:mwsim_configs.mwsim_api_get_url + "&sceneid=" + pointData.linkSceneId,
					type: 'POST',
					dataType: 'json',
				}
			)
			.done(function(data, textStatus, jqXHR ){
				jQuery('#preview').children().remove();

				let jQuery_element = jQuery(innerHTMLString);
				let imgPreloader = new Image();
				//onloadイベントハンドラ追加
				imgPreloader.onload=function() {
					//ロード完了で画像を表示
					jQuery('#preview').append(jQuery_element);
					pointData.width = parseInt(jQuery('#preview').width() + 2);
					pointData.height = parseInt(jQuery('#preview').height() + 2);

					overWritePointData(pointData);
				}
				imgPreloader.src=url;
			})
			.fail(function(jqXHR, textStatus, errorThrown){
				errorAlert(textStatus,errorThrown);
			});
		}

	});

	jQuery('#button-preview-label-code').on('click', function () {
		
		if (!checkTransitionSceneId()) {
			alert(mwsim_character_string["warning input only numbers"]);
		}

		if (jQuery('#codeTextarea').val() === '') {
			alert(mwsim_character_string["warning input enter code"]);
			return
		}

		let pointData = {
			innerHTML: null,
			isSprite: 0,
			linkSceneId: -1,
			width: 100,
			height: 100,
			x:0,
			y:0,
			z:0
		};

		pointData.width = parseInt(jQuery('#input-code-size-width').val());
		pointData.height = parseInt(jQuery('#input-code-size-height').val());

		var code = jQuery('#codeTextarea').val();

		let codehtml = htmlText(code);
		let base64 = Base64.encode(codehtml);
		let iframeSrc = 'data:text/html;charset=utf-8;base64,' + base64;

		let iframe = document.createElement('iframe');
		iframe.width = pointData.width;
		iframe.height = pointData.height;
		iframe.src = iframeSrc;

		if (jQuery('#label-is-sprite').attr('checked')) {
		  pointData.isSprite = 1;
		}else {
		  pointData.isSprite = 0;
		}

		jQuery('#preview').children().remove();

		let jQuery_element = jQuery(iframe);

		jQuery('#preview').append(jQuery_element);
		jQuery_element.load(function () {
			pointData.innerHTML = "<iframe width='" + pointData.width + "' height='" + pointData.height + "' src='" + iframeSrc + "' frameborder='0'></iframe>";
			overWritePointData(pointData);
		});
		
	});
	jQuery('#POST_DATA').on('click', function () {
		
		if (3 <= jQuery('#scene-list').children().length && 0 == mwsim_configs.sceneid) {
			alert(mwsim_character_string["error only 3 scenes"]);
			return;
		}

		var data = generator.getData();
		data.description = jQuery('#descriptionTextarea').val();
		data.title = jQuery('#title').val();
		jQuery.ajax(
			{
			  url: mwsim_configs.mwsim_api_post_url + "&sceneid=" + mwsim_configs.sceneid,
			  type:'POST',
			  data:JSON.stringify(data),
			  dataType: 'json',
			  contentType: 'application/json'
			})
			.done(function(data, textStatus, jqXHR ){
				window.location.href = data["href"];
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				errorAlert(textStatus,errorThrown);
			});
	});
});
