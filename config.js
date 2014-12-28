ig.module(
  'plugins.bezier.config'
)
.requires(
  'weltmeister.config'
)
.defines(function(){ "use strict";

wm.config.binds.ESC = 'bezierStop';
wm.config.binds.ALT = 'bezierPullOneHandle';
wm.config.binds.V = 'bezierLockHandles';
wm.config.binds.N = 'bezier45DegNearest';

wm.config.bezier = {
  POINT_MARKER_SIZE : 10,
  POINT_HANDLE_SIZE : 7,
  HANDLE_OFFSET : 100,
  LINE_DEFINITION : 200,
  SNAP_DIVISIONS : 8, // 8 = 45deg; 4 = 90deg, so on and so forth

  'bezierTiles': {
    'path': 'lib/plugins/bezier/media/blank.png',
    'tilesize': 64
  },  
}

});