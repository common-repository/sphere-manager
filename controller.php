<?php
if (! defined( 'ABSPATH' )) {
	exit; // Exit if accessed directly
}

require_once( 'models.php' );

function MwSIMPostData($my_plugin_slug) {
	global $wpdb;
	try {
		if ($_SERVER["REQUEST_METHOD"] != "POST") {
			throw new UnexpectedValueException();
		}

		if ( !( current_user_can( 'editor' ) || current_user_can( 'administrator' ) ) ) {
			throw new Exception('Not have permission to update');
		}

		if (array_key_exists('_wpnonce', $_GET) === false) {
			throw new UnexpectedValueException();
		}
		if (wp_verify_nonce($_GET['_wpnonce'], 'mwsim_post_data' ) === false) {
			throw new Exception('Invalid nonce');
		}

		if (array_key_exists('sceneid', $_GET) === false) {
			throw new UnexpectedValueException();
		}
		if (filter_var($_GET['sceneid'], FILTER_VALIDATE_INT) === false) {
			throw new UnexpectedValueException();
		}
		
		$json_string = file_get_contents('php://input');
		if ($json_string === false) {
			throw new UnexpectedValueException();
		}
		
		$data = json_decode($json_string, true);
		if ($data === null) {
			throw new UnexpectedValueException();
		}

		if (array_key_exists('title', $data) === false) {
			throw new UnexpectedValueException();
		}

		if (array_key_exists('description', $data) === false) {
			throw new UnexpectedValueException();
		}

		if (array_key_exists('isVideo', $data) === false) {
			throw new UnexpectedValueException();
		}
		if (filter_var($data['isVideo'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === null) {
			throw new UnexpectedValueException();
		}
		
		if (array_key_exists('imageSrc', $data) === false) {
			throw new UnexpectedValueException();
		}
		if (filter_var($data['imageSrc'], FILTER_VALIDATE_URL) === false) {
			throw new UnexpectedValueException();
		}

		if (array_key_exists('displayElementObjects', $data) === false) {
			throw new UnexpectedValueException();
		}
		
		foreach ($data['displayElementObjects'] as $value) {
			if (array_key_exists('linkSceneId', $value) === false) {
				throw new UnexpectedValueException();
			}
			if (filter_var($value['linkSceneId'], FILTER_VALIDATE_INT) === false) {
				throw new UnexpectedValueException();
			}

			if (array_key_exists('innerHTML', $value) === false) {
				throw new UnexpectedValueException();
			}

			if (array_key_exists('isSprite', $value) === false) {
				throw new UnexpectedValueException();
			}
			if (filter_var($value['isSprite'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === null) {
				throw new UnexpectedValueException();
			}

			if (array_key_exists('width', $value) === false) {
				throw new UnexpectedValueException();
			}
			if (filter_var($value['width'], FILTER_VALIDATE_INT) === false) {
				throw new UnexpectedValueException();
			}

			if (array_key_exists('height', $value) === false) {
				throw new UnexpectedValueException();
			}
			if (filter_var($value['height'], FILTER_VALIDATE_INT) === false) {
				throw new UnexpectedValueException();
			}

			if (array_key_exists('x', $value) === false) {
				throw new UnexpectedValueException();
			}
			if (filter_var($value['x'], FILTER_VALIDATE_FLOAT) === false) {
				throw new UnexpectedValueException();
			}

			if (array_key_exists('y', $value) === false) {
				throw new UnexpectedValueException();
			}
			if (filter_var($value['y'], FILTER_VALIDATE_FLOAT) === false) {
				throw new UnexpectedValueException();
			}

			if (array_key_exists('z', $value) === false) {
				throw new UnexpectedValueException();
			}
			if (filter_var($value['z'], FILTER_VALIDATE_FLOAT) === false) {
				throw new UnexpectedValueException();
			}
		}

		try {
			$wpdb->query('START TRANSACTION');

			$sceneid = (int)$_GET['sceneid'];

			$title = $data['title'];
			
			$description = $data['description'];
			
			$isVideo = (int)$data['isVideo'];

			$imageSrc = $data['imageSrc'];

			$scene = new MWSIM_Model_Scene($sceneid);
			$scene->title = $title;
			$scene->description = $description;
			$scene->isVideo = $isVideo;
			$scene->imageSrc = $imageSrc;

			if (0 === $sceneid) {
				$scene->insert();
			}

			if (0 !== $sceneid) {
				$scene->update();
			}
			
			foreach ($scene->displayElementObjects as $value) {
				$value->delete();
			}
			
			foreach ($data['displayElementObjects'] as $value) {
				$linkSceneId = (int)$value['linkSceneId'];

				$innerHTML = $value['innerHTML'];

				$isSprite = (int)$value['isSprite'];

				$width = (int)$value['width'];

				$height = (int)$value['height'];
				
				$x = (float)$value['x'];

				$y = (float)$value['y'];

				$z = (float)$value['z'];

				$displayElementObject = new MWSIM_Model_DisplayElementObject();
				$displayElementObject->sceneId = $scene->id;
				$displayElementObject->linkSceneId = $linkSceneId;
				$displayElementObject->innerHTML = $innerHTML;
				$displayElementObject->isSprite = $isSprite;
				$displayElementObject->width = $width;
				$displayElementObject->height = $height;
				$displayElementObject->x = $x;
				$displayElementObject->y = $y;
				$displayElementObject->z = $z;
				$displayElementObject->insert();
			}
			$wpdb->query('COMMIT');
		} catch (Exception $e) {
			$wpdb->query('ROLLBACK');
			throw $e;
		}

		$href = admin_url()."admin.php?page=". $my_plugin_slug ."&sceneid=".$scene->id;

		header('Content-Type: application/json; charset=utf-8');
		$data =  array('href'=>$href);
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
	} catch (UnexpectedValueException $e) {
		http_response_code(400);
		throw $e;
	} catch (Exception $e) {
		if ($e->getMessage() == 'scene does not exist') {
			http_response_code(404);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'The scene may have been deleted.');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'The input data is in error') {
			http_response_code(400);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'The input data is in error');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'Not have permission to update') {
			http_response_code(401);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'Not have permission to update');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'Invalid nonce') {
			http_response_code(403);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'Invalid nonce');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else {
			throw $e;
		}
	}
}

function MwSIMDelData() {
	global $wpdb;
	try {
		if ($_SERVER["REQUEST_METHOD"] != "POST") {
			throw new UnexpectedValueException();
		}

		if ( !( current_user_can( 'editor' ) || current_user_can( 'administrator' ) ) ) {
			throw new Exception('Not have permission to update');
		}

		if (array_key_exists('_wpnonce', $_GET) === false) {
			throw new UnexpectedValueException();
		}
		if (wp_verify_nonce($_GET['_wpnonce'], 'mwsim_del_data' ) === false) {
			throw new Exception('Invalid nonce');
		}

		if (!array_key_exists('sceneid', $_GET)) {
			throw new UnexpectedValueException();
		}

		if (!filter_var($_GET['sceneid'], FILTER_VALIDATE_INT)) {
			throw new UnexpectedValueException();
		}

		$sceneid = (int)filter_var($_GET['sceneid'], FILTER_SANITIZE_NUMBER_INT);

		$scene = new MWSIM_Model_Scene($sceneid);

		$linkedScenes = $scene->linkedScenes();

		if (count($linkedScenes) === 0 || (isset($_GET['force']) && $_GET['force'] == 'true')) {
			foreach ($scene->displayElementObjects as $value) {
				$value->delete();
			}
			$scene->delete();
			http_response_code(200);
		} else {
			http_response_code(423);
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($linkedScenes, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
		}
		
	} catch (UnexpectedValueException $e) {
		http_response_code(400);
		throw $e;
	} catch (Exception $e) {
		if ($e->getMessage() == 'scene does not exist') {
			http_response_code(404);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'The scene may have been deleted.');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'The input data is in error') {
			http_response_code(400);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'The input data is in error');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'Not have permission to update') {
			http_response_code(401);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'Not have permission to update');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'Invalid nonce') {
			http_response_code(403);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'Invalid nonce');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else {
			throw $e;
		}
	}
}

