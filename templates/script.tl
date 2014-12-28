<div class="script-container">
  
  <label for="scriptName">Script Name</label>
  <input data-control="scriptName" id="scriptName" type="text" name="scriptName">
  <button id="save-script" data-control="save-script" disabled>Save Script</button><br>

  <label for="startWhen">Start when: </label>
  <input data-control="startsWhen" id="startWhen" type="text" name="startWhen"><br>

  <label for="startOn">Start on event: </label>
  <input data-control="startOn" id="startOn" stype="text" name="startOn"><br>

  <label for="whenFinished">When finished, announces: </label>
  <input data-control="whenFinished" id="whenFinished" type="text" name="whenFinished"><br>

  <label for="startPriority">Ending event fires when:</label>
  <select name="startPriority">
    <option value="0">Enemies are dead</option>
    <option value="1">Timer finishes</option>
  </select><br>

  <label for="bezierLayers">Layers</label>
  <select name="layerName" data-control="bezierLayer" id="bezierLayers" data-leader="Enemy<%= gid %>"></select>
  
  <ul class="enemies">
    <li class="enemy">
      <fieldset>
        <legend>Enemy Type</legend>
        <label for="entitySelect_<%= gid %>">Entity</label><select class="entity-select" data-control="entitySelect" id="entitySelect_<%= gid %>" data-enemy-id="Enemy<%= gid%>" name="enemyLeader"></select>
        <fieldset>
          <legend>Weapons</legend>
          <button data-control="add-weapon">Add weapon</button>
          <ul class="leader weapons">
          </ul>
        </fieldset>   
        <fieldset>
          <legend>Animation</legend>
          <button data-control="play" class="play" data-play-entity="Enemy<%= gid %>" disabled>Play</button>
          <button data-control="stop" class="stop" data-play-entity="Enemy<%= gid %>" disabled="">Stop</button>
          <button data-control="add-directive" class="add-directive" data-play-entity="Enemy<%= gid %>">Add Directive</button>
          <button data-control="compile">Compile</button><span id="compile-perc"></span>

          <ul class="directives" name="directives">
            <li class="directive">
              <label for="entitySpeed_<%= gid %>">Speed</label><input data-control="entitySpeed" class="entity-speed" type="text" id="entitySpeed_<%= gid %>" data-range-slider="range-slider_<%= gid %>">
              <input data-control="entityPosition" id="range-slider_<%= gid %>" class="placement" disabled="" value="<%= gid %>" data-entity-position="Enemy<%= gid %>" type="range">
              <label>Wait </label><input type="text" class="wait" />ms
              <button class="remove" data-control="remove" disabled="">Remove</button>
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <legend>Followers</legend>
          <label for="entitySelect_<%=gid %>">Enemy Type</label><select class="entity-select" data-control="enemyFollowerSelect" id="entitySelect_<%=gid %>" name="entity_<%= gid %>"></select>
          <button class="add-enemy" data-control="add-enemy">Add enemy</button>
          <ul class="followers">
          </ul>
        </fieldset>           
      </fieldset>
    </li>
  </ul>
</div>