<?php
if (! defined( 'ABSPATH' )) {
	exit; // Exit if accessed directly
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
	
	if (array_key_exists('_wpnonce', $_GET) === false || wp_verify_nonce($_GET['_wpnonce'], 'mwsim_iframe' ) === false) {
		http_response_code(403);
		header('Content-Type: application/json; charset=utf-8');
		$data =  array('massage'=>'Invalid nonce');
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
		return;
	}
		
	if (!isset($_GET['sceneid']) || $_GET['sceneid'] == '0') {
		http_response_code(404);
		$data = array('massage' => 'sceneidを指定してください。');
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
		return;
	}
	?>
		<!DOCTYPE html>
		<html>
			<head>
			<meta charset="utf8">
			<title>viewer</title>
			<?php wp_head(); ?>
			<style>
			html,body {
				height: 100%;
				margin: 0px !important;
				padding: 0px;
				user-select: none; /* CSS3 */
				-moz-user-select: none; /* Firefox */
				-webkit-user-select: none; /* Safari、Chromeなど */
				-ms-user-select: none; /* IE10〜 */
			}
			.screen {
				width: 100%;
				height: 100%;
			}
			.screen > div:-webkit-full-screen{
				position : absolute ;
				left     : 0 ;
				top      : 0 ;
				width    : 100% ;
				height   : 100% ;
			}
			.screen > div:-moz-full-screen {
				position : absolute ;
				left     : 0 ;
				top      : 0 ;
				width    : 100% ;
				height   : 100% ;
			}
			.screen > div:-ms-fullscreen {
				position : absolute ;
				left     : 0 ;
				top      : 0 ;
				width    : 100% ;
				height   : 100% ;
			}
			.screen > div:fullscreen {
				position : absolute ;
				left     : 0 ;
				top      : 0 ;
				width    : 100% ;
				height   : 100% ;
			}
			</style>
			</head>
			<body>
				<div class="screen">
					<div id="screen"></div>
				</div>
				<?php wp_footer(); ?>
				<script>
					var element = document.getElementById('screen');
					var viewer = Viewer360(element);
					viewer.setSceneRepositoryUrl("<?php echo esc_url( home_url( '/' ) ) . "?mwsim_trigger=get" . "&_wpnonce=" . wp_create_nonce('mwsim_get_data') ?>");
					viewer.setSceneForRepository(<?php echo $_GET['sceneid'] ?>,null);
				</script>
			</body>
		</html>
	<?php
}
