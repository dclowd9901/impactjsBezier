// TODO: Move currentWave.wave.cached movement data over to wave class

ig.module(
  'plugins.bezier.bezier-debug-panel'
)
.requires(
  'dom.ready',
  'impact.game',
  'impact.debug.menu',
  'plugins.bezier.utils',
  'plugins.bezier.path',
  'game.wave'
)
.defines(function(){

var bezierLayers        = [],
    bezierEvents        = {
      afterLoadLevel : $.Deferred()
    },
    currentPath         = null,
    currentWave         = null,
    enemies             = [],
    gid                 = -1,
    bezierUtils         = new BezierUtils(),
    scripts             = [],
    cachedOptionLists   = [],
    cachedOptionObjects = {},

    PROPERTY_ENEMIES    = 'enemies',
    PROPERTY_PATH       = 'path',
    PROPERTY_SCRIPT     = 'script',

    EL_PROP_DISABLED    = 'disabled';

ig.Game.inject({

  pathChanged : false,
  cachedPath : null,

  loadLevel: function( data ) {
    this.parent( data );

    for( var i = 0; i < data.layer.length; i++ ){
      if( data.layer[i].bezier ){
        bezierLayers.push( {
          name        : data.layer[i].name,
          bezierList  : data.layer[i].bezierList,
          totalLength : bezierUtils.getTotalBezierLength( data.layer[i].bezierList, 100 )
        });
      }
    }

    bezierEvents.afterLoadLevel.resolve();
  },

  draw: function(){

    this.parent();

    if (currentWave) {
      currentWave.draw();
    } else {
      return;
    }

    var self = this,
        visualPlot = currentWave.wave.get('path.visualPlot'),
        trailingMax;

    if( !this.curvePixel ){
      this.curvePixel = bezierUtils.createCurvePixel(ig.system.context);
    }

    if( currentWave && visualPlot ){
      var ctx     = ig.system.context,
          plot    = visualPlot,
          offsetX = ig.game.screen.x,
          offsetY = ig.game.screen.y;

      _.forEach( plot, function( point ){
        ctx.putImageData( self.curvePixel, point.x - offsetX, point.y - offsetY );
      });
    }
  }
});

BezierDebugPanel = ig.DebugPanel.extend({

  $followers: null,
  $weapons: null,

  getGid: function(){
    gid++;
    return gid;
  },

  init: function (name, label) {
    this.parent(name, label);

    this.generateMarkup();
  },

  generateMarkup: function(){
    var self = this;

    this.loadPartial('plugins/bezier/templates/layout.tl')
      .done( function( html ){
        var bezierScriptPanel = _.template( html );

        $(self.container).append( bezierScriptPanel );

        self.backfillScripts();
        self.marshalEvents();
      });
  },


  marshalEvents: function(){
    var self = this;

    // $(this.container).on('keyup change', '.directives', function(e){
    //   var curveSection;

    //   currentWave.set( 'script.directives', self.getDirectives() );

    //   if( $(e.target).controlIs('entityPosition') ){
    //     curveSection = Math.floor( parseInt( $(e.target).val(), 10) );

    //     bezierUtils.entityOnPathAt(
    //       currentWave.get( PROPERTY_ENEMIES ).leader,
    //       currentWave.get( PROPERTY_SCRIPT ).bezier[curveSection],
    //       parseFloat( $(e.target).val() ) % 1
    //     );
    //   }
    // });

    // $(this.container).on('keyup change', '.follower', function(){

    //   _.forEach( currentWave.get( PROPERTY_ENEMIES ).followers, function( follower ){
    //     if( follower.kill )
    //       follower.kill();
    //   });

    //   currentWave.set( 'enemies.followers', self.getFollowers() );
    // });

    // $(this.container).on('keyup change', '.leader.weapons', function(e){
    //   currentWave.set( 'enemies.leader.weapons', self.getLeaderWeapons() );
    // });

    $(this.container).on('click', function(e){
      var $tgt = $(e.target);

      self.scriptEvents($tgt, e);
      self.directiveEvents($tgt, e);
      // self.enemyControlEvents( $tgt );
      // self.weaponEvents( $tgt );
    });
  },

  weaponEvents: function( $tgt ){
    var wepIdx,
        enemy,
        self = this;

    if( $tgt.controlIs('add-weapon') ){
      this.loadPartial( 'plugins/bezier/templates/weapon.tl')
        .done( function( data ){
          var $weaponList = $tgt.siblings('.weapons').first(),
              partial     = $.parseHTML(data);

          self.backfillOptionsAjax( $(partial).find('.weapon-class'),
                                    'enemyWeapons',
                                    'lib/game/entities/weapons/',
                                    'js' );
          $weaponList.append( partial );

          currentWave.set( 'enemies.followers', self.getFollowers() );
          currentWave.set( 'enemies.leader.weapons', self.getLeaderWeapons() );
        });
    }

    if( $tgt.controlIs('remove-weapon') ){
      $tgt.parent().remove();
      currentWave.set( 'enemies.followers', this.getFollowers() );
    }
  },

  scriptEvents : function ($tgt, e) {
    var self = this,
        found = false;

    if( $tgt.controlIs('save-script') ){

      _.forEach( cachedOptionObjects.bezierScripts, function( script ){
        if( script.name === currentWave.get('scriptName') ){
          found = true;
        }
      });

      if( found ){
        if( !confirm( 'Are you sure you want to overwrite an existing script?' ) ){
          return false;
        }
      }

      currentWave.save();
    }

    if( $tgt.controlIs('load-script') ){
      this.destroyAllEntities();

      this.newScript().done( function(){
        currentWave.load( $('#bezierScripts').val() )
          .done( function(){
            self.createDirectives();
            self.recalcSliders();

            $followers.html('');
            _.forEach( currentWave.enemies.followers, function( follower ){
              self.addFollowerMarkup( follower );
            });
          });
      });
    }

    if( $tgt.is('.compile-script') ){
      e.preventDefault();
      currentWave.cacheMovements( $('.compile-script') );
    }

    if( $tgt.is('.play-script') ){
      e.preventDefault();
      this.oppose( $tgt.siblings('.stop-script'), $tgt );
      currentWave.play();
    }

    if( $tgt.is('.stop-script') ){
      e.preventDefault();
      this.oppose( $tgt.siblings('.play-script'), $tgt );
      currentWave.stop();
    }

    if ($tgt[0].id === 'newBezierScript') {

      this.newScript()
        .done(this.updateForm)
        .done(function () {
          // Bind event listeners
          self.addObservers();

          // Adding options to selects
          self.backfillLayers();
          self.backfillEnemies();
          self.backfillWeapons();
        });
    }
  },


  addObservers: function () {
    var self = this;

    currentWave.wave.observe('layerName', this.createPath, this);

    currentWave.wave.observe('enemies.leader.className', function (newtype, oldtype, data) {
      self.replaceEntity(newtype, data, 'enemies.leader.objects.entity');
    }, this);

    currentWave.wave.observe('script.directives.*.speed', function (val, formerVal, data) {
      data.pop();

      self.recalcSlider(data.join('.'));
      currentWave.wave.set('script.max', currentWave.wave.get('script.bezier').length, self, true);
      currentWave.wave.set('script.max.nofollow', true, null, true);

      $('.play-script').prop(EL_PROP_DISABLED, true);
      $('.save-script').prop(EL_PROP_DISABLED, true);
    });

    currentWave.wave.observe('script.directives.*.starting', this.moveLeader.bind(this));

    currentWave.events.on('cached', function () {
      $('.play-script').prop(EL_PROP_DISABLED, false);
    });
  },


  backfillScripts: function () {
    this.getOptionsFromFiles('scriptNames', 'lib/game/levels/scripts/', false)
      .done(function (scriptNames) {
        var options = _.map(scriptNames,  function (name) {
                                            return '<option value="lib/game/levels/scripts/' + name + '">' + name + '</option>"';
                                          }).join('');

        $('#bezierScripts').html(options)
      });
  },

  backfillLayers: function () {
    currentWave.wave.updateInput('layerName', {
                                                options: _.pluck(bezierLayers, 'name'),
                                                value: _.first(bezierLayers).name
                                              });

    currentWave.wave.set('layerName', currentWave.wave.get('layerName'));
  },

  backfillEnemies: function () {

    var def = $.Deferred();

    this.getOptionsFromFiles('enemyEntities', 'lib/game/entities/ships/', true, 'Entity')
      .done(function (classes) {

        currentWave.wave.updateInput('enemies.leader.className',  {
                                                                    options: classes,
                                                                    value: _.first(classes)
                                                                  });

        currentWave.wave.updateInput('enemies.followers.members.*.className', {
                                                                                options: classes,
                                                                                value: _.first(classes)
                                                                              });

        def.resolve(_.first(classes));
      });

      return def;
  },

  backfillWeapons: function () {
    var def = $.Deferred();

    this.getOptionsFromFiles('weaponEntities', 'lib/game/entities/weapons/', true, 'Entity')
      .done(function (classes) {

        currentWave.wave.updateInput('enemies.leader.weapons.*.className',  {
                                                                              options: classes,
                                                                              value: _.first(classes)
                                                                            });

        currentWave.wave.updateInput('enemies.followers.members.*.weapons.*.className', {
                                                                                  options: classes,
                                                                                  value: _.first(classes)
                                                                                });

        def.resolve();
      });

    return def;
  },


  oppose: function( $enable, $disable ){
    $enable.prop( EL_PROP_DISABLED, false);
    $disable.prop( EL_PROP_DISABLED, true);
  },

  newScript: function(){
    if( $('.script-container').size() > 0 )
      $('.script-container').remove();

    return this.addScriptMarkup();
  },

  directiveEvents : function ($tgt, e) {
    var $directivesList,
        $clonedFirstLi,
        $directives,
        $lis;

    e.preventDefault();

    if( $tgt.is('.add-directive') ){
      currentWave.addDirective().done(this.updateForm);
    }

    if( $tgt.controlIs( 'remove' ) ){
      $directives = $tgt.parents('.directives').first(),

      $tgt.parent().remove();

      $lis = $directives.find('li');

      if( $lis.size() === 1 ){
        $lis.first().find('.remove').prop( EL_PROP_DISABLED, true);
      }

      currentWave.set( 'enemies.followers', this.getDirectives() );
    }
  },

  updateForm: function (formEl) {
    $('#model').html(formEl);
  },

  enemyControlEvents: function( $tgt ){
    var self = this,
        index,
        type,
        $clonedLi,
        $list,
        $li;

    if( $tgt.controlIs('add-enemy') ){
      type  = $tgt.siblings('select').first().val(),
      $list = $tgt.siblings('ul').first();

      this.addFollowerMarkup( { className: type });
    }

    if( $tgt.controlIs('remove-follower') ){
      $li   = $tgt.parent(),
      index = $li.index();

      $li.remove();
      currentWave.get( PROPERTY_ENEMIES ).followers[index].kill();
      currentWave.get( PROPERTY_ENEMIES ).followers.splice( index, 1 );
    }

    if( $tgt.controlIs('clone-follower') ){
      $clonedLi = $tgt.parent().clone(),
      $list     = $tgt.parents('ul').first();

      $list.append( $clonedLi );
      currentWave.set('enemies.followers', this.getFollowers());
    }
  },


  getFollowers: function(){
    var $followers = $(currentWave._formEl).find('.follower'),
        leaderPos = currentWave.get( PROPERTY_ENEMIES ).leader.pos,
        self = this;

    return _.map( $followers, function( follower ){
      var $f = $(follower),
          className = $f.find('.enemy-class').text(),
          offset = {
            x: parseInt($f.find('.x').val(), 10),
            y: parseInt($f.find('.y').val(), 10)
          };

      return ig.game.spawnEntity(
        className,
        leaderPos.x + offset.x,
        leaderPos.y + offset.y,
        {
          weapons: self.getFollowerWeapons(),
          type: className,
          offset: offset,
          trailing: parseInt($f.find('.trailing-time').val(), 10)
        });
    });
  },


  getLeaderWeapons: function(){
    weapons = _.first( $('.weapons') );

    return this.getWeapons( weapons );
  },

  getFollowerWeapons: function(){
    weapons = _.rest( $('.weapons') );

    return _.map( weapons, this.getWeapons );
  },

  getWeapons: function( weaponList ){
    var $weapons = $(weaponList).find('.weapon');

    return _.map( $weapons, function( weapon ){
      var $weapon = $(weapon);

      return {
        className:       $weapon.find('.weapon-class').first().val(),
        firingDirType:   $weapon.find('.firing-type').first().val(),
        firingRate:      parseFloat($weapon.find('.rate').first().val()),
        firingAngle:     parseFloat($weapon.find('.firing-angle').first().val())
      }
    });
  },


  getDirectives: function(){
    var $directives = $('.directive'),
        first       = true;

    return _.map( $directives, function( directive ){
      var $d = $(directive),
          starting = parseFloat( $d.find('.placement').val() );

      // Set script starting point
      if( first ){
        currentWave.get( PROPERTY_SCRIPT ).state = starting;
        first = false;
      }

      return {
        starting: starting,
        speed:    parseInt( $d.find('.entity-speed').val(), 10 ),
        step:     parseFloat( $d.find('.placement')[0].step ),
        waitTime: parseInt( $d.find('.wait').val(), 10 )
      };
    });
  },

  moveLeader : function (to) {
    debugger;
    var entity  = currentWave.wave.get('enemies.leader.objects.entity'),
        bezier  = currentWave.wave.get('script.bezier'),
        to      = parseFloat(to),
        relTo   = to % 1,
        section = Math.floor(to);

    bezierUtils.entityOnPathAt(entity, bezier[section], relTo);
  },


  addScriptMarkup: function () {
    var self = this;

    currentWave = new Wave();

    return currentWave.wave.modelToHTML();

    // return this.loadPartial( 'plugins/bezier/templates/script.tl' )
    //   .done( function( data ){

    //     var enemy,
    //         gid     = self.getGid(),
    //         name    = 'Enemy' + gid,
    //         segment = $.parseHTML( _.template( data, { gid: gid } ) );

    //     currentWave.set( 'script.instance', self );

    //     currentWave.observe('enemyLeader', function( type ){
    //       if( currentWave.get( PROPERTY_ENEMIES ).leader.kill )
    //         currentWave.get( PROPERTY_ENEMIES ).leader.kill();

    //       currentWave.set( 'enemies.leader', ig.game.spawnEntity( type, 0, 0, { className: type } ) );
    //     });


    //     // Move entity to beginning of new path when it's changed
    //     currentWave.observe( PROPERTY_PATH, self.pathChanged, self);

    //     // Recalculate slider step/max when the script values change
    //     currentWave.observe( 'script.directives', function(){
    //       this.recalcSliders();
    //       currentWave.set( 'script.max', currentWave.get( PROPERTY_SCRIPT ).bezier.length, self, true );

    //       $('.play').prop( EL_PROP_DISABLED, true);
    //       $('#save-script').prop( EL_PROP_DISABLED, true);
    //     }, self);

    //     // Recalculate sliders if the layer is changed
    //     currentWave.observe('layerName', function( newLayerName, formerLayerName ){
    //       this.recalcSliders();
    //       currentWave.set( 'script.directives', self.getDirectives() );
    //     }, self);

    //     currentWave.observe('cached', function(){
    //       $('.play').prop( EL_PROP_DISABLED, false);
    //       $('#save-script').prop( EL_PROP_DISABLED, false);
    //     });
    //   });
  },


  setObservers: function (wave) {
    currentWave.wave.observe('layerName', self.createPath, self);
  },


  addFollowerMarkup: function( model ){
    var self = this;

    this.loadPartial( 'plugins/bezier/templates/follower.tl' )
      .done( function( data ){
        var segment = $.parseHTML( _.template(data, { type: model.className }) );

        $followers.append( segment );

        if( model ){
          self.backfillFollowerMarkup( $(segment), model );
        } else {
          currentWave.wave.set( 'enemies.followers', self.getFollowers() );
        }
      });
  },


  backfillFollowerMarkup: function( $row, model ){
    $row.find('.x').val( model.offset.x );
    $row.find('.y').val( model.offset.y );
    $row.find('.trailing-time').val( model.trailing );
  },


  addWeaponMarkup: function( model ){
    this.loadPartial( 'plugins/bezier/templates/weapon.tl')
      .done( function( data ){
        var $weaponList = $tgt.siblings('.weapons').first(),
            partial     = $.parseHTML(data),
            leader      = currentWave.wave.get( PROPERTY_ENEMIES ).leader;

        self.backfillOptionsAjax( $(partial).find('.weapon-class'),
                                  'enemyWeapons',
                                  'lib/game/entities/weapons/',
                                  'js' );
        $weaponList.append( partial );

        currentWave.wave.set( 'enemies.followers', self.getFollowers() );

        leader.weapons = self.getLeaderWeapons();
        currentWave.wave.set( 'enemies.leader', leader );
      });
  },


  createPath: function (fromLayer) {
    var path = new BezierPath(null, this.findBezierByLayerName(fromLayer)),
        entity = currentWave.wave.get('enemies.leader.objects.entity');

    currentWave.wave.set('path', path);

    if (entity) {
      bezierUtils.entityOnPathAt(entity,
                                 bezierUtils.getCurveSubsection(path.groups[0], 0),
                                 0);
      }
  },


  createDirectives: function() {
    var directives    = currentWave.wave.get( PROPERTY_SCRIPT ).directives,
        $dirUI        = $('.directive'),
        $dirContainer = $dirUI.first().parent(),
        $thisRow,
        diff,
        i;

    for( i = 0; i < directives.length; i++ ){
      if( !$dirUI[i] ){
        $thisRow = $dirUI.first().clone();
      } else {
        $thisRow = $dirUI.eq(i);
      }

      $thisRow.find('.entity-speed').val( directives[i].speed );
      $thisRow.find('.placement').val( directives[i].starting );
      $thisRow.find('.wait').val( directives[i].waitTime );

      if( !$dirUI[i] ){
        $dirContainer.append( $thisRow );
      }
    }

    // If there's more rows than there are directives in the model, remove them
    if( $dirUI.length > directives.length ){
      diff = $dirUI.length - directives.length;

      for( i = 0; i < diff; i++ ){
        $dirUI.last().remove();
      }
    }
  },


  replaceEntity : function (newType, data, path) {
    var newEntity,
        ready,
        pos;

    if (!ig.global[newType])
      ready = this.thisClassIsAvailable(newType);
    else
      ready = true;

    $.when(ready).then(function (){
      var currentEntity = currentWave.wave.get(path),
          bezier = currentWave.wave.get('script.bezier');

      if (currentEntity) {
        currentWave.wave.set(path, ig.game.spawnEntity( newType, currentEntity.pos.x, currentEntity.pos.y, data ), true);
        currentEntity.kill();
      } else {
        newEntity = ig.game.spawnEntity( newType, 0, 0, data );

        if (bezier)
          newEntity.pos = bezierUtils.positionOnPathAt( newEntity, bezier[0], 0);

        currentWave.wave.set(path, newEntity, true);
      }
    });
  },


  findBezierByLayerName: function( name ){
    return _.find( bezierLayers, function( layer ){
      return layer.name === name;
    });
  },

  loadPartial: function( path ){
    return $.get( '/lib/' + path );
  },

  recalcSlider : function (directivePath) {

    var dir       = currentWave.wave.get(directivePath),
        speed     = parseInt(dir.speed.value, 10),
        path      = currentWave.wave.get(PROPERTY_PATH),
        self      = this,
        newConfig = { min : dir.starting.min, value : dir.starting.value },
        steps;

    steps = self.calculateMovementSteps(speed, path.totalLength);
    newConfig.max  = path.stepsLength;
    newConfig.step = path.stepsLength / steps;

    currentWave.wave.updateInput(directivePath + '.starting', newConfig);

  },

  calculateMovementSteps: function( speed, distance ){
    return distance / speed;
  },

  getOptionsFromFiles : function (name, path, isClass, classPrefix, onDependencyLoad) {
    var self = this,
        def  = $.Deferred();

    suffix  = 'js';
    isClass = ( _.isUndefined(isClass) ) ? true : isClass; // default to true

    if (!_.isUndefined(cachedOptionLists[name])) {

      def.resolve(cachedOptionLists[name]);

    } else {

      if (isClass) {

        this.assetLoader(path, suffix)
          .done(this.hotLoadModules)
          .done(function (list) {

            def.resolve(_.map(list, function (file){
                                      return self.fileNameToClassName(file, classPrefix);
                                    }));

          });

      } else {

        this.assetLoader(path, suffix)
          .done(function (list) {
            def.resolve(_.map(list, function (file){
                                      return file.split('/').pop();
                                    }));
          });

      }
    }

    return def;
  },


  hotLoadModules: function( list ){
    var re1 = /\.js|lib\//gi,
        re2 = /\//gi,
        modules = [],
        module,
        def = $.Deferred(),
        i;

    for( i = 0; i < list.length; i++ ){
      modules.push( list[i].replace(re1, '').replace(re2, '.') );
    }

    module = modules[0].split('.');
    module.pop();
    module = module.join('.');

    if( !ig.modules[module] ){
      ig.module(module)
        .requires.apply(ig, modules)
        .defines(function () { });
    }

    return def;

  },

  fileNameToClassName: function (name, classPrefix) {
    var typeName = '-' + name.replace(/^.*\/|\.js/g,'');

    typeName = typeName.replace(/-(\w)/g, function( m, a ) {
      return a.toUpperCase();
    });

    return classPrefix + typeName;
  },

  assetLoader: function( path, suffix ){
    var glob = path + '*.' + suffix;
    return $.getJSON( 'lib/weltmeister/api/glob.php' , { glob : [ glob ], nocache: Math.random() });
  },

  destroyAllEntities: function(){
    if( currentWave.wave.enemies.leader.kill )
      currentWave.wave.enemies.leader.kill();

    _.forEach( currentWave.wave.enemies.followers, function( follower ){
      follower.kill();
    });
  },

  thisClassIsAvailable : function (className) {
    var def = $.Deferred();

    var si = setInterval(function () {
      if (ig.global[className]) {
        clearInterval(si);
        def.resolve();
      }
    }, 500);

    return def;
  }
});

// Add a panel to the debug menu that allows us to toggle the _enabled flag
// for ig.CollisionMap
ig.debug.addPanel({
    type  : BezierDebugPanel,
    name  : 'bezierScripter',
    label : 'Bezier Scripter'
});

$.fn.controlIs = function( controlName ){
  return $(this).data('control') === controlName;
};

});
