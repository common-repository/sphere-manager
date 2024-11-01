<?php
/*
Plugin Name: Sphere Manager
Description: Sphere Manager is a plugin for sharing panorama images (captured by cameras such as RICOH THETA.) After you create a scene using Sphere Manager(you can add text, images as labels on the image), you will be able to paste a player on your webite.

Version: 1.0.2
Author: MICROWAVE
Author URI: http://micro-wave.net
License: GPL2
*/

if (! defined( 'ABSPATH' )) {
	exit; // Exit if accessed directly
}

require_once('models.php');
require_once('controller.php');

class SphereImageManager
{
	private $my_plugin_slug = '';

	private $textDomain = 'SphereManager';

	private $lang_dir = 'languages';

	public function __construct()
	{
		global $wpdb;
		$this->my_plugin_slug = plugin_basename(__FILE__);

		$this->sim_displayelementobject_table_name = $wpdb->prefix.'mwsim_displayelementobject';

		if (function_exists('register_activation_hook')) {
			register_activation_hook(__FILE__, array($this, 'activate'));
		}

		if (function_exists('register_deactivation_hook')) {
			register_deactivation_hook(__FILE__, array($this, 'deactivate'));
		}

		//翻訳ファイル読み込み
		load_plugin_textdomain( $this->textDomain , false, dirname( plugin_basename( __FILE__ ) ) . '/' . $this->lang_dir);

		add_action('admin_menu', array($this, 'add_plugin_menu_page'));

		add_filter('query_vars', array($this, 'plugin_add_trigger'));

		add_action('template_redirect', array($this, 'public_iframe_page'));

		add_action('wp_ajax_mwsim_get', array($this, 'mwsim_get') );
		add_action('wp_ajax_mwsim_post', array($this, 'mwsim_post') );
		add_action('wp_ajax_mwsim_del', array($this, 'mwsim_del') );

		add_shortcode('show_sphere_image', array($this, 'show_sphere_image'));
	}


	//プラグインインストール時に呼ばれる
	public function activate()
	{
		MWSIM_Model_Scene::initDb();
		MWSIM_Model_DisplayElementObject::initDb();
	}


	//プラグインアンインストール時に呼ばれる
	public function deactivate()
	{
	}

	//管理メニューにフック
	public function add_plugin_menu_page()
	{
		if( current_user_can( 'administrator' ) ) {
			$this->sim_page_hook_suffix = add_menu_page('SphereManager', 'SphereManager', 'administrator',
				  $this->my_plugin_slug, array($this, 'admin_page')
				);
		} else {
			$this->sim_page_hook_suffix = add_menu_page('SphereManager', 'SphereManager', 'editor',
				  $this->my_plugin_slug, array($this, 'admin_page')
				);
		}

		add_action( 'admin_head-'. $this->sim_page_hook_suffix, array($this, 'load_config'));

		add_action( 'admin_enqueue_scripts', array($this, 'load_custom_jscode_and_style'));
	}


	public function load_config()
	{
		?>
			<script>
				var mwsim_configs = {
					sim_plugin_path : "<?php echo esc_url( plugins_url('/', __FILE__ ) ) ?>",
					mwsim_api_get_url : "<?php echo esc_url( home_url( '/' ) ) . 'wp-admin/admin-ajax.php?action=mwsim_get&_wpnonce=' . wp_create_nonce('mwsim_get_data') ?>",
					mwsim_api_post_url : "<?php echo esc_url( home_url( '/' ) ) . 'wp-admin/admin-ajax.php?action=mwsim_post&_wpnonce=' . wp_create_nonce('mwsim_post_data') ?>",
					mwsim_api_del_url : "<?php echo esc_url( home_url( '/' ) ) . 'wp-admin/admin-ajax.php?action=mwsim_del&_wpnonce=' . wp_create_nonce('mwsim_del_data') ?>",
					sim_previewhtml_url : "<?php echo esc_url( home_url( '/' ) ) . '?mwsim_trigger=previewhtml&_wpnonce=' . wp_create_nonce('mwsim_iframe') ?>",
					<?php
					if (isset($_GET['sceneid'])) {
						echo "sceneid : ".$_GET['sceneid'];
					} else {
						echo "sceneid : 0";
					}
					?>,
					sim_admin_url :'<?php echo esc_url( admin_url()."admin.php?page=".  $this->my_plugin_slug ) ?>'
				};
				var mwsim_character_string = {
					"error bat request" : "<?=__('Bat Request. Please check the log file for details.', $this->textDomain)?>",
					"error not found" : "<?=__('Not found link Scene.', $this->textDomain)?>",
					"error unknown" : "<?=__('Unknown error. Please check the log file for details.', $this->textDomain)?>",
					"error read" : "<?=__('A read error occurred.', $this->textDomain)?>",
					"error only 3 scenes" : "<?=__('You can create up to 3 scenes.', $this->textDomain)?>",
					"warning remove" : "<?=__('Are you sure you want to scene remove?', $this->textDomain)?>",
					"warning remove2" : "<?=__('There are {0} id scenes attached to this scene. Do you want to remove it?', $this->textDomain)?>",
					"warning select image" : "<?=__('Please select an image.', $this->textDomain)?>",
					"warning select video" : "<?=__('Please select a video.', $this->textDomain)?>",
					"warning input only numbers" : "<?=__('Link Scene id is only numbers.', $this->textDomain)?>",
					"warning input enter text" : "<?=__('Please enter a text.', $this->textDomain)?>",
					"warning input enter code" : "<?=__('Please enter a code text.', $this->textDomain)?>",
				}
			</script>
		<?php
	}


