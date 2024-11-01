<?php
if (! defined( 'ABSPATH' )) {
	exit; // Exit if accessed directly
}

require_once dirname(__FILE__).'/../models.php';

$sim_scene_table_name = MWSIM_Model_Scene::table_name();
global $wpdb;
$scene_results = $wpdb->get_results(
	"SELECT id FROM $sim_scene_table_name;",
	ARRAY_A
	);
?>
<div id="loader-bg">
  <div id="loader"></div>
</div>

<div class="container-fluid">
	<br/>
	<div class="row">
		<div class="col-xs-3">
			<div class="panel panel-default">
				<div class="panel-heading">
					<span class="lead"><?=__('Scene List', $this->textDomain)?></span>&nbsp;&nbsp;<span id="scene-list-len" class="badge">0</span>&nbsp;&nbsp;<span id="new-scene-button" data-placement="bottom" data-toggle="popover" aria-disabled="false" data-content="Up to 3 scenes can be created with the free version. Please purchase the pro version to create unlimited amount of scenes. https://www.micro-wave.net/ext/plugins/"><a href="<?php echo admin_url().'admin.php?page='. basename(dirname(dirname(__FILE__))) .'%2Fplugin.php' ?>" class="btn btn-primary"><?=__('New Scene', $this->textDomain)?></a></span>
				</div>
				<ul class="list-group" id="scene-list">
					<?php
						foreach ($scene_results as $key => $value) {
							$scene = new MWSIM_Model_Scene((int) $value['id']);
							printf(
								'
								<li class="list-group-item" data-sceneid="%d">
									<div>
										<div class="row">
											<div class="col-xs-9">
												<dl class="dl-horizontal">
												<dt>ID</dt>
												<dd>%d</dd>
												<dt>%s</dt>
												<dd>%s</dd>
												<dt>%s</dt>
												<dd class="description">%s</dd>
												<dt>%s</dt>
												<dd>%d</dd>
												<dt>%s</dt>
												<dd>[show_sphere_image sceneid="%d" width="" height="" ]</dd>
												</dl>
											</div>
											<div class="col-xs-3">
												<button type="button" class="btn btn-info btn-sm btn-block on_view" data-recipient="%d" data-placement="right" data-container="body" data-toggle="tooltip" title="%s">
													<span class="glyphicon glyphicon-picture"></span>
												</button>
												<a href="%s" class="btn btn-block btn-sm btn-warning" data-placement="right" data-container="body" data-toggle="tooltip" title="%s">
													<span class="glyphicon glyphicon-wrench"></span>
												</a>
												<button class="btn btn-danger btn-sm btn-block scene-list-delete" data-sceneid="%s"type="button"data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
													<span class="glyphicon glyphicon-remove"></span>
												</button>
											</div>
										</div>
									</div>
								</li>
								',
								(string)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT),
								(string)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT),
								__('Title', $this->textDomain),
								(string)filter_var($scene->title, FILTER_SANITIZE_FULL_SPECIAL_CHARS),
								__('Description', $this->textDomain),
								(string)filter_var($scene->description, FILTER_SANITIZE_FULL_SPECIAL_CHARS),
								__('Element', $this->textDomain),
								(string)filter_var(count($scene->displayElementObjects), FILTER_SANITIZE_NUMBER_INT),
								__('Short Code', $this->textDomain),
								(string)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT),
								(string)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT),
								__('Preview', $this->textDomain),
								(string)filter_var(admin_url().'admin.php?page='.  $this->my_plugin_slug .'&sceneid='.$scene->id, FILTER_SANITIZE_URL),
								__('Edit', $this->textDomain),
								(string)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT)
							);
						}
					?>
				</ul>
				<div class="panel-footer">
				</div>
			</div>
			<!-- モーダル・ダイアログ -->
			<div class="modal fade" id="sim-view" tabindex="-1">
				<br/>
				<br/>
				<br/>
				<div class="modal-dialog modal-lg">
					<div class="modal-content">
						<div class="modal-header">
							<button type="button" class="close" data-dismiss="modal"><span>×</span></button>
							<h4 class="modal-title"></h4>
						</div>
						  <div class="embed-responsive embed-responsive-16by9">
							<iframe id="list-preview-screen" class="embed-responsive-item" frameborder="0" allowFullScreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" src=""></iframe>
						  </div>
						<div class="modal-footer">
							<button type="button" class="btn btn-default" data-dismiss="modal"><?=__('Close', $this->textDomain)?></button>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="col-xs-9">
			<div class="row">
				<div class="col-xs-8">
					<div class="form-group">
						<label class="control-label" for="title"><?=__('Title', $this->textDomain)?></label>
						<input id="title" type="text" class="form-control first-child last-child text" value="">
					</div>
					<div class="panel panel-default">
						<div class="panel-heading">
							<?=__('Edit Preview', $this->textDomain)?>
						</div>
						<div class="embed-responsive embed-responsive-16by9">
							<div class="embed-responsive-item">
								<div class="screen">
									<div id="screen">
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="panel panel-default">
						<div class="panel-heading">
							<?=__('Label List', $this->textDomain)?>
							&nbsp;&nbsp;
							<span id="label-list-len" class="badge">0</span>
							&nbsp;&nbsp;
							<button id="button-new-label" type="button" class="btn btn-primary"><?=__('New Label', $this->textDomain)?></button>
						</div>
						<ul id="label-list">
							<li>
							</li>
						</ul>
					</div>
					<div class="form-group">
						<label class="control-label" for="descriptionTextarea"><?=__('Description', $this->textDomain)?></label>
						<textarea placeholder="Description" rows="4" class="form-control" id="descriptionTextarea"></textarea>
					</div>
				</div>

				<div class="col-xs-4">
					<div class="panel panel-default">
						<div class="panel-heading">
							<?=__('Background', $this->textDomain)?>
						</div>
						<div class="panel-body">
							<!-- タブ・メニュー -->
							<ul class="nav nav-tabs">
								<li class="active"><a href="#select_background_img" data-toggle="tab"><?=__('Image', $this->textDomain)?></a></li>
								<li><a href="#select_background_video" data-toggle="tab"><?=__('Video', $this->textDomain)?></a></li>
							</ul>
							<!-- タブ内容 -->
							<div class="tab-content">
								<div class="tab-pane active" id="select_background_img">
									<div class="form-group">
										<label id="select-sphere-image-label" class="control-label"></label>
									</div>
									<div class="form-group">
										<div class="input-group">
											<span class="input-group-addon">
												<button type="button" name="button" class="btn btn-default" id="button-sphere-image-selecter-img" ><?=__('Select', $this->textDomain)?></button>
											</span>
											<input id="select-sphere-image-src" type="text" value="" class="form-control text" />
										</div>
									</div>
									<div class="form-group">
										<label class="control-label" for="button-set-sphere-image"></label>
										<button id="button-set-sphere-image" class="btn btn-primary btn-block" type="button"><?=__('Apply', $this->textDomain)?></button>
									</div>
								</div>
								<div class="tab-pane" id="select_background_video">
									<div class="form-group">
										<label id="select-sphere-video-label" class="control-label"></label>
									</div>
									<div class="form-group">
										<div class="input-group">
											<span class="input-group-addon">
												<button type="button" name="button" class="btn btn-default" id="button-sphere-video-selecter" ><?=__('Select', $this->textDomain)?></button>
											</span>
											<input id="select-sphere-video-src" type="text" value="" class="form-control text" />
										</div>
									</div>
									<div class="form-group">
										<label class="control-label" for="button-set-sphere-video"></label>
										<button id="button-set-sphere-video" class="btn btn-primary btn-block" type="button"><?=__('Apply', $this->textDomain)?></button>
									</div>
								</div>
							</div>
						</div>
						<div class="panel-footer"></div>
					</div>
					<div class="panel panel-default">
						<div class="panel-heading">
							<?=__('Label', $this->textDomain)?>
						</div>
						<div class="panel-body">
							<div id="preview">
							</div>
							<hr/>
							<!--タブ-->
							<ul class="nav nav-tabs">
								<li class="active">
									<a href="#label_tab1" data-toggle="tab"><?=__('Text', $this->textDomain)?></a>
								</li>
								<li>
									<a href="#label_tab2" data-toggle="tab"><?=__('Image', $this->textDomain)?></a>
								</li>
								<li>
									<a id="button_label_tab3" href="#label_tab3" data-toggle="tab"><?=__('Code（html）', $this->textDomain)?></a>
								</li>
							</ul>
							<!-- / タブ-->
							<br/>
							<form class="form-horizontal ">
								<div class="form-group">
									<label class="col-xs-4 control-label" for="label-is-sprite"><?=__('Rotate', $this->textDomain)?> <?=__('Label', $this->textDomain)?></label>
									<div class="col-xs-8">
										<input type="checkbox" id="label-is-sprite"/>
									</div>
								</div>
								<div id="form-transition-scene" class="form-group">
									<label class="col-xs-4 control-label" for="input-label-linkSceneId"><?=__('Transition', $this->textDomain)?> <?=__('Scene', $this->textDomain)?></label>
									<div class="col-xs-8">
										<div class="u-scene-selecter-dropdown">
											<div class="row">
												<div class="col-xs-6">
													<span class="input-group-btn">
														<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
															<?=__('Select', $this->textDomain)?>
															<span class="caret"></span>
														</button>
														<div class="dropdown-menu dropdown-menu-right" role="menu">
															<table class="table table-hover">
																<thead>
																	<tr>
																		<th>Id</th>
																		<th><?=__('Title', $this->textDomain)?></th>
																		<th><?=__('Description', $this->textDomain)?></th>
																	</tr>
																</thead>
																<tbody>

																	<?php
																		foreach ($scene_results as $key => $value) {
																			$scene = new MWSIM_Model_Scene((int) $value['id']);

																		printf(
																			'<tr class="scenes-column" data-sceneid="%d">
																				<th>%d</th>
																				<td>%s</td>
																				<td>%s</td>
																			</tr>',
																			(string)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT),
																			(string)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT),
																			(string)filter_var($scene->title, FILTER_SANITIZE_FULL_SPECIAL_CHARS),
																			(string)filter_var($scene->description, FILTER_SANITIZE_FULL_SPECIAL_CHARS)
																		);
																	}
																	?>
																</tbody>
															</table>
														</div>
													</span>
												</div>
												<div class="col-xs-6">
													<input id="input-label-linkSceneId" type="text" class="form-control" placeholder="ID">
												</div>
											</div>
										</div>
									</div>
								</div>
							</form>
							<div class="tab-content">
								<div class="tab-pane fade in active" id="label_tab1">
									<form class="form-horizontal">
										<div class="form-group has-warning">
											<label class="col-xs-4 control-label" for="input-label-text"><?=__('Text', $this->textDomain)?> <?=__('Required', $this->textDomain)?></label>
											<div class="col-xs-8">
												<input id="input-label-text" type="text" class="form-control" placeholder="Text" aria-describedby="basic-addon1">
											</div>
										</div>
										<div class="form-group">
											<label class="col-xs-4 control-label" for="input-label-size"><?=__('Font', $this->textDomain)?> <?=__('Size', $this->textDomain)?></label>
											<div class="col-xs-8">
												<div class="input-group">
													<input id="input-label-size" type="number" class="form-control" value="20" aria-describedby="basic-addon2">
													<span class="input-group-addon">px</span>
												</div>
											</div>
										</div>
										<div class="form-group">
											<label class="col-xs-4 control-label" for="input-label-color"><?=__('Color', $this->textDomain)?></label>
											<div class="col-xs-8">
												<div id="input-label-colorpicker" class="input-group colorpicker-component">
													<span class="input-group-addon"><i></i></span>
													<input id="input-label-color" type="text" value="#00AABB" class="form-control" />
												</div>
											</div>
										</div>
										<div class="form-group">
											<label class="col-xs-4 control-label" for="button-preview-label-text"></label>
											<div class="col-xs-8">
												<button id="button-preview-label-text" class="btn btn-primary btn-block" type="button"><?=__('Apply', $this->textDomain)?></button>
											</div>
										</div>
									</form>
								</div>
								<div class="tab-pane fade" id="label_tab2">
									<div class="form-horizontal">
										<div class="form-group has-warning">
											<label class="col-xs-4 control-label" for="select-image-src"><?=__('Image', $this->textDomain)?> <?=__('Required', $this->textDomain)?></label>
											<div class="col-xs-8">
												<div class="row">
													<div class="col-xs-6">
														<button type="button" name="button" class="btn btn-default" id="button-image-selecter-img" ><?=__('Select', $this->textDomain)?></button>
													</div>
													<div class="col-xs-6">
														<input id="select-image-src" type="text" value="" class="form-control text" />
													</div>
												</div>
											</div>
										</div>
										<div class="form-group">
											<label class="col-xs-4 control-label" for="button-preview-label-image"></label>
											<div class="col-xs-8">
												<button id="button-preview-label-image" class="btn btn-primary btn-block" type="button"><?=__('Apply', $this->textDomain)?></button>
											</div>
										</div>
									</div>
								</div>
								<div class="tab-pane fade in" id="label_tab3">
									<div class="form-horizontal">
										<div class="form-group has-warning">
											<label class="col-xs-4 control-label" for="codeTextarea"><?=__('Code', $this->textDomain)?> <?=__('Required', $this->textDomain)?></label>
											<div class="col-xs-8">
												<textarea placeholder="code" rows="3" class="form-control" id="codeTextarea"></textarea>
											</div>
										</div>
										<div class="form-group">
											<label class="col-xs-4 control-label" for="input-code-size-width"><?=__('Width', $this->textDomain)?></label>
											<div class="col-xs-8">
												<div class="input-group">
													<input id="input-code-size-width" type="number" class="form-control" value="150">
													<span class="input-group-addon">px</span>
												</div>
											</div>
										</div>
										<div class="form-group">
											<label class="col-xs-4 control-label" for="input-code-size-height"><?=__('Height', $this->textDomain)?></label>
											<div class="col-xs-8">
												<div class="input-group">
													<input id="input-code-size-height" type="number" class="form-control" value="100">
													<span class="input-group-addon">px</span>
												</div>
											</div>
										</div>
										<div class="form-group">
											<label class="col-xs-4 control-label" for="button-preview-label-code"></label>
											<div class="col-xs-8">
												<button id="button-preview-label-code" class="btn btn-primary btn-block" type="button"><?=__('Apply', $this->textDomain)?></button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<button id="POST_DATA" class="btn btn-primary btn-lg btn-block"><?=__('Save', $this->textDomain)?></button>
				</div>
			</div>
		</div>
	</div>
	<!-- モーダル・ダイアログ -->
	<div class="modal fade" id="image-select-modal" tabindex="-1">
		<br />
		<br />
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal"><span>×</span></button>
					<h4 class="modal-title"><?=__('Image', $this->textDomain)?> <?=__('Select', $this->textDomain)?></h4>
				</div>
				<div class="modal-body">
					<div class="table-responsive">
						<table class="table table-hover">
							<thead>
								<tr>
									<th><?=__('Image', $this->textDomain)?></th>
									<th><?=__('Title', $this->textDomain)?></th>
									<th><?=__('Caption', $this->textDomain)?></th>
									<th><?=__('Description', $this->textDomain)?></th>
									<th><?=__('Post Date', $this->textDomain)?></th>
								</tr>
							</thead>
							<tbody>
								<?php
								$args = array(
									'post_type' => 'attachment',
									'numberposts' => -1,
									'post_status' => null,
									'post_mime_type' => 'image',
									);

								$attachments = get_posts($args);
								if ($attachments) {
									foreach ($attachments as $key => $attachment) {
										$image_attributes = wp_get_attachment_image_src($attachment->ID, 'thumbnail', false);
										echo '<tr class="image-column" data-img-src="'.(string)filter_var($attachment->guid, FILTER_SANITIZE_FULL_SPECIAL_CHARS).'">';
										echo '<td><img src="'.(string)filter_var($image_attributes[0], FILTER_SANITIZE_FULL_SPECIAL_CHARS).'" width="'.(string)filter_var($image_attributes[1], FILTER_SANITIZE_FULL_SPECIAL_CHARS).'" height="'.(string)filter_var($image_attributes[2], FILTER_SANITIZE_FULL_SPECIAL_CHARS).'" ></td>'; // 画像パス
										echo '<td>'.(string)filter_var(apply_filters('the_title', $attachment->post_title ), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';      // メディアを編集のタイトル
										echo '<td>'.(string)filter_var(apply_filters('the_excerpt', $attachment->post_excerpt), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';  // メディアを編集のキャプション
										echo '<td>'.(string)filter_var(apply_filters('the_content', $attachment->post_content), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';  // メディアを編集の説明
										echo '<td>'.(string)filter_var(apply_filters('the_date', $attachment->post_date), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';        // メディアの投稿日
										echo '</tr>';
									}
								}
								wp_reset_postdata();
								?>
							</tbody>
						</table>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal"><?=__('Close', $this->textDomain)?></button>
				</div>
			</div>
		</div>
	</div>
	<div class="modal fade" id="video-select-modal" tabindex="-1">
		<br />
		<br />
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal"><span>×</span></button>
					<h4 class="modal-title"><?=__('Video', $this->textDomain)?> <?=__('Select', $this->textDomain)?></h4>
				</div>
				<div class="modal-body">
					<div class="table-responsive">
						<table class="table table-hover">
							<thead>
								<tr>
									<th><?=__('Title', $this->textDomain)?></th>
									<th><?=__('Caption', $this->textDomain)?></th>
									<th><?=__('Description', $this->textDomain)?></th>
									<th><?=__('Post Date', $this->textDomain)?></th>
								</tr>
							</thead>
							<tbody>
								<?php
								$args = array(
								'post_type' => 'attachment',
								'numberposts' => -1,
								'post_status' => null,
								'post_mime_type' => 'video',
								);
								$attachments = get_posts($args);
								if ($attachments) {
									foreach ($attachments as $key => $attachment) {
										echo '<tr class="video-column" data-img-src="'.(string)filter_var($attachment->guid, FILTER_SANITIZE_FULL_SPECIAL_CHARS).'">';
										echo '<td>'.(string)filter_var(apply_filters('the_title', $attachment->post_title), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';      // メディアを編集のタイトル
										echo '<td>'.(string)filter_var(apply_filters('the_excerpt', $attachment->post_excerpt), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';  // メディアを編集のキャプション
										echo '<td>'.(string)filter_var(apply_filters('the_content', $attachment->post_content), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';  // メディアを編集の説明
										echo '<td>'.(string)filter_var(apply_filters('the_date', $attachment->post_date), FILTER_SANITIZE_FULL_SPECIAL_CHARS).'</td>';        // メディアの投稿日
										echo '</tr>';
									}
								}
								wp_reset_postdata();
								?>
							</tbody>
						</table>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal"><?=__('Close', $this->textDomain)?></button>
				</div>
			</div>
		</div>
	</div>
</div>
