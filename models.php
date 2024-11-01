<?php
if (! defined( 'ABSPATH' )) {
	exit; // Exit if accessed directly
}

define('MWSIM_DB_VERSION', '1.0');

require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

interface MwSIM_Model
{
	public function delete();
	public function update();
	public function insert();

	/**
	 * fetch data by using id from db.
	 *
	 * @param int $id
	 *
	 * @return array $result_row
	 */
	public static function fetchData($id);
	public static function table_name();
	public static function initDb();
}

class MWSIM_Model_Scene implements MWSIM_Model
{
	public $id;
	public $title;
	public $description;
	public $imageSrc;
	public $isVideo;
	public $displayElementObjects;

	/**
	 * 引数の$id!=0のときDBから情報を引っ張りプロパティへ登録する
	 * $id=0のとき新規に登録となり保存する場合insert()を行う.
	 *
	 * @param int $id
	 *
	 * @return object $this
	 */
	public function __construct($id = 0)
	{
		global $wpdb;

		$this->displayElementObjects = array();

		if ($id == 0) {
			$sim_scene_table_name = self::table_name();
			$maxid_row = $wpdb->get_row(
			  "SELECT MAX(id) FROM $sim_scene_table_name;",
			  ARRAY_A
			);
			if ($maxid_row['MAX(id)'] == 0) {
				$this->id = 1;
			} else {
				$this->id = $maxid_row['MAX(id)'] + 1;
			}
		}

		if ($id != 0) {
			$result_scene_row = self::fetchData($id);
			if ($result_scene_row) {
				$this->id = $result_scene_row['id'];
				$this->title = $result_scene_row['title'];
				$this->description = $result_scene_row['description'];
				$this->isVideo = $result_scene_row['isvideo'];
				$this->imageSrc = $result_scene_row['imagesrc'];

				$sim_deo_table_name = MWSIM_Model_DisplayElementObject::table_name();
				$deosobjs = $wpdb->get_results($wpdb->prepare(
					"SELECT `id` FROM $sim_deo_table_name WHERE sceneid = %d;",
					$id // $sceneId
				  ),
				  ARRAY_A
				);

				foreach ($deosobjs as $key => $value) {
					try {
						array_push($this->displayElementObjects, new MWSIM_Model_DisplayElementObject($value));
					} catch (Exception $e) {
						if ($e->getMessage() == 'deo dose not exist') {
							// code...
						}
						throw new Exception($e->getMessage());
					}
				}
			} else {
				throw new Exception('scene does not exist');
			}
		}
	}


	public function linkedScenes()
	{
		global $wpdb;
		$sim_deo_table_name = MWSIM_Model_DisplayElementObject::table_name();
		
		$result_row = $wpdb->get_results($wpdb->prepare(
			"SELECT sceneId FROM $sim_deo_table_name WHERE linksceneid = %d AND sceneId <> %d GROUP BY sceneId;",
			$this->id,
			$this->id
		  ),
		  ARRAY_A
		);

		$result_Scene_list = array();
		foreach ($result_row as $key => $value) {
			try {
				$result_Scene_list[] = new self((int)$value['sceneId']);
			} catch (Exception $e) {
				if ($e->getMessage() == 'scene does not exist') {
					// code...
				} else {
					throw $e;
				}
			}
		}
		return $result_Scene_list;
	}

	public function delete()
	{
		global $wpdb;
		$result = $wpdb->delete(self::table_name(), array('id' => $this->id), array('%d'));
		if (false === $result) {
			throw new Exception('The input data is in error');
		}
	}
	
	public function update()
	{
		global $wpdb;
		$result = $wpdb->update(
			self::table_name(),
			array(
				'title' => $this->title,
				'description' => $this->description,
				'isvideo' => $this->isVideo,
				'imagesrc' => $this->imageSrc,
			),
			array(
				'id' => $this->id,
			),
			array(
				'%s',
				'%s',
				'%d',
				'%s',
			),
			array(
				'%d',
			)
		);
		if (false === $result) {
			throw new Exception('The input data is in error');
		}
	}

	public function insert()
	{
		global $wpdb;
		$result = $wpdb->insert(
			self::table_name(),
			array(
				'id' => $this->id,
				'title' => $this->title,
				'description' => $this->description,
				'isvideo' => $this->isVideo,
				'imagesrc' => $this->imageSrc,
			  ),
			array(
				'%d',
				'%s',
				'%s',
				'%d',
				'%s',
			)
		);
		if (false === $result) {
			throw new Exception('The input data is in error');
		}
	}

	public static function fetchData($id)
	{
		global $wpdb;
		$sim_scene_table_name = self::table_name();
		$result_row = $wpdb->get_row($wpdb->prepare(
			"SELECT * FROM $sim_scene_table_name WHERE id = %d;",
			$id
		  ),
		  ARRAY_A
		);

		return $result_row;
	}

	public static function table_name()
	{
		global $wpdb;

		return $wpdb->prefix.'mwsim_scene';
	}

