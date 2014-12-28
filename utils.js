ig.module('plugins.bezier.utils')
.requires(
  'impact.impact'
)
.defines(function(){

BezierUtils = ig.Class.extend({

  curvePixel: null,

  getArcTan: function( origin, point ){
    var dx = point.x - origin.x,
        dy = point.y - origin.y;

    return Math.atan2( dy, dx );
  },

  pointInRelationToOrigin: function( origin, point ){
    return {
      x : ( point.x < origin.x ) ? point.x + origin.x : point.x - origin.x,
      y : ( point.y > origin.y ) ? point.y + origin.y : point.y - origin.y
    };
  },

  getOppositeRad: function( rad ){
    return rad + Math.PI;
  },  

  distanceBetweenPoints: function( p1, p2 ){
    return Math.sqrt( Math.pow(p2.x-p1.x, 2) + Math.pow(p2.y-p1.y,2) );
  },

  bezierCurvePoint: function( p1, h1, h2, p2, step ){
    var cx = 3 * ( h1.x - p1.x ),
      bx = 3 * ( h2.x - h1.x ) - cx,
      ax = p2.x - p1.x - cx - bx,

      cy = 3 * (h1.y - p1.y ),
      by = 3 * (h2.y - h1.y ) - cy,
      ay = p2.y - p1.y - cy - by,

      x = (ax * Math.pow(step, 3)) + (bx * Math.pow(step, 2)) + (cx * step) + p1.x,
      y = (ay * Math.pow(step, 3)) + (by * Math.pow(step, 2)) + (cy * step) + p1.y;

      return { x : x, y : y };
  },

  estimateCurveLength: function( bezier, accuracy, start, end ){ // Accuracy equates to number of steps rendered on path
    end = end || 1;
    start = start || 0;

    var steps = end/accuracy,
      length = 0,
      last;

    for( var i = start; i <= end; i += steps ){
      point = this.bezierCurvePoint( bezier.p1, bezier.h1, bezier.h2, bezier.p2, i );
      
      if( last )
        length += this.distanceBetweenPoints( last, point );

      last = point; 
    }

    return length;
  },

  getTotalBezierLength: function( bezierList, accuracy ){ 
    var total = 0,
        subsection;

    for( var i = 0; i < bezierList.length; i++ ){ // result is group
      for( var j = 0; j < bezierList[i].length; j++ ){ // result is marker point
        subsection = this.getCurveSubsection( bezierList[i], j );    
        
        if( subsection )
          total += this.estimateCurveLength( subsection, accuracy );
      }
    }

    return total;
  },

  getTotalStepsLength: function( bezierList ){
    var total = 0;

    for( var i = 0; i < bezierList.length; i++ ){
      for( var j = 0; j < bezierList[i].length; j++ ){
        if( bezierList[i][j+1] ) { // if not last...
          total += 1;
        }
      }
    }

    return total;
  },

  getCurveSubsection: function( bezierGroup, at ){
    if( !bezierGroup[at] || !bezierGroup[at+1] ){
      return null;
    }

    var p1 = bezierGroup[at].pos,
        h1 = (bezierGroup[at].handles.length > 1) ? bezierGroup[at].handles[1].pos : bezierGroup[at].handles[0].pos,
        h2 = bezierGroup[at+1].handles[0].pos,
        p2 = bezierGroup[at+1].pos;

    return { p1: p1, h1: h1, h2: h2, p2: p2 };
  },

  drawPathOnContext: function( path, context ){
    var xOffset = ig.game.screen.x,
      yOffset = ig.game.screen.y,
      curvePixel = this.createCurvePixel( context ),
      i;

    for( i = 0; i < path.length; i++ ){
      context.putImageData( curvePixel, path[i].x - xOffset, path[i].y - yOffset );      
    }  
  },

  createCurvePixel: function( context ){
    var createPixel = context.createImageData(1,1);

    createPixel.data[0] = 255,
    createPixel.data[1] = 255,
    createPixel.data[2] = 255,
    createPixel.data[3] = 255;

    return createPixel;      
  },

  entityOnPathAt: function( entity, points, at, offset ){ // 0 < at < 1
    entity.pos = this.positionOnPathAt( entity, points, at, offset );
  },

  positionOnPathAt: function( entity, points, at, offset ){ // 0 < at < 1
    var pos = bezierUtils.bezierCurvePoint( points.p1, points.h1, points.h2, points.p2, at ),
        offset = offset || 0,
        posx, posy;

    posx = pos.x - entity.size.x/2 - offset;
    posy = pos.y - entity.size.y/2 - offset;

    return { x: posx, y: posy };
  }    
});

});