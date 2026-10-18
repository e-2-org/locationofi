/**
 * encodePolyline.js
 * based on Javascript code written by Mark McClure in September 2006
 * http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/
 */

function encode(points)
{
    setLevels(points);
    var result = createEncodings(points);
    return result;    
}


// The createEncodings function is taken almost verbatim from
// http://www.google.com/apis/maps/documentation/polyline.js
// The only difference is the technique for passing data in and out.

function createEncodings(points) {
  var i = 0;

  var plat = 0;
  var plng = 0;

  var encoded_points = "";
  var encoded_levels = "";

  for(i = 0; i < points.length; ++i) {
    var point = points[i];
    var lat = point.lat;
    var lng = point.lon;
    var level = point.lev;

    var late5 = Math.floor(lat * 1e5);
    var lnge5 = Math.floor(lng * 1e5);

    dlat = late5 - plat;
    dlng = lnge5 - plng;

    plat = late5;
    plng = lnge5;

    encoded_points += encodeSignedNumber(dlat) + encodeSignedNumber(dlng);
    encoded_levels += encodeNumber(level);
  }
  return {
    PointString: encoded_points,
    ZoomString:  encoded_levels
  }
}


// The next two functions are taken verbatim from
// http://www.google.com/apis/maps/documentation/polyline.js
function encodeSignedNumber(num) {
  var sgn_num = num << 1;

  if (num < 0) {
    sgn_num = ~(sgn_num);
  }

  return(encodeNumber(sgn_num));
}

function encodeNumber(num) {
  var encodeString = "";
  var nextValue;

  while (num >= 0x20) {
    nextValue = (0x20 | (num & 0x1f)) + 63;
    if (nextValue == 92) {
      encodeString += (String.fromCharCode(nextValue));
    }
    encodeString += (String.fromCharCode(nextValue));
    num >>= 5;
  }

  finalValue = num + 63;
  if (finalValue == 92) {
    encodeString += (String.fromCharCode(finalValue));
  }
  encodeString += (String.fromCharCode(finalValue));
  return encodeString;
}


// The next two functions set the level string,
// which is a bit trickier.

// dist(point1, point2) returns the distance between point1
// and point2 in meters.  Note that each point needs lat
// and lon properties.
function dist(point1, point2) {
  var deg = 0.0174532925199;
  
  return 12746004.5*Math.asin(Math.sqrt(
    Math.pow(Math.sin((point1.lat - point2.lat)*deg/2),2) + 
      Math.cos(point1.lat*deg)*Math.cos(point2.lat*deg)*
        Math.pow(Math.sin((point1.lon - point2.lon)*deg/2),2)));
}

// We set the levels here.
function setLevels(points) {
  var numLevels = 18;
  var small, i, j;
  var len = points.length;
  
  // Set the endpoints to show at all zoom levels
  points[0].lev = numLevels-1;
  points[len-1].lev = numLevels-1;
  
  // Starting at the largest possible level, we step down through
  // the levels labelling points which need to appear at
  // lower resolutions.
  for (level = numLevels-1; level >= 0; level--) {
    // Set "small" for the current level.
    // More generally, we might use
    // small = small0*Math.pow(2.0, -18*(numLevels-level)/numLevels);
    small = small0*Math.pow(2.0, level-18);
    
    // Figure out which points need to occur at this level,
    // the main criteria being that we've stepped a certain 
    // distance (called "small") from the previous set point.
    i = j = 1;
    while (i < len-1) {
      if (dist(points[i], points[j]) >= small && points[i].lev == "unset") {
        points[i].lev = level;
        j = i;
      }
      if (points[i].lev != "unset") {
        j=i;
      }
      i++;
    }
  }
  // Set any unset points to level 0.
  for (i=0; i < len; i++) {
    if (points[i].lev == "unset") {
      points[i].lev = 0;
    }
  }
}