	public function load_custom_jscode_and_style($hook_suffix)
	{
		if ($hook_suffix != $this->sim_page_hook_suffix) {
			return;
		}
		
		wp_enqueue_style( 'mwsim_vendercss_bootstrap_min', plugins_url('vendercss/bootstrap.min.css', __FILE__ ) );
		wp_enqueue_style( 'mwsim_vendercss_bootstrap_colorpicker_min', plugins_url('vendercss/bootstrap-colorpicker.min.css', __FILE__ ) );
		wp_enqueue_style( 'mwsim_css_Viewer360', plugins_url('css/Viewer360.css', __FILE__ ) );
		wp_enqueue_style( 'mwsim_css_edit', plugins_url('css/edit.css', __FILE__ ) );

		wp_enqueue_script( 'jquery');

		wp_enqueue_script( 'mwsim_venderjs_bootstrap_min_js', plugins_url('venderjs/bootstrap.min.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_bootstrap_colorpicker_min_js', plugins_url('venderjs/bootstrap-colorpicker.min.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_three_js', plugins_url('venderjs/three.min.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_CSS2DRenderer_js', plugins_url('venderjs/CSS2DRenderer.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_CSS3DRenderer_js', plugins_url('venderjs/CSS3DRenderer.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_Core360_js', plugins_url('js/Core360.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_Generator360_js', plugins_url('/js/Generator360.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_edit_js', plugins_url('js/edit.js', __FILE__), array(), false, true );
	}


	function plugin_add_trigger($vars)
	{
			$vars[] = 'mwsim_trigger';
			return $vars;
	}


	function public_iframe_page()
	{
		$mwsim_trigger = filter_var(get_query_var('mwsim_trigger'), FILTER_SANITIZE_STRING);
		if ($mwsim_trigger == 'previewhtml') {
			show_admin_bar( false );
			add_action( 'wp_enqueue_scripts', array($this, 'public_iframe_page_scripts' ) );

			require(dirname(__FILE__).'/views/public_view.php');
			exit;
		}
		if ($mwsim_trigger == 'get') {
			MwSIMGetData();
			exit;
		}
	}


	function public_iframe_page_scripts()
	{
		wp_enqueue_style( 'mwsim_vendercss_bootstrap_min', plugins_url('vendercss/bootstrap.min.css', __FILE__ ) );
		wp_enqueue_style( 'mwsim_css_Viewer360', plugins_url('css/Viewer360.css', __FILE__ ) );

		wp_enqueue_script( 'jquery');

		wp_enqueue_script( 'mwsim_venderjs_bootstrap_min_js', plugins_url('venderjs/bootstrap.min.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_three_js', plugins_url('venderjs/three.min.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_CSS2DRenderer_js', plugins_url('venderjs/CSS2DRenderer.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_CSS3DRenderer_js', plugins_url('venderjs/CSS3DRenderer.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_Core360_js', plugins_url('js/Core360.js', __FILE__), array(), false, true );
		wp_enqueue_script( 'mwsim_venderjs_Viewer360_js', plugins_url('/js/Viewer360.js', __FILE__), array(), false, true );
	}


	function mwsim_get()
	{
		MwSIMGetData();
		exit;
	}

	function mwsim_post()
	{
		MwSIMPostData($this->my_plugin_slug);
		exit;
	}

	function mwsim_del()
	{
		MwSIMDelData();
		exit;
	}
	

	public function admin_page()
	{
		require(dirname(__FILE__).'/views/admin_page.php');
	}


	public function show_sphere_image($atts)
	{
		$atts = shortcode_atts(array(
			'sceneid' => 0,
			'width'  => '100%',
			'height' => '100%',
		), $atts, 'show_sphere_image');

		$sceneid = $atts['sceneid'];
		$width = $atts['width'];
		$height = $atts['height'];
		
		$src = home_url( '/' ) . "?mwsim_trigger=previewhtml" . "&_wpnonce=" . wp_create_nonce('mwsim_iframe') . "&sceneid={$sceneid}" ;

		return "<iframe src='{$src}' width='{$width}' height='{$height}' frameborder='no' allowfullscreen='true'></iframe>";
	}
}


$SphereImageManager = new SphereImageManager();