	public static function initDb()
	{
		global $wpdb;
		$sim_scene_table_name = self::table_name();

		$installed_var = get_option('mwsim_scene_db_version');

		$sql = '';
		$charset_collate = 'ENGINE=InnoDB';

		// charsetを指定する
		if (!empty($wpdb->charset)) {
			$charset_collate = " DEFAULT CHARSET = {$wpdb->charset}";
		}

		// 照合順序を指定する（ある場合。通常デフォルトのutf8_general_ci）
		if (!empty($wpdb->collate)) {
			$charset_collate .= " COLLATE {$wpdb->collate}";
		}
		if ($installed_var != MWSIM_DB_VERSION) {
			$sim_scene_table_name = self::table_name();
			$sql = "
			CREATE TABLE `$sim_scene_table_name` (
			  `id` bigint(20) NOT NULL,
			  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
			  `imagesrc` text COLLATE utf8mb4_unicode_ci,
			  `description` text COLLATE utf8mb4_unicode_ci,
			  `isvideo` int(11) DEFAULT NULL
			) $charset_collate;
			";
			dbDelta($sql);
			update_option('mwsim_scene_db_version', MWSIM_DB_VERSION);
		}
	}
}

class MWSIM_Model_DisplayElementObject implements MWSIM_Model
{
	public $id;
	public $sceneId;
	public $linkSceneId;
	public $innerHTML;
	public $isSprite;
	public $width;
	public $height;
	public $x;
	public $y;
	public $z;

	public function __construct($id = 0)
	{
		global $wpdb;

		if ($id == 0) {
			$sim_deo_table_name = self::table_name();
			$maxid_row = $wpdb->get_row(
			"SELECT MAX(id) FROM $sim_deo_table_name;",
			ARRAY_A
			);
			if ($maxid_row['MAX(id)'] == 0) {
				$this->id = 1;
			} else {
				$this->id = $maxid_row['MAX(id)'] + 1;
			}
		}

		if ($id != 0) {
			$result_deo_row = self::fetchData($id);
			if ($result_deo_row) {
				$this->id = $result_deo_row['id'];
				$this->sceneId = $result_deo_row['sceneid'];
				$this->linkSceneId = $result_deo_row['linksceneid'];
				$this->innerHTML = $result_deo_row['innerhtml'];
				$this->isSprite = $result_deo_row['issprite'];
				$this->width = $result_deo_row['width'];
				$this->height = $result_deo_row['height'];
				$this->x = $result_deo_row['x'];
				$this->y = $result_deo_row['y'];
				$this->z = $result_deo_row['z'];
			} else {
				throw new Exception('deo dose not exist');
			}
		}
	}

	public function delete()
	{
		global $wpdb;
		$result = $wpdb->delete(self::table_name(), array('id' => $this->id), array('%d'));
		if (false === $result) {
			throw new Exception('The input data is in error');
		}
	}

	public function update()
	{
		$result = $wpdb->update(
			self::table_name(),
			array(
				'sceneid' => $this->sceneId,
				'linksceneid' => $this->linkSceneId,
				'innerhtml' => $this->innerHTML,
				'issprite' => $this->isSprite,
				'width' => $this->width,
				'height' => $this->height,
				'x' => $this->x,
				'y' => $this->y,
				'z' => $this->z,
			  ),
			array(
				'id' => $this->id,
			),
			array(
				'%d',
				'%d',
				'%s',
				'%d',
				'%d',
				'%f',
				'%f',
				'%f',
			),
			array(
				'%d',
			)
		);

		if (false === $result) {
			throw new Exception('The input data is in error');
		}
	}

	public function insert()
	{
		global $wpdb;
		$result = $wpdb->insert(
			self::table_name(),
			array(
				'id' => $this->id,
				'sceneid' => $this->sceneId,
				'linksceneid' => $this->linkSceneId,
				'innerhtml' => $this->innerHTML,
				'issprite' => $this->isSprite,
				'width' => $this->width,
				'height' => $this->height,
				'x' => $this->x,
				'y' => $this->y,
				'z' => $this->z,
			  ),
			array(
				'%d',
				'%d',
				'%d',
				'%s',
				'%d',
				'%d',
				'%f',
				'%f',
				'%f',
			)
		);

		if (false === $result) {
			throw new Exception('The input data is in error');
		}
	}
	public static function fetchData($id)
	{
		global $wpdb;
		$sim_scene_table_name = self::table_name();
		$result_row = $wpdb->get_row($wpdb->prepare(
				"SELECT * FROM $sim_scene_table_name WHERE id = %d;",
				$id
			  ),
			  ARRAY_A
			);

		return $result_row;
	}

	public static function table_name()
	{
		global $wpdb;

		return $wpdb->prefix.'mwsim_deo';
	}

	public static function initDb()
	{
		global $wpdb;
		$sim_deo_table_name = self::table_name();

		$installed_var = get_option('mwsim_deo_db_version');

		$sql = '';
		$charset_collate = 'ENGINE=InnoDB';

		// charsetを指定する
		if (!empty($wpdb->charset)) {
			$charset_collate = " DEFAULT CHARSET = {$wpdb->charset}";
		}

		// 照合順序を指定する（ある場合。通常デフォルトのutf8_general_ci）
		if (!empty($wpdb->collate)) {
			$charset_collate .= " COLLATE {$wpdb->collate}";
		}
		if ($installed_var != MWSIM_DB_VERSION) {
			$sql = "
			CREATE TABLE `$sim_deo_table_name` (
			  `id` bigint(20) NOT NULL,
			  `sceneid` bigint(20) NOT NULL,
			  `innerhtml` text COLLATE utf8mb4_unicode_ci,
			  `linksceneid` int(11) DEFAULT '-1',
			  `issprite` int(11) DEFAULT '0',
			  `width` int(11) DEFAULT NULL,
			  `height` int(11) DEFAULT NULL,
			  `x` float DEFAULT NULL,
			  `y` float DEFAULT NULL,
			  `z` float DEFAULT NULL
			) $charset_collate;
			";
			dbDelta($sql);
			update_option('mwsim_deo_db_version', MWSIM_DB_VERSION);
		}
	}
}