function MwSIMGetData() {
	global $wpdb;
	try {
		if ($_SERVER["REQUEST_METHOD"] != "POST") {
			throw new UnexpectedValueException();
		}
		
		if (array_key_exists('_wpnonce', $_GET) === false) {
			throw new UnexpectedValueException();
		}
		if (wp_verify_nonce($_GET['_wpnonce'], 'mwsim_get_data' ) === false) {
			throw new Exception('Invalid nonce');
		}

		if (!array_key_exists('sceneid', $_GET)) {
			throw new UnexpectedValueException();
		}

		if (!filter_var($_GET['sceneid'], FILTER_VALIDATE_INT)) {
			throw new UnexpectedValueException();
		}

		$sceneid = (int)filter_var($_GET['sceneid'], FILTER_SANITIZE_NUMBER_INT);

		$scene = new MWSIM_Model_Scene($sceneid);

		$sanitized_scene = array();
		
		$sanitized_scene['id'] = (int)filter_var($scene->id, FILTER_SANITIZE_NUMBER_INT);
		$sanitized_scene['title'] = (string)filter_var($scene->title, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
		$sanitized_scene['description'] = (string)filter_var($scene->description, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
		$sanitized_scene['imageSrc'] = (string)filter_var($scene->imageSrc, FILTER_SANITIZE_URL);
		$sanitized_scene['isVideo'] = (int)filter_var($scene->isVideo, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
		$sanitized_scene['displayElementObjects'] = array_map(
			function ($displayElementObject) {
				$sanitized_displayElementObject = array();
				$sanitized_displayElementObject['id'] = (int)filter_var($displayElementObject->id, FILTER_SANITIZE_NUMBER_INT);
				$sanitized_displayElementObject['sceneId'] = (int)filter_var($displayElementObject->sceneId, FILTER_SANITIZE_NUMBER_INT);
				$sanitized_displayElementObject['linkSceneId'] = (int)filter_var($displayElementObject->linkSceneId, FILTER_SANITIZE_NUMBER_INT);
				$sanitized_displayElementObject['innerHTML'] = $displayElementObject->innerHTML;
				$sanitized_displayElementObject['isSprite'] = (int)filter_var($displayElementObject->isSprite, FILTER_VALIDATE_BOOLEAN);
				$sanitized_displayElementObject['width'] = (int)filter_var($displayElementObject->width, FILTER_SANITIZE_NUMBER_INT);
				$sanitized_displayElementObject['height'] = (int)filter_var($displayElementObject->height, FILTER_SANITIZE_NUMBER_INT);
				$sanitized_displayElementObject['x'] = (float)filter_var($displayElementObject->x, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
				$sanitized_displayElementObject['y'] = (float)filter_var($displayElementObject->y, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
				$sanitized_displayElementObject['z'] = (float)filter_var($displayElementObject->z, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
				return $sanitized_displayElementObject;
			},
			$scene->displayElementObjects
		);
		header('Content-Type: application/json; charset=utf-8');
		http_response_code(200);
		echo json_encode($sanitized_scene, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

	} catch (UnexpectedValueException $e) {
		http_response_code(400);
		header('Content-Type: application/json; charset=utf-8');
		$data =  array('massage'=>'Bad request');
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
	} catch (Exception $e) {
		if ($e->getMessage() == 'scene does not exist') {
			http_response_code(404);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'The scene may have been deleted.');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'The input data is in error') {
			http_response_code(400);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'The input data is in error');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'Not have permission to update') {
			http_response_code(401);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'Not have permission to update');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else if ($e->getMessage() == 'Invalid nonce') {
			http_response_code(403);
			header('Content-Type: application/json; charset=utf-8');
			$data =  array('massage'=>'Invalid nonce');
			echo json_encode($data, JSON_UNESCAPED_UNICODE);
		} else {
			throw $e;
		}
	}
}
