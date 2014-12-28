ig.module(
  'plugins.bezier.edit-map'
)
.requires(
  'weltmeister.edit-map',
  'plugins.bezier.utils'
)
.defines(function(){ "use strict";

wm.EditMap.inject({
  bezier: false,
  //   Points will be structured like this:
  //   bezierList: [
  //     [{
  //       pos: {x, y},
  //       rect: { x1, y1, x2, y2 },      Curve beziers[0][0] and beziers[0][1] is 
  //       handles: [{       formulated with the points
  //         pos: {x, y}
  //         rect: {x1, y1, x2, y2 }     beziers[0][0].pos.x,beziers[0][0].pos.y, 
  //       }]                beziers[0][0].handles[0].pos.x, beziers[0][0].handles[0].pos.y
  //     },                  beziers[0][1].pos.x,beziers[0][1].pos.y,
  //     {                   beziers[0][1].handles[0].pos.x, beziers[0][1].handles[0].pos.y
  //       pos: {x, y},
  //       rect: { x1, y1, x2, y2 },
  //       handles: [{
  //         pos: {x, y}
  //       },
  //       {
  //         pos: {x, y}
  //       }]
  //     },
  //     {                   Curve beziers[0][1] and beziers[0][2] is
  //        pos: {x, y},     formulated with the points
  //        handles: [{      beziers[0][1].pos.x,beziers[0][1].pos.y,
  //          pos: {x, y}    beziers[0][1].handles[1].pos.x, beziers[0][1].handles[1].pos.y,
  //        }]               beziers[0][2].pos.x,beziers[0][2].pos.y,
  //     }                   beziers[0][2].handles[0].pos.x, beziers[0][2].handles[0].pos.y,
  //   ]     
  // 
  bezierList: [],
  
  currentlySelectedMarker: null,
  currentlySelectedGroup: null,
  currentlySelectedHandle: null,
  currentlyOppSelectedHandle: null,

  draggingSelected: false,
  markerSize: wm.config.bezier.POINT_MARKER_SIZE,
  handleSize: wm.config.bezier.POINT_HANDLE_SIZE,

  snapNodeArray: [],

  markerRefs: [], // To access marker-handle groups by marker [{x: x, y: y, marker: marker}]
  handleRefs: [],
  kvoListeners: {}, // To access marker-handle groups by handle [{x: x, y: y, marker: marker}]

  init: function( name, tilesize, tileset, foreground ){
    this.parent( name, tilesize, tileset, foreground );

    this.bezierUtils = new BezierUtils();
    this.curvePixel = this.bezierUtils.createCurvePixel(ig.system.context);

    this.initNearestSnap();
  },

  getSaveData: function() {
    var saveData = this.parent();
    saveData.bezierList = this.bezierList;
    saveData.bezier = this.bezier;
    return saveData;
  },

  placeBezierPointMarker: function( x, y ){
    var context = ig.system.context,
        rx = x,
        ry = y,
        markerSize = wm.config.bezier.POINT_MARKER_SIZE,
        handleSize = wm.config.bezier.POINT_HANDLE_SIZE,
        marker,
        last,
        index;

    // If no group selected, start a new one

    marker = this.createMarker(rx, ry);

    if( this.currentlySelectedGroup === null){
      this.bezierList.push( [ marker ] );
      this.currentlySelectedGroup = _.last( this.bezierList );
    } else {

      // otherwise, add to the last one
      for(var i = 0; i < this.currentlySelectedGroup.length; i++ ){
        if( this.currentlySelectedMarker === this.currentlySelectedGroup[i] ){
          index = i;
          break;
        }
      }

      this.currentlySelectedGroup.splice( index + 1, 0, marker );

      // Reset curve positions
      this.currentlySelectedGroup[index].curve = [];
      if( this.currentlySelectedGroup[index + 2] ) this.currentlySelectedGroup[index + 2].curve = [];

      // if the new marker is last, give the marker before it another handle
      if( this.currentlySelectedGroup.length > 2 ){
        if( this.currentlySelectedGroup.length === index + 2 ){
          var markerBefore = this.currentlySelectedGroup[index];
          
          if( markerBefore.handles.length < 2 )
            markerBefore.handles.push( this.createHandle(markerBefore.pos.x + wm.config.bezier.HANDLE_OFFSET, markerBefore.pos.y) );
        } else {
          // otherwise, give the new marker another handle
          var newMarker = this.currentlySelectedGroup[index+1];
          newMarker.handles.push( this.createHandle(newMarker.pos.x + wm.config.bezier.HANDLE_OFFSET, newMarker.pos.y) );       
        }
      }
    }

    this.currentlySelectedMarker = marker;
  },

  createMarker: function(x, y){
    return {
      pos: {x: x, y: y},
      handles: [ this.createHandle( x - wm.config.bezier.HANDLE_OFFSET, y ) ],
      curve: [],
      selected : true,
      rect: this.createRect( x, y, this.markerSize )      
    };
  },

  createHandle: function(x, y){
    return {
      pos: {
        x: x, 
        y: y
      },
      rect: this.createRect(x, y, this.handleSize)
    };
  },

  deleteMarker: function( marker, group ){
    var self = this;

    this.operateOnMarkerInGroup( marker, group, function( markerIndex ){
      group.splice( markerIndex, 1 );

      if( group[markerIndex - 1] ) {
        self.currentlySelectedGroup = group;
        self.currentlySelectedMarker = group[markerIndex - 1];
        self.currentlySelectedMarker.curve = [];
      }

      // If first marker is deleted in a 3 member group, delete the new first's handle 0
      // or if the last marker's, delete the new last marker's 2nd handle
      if( group.length > 1 ){
        if( markerIndex === 0 ){
          group[markerIndex].handles.splice( 0, 1 );
        }

        if( markerIndex === group.length){
          group[markerIndex - 1].handles.splice( 1, 1 );
        }
      }

      if( group[markerIndex] ){
        group[markerIndex].curve = [];
      }
    });

    for( var i = 0; i < this.bezierList.length; i++ ){
      if( this.bezierList[i].length === 0 ){
        this.bezierList.splice( i, 1 );
        this.currentlySelectedGroup = null;
        this.currentlySelectedMarker = null;
        this.currentlySelectedHandle = null;
        this.currentlyOppSelectedHandle = null;
      }
    }
  },

  operateOnMarkerInGroup: function( marker, group, fn ){ // fn gets index of marker in group
    for( var i = 0; i < group.length; i++ ){
      if( marker === group[i] ){
        fn(i);
      }
    }
  },

  moveMarker: function( marker, x, y ){
    // do move handles if it's a handle
    if( marker && !marker.handles ){
      this.moveHandle( marker, x, y );
      return;
    }

    var pos = marker.pos,
      handle1 = marker.handles[0],
      handle1Offset = {
        x: pos.x - handle1.pos.x, 
        y: pos.y - handle1.pos.y
      },
      handle2,
      handle2Offset;

    if( marker.handles[1] ){
      handle2 = marker.handles[1];

      handle2Offset = {
        x: pos.x - handle2.pos.x, 
        y: pos.y - handle2.pos.y
      };
    }

    pos.x = x;
    pos.y = y;

    handle1.pos.x = x - handle1Offset.x;
    handle1.pos.y = y - handle1Offset.y;

    marker.rect  = this.createRect(x, y, this.markerSize);    
    handle1.rect = this.createRect(handle1.pos.x, handle1.pos.y, this.handleSize);

    if( handle2Offset ){
      handle2.pos.x = x - handle2Offset.x;
      handle2.pos.y = y - handle2Offset.y; 
      handle2.rect = this.createRect(handle2.pos.x, handle2.pos.y, this.handleSize); 
    }
  },

  moveHandle: function( handle, x, y ){
    handle.pos.x = x;
    handle.pos.y = y;
    handle.rect = this.createRect( x, y, this.handleSize );
  },

  drawBezierPoints: function(){
    var self = this,
      white = "rgba(255,255,255,1)",
      green = "rgba(0,255,0,1)";

    _.forEach(this.bezierList, function( group ){

      if( group.length > 1 ){
        self.drawBezierLines( group, 0 );
      }

      _.forEach( group, function( marker ){
        self.drawMarkerPoint( marker.pos.x, marker.pos.y, marker.selected ? green : white );

        if( marker.selected ){
          for( var i = 0; i < marker.handles.length; i++ ){
            self.drawHandlePoint( marker.handles[i].pos.x, marker.handles[i].pos.y );
            self.drawHandleLines( marker.handles[i].pos, marker.pos );
          }
        }
      });
    });
  },

  drawHandleLines: function( p1, p2 ){
    var c = ig.system.context;

    c.beginPath();
    c.moveTo(p1.x - ig.game.screen.x, p1.y - ig.game.screen.y);
    c.lineTo(p2.x - ig.game.screen.x, p2.y - ig.game.screen.y);
    c.strokeStyle = '#333333';
    c.closePath();
    c.stroke();
  },

  drawBezierLines: function( group, memo ){
    var p1 = group[memo], 
      p2 = group[memo + 1],
      curve = [],
      step = 1 / wm.config.bezier.LINE_DEFINITION,
      i;

    if( !p1.curve.length ){
      for( i = 0; i < 1; i += step ){
        if( !p1.curve.length || !p2.curve.length ){
          if( p1.handles[1] ){
            curve.push( this.bezierUtils.bezierCurvePoint(p1.pos, p1.handles[1].pos, p2.handles[0].pos, p2.pos, i) );
          } else {
            curve.push( this.bezierUtils.bezierCurvePoint(p1.pos, p1.handles[0].pos, p2.handles[0].pos, p2.pos, i) );      
          }
        }
      }

      p1.curve = curve;
    }

    this.bezierUtils.drawPathOnContext( p1.curve, ig.system.context );

    if( group[memo + 2] ){
      this.drawBezierLines( group, memo + 1 );
    }
  },

  createRect: function(x, y, width){
    var offset = width/2;

    return {
      x1: x - offset,
      x2: x + this.markerSize - offset,
      y1: y - offset,
      y2: y + this.markerSize - offset
    };
  },

  drawMarkerPoint: function(x, y, color){
    var context = ig.system.context,
      offset = this.markerSize/2;
      
    context.fillStyle = color;
    context.fillRect( x - ig.game.screen.x - offset, y - ig.game.screen.y - offset, this.markerSize, this.markerSize );
  },

  drawHandlePoint: function(x, y){
    var context = ig.system.context,
      rect,
      offset = this.handleSize/2;
    
    context.fillStyle = "rgba(128,128,128,1)";
    rect = {
      x1: x - offset,
      x2: x + this.handleSize - offset,
      y1: y - offset,
      y2: y + this.handleSize - offset
    };    
    context.fillRect( x - ig.game.screen.x - offset, y - ig.game.screen.y - offset, this.handleSize, this.handleSize );

    return rect;
  },

  isClickingBezierPoint: function(x, y){
    var point = {x: x, y: y},
      self = this,
      found = false;

    _.forEach( this.bezierList, function( group ){
      var markerKey = 0;

      _.forEach( group, function( marker ){
        marker.selected = false;

        if( self.isInsideRect( point, marker.rect ) ){
          self.currentlySelectedMarker = marker;
          self.currentlySelectedPartnerMarker = group[markerKey-1];
          self.currentlySelectedGroup = group;
          marker.selected = true;
          console.log( markerKey, self.currentlySelectedPartnerMarker );
          found = true;
        }

        if( !found ){
          for( var i = 0; i < marker.handles.length; i++ ){

            if( self.isInsideRect( point, marker.handles[i].rect ) ){
              marker.selected = true;
              self.currentlySelectedMarker = marker;
              self.currentlySelectedPartnerMarker = group[markerKey-1] || group[markerKey+1];
              self.currentlySelectedHandle = marker.handles[i];
              self.currentlySelectedGroup = group;

              if( marker.handles.length > 1 ) 
                self.currentlyOppSelectedHandle = marker.handles[i-1] || marker.handles[i+1];
              else 
                self.currentlyOppSelectedHandle = null;

              found = true;              
            }
          }
        }

        markerKey++;
      });
    });

    return found;
  },

  isInsideRect: function( point, rect ){
    var x = point.x,
      y = point.y;

    if( x > rect.x1 && y > rect.y1 && x < rect.x2 && y < rect.y2 ){
      return true;
    } else {
      return false;
    }
  },

  initNearestSnap: function(){
    var radSnap = ( Math.PI * 2 ) / wm.config.bezier.SNAP_DIVISIONS;

    for( var i = -Math.PI; i <= Math.PI; i += radSnap ){
      this.snapNodeArray.push( i );
    }
  },

  nearestSnap: function( o, p ){
    var nearest, i, nearestIndex,
      nearestATan,
      nearestCheck,
      arcTan = this.bezierUtils.getArcTan( o, p ),
      radius = Math.abs( this.bezierUtils.distanceBetweenPoints( o, p ) );

    nearest = Math.PI / wm.config.bezier.SNAP_DIVISIONS;

    for( i = 0; i < this.snapNodeArray.length; i++ ){
      nearestCheck = Math.abs( 0 - ( arcTan - this.snapNodeArray[i] ) );

      if( nearestCheck < nearest ){
        nearest = nearestCheck;
        nearestIndex = i;
      }
    }

    return {
      x: o.x + ( radius * Math.cos( this.snapNodeArray[nearestIndex] ) ),
      y: o.y + ( radius * Math.sin( this.snapNodeArray[nearestIndex] ) )
    };
  },

  translateOppositeHandle: function( origin, p1, p2 ){
    var rad, oppRad,
        oHandleRadius,
        hir; // handle in relation

    oHandleRadius = Math.abs( this.bezierUtils.distanceBetweenPoints( origin, p2 ) );

    rad = this.bezierUtils.getArcTan( origin, p1 );
    oppRad = this.bezierUtils.getOppositeRad( rad );

    hir = { 
      x: oHandleRadius * Math.cos(oppRad),
      y: oHandleRadius * Math.sin(oppRad) 
    };

    return {
      x: origin.x + hir.x,
      y: origin.y + hir.y
    };
  },  

  fakeBezierTileset: function() {
    var path = wm.config.collisionTiles.path;
    var scale = this.tilesize / wm.config.collisionTiles.tilesize;
    this.tileset = new ig.AutoResizedImage( path, scale );
  }
});

});