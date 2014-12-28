ig.module(
  'plugins.bezier.weltmeister'
)
.requires(
  'dom.ready',
  'impact.game',
  'weltmeister.evented-input',
  'plugins.bezier.config',
  'weltmeister.edit-entities',
  'weltmeister.select-file-dropdown',
  'weltmeister.modal-dialogs',
  'weltmeister.undo',
  'weltmeister.weltmeister',
  'plugins.bezier.edit-map'
)
.defines(function(){ "use strict";

wm.Weltmeister.inject({  

  bezierLayer: null,

  MODE: {
    DRAW: 1,
    TILESELECT: 2,
    ENTITYSELECT: 4,
    BEZIER: 5
  },

  selectedMarker: null,

  init: function(){
    this.addBezierOptionMarkup();

    $('#layerIsBezier').on('change', this.toggleBezierLayer.bind(this));
    
    this.parent();
  },

  addBezierOptionMarkup: function(){
    $('#layerLinkWithCollision').parent().after('<dd><input type="checkbox" id="layerIsBezier"/><label for="layerIsBezier"> Is Bezier Layer</label></dd>');
  },

  toggleCollisionLayer: function(e){
    this.parent();
    $('#layerIsBezier').attr('disabled', $('#layerIsCollision').prop('checked') );
  },

  toggleBezierLayer: function(){
    var isBezier = $('#layerIsBezier').prop('checked');
    $('#layerIsCollision,#layerLinkWithCollision,#layerDistance,#layerPreRender,#layerRepeat,#layerTileset')
      .attr('disabled', isBezier );

    if( isBezier ){
      $('#canvas').css('cursor', 'crosshair');
      this.mode = this.MODE.BEZIER;
      this.activeLayer.bezier = true;
    } else {
      $('#canvas').css('cursor', 'default');
      this.mode = this.MODE.DEFAULT;
      this.activeLayer.bezier = false;      
    }
  },

  updateLayerSettings: function(){
    this.parent();

    var collisionLayerSelected = !( this.activeLayer.name === 'collision' );

    $('#layerIsBezier').prop( 'checked', this.activeLayer.bezier );  
    $('#layerIsCollision').prop( 'disabled', this.activeLayer.bezier || this.getLayerWithName('collision') );
  },

  saveLayerSettings: function(){
    this.activeLayer.bezier = $('#layerIsBezier').prop('checked');
    this.parent();
  },

  loadResponse: function( data ) {
    $.cookie( 'wmLastLevel', this.filePath );
    
    // extract JSON from a module's JS
    var jsonMatch = data.match( /\/\*JSON\[\*\/([\s\S]*?)\/\*\]JSON\*\// );
    data = JSON.parse( jsonMatch ? jsonMatch[1] : data );
    
    while( this.layers.length ) {
      this.layers[0].destroy();
      this.layers.splice( 0, 1 );
    }
    this.screen = {x: 0, y: 0};
    this.entities.clear();
    
    for( var i=0; i < data.entities.length; i++ ) {
      var ent = data.entities[i];
      this.entities.spawnEntity( ent.type, ent.x, ent.y, ent.settings );
    }
    
    for( var i=0; i < data.layer.length; i++ ) {
      var ld = data.layer[i];
      var newLayer = new wm.EditMap( ld.name, ld.tilesize, ld.tilesetName, !!ld.foreground );
      newLayer.resize( ld.width, ld.height );
      newLayer.linkWithCollision = ld.linkWithCollision;
      newLayer.repeat = ld.repeat;
      newLayer.preRender = !!ld.preRender;
      newLayer.distance = ld.distance;
      newLayer.visible = !ld.visible;
      newLayer.bezier = ld.bezier;
      newLayer.bezierList = ld.bezierList;
      newLayer.data = ld.data;
      newLayer.toggleVisibility();
      this.layers.push( newLayer );
      
      if( ld.name == 'collision' ) {
        this.collisionLayer = newLayer;
      }
      
      this.setActiveLayer( ld.name );
    }
    
    this.setActiveLayer( 'entities' );
    
    this.reorderLayers();
    $('#layers').sortable('refresh');
    
    this.resetModified();
    this.undo.clear();
    this.draw();
  },

  setActiveLayer: function( name ) {
    this.parent( name );



    if( this.activeLayer.bezier ) {
      $('#layerIsBezier').prop('checked', this.activeLayer.bezier);
      this.toggleBezierLayer();
    }
  },

  keydown: function( action ){
    var x, y;

    if( !this.activeLayer ) {
      return;
    }

    if( action === 'draw' ){
      
      if( this.mode === this.MODE.BEZIER ){
        x = ig.input.mouse.x + this.screen.x;
        y = ig.input.mouse.y + this.screen.y;

        if( this.activeLayer.isClickingBezierPoint(x, y) ){ // Move Marker|Handle
          $('#canvas').css('cursor', 'hand');
        } else {                                 // Create Marker|Handle
          this.activeLayer.placeBezierPointMarker( x, y ); 
        }

        this.setModified();
      }
    }

    if( action === 'delete' ){
      if( this.mode === this.MODE.BEZIER ){
        this.activeLayer.deleteMarker( this.activeLayer.currentlySelectedMarker, this.activeLayer.currentlySelectedGroup );
        this.setModified();
      }
    }

    this.parent( action );
  },

  keyup: function( action ){
    if( this.mode === this.MODE.BEZIER ){

      if( action === 'draw' ){
        this.activeLayer.currentlySelectedHandle = null;
      }

      if( action === 'bezierStop' ){
        this.activeLayer.currentlySelectedMarker.selected = false;
        this.activeLayer.currentlySelectedMarker = null;
        this.activeLayer.currentlySelectedGroup = null;
      }

      this.activeLayer.currentlySelectedHandle = null;
      this.activeLayer.currentlyOppSelectedHandle = null;      

      this.draw();
      this.mouseLast = {x: ig.input.mouse.x, y: ig.input.mouse.y};  
    } else {
      this.parent( action );
    }
  },

  mousemove: function(){
    if( this.mode === this.MODE.BEZIER )
      this.mousemoveBezier();
    else
      this.parent();
  },

  mousemoveBezier: function() {
    var x, y, newOpp, snapCoords;

    if( !this.activeLayer ){
      return;
    }

    if( ig.input.state('drag') ) {
      this.drag();
    }

    if( ig.input.state('draw') ) {
      // move marker
      x = ig.input.mouse.x + this.screen.x;
      y = ig.input.mouse.y + this.screen.y;

      if( this.activeLayer.currentlySelectedHandle ){
        $('#canvas').css('cursor', 'pointer');

        this.activeLayer.currentlySelectedMarker.curve = [];
        if (this.activeLayer.currentlySelectedPartnerMarker) this.activeLayer.currentlySelectedPartnerMarker.curve = [];

        if( ig.input.state('bezier45DegNearest') ){
          snapCoords = this.activeLayer.nearestSnap( 
            this.activeLayer.currentlySelectedMarker.pos, 
            {x: x, y: y} 
          );

          x = snapCoords.x;
          y = snapCoords.y;
        }

        this.activeLayer.moveHandle( this.activeLayer.currentlySelectedHandle, x, y );
        if( this.activeLayer.currentlyOppSelectedHandle && !ig.input.state('bezierPullOneHandle') ) {
          newOpp = this.activeLayer.translateOppositeHandle( 
            this.activeLayer.currentlySelectedMarker.pos, 
            this.activeLayer.currentlySelectedHandle.pos, 
            this.activeLayer.currentlyOppSelectedHandle.pos 
          );

          this.activeLayer.moveHandle( this.activeLayer.currentlyOppSelectedHandle, newOpp.x, newOpp.y );
        }

      } else if( this.activeLayer.currentlySelectedMarker ){
        $('#canvas').css('cursor', 'pointer');

        this.activeLayer.currentlySelectedMarker.curve = [];
        if (this.activeLayer.currentlySelectedPartnerMarker) this.activeLayer.currentlySelectedPartnerMarker.curve = [];

        this.activeLayer.moveMarker( this.activeLayer.currentlySelectedMarker, x, y );
      }
    }

    this.mouseLast = {x: ig.input.mouse.x, y: ig.input.mouse.y};
    this.draw();
  },

  drawIfNeeded: function(){
    this.parent();

    if( this.mode === this.MODE.BEZIER ){
      this.activeLayer.drawBezierPoints();
    }
  }
});

});