// This function simply sets the example.
function setExample() {
  document.getElementById("polylineEncoder").inputPoints.value ="35.616, -82.5649\n35.6165, -82.5643\n35.6169, -82.5639\n35.6188, -82.5637\n35.6193, -82.5632\n35.6197, -82.5629\n35.6198, -82.5629\n35.6204, -82.5625\n35.6207, -82.5619\n35.6208, -82.5611\n35.6203, -82.5493\n35.6202, -82.5491\n35.6247, -82.5482\n35.6281, -82.5434\n35.6283, -82.5432\n35.6286, -82.5431\n35.6289, -82.5428\n35.629, -82.5423\n35.6289, -82.5422\n35.6285, -82.542\n35.6286, -82.5416\n35.6287, -82.5405\n35.6289, -82.5398\n35.6296, -82.5413\n35.6296, -82.5417\n35.6308, -82.5438\n35.6309, -82.5439\n35.631, -82.5428\n35.6302, -82.541\n35.6302, -82.5408\n35.6295, -82.5383\n35.627, -82.537\n35.6267, -82.537\n35.6248, -82.5364\n35.6246, -82.5361\n35.6238, -82.5354\n35.6241, -82.5373\n35.6241, -82.5375\n35.6245, -82.5379\n35.6245, -82.5381\n35.6242, -82.5384\n35.6237, -82.5385\n35.6221, -82.5368\n35.622, -82.5366\n35.6213, -82.5386\n35.6212, -82.5389\n35.6204, -82.5391\n35.6199, -82.5393\n35.6193, -82.5394\n35.6181, -82.5386\n35.618, -82.5385\n35.6182, -82.5384\n35.6182, -82.5378\n35.617, -82.5365\n35.6168, -82.5364\n35.6169, -82.5359\n35.6175, -82.5365\n35.6178, -82.5366\n35.6186, -82.5374\n35.6188, -82.5374\n35.6192, -82.5379\n35.6195, -82.538\n35.6206, -82.5388\n35.6215, -82.5377\n35.6216, -82.5359\n35.6222, -82.5356\n35.6218, -82.5352\n35.6218, -82.5345\n35.62, -82.5362\n35.6182, -82.5357\n35.6179, -82.5355\n35.6177, -82.5347\n35.6172, -82.5349\n35.6162, -82.5339\n35.615, -82.5326\n35.6178, -82.5302\n35.6181, -82.5301\n35.6215, -82.5307\n35.6235, -82.5303\n35.6254, -82.5271\n35.6263, -82.5259\n35.6263, -82.5251\n35.6261, -82.5248\n35.6255, -82.5208\n35.6259, -82.518\n35.6238, -82.5136\n35.6229, -82.5131\n35.6232, -82.512\n35.6239, -82.5112\n35.6274, -82.5108\n35.6277, -82.5106\n35.6277, -82.5098\n35.6273, -82.5088\n35.6283, -82.5067\n35.6285, -82.5065\n35.6294, -82.5069\n35.6298, -82.5038\n35.6306, -82.5019\n35.6309, -82.5017\n35.6316, -82.5017\n35.6318, -82.5014\n35.6326, -82.4989\n35.6328, -82.4987\n35.6344, -82.4986\n35.6364, -82.4922\n35.6366, -82.4919\n35.6377, -82.4912\n35.6384, -82.4914\n35.6386, -82.4917\n35.64, -82.4943\n35.6406, -82.4947\n35.641, -82.4948\n35.6429, -82.494\n35.6438, -82.4941\n35.6442, -82.4939\n35.645, -82.4923\n35.647, -82.4912\n35.6483, -82.4865\n35.6509, -82.4868\n35.6522, -82.4865\n35.6525, -82.4862\n35.6542, -82.4854\n35.6555, -82.4844\n35.6577, -82.4849\n35.6583, -82.485\n35.659, -82.4848\n35.6609, -82.4822\n35.661, -82.4803\n35.6613, -82.48\n35.6628, -82.4795\n35.6674, -82.4747\n35.6684, -82.4719\n35.668, -82.4708\n35.6678, -82.4706\n35.6664, -82.47\n35.6674, -82.4655\n35.6665, -82.4627\n35.6598, -82.4581\n35.6575, -82.4569\n35.6556, -82.455\n35.654, -82.4528\n35.6543, -82.452\n35.6547, -82.4513\n35.656, -82.4507\n35.6566, -82.4489\n35.6572, -82.4485\n35.6604, -82.4503\n35.6611, -82.4506\n35.663, -82.4509\n35.6636, -82.4507\n35.6672, -82.448\n35.6679, -82.4473\n35.6677, -82.4452\n35.6672, -82.4435\n35.6675, -82.4428\n35.6689, -82.4423\n35.6705, -82.442\n35.6712, -82.4432\n35.6716, -82.4438\n35.6748, -82.4428\n35.6762, -82.4412\n35.675, -82.4379\n35.6747, -82.4364\n35.6751, -82.4357\n35.6766, -82.435\n35.6767, -82.4331\n35.679, -82.4296\n35.6791, -82.4288\n35.6785, -82.4274\n35.6785, -82.4262\n35.6784, -82.4259\n35.6778, -82.4255\n35.6762, -82.4253\n35.6757, -82.4249\n35.675, -82.4227\n35.6753, -82.4214\n35.6769, -82.4201\n35.678, -82.4199\n35.678, -82.4174\n35.6781, -82.4171\n35.6784, -82.4168\n35.6806, -82.4174\n35.6812, -82.4174\n35.6828, -82.4161\n35.6862, -82.4135\n35.6863, -82.4113\n35.6864, -82.4105\n35.6876, -82.4093\n35.6906, -82.4094\n35.6915, -82.4093\n35.6965, -82.4054\n35.6981, -82.3992\n35.6982, -82.3984\n35.6965, -82.3912\n35.6962, -82.3904\n35.6959, -82.3902\n35.6925, -82.3907\n35.6918, -82.3907\n35.6871, -82.3898\n35.6844, -82.3888\n35.6826, -82.3875\n35.6822, -82.3869\n35.6827, -82.3858\n35.6836, -82.3854\n35.6857, -82.3849\n35.6876, -82.383\n35.6885, -82.3837\n35.6946, -82.3823\n35.6955, -82.3804\n35.6959, -82.3798\n35.6999, -82.3798\n35.7004, -82.3795\n35.7006, -82.3793\n35.7013, -82.376\n35.7076, -82.3698\n35.7094, -82.3659\n35.7162, -82.3611\n35.7181, -82.3601\n35.7182, -82.3586\n35.7187, -82.3571\n35.7264, -82.3525\n35.7291, -82.3527\n35.7294, -82.3525\n35.7311, -82.3477\n35.7314, -82.3459\n35.7361, -82.3436\n35.7376, -82.3424\n35.74, -82.3406\n35.7413, -82.3406\n35.7417, -82.3401\n35.7421, -82.3387\n35.7426, -82.3383\n35.7436, -82.3382\n35.7478, -82.3396\n35.7481, -82.3396\n35.7487, -82.3372\n35.7492, -82.3346\n35.7476, -82.3334\n35.7459, -82.3318\n35.7403, -82.327\n35.7378, -82.3233\n35.7359, -82.3229\n35.7323, -82.3149\n35.7319, -82.3146\n35.7302, -82.3137\n35.7293, -82.312\n35.7307, -82.3096\n35.7309, -82.3088\n35.7286, -82.304\n35.7281, -82.3027\n35.7278, -82.3025\n35.7266, -82.3028\n35.7263, -82.3026\n35.7272, -82.2981\n35.7258, -82.2939\n35.7252, -82.2935\n35.7234, -82.2927\n35.7231, -82.2919\n35.7241, -82.2899\n35.7245, -82.2875\n35.724, -82.2853\n35.7203, -82.2814\n35.7181, -82.2799\n35.7197, -82.2797\n35.7212, -82.2797\n35.7218, -82.2805\n35.7268, -82.284\n35.7274, -82.2843\n35.7295, -82.2843\n35.7293, -82.2808\n35.7296, -82.2797\n35.7325, -82.2791\n35.7337, -82.2801\n35.7357, -82.281\n35.7375, -82.2811\n35.7382, -82.2799\n35.7384, -82.2796\n35.741, -82.278\n35.748, -82.2776\n35.7507, -82.275\n35.7512, -82.2745\n35.7542, -82.2747\n35.7545, -82.2747\n35.7557, -82.273\n35.7563, -82.2722\n35.7574, -82.2714\n35.7614, -82.2723\n35.7627, -82.2732\n35.7622, -82.2725\n35.7616, -82.2715\n35.7635, -82.2682\n35.7655, -82.2665\n35.7664, -82.2664\n35.7673, -82.2649\n35.7672, -82.2646\n35.7666, -82.2646\n35.7662, -82.2651\n35.7667, -82.2652\n"
}
// load() just sets the initial values.
function load() {
  document.getElementById("polylineEncoder").inputPoints.value =  "";
  document.getElementById("polylineEncoder").encodedPolyline.value = "";
  document.getElementById("polylineEncoder").small0in.value = 500000;
  document.getElementById("polylineEncoder").small0Radio[1].checked = "true";
}

// setsmall0(val) is called when one of the radio buttons is pushed.
function setsmall0(val) {
  document.getElementById("polylineEncoder").small0in.value = 1*val;
}
